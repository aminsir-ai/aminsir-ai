"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const LS_KEY = "aminsir_progress_v5";
const VOICE = "onyx"; // male voice

// ✅ Feature A: Continuous auto follow-up
const FOLLOWUP_SILENCE_MS = 12000; // 12 sec after AI finishes
const MAX_FOLLOWUPS_PER_SESSION = 6;
const FOLLOWUP_COOLDOWN_MS = 15000;

function todayKeyLocal() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { streak: 0, lastDay: null, history: [], level: "beginner" };
    const parsed = JSON.parse(raw);
    return {
      streak: Number(parsed?.streak || 0),
      lastDay: parsed?.lastDay || null,
      history: Array.isArray(parsed?.history) ? parsed.history : [],
      level: parsed?.level || "beginner",
    };
  } catch {
    return { streak: 0, lastDay: null, history: [], level: "beginner" };
  }
}

function saveProgress(p) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(p));
  } catch {}
}

function computeNewStreak(prevLastDay, prevStreak) {
  const today = todayKeyLocal();
  if (!prevLastDay) return { streak: 1, lastDay: today };
  if (prevLastDay === today) return { streak: prevStreak || 1, lastDay: today };

  const prev = new Date(prevLastDay + "T00:00:00");
  const now = new Date(today + "T00:00:00");
  const diffDays = Math.round((now - prev) / (24 * 60 * 60 * 1000));
  if (diffDays === 1) return { streak: (prevStreak || 0) + 1, lastDay: today };
  return { streak: 1, lastDay: today };
}

function clampScore(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(10, Math.round(n)));
}

function scoreLabel(score) {
  if (score >= 9) return "Excellent!";
  if (score >= 7) return "Very Good!";
  if (score >= 5) return "Good Start!";
  return "Keep Practicing!";
}

function levelToText(level) {
  if (level === "advanced") return "Advanced";
  if (level === "medium") return "Medium";
  return "Beginner";
}

function levelProfile(level) {
  if (level === "advanced")
    return { vocab: "moderate to high", questions: "opinion + story + reasons", correction: "more strict" };
  if (level === "medium")
    return { vocab: "simple to moderate", questions: "mix easy + open ended", correction: "balanced" };
  return { vocab: "very simple", questions: "very easy daily-life", correction: "gentle" };
}

