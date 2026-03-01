"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const FOLLOWUP_SILENCE_MS = 12000; // 12 sec after AI finished
const MAX_FOLLOWUPS_PER_SESSION = 6;
const FOLLOWUP_COOLDOWN_MS = 15000;

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem("amin_progress_v1") || "{}");
  } catch {
    return {};
  }
}

function saveProgress(p) {
  localStorage.setItem("amin_progress_v1", JSON.stringify(p));
}

function getLast7Days(progress) {
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
    out.push({ date: k, score: progress?.[k]?.score || 0, minutes: progress?.[k]?.minutes || 0 });
  }
  return out;
}

function calcStreak(progress) {
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
    const has = (progress?.[k]?.minutes || 0) > 0;
    if (!has) break;
    streak++;
  }
  return streak;
}

export default function ChatPage() {
  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);

  const followupTimerRef = useRef(null);
  const followupCountRef = useRef(0);
  const lastFollowupAtRef = useRef(0);

  const greetedRef = useRef(false);
  const studentSpeakingRef = useRef(false);
  const sessionActiveRef = useRef(false);

  const [level, setLevel] = useState("Beginner");
  const [status, setStatus] = useState("Idle");
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);

  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showScoreCard, setShowScoreCard] = useState(false);

  const [progress, setProgress] = useState(() => (typeof window !== "undefined" ? loadProgress() : {}));
  const streak = useMemo(() => calcStreak(progress), [progress]);
  const last7 = useMemo(() => getLast7Days(progress), [progress]);

  // --- Helpers ---
  function logStatus(s) {
    setStatus(s);
  }

  function clearFollowupTimer() {
    if (followupTimerRef.current) {
      clearTimeout(followupTimerRef.current);
      followupTimerRef.current = null;
    }
  }

  function canSendFollowup() {
    const now = Date.now();
    if (!sessionActiveRef.current) return false;
    if (!connected) return false;
    if (followupCountRef.current >= MAX_FOLLOWUPS_PER_SESSION) return false;
    if (studentSpeakingRef.current) return false;
    if (now - lastFollowupAtRef.current < FOLLOWUP_COOLDOWN_MS) return false;
    return true;
  }

  function sendJSON(obj) {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open") return;
    dc.send(JSON.stringify(obj));
  }

  async function getEphemeralToken() {
    const r = await fetch("/api/realtime", { method: "POST" });
    const data = await r.json();
    if (!r.ok) throw new Error(JSON.stringify(data, null, 2));
    if (!data?.value) throw new Error("Token missing: " + JSON.stringify(data, null, 2));
    return data.value;
  }

  async function enableSound() {
    try {
      // Mobile unlock: play a tiny silent audio once user taps
      const a = new Audio();
      a.src =
        "data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCA" +
        "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
      a.volume = 0.001;
      await a.play().catch(() => {});
      setSoundEnabled(true);
      setError("");
    } catch (e) {
      setError("Enable Sound failed. Try again.");
    }
  }

  function buildSystemPrompt() {
    // Hinglish rule + teacher tone + follow-up friendly
    return `
You are "Amin Sir AI Voice Tutor" for Indian school students (Class 4–10).
Voice: male "onyx". Speak at normal teacher speed.

Language rule:
- 80% English + 20% very simple Hindi (Hinglish).
- Use easy words for weak students.

Session rules:
- Greet only ONCE per session. After greeting, do not greet again.
- Always be interactive: ask 1 short question at the end of each answer.
- If the student is silent, gently prompt them, give a small hint, and ask again.

Level: ${level}
- Beginner: very simple sentences, more examples, more Hindi support (still keep 80/20).
- Medium: normal school level, 1–2 examples.
- Advanced: more fluent, challenge with better vocabulary, still friendly.

Teaching style:
- Correct mistakes politely.
- Keep answers short.
- Always end with: "Your turn—answer in 1 line." (or similar).
`.trim();
  }

  function sendSessionUpdate() {
    // Important: this keeps your “working voice” stable while improving behavior
    sendJSON({
      type: "session.update",
      session: {
        voice: "onyx",
        instructions: buildSystemPrompt(),
        // If your build already uses turn_detection successfully, keep it.
        // This is the common setup for smooth conversational turns:
        turn_detection: { type: "server_vad" },
        input_audio_transcription: { model: "gpt-4o-mini-transcribe" },
      },
    });
  }

  function sendGreetingOnce() {
    if (greetedRef.current) return;
    greetedRef.current = true;

    sendJSON({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              "Start the session with ONE short greeting (1 line) and ask the student what they want to practice today (1 short question). Remember: Hinglish 80/20.",
          },
        ],
      },
    });

    sendJSON({ type: "response.create" });
  }

  function scheduleAutoFollowup(reason = "silent_after_ai") {
    clearFollowupTimer();

    if (!canSendFollowup()) return;

    followupTimerRef.current = setTimeout(() => {
      if (!canSendFollowup()) return;

      followupCountRef.current += 1;
      lastFollowupAtRef.current = Date.now();

      // “Coach instruction” — model generates a short follow-up question/hint
      sendJSON({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Student is silent. Give a gentle follow-up prompt (1–2 lines), a tiny hint if needed, and ask the SAME question again.
Level=${level}. Hinglish 80/20. Keep it motivating. Reason=${reason}.`,
            },
          ],
        },
      });

      sendJSON({ type: "response.create" });
    }, FOLLOWUP_SILENCE_MS);
  }

  // --- Realtime event handler ---
  function handleRealtimeEvent(msg) {
    // We only parse JSON messages from dc
    if (!msg?.type) return;

    // Student speech events (server_vad)
    if (msg.type === "input_audio_buffer.speech_started") {
      studentSpeakingRef.current = true;
      clearFollowupTimer();
    }

    if (msg.type === "input_audio_buffer.speech_stopped") {
      studentSpeakingRef.current = false;
      // we don't follow-up immediately here; we wait until AI finishes its response
    }

    // When the assistant response completes, start silence timer
    if (msg.type === "response.done") {
      // After AI finishes, if student stays silent → nudge
      scheduleAutoFollowup("silent_after_ai_done");
    }

    // Optional: if you receive an error, show it
    if (msg.type === "error") {
      setError(msg?.error?.message || "Realtime error");
    }
  }

  // --- Start/Stop ---
  async function startVoice() {
    try {
      setShowScoreCard(false);
      setError("");
      logStatus("Starting…");

      if (!soundEnabled) {
        setError("Tap Enable Sound first.");
        return;
      }

      // reset session trackers
      greetedRef.current = false;
      followupCountRef.current = 0;
      lastFollowupAtRef.current = 0;
      studentSpeakingRef.current = false;
      sessionActiveRef.current = true;

      const token = await getEphemeralToken();

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      pcRef.current = pc;

      // remote audio
      const remoteAudio = new Audio();
      remoteAudio.autoplay = true;
      remoteAudio.playsInline = true;
      remoteAudioRef.current = remoteAudio;

      pc.ontrack = (e) => {
        const [stream] = e.streams;
        remoteAudio.srcObject = stream;
      };

      // local mic
      const local = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = local;
      local.getTracks().forEach((t) => pc.addTrack(t, local));

      // data channel
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.onopen = () => {
        setConnected(true);
        logStatus("Connected ✅");
        setError("");

        sendSessionUpdate();
        sendGreetingOnce();
      };

      dc.onclose = () => {
        setConnected(false);
        logStatus("Disconnected");
      };

      dc.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          handleRealtimeEvent(msg);
        } catch {
          // ignore non-json
        }
      };

      // WebRTC offer/answer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpResp = await fetch("https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/sdp",
        },
        body: offer.sdp,
      });

      const answerSdp = await sdpResp.text();
      if (!sdpResp.ok) {
        throw new Error(`Realtime SDP error: ${answerSdp}`);
      }
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

      // Track minutes in local progress (simple)
      const k = todayKey();
      const p = { ...progress };
      p[k] = p[k] || { minutes: 0, score: 0 };
      saveProgress(p);
      setProgress(p);
    } catch (e) {
      setError(e?.message || "Start failed");
      logStatus("Error");
      setConnected(false);
      sessionActiveRef.current = false;
      clearFollowupTimer();
      stopVoice(true);
    }
  }

  function stopVoice(silent = false) {
    clearFollowupTimer();
    sessionActiveRef.current = false;

    const dc = dcRef.current;
    try {
      if (dc) dc.close();
    } catch {}

    const pc = pcRef.current;
    try {
      if (pc) pc.close();
    } catch {}

    const local = localStreamRef.current;
    try {
      if (local) local.getTracks().forEach((t) => t.stop());
    } catch {}

    dcRef.current = null;
    pcRef.current = null;
    localStreamRef.current = null;

    setConnected(false);
    logStatus(silent ? "Stopped" : "Stopped ✅");
    if (!silent) setShowScoreCard(true);
  }

  // cleanup
  useEffect(() => {
    return () => stopVoice(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- UI helpers for score ---
  function addMinuteAndScore() {
    // Call this from wherever you already detect “completed practice”
    const k = todayKey();
    const p = loadProgress();
    p[k] = p[k] || { minutes: 0, score: 0 };
    p[k].minutes += 1;
    p[k].score += 10;
    saveProgress(p);
    setProgress(p);
  }

  return (
    <div style={{ padding: 16, maxWidth: 820, margin: "0 auto", fontFamily: "system-ui, Arial" }}>
      <h2 style={{ marginBottom: 6 }}>Welcome, Amin sir 👋</h2>

      <div style={{ marginBottom: 10, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <b>Status:</b> {status}
        </div>
        <div>
          <b>Connection:</b> {connected ? "Connected ✅" : "Not connected"}
        </div>
      </div>

      <div style={{ marginBottom: 12, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span><b>Level:</b></span>
          <select value={level} onChange={(e) => setLevel(e.target.value)} disabled={connected}>
            <option>Beginner</option>
            <option>Medium</option>
            <option>Advanced</option>
          </select>
        </label>

        {!soundEnabled ? (
          <button onClick={enableSound} style={{ padding: "10px 14px", fontWeight: 700 }}>
            Enable Sound 🔊
          </button>
        ) : (
          <button disabled style={{ padding: "10px 14px", opacity: 0.7 }}>
            Sound Enabled ✅
          </button>
        )}

        {!connected ? (
          <button onClick={startVoice} style={{ padding: "10px 14px", fontWeight: 800 }}>
            Start Voice 🎤
          </button>
        ) : (
          <button onClick={() => stopVoice(false)} style={{ padding: "10px 14px", fontWeight: 800 }}>
            Stop
          </button>
        )}

        {/* Optional: quick test button for progress */}
        <button onClick={addMinuteAndScore} style={{ padding: "10px 14px" }}>
          +Practice (test)
        </button>
      </div>

      {error ? (
        <pre style={{ background: "#fff3f3", border: "1px solid #ffbdbd", padding: 12, whiteSpace: "pre-wrap" }}>
          {error}
        </pre>
      ) : null}

      {showScoreCard ? (
        <div style={{ marginTop: 16, border: "1px solid #ddd", borderRadius: 10, padding: 14 }}>
          <h3 style={{ marginTop: 0 }}>Score Card</h3>
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 14, opacity: 0.8 }}>Streak</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{streak} 🔥</div>
            </div>
            <div>
              <div style={{ fontSize: 14, opacity: 0.8 }}>Today</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>
                {progress?.[todayKey()]?.score || 0} pts
              </div>
            </div>
          </div>

          <h4 style={{ marginBottom: 8, marginTop: 16 }}>Last 7 Days Progress</h4>
          <div style={{ display: "grid", gap: 6 }}>
            {last7.map((d) => (
              <div
                key={d.date}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  border: "1px solid #eee",
                  borderRadius: 8,
                  padding: "8px 10px",
                }}
              >
                <div style={{ fontWeight: 700 }}>{d.date}</div>
                <div style={{ opacity: 0.9 }}>
                  Score: <b>{d.score}</b> | Minutes: <b>{d.minutes}</b>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12, opacity: 0.8, fontSize: 13 }}>
            Auto follow-up is ON: if student is silent after AI finishes, tutor prompts again.
          </div>
        </div>
      ) : null}
    </div>
  );
}