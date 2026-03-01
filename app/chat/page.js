"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const LS_KEY = "aminsir_progress_v2"; // local storage key

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
  // Controls question complexity + correction strictness
  if (level === "advanced") {
    return {
      vocab: "moderate to high",
      sentence: "medium length",
      questions: "open-ended, opinion based",
      correction: "more strict",
    };
  }
  if (level === "medium") {
    return {
      vocab: "simple to moderate",
      sentence: "short to medium",
      questions: "mix of short + some open-ended",
      correction: "balanced",
    };
  }
  return {
    vocab: "very simple",
    sentence: "very short",
    questions: "very easy daily-life",
    correction: "gentle and minimal",
  };
}

export default function ChatPage() {
  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);

  // Report aggregation from DC
  const reportTextRef = useRef("");
  const reportResolveRef = useRef(null);
  const reportTimeoutRef = useRef(null);
  const stoppingRef = useRef(false);

  const [status, setStatus] = useState("Idle");
  const [step, setStep] = useState("—");
  const [error, setError] = useState("");

  const [dcOpen, setDcOpen] = useState(false);
  const [gotRemoteTrack, setGotRemoteTrack] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [connected, setConnected] = useState(false);
  const [micOn, setMicOn] = useState(false);

  const [reportLoading, setReportLoading] = useState(false);

  // Score card state
  const [scoreCard, setScoreCard] = useState(null); // { score, grammar, tip, summary, date }
  const [streak, setStreak] = useState(0);
  const [history, setHistory] = useState([]); // [{date, score}]
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
    const next = { ...prev, level: newLevel };
    saveProgress(next);
  }

  function setErr(e) {
    const msg = typeof e === "string" ? e : e?.message || JSON.stringify(e, null, 2);
    console.error(e);
    setError(msg);
  }

  // Non-blocking audio unlock
  function enableSoundNonBlocking() {
    try {
      const el = remoteAudioRef.current;
      if (!el) return;
      el.muted = false;
      el.volume = 1;
      el.playsInline = true;

      const p = el.play?.();
      if (p && typeof p.then === "function") {
        p.then(() => setSoundEnabled(true)).catch(() => setSoundEnabled(false));
      } else {
        setSoundEnabled(true);
      }
    } catch {
      setSoundEnabled(false);
    }
  }

  function sendJSON(obj) {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open") return;
    dc.send(JSON.stringify(obj));
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

    track.enabled = true; // hands-free
    setMicOn(true);
  }

  function attachDcMessageHandler(dc) {
    dc.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (!stoppingRef.current) return;

        const delta =
          msg?.delta ||
          msg?.text?.delta ||
          msg?.output_text?.delta ||
          msg?.response?.output_text?.delta;

        if (typeof delta === "string" && delta.length) {
          reportTextRef.current += delta;
        }

        if (msg?.type === "response.completed" || msg?.type === "response.done") {
          if (typeof reportResolveRef.current === "function") {
            reportResolveRef.current();
            reportResolveRef.current = null;
          }
        }
      } catch {}
    };
  }

  function buildTutorInstructions(selectedLevel) {
    const prof = levelProfile(selectedLevel);

    return `
You are Amin Sir, a friendly spoken-English teacher for Indian school students (age 10–15).

Language & speed rules (VERY IMPORTANT):
• Speak like a real teacher: slow pace, clear pronunciation.
• Use short pauses. Short sentences.
• Use 80% English + 20% very simple Hindi (Hinglish).
• Do NOT use difficult Hindi words. Use simple Hindi only for explanation.
Example style:
"Good! Very nice. Ab ek aur question. Tell me about your school."

Level: ${levelToText(selectedLevel)}
Level settings:
• Vocabulary: ${prof.vocab}
• Sentence length: ${prof.sentence}
• Question style: ${prof.questions}
• Correction style: ${prof.correction}

Conversation rules:
• One question at a time.
• Always keep the conversation going.
• Ask daily life questions (school, friends, hobbies, food, games).
• Encourage the student: "Good!", "Nice try!", "Very good!", "Try again".
• Correct gently using simple examples.
• Do NOT give scores during conversation.

Always respond in AUDIO.
`.trim();
  }

  async function startVoice() {
    setError("");
    setScoreCard(null);
    setReportLoading(false);

    setStatus("Connecting…");
    setStep("Starting…");
    setDcOpen(false);
    setGotRemoteTrack(false);
    setConnected(false);

    try {
      enableSoundNonBlocking();

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
        const el = remoteAudioRef.current;
        if (el) {
          el.srcObject = e.streams[0];
          enableSoundNonBlocking();
        }
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

        // Apply session + level instructions
        sendJSON({
          type: "session.update",
          session: {
            modalities: ["audio", "text"],
            voice: "alloy",
            audio: { output: { voice: "alloy", format: "pcm16" } },
            turn_detection: { type: "server_vad" },
            instructions: buildTutorInstructions(level),
          },
        });

        await new Promise((r) => setTimeout(r, 200));

        // Greeting: includes level mention softly
        sendJSON({
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "user",
            content: [
              {
                type: "input_text",
                text:
                  `Say exactly in AUDIO: "Hello beta! I am Amin Sir. We will practice English speaking. Your level is ${levelToText(
                    level
                  )}. What is your name?"`,
              },
            ],
          },
        });

        sendJSON({
          type: "response.create",
          response: { modalities: ["audio"], max_output_tokens: 160 },
        });

        enableSoundNonBlocking();
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

      setStep("Connected ✅");
      setStatus("Connected ✅");
      setConnected(true);
    } catch (e) {
      setStatus("Error");
      setErr(e);
    }
  }

  function stopAllImmediate() {
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
    } catch {}

    setDcOpen(false);
    setGotRemoteTrack(false);
    setSoundEnabled(false);
    setConnected(false);
    setMicOn(false);

    setStatus("Closed");
    setStep("—");
  }

  async function stopWithReport() {
    setError("");
    setReportLoading(true);
    setScoreCard(null);

    setStep("Stopping & generating score…");
    setStatus("Evaluating…");
    stoppingRef.current = true;

    // turn mic off immediately
    try {
      const track = localStreamRef.current?.getAudioTracks?.()?.[0];
      if (track) track.enabled = false;
      setMicOn(false);
    } catch {}

    try {
      reportTextRef.current = "";

      const donePromise = new Promise((resolve) => {
        reportResolveRef.current = resolve;
      });

      reportTimeoutRef.current = setTimeout(() => {
        if (typeof reportResolveRef.current === "function") {
          reportResolveRef.current();
          reportResolveRef.current = null;
        }
      }, 7000);

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
Give a FINAL evaluation for today's speaking session.

Return STRICT JSON only (no extra text), exactly:
{
  "score": 0-10,
  "grammar": "one correction in simple English + small Hindi help (80/20)",
  "tip": "one improvement tip in simple English + small Hindi help (80/20)",
  "summary": "one short encouraging line (80/20)",
  "level": "${levelToText(level)}"
}

Rules:
• Speak for ${levelToText(level)} level.
• Vocabulary: ${prof.vocab}
• Sentence length: ${prof.sentence}
• Keep it friendly.
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

      const card =
        score !== null
          ? { score, grammar, tip, summary, date: today, level: levelToText(level) }
          : { score: null, grammar: "", tip: "", summary: "", date: today, raw: raw || "Report not received." };

      setScoreCard(card);

      const prev = loadProgress();
      const s = computeNewStreak(prev.lastDay, prev.streak);

      const newHistory = [
        ...(Array.isArray(prev.history) ? prev.history : []).filter((x) => x?.date !== today),
        ...(score !== null ? [{ date: today, score }] : []),
      ]
        .sort((a, b) => (a.date > b.date ? 1 : -1))
        .slice(-7);

      const next = { ...prev, streak: s.streak, lastDay: s.lastDay, history: newHistory, level };
      saveProgress(next);

      setStreak(next.streak);
      setHistory(next.history);
    } catch (e) {
      setErr(e);
      setScoreCard({ score: null, raw: "Report failed. Please try again.", date: todayKeyLocal() });
    } finally {
      setReportLoading(false);
      stoppingRef.current = false;
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

      {/* Level selector */}
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
          style={{ padding: "10px 14px", borderRadius: 12, border: "none", background: "#111", color: "#fff", fontWeight: 900 }}
        >
          Start Voice 🎤
        </button>

        <button
          onClick={enableSoundNonBlocking}
          style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid #ddd", background: "#fff", fontWeight: 900 }}
        >
          Enable Sound 🔊
        </button>

        <button
          onClick={stopWithReport}
          style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid #ddd", background: "#fff", fontWeight: 900 }}
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

      {/* Trophy + Score card */}
      <div style={{ marginTop: 16, padding: 14, border: "1px solid #eee", borderRadius: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ fontWeight: 900, fontSize: 16 }}>🏆 Today’s Score Card</div>
          <div style={{ fontWeight: 900 }}>Level: {levelToText(level)}</div>
        </div>

        {reportLoading ? (
          <div style={{ marginTop: 10, fontWeight: 800 }}>Generating score…</div>
        ) : scoreCard ? (
          scoreCard.score === null ? (
            <pre style={{ marginTop: 10, whiteSpace: "pre-wrap" }}>{scoreCard.raw || "No report."}</pre>
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

        {/* 7-day progress */}
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
        </div>
      </div>
    </div>
  );
}