export default function ChatPage() {
  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);

  // Mobile audio fallback
  const audioCtxRef = useRef(null);
  const audioSrcRef = useRef(null);
  const remoteStreamRef = useRef(null);

  // ✅ prevents double start + prevents repeated greeting
  const startLockRef = useRef(false);
  const greetedRef = useRef(false);

  // Report capture
  const stoppingRef = useRef(false);
  const reportTextRef = useRef("");
  const reportResolveRef = useRef(null);
  const reportTimeoutRef = useRef(null);

  // ✅ Feature A refs
  const followupTimerRef = useRef(null);
  const followupCountRef = useRef(0);
  const lastFollowupAtRef = useRef(0);
  const studentSpeakingRef = useRef(false);

  const [status, setStatus] = useState("Idle");
  const [step, setStep] = useState("—");
  const [error, setError] = useState("");

  const [dcOpen, setDcOpen] = useState(false);
  const [gotRemoteTrack, setGotRemoteTrack] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [connected, setConnected] = useState(false);
  const [micOn, setMicOn] = useState(false);

  const [reportLoading, setReportLoading] = useState(false);
  const [scoreCard, setScoreCard] = useState(null);
  const [streak, setStreak] = useState(0);
  const [history, setHistory] = useState([]);
  const [level, setLevel] = useState("beginner");

  useEffect(() => {
    const p = loadProgress();
    setStreak(p.streak || 0);
    setHistory(p.history || []);
    setLevel(p.level || "beginner");
  }, []);

  function persistLevel(newLevel) {
    setLevel(newLevel);
    const prev = loadProgress();
    saveProgress({ ...prev, level: newLevel });
  }

  function setErr(e) {
    const msg = typeof e === "string" ? e : e?.message || JSON.stringify(e, null, 2);
    console.error(e);
    setError(msg);
  }

  async function enableSoundStrong() {
    setError("");
    try {
      const el = remoteAudioRef.current;
      if (el) {
        el.muted = false;
        el.volume = 1;
        el.playsInline = true;
        const p = el.play?.();
        if (p && typeof p.then === "function") await p;
      }

      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        if (!audioCtxRef.current) audioCtxRef.current = new AC();
        if (audioCtxRef.current.state === "suspended") await audioCtxRef.current.resume();

        if (remoteStreamRef.current) {
          try {
            if (audioSrcRef.current) audioSrcRef.current.disconnect();
          } catch {}
          try {
            audioSrcRef.current = audioCtxRef.current.createMediaStreamSource(remoteStreamRef.current);
            audioSrcRef.current.connect(audioCtxRef.current.destination);
          } catch {}
        }
      }

      setSoundEnabled(true);
    } catch (e) {
      setSoundEnabled(false);
      setErr(e);
    }
  }

  function sendJSON(obj) {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open") return;
    dc.send(JSON.stringify(obj));
  }

  // ✅ Feature A helpers
  function clearFollowupTimer() {
    if (followupTimerRef.current) {
      clearTimeout(followupTimerRef.current);
      followupTimerRef.current = null;
    }
  }

  function canSendFollowup() {
    const now = Date.now();
    if (!connected) return false;
    if (!dcOpen) return false;
    if (stoppingRef.current) return false;
    if (followupCountRef.current >= MAX_FOLLOWUPS_PER_SESSION) return false;
    if (studentSpeakingRef.current) return false;
    if (now - lastFollowupAtRef.current < FOLLOWUP_COOLDOWN_MS) return false;
    return true;
  }

  function scheduleFollowup(reason = "after_ai_done") {
    clearFollowupTimer();
    if (!canSendFollowup()) return;

    followupTimerRef.current = setTimeout(() => {
      if (!canSendFollowup()) return;

      followupCountRef.current += 1;
      lastFollowupAtRef.current = Date.now();

      sendJSON({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Student is silent. In AUDIO, give a gentle follow-up (1–2 lines), tiny hint, and ask the SAME question again.
Level=${levelToText(level)}. Hinglish 80/20. Motivating. Reason=${reason}.
End with: "Your turn—answer in 1 line."`,
            },
          ],
        },
      });

      sendJSON({
        type: "response.create",
        response: { modalities: ["audio"], max_output_tokens: 140 },
      });
    }, FOLLOWUP_SILENCE_MS);
  }

  async function getEphemeralKey() {
    setStep("Fetching key…");
    const r = await fetch("/api/realtime", { method: "POST" });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data?.error?.message || JSON.stringify(data, null, 2));
    if (!data?.value) throw new Error("Ephemeral key missing from response");
    return data.value;
  }

  async function ensureMicTrack(pc) {
    setStep("Requesting microphone…");
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      video: false,
    });
    localStreamRef.current = stream;

    const track = stream.getAudioTracks()[0];
    if (!track) throw new Error("No microphone track");

    const already = pc.getSenders().some((s) => s.track && s.track.kind === "audio");
    if (!already) pc.addTrack(track, stream);

    track.enabled = true;
    setMicOn(true);
  }

  function extractAnyText(msg) {
    const candidates = [
      msg?.delta,
      msg?.text?.delta,
      msg?.output_text?.delta,
      msg?.response?.output_text?.delta,
      msg?.response?.text?.delta,
    ];
    for (const c of candidates) if (typeof c === "string" && c.length) return c;

    const direct = [msg?.text, msg?.output_text, msg?.response?.output_text, msg?.response?.text];
    for (const d of direct) if (typeof d === "string" && d.length) return d;

    const output = msg?.response?.output;
    if (Array.isArray(output)) {
      let outText = "";
      for (const item of output) {
        const content = item?.content;
        if (Array.isArray(content)) {
          for (const part of content) {
            if (typeof part?.text === "string") outText += part.text;
            if (typeof part?.transcript === "string") outText += part.transcript;
          }
        }
      }
      if (outText.trim()) return outText;
    }
    return "";
  }

  function attachDcMessageHandler(dc) {
    dc.onmessage = (ev) => {
      let msg;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }

      // ✅ Feature A: detect student speaking (server VAD events)
      if (msg?.type === "input_audio_buffer.speech_started") {
        studentSpeakingRef.current = true;
        clearFollowupTimer();
      }
      if (msg?.type === "input_audio_buffer.speech_stopped") {
        studentSpeakingRef.current = false;
      }

      // ✅ When AI finishes, schedule follow-up if student silent
      if (msg?.type === "response.done" || msg?.type === "response.completed") {
        scheduleFollowup("after_ai_done");
      }

      // Existing report capture logic
      if (stoppingRef.current) {
        const t = extractAnyText(msg);
        if (t) reportTextRef.current += t;

        if (msg?.type === "response.completed" || msg?.type === "response.done") {
          if (typeof reportResolveRef.current === "function") {
            reportResolveRef.current();
            reportResolveRef.current = null;
          }
        }
      }
    };
  }

  // ✅ Normal teacher speed (NOT slow motion) + Hinglish rule + anti-repeat rule
  function buildTutorInstructions(selectedLevel) {
    const prof = levelProfile(selectedLevel);

    return `
You are Amin Sir, a friendly spoken-English teacher for Indian school students (age 10–15).

SPEED:
• Speak at normal TEACHER speed (not fast, not slow motion).
• Use short sentences. 1–2 sentences per turn.

LANGUAGE MIX (MUST):
• 80% English + 20% very simple Hindi (Hinglish).
• Hindi only for quick help/explanation. Keep Hindi very simple.

ANTI-REPEAT (VERY IMPORTANT):
• Never repeat the same greeting again.
• Greet only once per session.
• Do not say "Hello beta I am Amin Sir" again after the first greeting.
• If you already greeted, immediately ask a NEW question.

LEVEL: ${levelToText(selectedLevel)}
• Vocabulary: ${prof.vocab}
• Questions: ${prof.questions}
• Correction: ${prof.correction}

Conversation:
• One question at a time.
• Keep student talking (ask follow-up).
• If student becomes silent after you finish, gently prompt again with a small hint.
• Do NOT give scores during conversation.
Always respond in AUDIO.
`.trim();
  }

  async function startVoice() {
    // ✅ lock: prevent double start
    if (startLockRef.current) return;
    startLockRef.current = true;

    setError("");
    setScoreCard(null);
    setReportLoading(false);

    setStatus("Connecting…");
    setStep("Starting…");
    setDcOpen(false);
    setGotRemoteTrack(false);
    setConnected(false);

    greetedRef.current = false; // reset greeting flag for new session

    // ✅ reset Feature A counters for new session
    followupCountRef.current = 0;
    lastFollowupAtRef.current = 0;
    studentSpeakingRef.current = false;
    clearFollowupTimer();

    try {
      const key = await getEphemeralKey();

      setStep("Creating peer…");
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      pcRef.current = pc;

      pc.onconnectionstatechange = () => {
        setStatus(`PC: ${pc.connectionState}`);
        setConnected(pc.connectionState === "connected");
      };

      pc.ontrack = (e) => {
        setGotRemoteTrack(true);
        const stream = e.streams?.[0];
        if (stream) remoteStreamRef.current = stream;

        const el = remoteAudioRef.current;
        if (el && stream) el.srcObject = stream;

        if (soundEnabled) enableSoundStrong();
      };

      setStep("Adding transceiver…");
      pc.addTransceiver("audio", { direction: "sendrecv" });

      await ensureMicTrack(pc);

      setStep("Creating DataChannel…");
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;
      attachDcMessageHandler(dc);

      dc.onopen = async () => {
        setDcOpen(true);

        sendJSON({
          type: "session.update",
          session: {
            modalities: ["audio", "text"],
            voice: VOICE,
            output_audio_format: "pcm16",
            audio: { output: { voice: VOICE, format: "pcm16" } },
            turn_detection: { type: "server_vad" },
            instructions: buildTutorInstructions(level),
          },
        });

        // ✅ greet only once
        if (!greetedRef.current) {
          greetedRef.current = true;

          sendJSON({
            type: "conversation.item.create",
            item: {
              type: "message",
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: `Say in AUDIO at normal teacher speed (not slow):
"Hello beta! I am Amin Sir. We will practice English speaking. Level is ${levelToText(level)}.
Aapka naam kya hai? What is your name?"`,
                },
              ],
            },
          });

          sendJSON({
            type: "response.create",
            response: { modalities: ["audio"], max_output_tokens: 170 },
          });
        }
      };

      setStep("Creating offer…");
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdp = offer?.sdp || "";
      if (!sdp.trim().startsWith("v=")) throw new Error("Offer SDP empty/invalid");

      setStep("Sending SDP…");
      const sdpResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/sdp",
          Accept: "application/sdp",
        },
        body: sdp,
      });

      const answer = await sdpResponse.text().catch(() => "");
      if (!sdpResponse.ok) throw new Error(answer || `SDP exchange failed (${sdpResponse.status})`);
      if (!answer.trim().startsWith("v=")) throw new Error("Invalid answer SDP:\n" + answer.slice(0, 400));

      setStep("Applying answer…");
      await pc.setRemoteDescription({ type: "answer", sdp: answer });

      setStep("Connected ✅ (Tap Enable Sound once)");
      setStatus("Connected ✅");
      setConnected(true);
    } catch (e) {
      setStatus("Error");
      setErr(e);
    } finally {
      // allow start again only when session is closed by user
      // keep lock if connected; unlock if failed
      if (!connected) startLockRef.current = false;
    }
  }

  function stopAllImmediate() {
    // ✅ stop follow-up timer
    clearFollowupTimer();

    setStep("Closing…");
    setStatus("Closing…");

    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch {}
        });
        localStreamRef.current = null;
      }

      if (dcRef.current) {
        try {
          dcRef.current.close();
        } catch {}
        dcRef.current = null;
      }

      if (pcRef.current) {
        try {
          pcRef.current.ontrack = null;
          pcRef.current.onconnectionstatechange = null;
          pcRef.current.close();
        } catch {}
        pcRef.current = null;
      }

      if (remoteAudioRef.current) {
        remoteAudioRef.current.pause?.();
        remoteAudioRef.current.srcObject = null;
      }

      try {
        if (audioSrcRef.current) {
          audioSrcRef.current.disconnect();
          audioSrcRef.current = null;
        }
      } catch {}
    } catch {}

    greetedRef.current = false;
    startLockRef.current = false; // ✅ unlock start now

    setDcOpen(false);
    setGotRemoteTrack(false);
    setConnected(false);
    setMicOn(false);
    setStatus("Closed");
    setStep("—");
  }

  async function stopWithReport() {
    // ✅ stop follow-up timer
    clearFollowupTimer();

    setError("");
    setReportLoading(true);
    setScoreCard(null);

    setStep("Stopping & generating score…");
    setStatus("Evaluating…");

    try {
      const track = localStreamRef.current?.getAudioTracks?.()?.[0];
      if (track) track.enabled = false;
      setMicOn(false);
    } catch {}

    stoppingRef.current = true;
    reportTextRef.current = "";

    try {
      const donePromise = new Promise((resolve) => {
        reportResolveRef.current = resolve;
      });

      reportTimeoutRef.current = setTimeout(() => {
        if (typeof reportResolveRef.current === "function") {
          reportResolveRef.current();
          reportResolveRef.current = null;
        }
      }, 9000);

      const prof = levelProfile(level);

      sendJSON({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [
            {
              type: "input_text",
              text: `
Give FINAL evaluation for today.

Return STRICT JSON only (no extra text), exactly:
{
  "score": 0-10,
  "grammar": "one correction (80% English + 20% simple Hindi)",
  "tip": "one tip (80% English + 20% simple Hindi)",
  "summary": "one encouraging line (80% English + 20% simple Hindi)",
  "level": "${levelToText(level)}"
}

Student level: ${levelToText(level)}
Vocabulary: ${prof.vocab}
Keep it short.
              `.trim(),
            },
          ],
        },
      });

      sendJSON({
        type: "response.create",
        response: { modalities: ["text"], max_output_tokens: 260 },
      });

      await donePromise;

      if (reportTimeoutRef.current) {
        clearTimeout(reportTimeoutRef.current);
        reportTimeoutRef.current = null;
      }

      const raw = (reportTextRef.current || "").trim();
      let parsed = null;
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = null;
      }

      const score = clampScore(parsed?.score);
      const grammar = typeof parsed?.grammar === "string" ? parsed.grammar : "";
      const tip = typeof parsed?.tip === "string" ? parsed.tip : "";
      const summary = typeof parsed?.summary === "string" ? parsed.summary : "";
      const today = todayKeyLocal();

      if (score === null) {
        setScoreCard({ score: null, raw: raw || "Report not received. Try again.", date: today, level: levelToText(level) });
      } else {
        setScoreCard({ score, grammar, tip, summary, date: today, level: levelToText(level) });

        const prev = loadProgress();
        const s = computeNewStreak(prev.lastDay, prev.streak);

        const newHistory = [
          ...(Array.isArray(prev.history) ? prev.history : []).filter((x) => x?.date !== today),
          { date: today, score },
        ]
          .sort((a, b) => (a.date > b.date ? 1 : -1))
          .slice(-7);

        const next = { ...prev, streak: s.streak, lastDay: s.lastDay, history: newHistory, level };
        saveProgress(next);

        setStreak(next.streak);
        setHistory(next.history);
      }
    } catch (e) {
      setErr(e);
      setScoreCard({ score: null, raw: "Report failed. Please try again.", date: todayKeyLocal(), level: levelToText(level) });
    } finally {
      stoppingRef.current = false;
      setReportLoading(false);
      stopAllImmediate();
    }
  }

  const last7 = useMemo(() => {
    const map = new Map((history || []).map((h) => [h.date, h.score]));
    const days = [];
    const today = new Date(todayKeyLocal() + "T00:00:00");
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      days.push({ date: key, score: map.has(key) ? map.get(key) : null });
    }
    return days;
  }, [history]);

  useEffect(() => {
    return () => stopAllImmediate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: 16, paddingBottom: 50 }}>
      <h2 style={{ margin: "8px 0 8px" }}>Amin Sir AI Tutor</h2>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontWeight: 900 }}>Level:</div>
        <select
          value={level}
          onChange={(e) => persistLevel(e.target.value)}
          style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #ddd", fontWeight: 800 }}
        >
          <option value="beginner">Beginner</option>
          <option value="medium">Medium</option>
          <option value="advanced">Advanced</option>
        </select>
        <div style={{ marginLeft: "auto", fontWeight: 900 }}>🔥 Streak: {streak} day{streak === 1 ? "" : "s"}</div>
      </div>

      <div style={{ fontWeight: 800, marginBottom: 6 }}>Status: {status}</div>
      <div style={{ fontWeight: 800, marginBottom: 6 }}>Step: {step}</div>
      <div style={{ fontWeight: 800, marginBottom: 12 }}>
        DC: {dcOpen ? "Open ✅" : "Not open"} | Track: {gotRemoteTrack ? "Yes ✅" : "No"} | Sound:{" "}
        {soundEnabled ? "Enabled ✅" : "Locked"} | Mic: {micOn ? "On ✅" : "Off"}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          onClick={startVoice}
          disabled={startLockRef.current && !connected}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "none",
            background: "#111",
            color: "#fff",
            fontWeight: 900,
            opacity: startLockRef.current && !connected ? 0.6 : 1,
          }}
        >
          Start Voice 🎤
        </button>

        <button
          onClick={enableSoundStrong}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #ddd",
            background: soundEnabled ? "#eaffea" : "#fff",
            fontWeight: 900,
          }}
        >
          Enable Sound 🔊 {soundEnabled ? "✅" : ""}
        </button>

        <button
          onClick={stopWithReport}
          disabled={!connected || reportLoading}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #ddd",
            background: !connected || reportLoading ? "#f3f4f6" : "#fff",
            fontWeight: 900,
            opacity: !connected || reportLoading ? 0.6 : 1,
          }}
        >
          Stop ⛔ (Score Card)
        </button>
      </div>

      {error ? (
        <pre
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 12,
            background: "#fff1f2",
            border: "1px solid #fecdd3",
            color: "#7f1d1d",
            whiteSpace: "pre-wrap",
          }}
        >
          {error}
        </pre>
      ) : null}

      <audio ref={remoteAudioRef} autoPlay playsInline controls style={{ width: "100%", marginTop: 12 }} />

      <div style={{ marginTop: 16, padding: 14, border: "1px solid #eee", borderRadius: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ fontWeight: 900, fontSize: 16 }}>🏆 Today’s Score Card</div>
          <div style={{ fontWeight: 900 }}>Level: {levelToText(level)}</div>
        </div>

        {reportLoading ? (
          <div style={{ marginTop: 10, fontWeight: 800 }}>Generating score…</div>
        ) : scoreCard ? (
          scoreCard.score === null ? (
            <div style={{ marginTop: 10, fontWeight: 800, color: "#b91c1c" }}>
              {scoreCard.raw || "Report not received."}
            </div>
          ) : (
            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center", padding: 12, borderRadius: 14, border: "1px solid #eee" }}>
                <div style={{ fontSize: 38, lineHeight: "40px" }}>🏆</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 900, fontSize: 22 }}>
                    {scoreCard.score}/10 — {scoreLabel(scoreCard.score)}
                  </div>
                  <div style={{ color: "#444", fontWeight: 700 }}>Date: {scoreCard.date}</div>
                </div>
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ padding: 12, borderRadius: 14, border: "1px solid #eee" }}>
                  <div style={{ fontWeight: 900 }}>✅ Grammar Fix</div>
                  <div style={{ marginTop: 4 }}>{scoreCard.grammar || "No major grammar mistakes today."}</div>
                </div>

                <div style={{ padding: 12, borderRadius: 14, border: "1px solid #eee" }}>
                  <div style={{ fontWeight: 900 }}>💡 Tip for Tomorrow</div>
                  <div style={{ marginTop: 4 }}>{scoreCard.tip || "Speak in full sentences."}</div>
                </div>

                <div style={{ padding: 12, borderRadius: 14, border: "1px solid #eee" }}>
                  <div style={{ fontWeight: 900 }}>⭐ Summary</div>
                  <div style={{ marginTop: 4 }}>{scoreCard.summary || "Keep practicing!"}</div>
                </div>
              </div>
            </div>
          )
        ) : (
          <div style={{ marginTop: 10, color: "#666" }}>Stop the session to generate today’s score card.</div>
        )}

        <div style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>📈 Last 7 Days Progress</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
            {last7.map((d) => {
              const s = d.score;
              const h = s === null ? 12 : 10 + s * 6;
              return (
                <div key={d.date} style={{ textAlign: "center" }}>
                  <div
                    title={s === null ? `${d.date}: no practice` : `${d.date}: ${s}/10`}
                    style={{
                      height: 74,
                      border: "1px solid #eee",
                      borderRadius: 10,
                      display: "flex",
                      alignItems: "flex-end",
                      justifyContent: "center",
                      padding: 6,
                    }}
                  >
                    <div style={{ width: "100%", height: h, borderRadius: 8, background: s === null ? "#ddd" : "#111" }} />
                  </div>
                  <div style={{ fontSize: 11, marginTop: 4, color: "#555" }}>{d.date.slice(5)}</div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 10, fontSize: 12, color: "#666" }}>
            ✅ Auto follow-up ON: If student stays silent after AI finishes, Amin Sir prompts again after ~12 seconds.
          </div>
        </div>
      </div>
    </div>
  );
}