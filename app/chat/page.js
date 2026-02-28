"use client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);

  const [status, setStatus] = useState("Idle");
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const [topic, setTopic] = useState("");

  // Score UI
  const [scoreStatus, setScoreStatus] = useState("");
  const [scoreObj, setScoreObj] = useState(null);
  const [scoring, setScoring] = useState(false);

  // Transcript capture
  const transcriptRef = useRef("");
  const [transcriptPreview, setTranscriptPreview] = useState("");

  // History UI
  const [history, setHistory] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState(null);

  // Streak UI
  const [streakCount, setStreakCount] = useState(0);
  const [streakLastDay, setStreakLastDay] = useState(null);

  // ⭐ Best average score (per student)
  const [bestAvg, setBestAvg] = useState(null);

  // ✅ Debug (shows exactly where it stops)
  const [debug, setDebug] = useState([]);
  function logStep(msg) {
    setDebug((p) => [`${new Date().toLocaleTimeString()} — ${msg}`, ...p].slice(0, 20));
  }

  // ---------------- Student name ----------------
  const studentName = useMemo(() => {
    const fromUrl = (searchParams.get("name") || "").trim();
    if (fromUrl) return fromUrl;

    try {
      const fromLs = localStorage.getItem("studentName") || "";
      if (fromLs.trim()) return fromLs.trim();
    } catch {}

    return "Student";
  }, [searchParams]);

  // ---------------- Per-student keys ----------------
  const safeStudentKey = useMemo(() => {
    const safe = (studentName || "Student")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
    return safe || "student";
  }, [studentName]);

  const lessonKey = useMemo(() => `lessonDay_${safeStudentKey}`, [safeStudentKey]);
  const levelKey = useMemo(() => `level_${safeStudentKey}`, [safeStudentKey]);
  const historyKey = useMemo(() => `scoreHistory_${safeStudentKey}`, [safeStudentKey]);

  const streakKey = useMemo(() => `streak_${safeStudentKey}`, [safeStudentKey]);
  const streakLastKey = useMemo(() => `streakLast_${safeStudentKey}`, [safeStudentKey]);
  const bestKey = useMemo(() => `bestScore_${safeStudentKey}`, [safeStudentKey]);

  // ---------------- SESSION CONTROL (10 min) ----------------
  const sessionTimerRef = useRef(null);
  const sessionStartedAtRef = useRef(null);
  const sessionEndedRef = useRef(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const dailyLockKey = useMemo(() => `lastSessionDay_${safeStudentKey}`, [safeStudentKey]);

  // ---------------- Level ----------------
  const [level, setLevel] = useState("beginner");

  useEffect(() => {
    try {
      const saved = (localStorage.getItem(levelKey) || "").toLowerCase();
      if (saved === "beginner" || saved === "medium" || saved === "advanced") setLevel(saved);
      else setLevel("beginner");
    } catch {
      setLevel("beginner");
    }
  }, [levelKey]);

  function onChangeLevel(nextLevel) {
    setLevel(nextLevel);
    try {
      localStorage.setItem(levelKey, nextLevel);
    } catch {}
  }

  // ---------------- Load history + streak + best ----------------
  useEffect(() => {
    try {
      const raw = localStorage.getItem(historyKey);
      const parsed = raw ? JSON.parse(raw) : [];
      setHistory(Array.isArray(parsed) ? parsed : []);
    } catch {
      setHistory([]);
    }
    setSelectedReportId(null);

    try {
      const c = parseInt(localStorage.getItem(streakKey) || "0", 10);
      setStreakCount(Number.isFinite(c) ? c : 0);
    } catch {
      setStreakCount(0);
    }

    try {
      const d = localStorage.getItem(streakLastKey);
      setStreakLastDay(d || null);
    } catch {
      setStreakLastDay(null);
    }

    try {
      const b = parseFloat(localStorage.getItem(bestKey) || "");
      setBestAvg(Number.isNaN(b) ? null : b);
    } catch {
      setBestAvg(null);
    }

    // reset timer UI
    if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    sessionTimerRef.current = null;
    sessionStartedAtRef.current = null;
    sessionEndedRef.current = false;
    setTimeLeft(null);
  }, [historyKey, streakKey, streakLastKey, bestKey]);

  function saveHistory(nextHistory) {
    setHistory(nextHistory);
    try {
      localStorage.setItem(historyKey, JSON.stringify(nextHistory));
    } catch {}
  }

  function addToHistory(report) {
    const next = [report, ...history].slice(0, 10);
    saveHistory(next);
    setSelectedReportId(report.id);
  }

  function clearHistory() {
    saveHistory([]);
    setSelectedReportId(null);
  }

  const selectedReport = useMemo(() => {
    return history.find((h) => h.id === selectedReportId) || null;
  }, [history, selectedReportId]);

  // ---------------- Helpers ----------------
  async function safeJsonAny(res) {
    const text = await res.text();
    try {
      return { json: text ? JSON.parse(text) : null, text };
    } catch {
      return { json: null, text };
    }
  }

  async function fetchWithTimeout(url, options = {}, ms = 15000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), ms);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      return res;
    } finally {
      clearTimeout(id);
    }
  }

  async function getEphemeralToken() {
    logStep("POST /api/realtime (token)...");
    const r = await fetchWithTimeout("/api/realtime", { method: "POST" }, 15000);
    const { json, text } = await safeJsonAny(r);

    if (!r.ok) throw new Error(`POST /api/realtime failed (${r.status}). Body: ${text}`);
    if (!json?.value) throw new Error(`Token missing from /api/realtime. Body: ${text}`);

    logStep("Token received ✅");
    return json.value;
  }

  function appendTranscript(line) {
    if (!line) return;
    transcriptRef.current += line.trim() + "\n";
    const t = transcriptRef.current;
    setTranscriptPreview(t.length > 700 ? "..." + t.slice(-700) : t);
  }

  function cleanup() {
    try {
      dcRef.current?.close();
    } catch {}
    dcRef.current = null;

    try {
      pcRef.current?.close();
    } catch {}
    pcRef.current = null;

    try {
      localStreamRef.current?.getTracks()?.forEach((t) => t.stop());
    } catch {}
    localStreamRef.current = null;

    try {
      if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    } catch {}

    setConnected(false);
    setConnecting(false);
    setStatus("Idle");
  }

  function stopTalking() {
    setError("");
    setStatus("Stopping...");
    logStep("Stop clicked");

    if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    sessionTimerRef.current = null;
    sessionStartedAtRef.current = null;
    sessionEndedRef.current = false;
    setTimeLeft(null);

    cleanup();
  }

  function endSessionDueToLimit() {
    if (sessionEndedRef.current) return;
    sessionEndedRef.current = true;

    appendTranscript("SYSTEM: Session limit reached (10 minutes).");
    alert("Today's 10 minute speaking class is complete 😊\nCome back tomorrow!");
    stopTalking();
  }

  function resetProgress() {
    try {
      localStorage.setItem(lessonKey, "0");
    } catch {}
    setTopic("");
  }

  function getCourseTopic() {
    const course = [
      "Introducing myself",
      "My family",
      "My school",
      "My best friend",
      "My daily routine",
      "At the grocery shop",
      "At the restaurant",
      "At the bus stop",
      "At the doctor",
      "My favorite food",
      "My hobbies",
      "Weather and seasons",
      "Shopping conversation",
      "Asking for directions",
      "Telephone conversation",
      "Ordering food",
      "Describing a picture",
      "Story telling",
      "Past tense speaking",
      "Future plans",
    ];

    let day = 0;
    try {
      day = parseInt(localStorage.getItem(lessonKey) || "0", 10);
      if (Number.isNaN(day)) day = 0;
    } catch {}

    if (day >= course.length) day = 0;

    const lessonNumber = day + 1;
    const t = course[day];

    try {
      localStorage.setItem(lessonKey, String(day + 1));
    } catch {}

    setTopic(`Lesson ${lessonNumber}: ${t}`);
    return { lessonNumber, topicText: t };
  }

  function getLevelRules(lvl) {
    if (lvl === "advanced") return { label: "Advanced", speed: "normal" };
    if (lvl === "medium") return { label: "Medium", speed: "slow-medium" };
    return { label: "Beginner", speed: "slow" };
  }

  function getAvg(scores) {
    const s = scores || {};
    const vals = [s.pronunciation, s.grammar, s.fluency, s.confidence].filter((x) => typeof x === "number");
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }

  function updateStreakOnSuccessfulScore() {
    const today = new Date().toISOString().slice(0, 10);

    if (!streakLastDay) {
      setStreakCount(1);
      setStreakLastDay(today);
      try {
        localStorage.setItem(streakKey, "1");
        localStorage.setItem(streakLastKey, today);
      } catch {}
      return;
    }

    if (streakLastDay === today) return;

    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const nextCount = streakLastDay === yesterday ? Math.max(1, (streakCount || 0) + 1) : 1;

    setStreakCount(nextCount);
    setStreakLastDay(today);
    try {
      localStorage.setItem(streakKey, String(nextCount));
      localStorage.setItem(streakLastKey, today);
    } catch {}
  }

  function updateBestOnSuccessfulScore(scores) {
    const avg = getAvg(scores);
    if (avg === null) return;

    if (bestAvg === null || avg > bestAvg) {
      setBestAvg(avg);
      try {
        localStorage.setItem(bestKey, String(avg));
      } catch {}
    }
  }

  async function requestSpeakingScore() {
    setError("");
    setScoreObj(null);

    const transcript = transcriptRef.current.trim();
    if (transcript.length < 20) {
      setError("Transcript too short. Start Voice and speak 30–60 seconds first.");
      return;
    }

    setScoring(true);
    setScoreStatus("Scoring... please wait");

    try {
      const r = await fetchWithTimeout(
        "/api/score",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentName, lesson: topic || "", level, transcript }),
        },
        20000
      );

      const { json, text } = await safeJsonAny(r);
      if (!r.ok) throw new Error(`Score API failed (${r.status}). Body: ${text}`);
      if (!json || typeof json !== "object") throw new Error(`Score API returned non-JSON: ${text}`);

      setScoreObj(json);
      setScoreStatus("Score ready ✅");

      const report = {
        id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
        ts: Date.now(),
        student: json.student || studentName,
        level: json.level || level,
        lesson: json.lesson || topic || "",
        scores: json.scores || {},
        strengths: Array.isArray(json.strengths) ? json.strengths : [],
        improvements: Array.isArray(json.improvements) ? json.improvements : [],
        corrected_sentences: Array.isArray(json.corrected_sentences) ? json.corrected_sentences : [],
        homework: json.homework || "",
      };

      addToHistory(report);
      updateStreakOnSuccessfulScore();
      updateBestOnSuccessfulScore(report.scores);
    } catch (e) {
      setScoreStatus("");
      setError(String(e?.message || e));
    } finally {
      setScoring(false);
    }
  }

  // ---------------- Mobile Audio Unlock ----------------
  const audioUnlockedRef = useRef(false);

  async function unlockAudio() {
    if (audioUnlockedRef.current) return true;
    const el = remoteAudioRef.current;
    if (!el) return false;

    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        const ctx = new AC();
        if (ctx.state === "suspended") await ctx.resume();
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
        source.stop(0);
        if (ctx.close) await ctx.close();
      }

      try {
        await el.play();
      } catch {}

      audioUnlockedRef.current = true;
      logStep("Audio unlocked ✅");
      return true;
    } catch {
      logStep("Audio unlock failed (ok)");
      return false;
    }
  }

  // ---------------- Start Voice (WebRTC) ----------------
  async function startTalking() {
    setError("");
    setScoreObj(null);
    setScoreStatus("");

    if (connecting || connected) return;

    if (typeof window === "undefined") return;

    // IMPORTANT: show progress, not silent
    setConnecting(true);
    setStatus("Connecting...");
    logStep("Start clicked");

    try {
      if (!window.isSecureContext) throw new Error("Microphone needs HTTPS (secure connection). Open the https link.");

      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error("Microphone not available. Use Chrome on mobile and allow mic permission.");
      }

      // ✅ DAILY LOCK (1 session per day) — you can comment this if testing
      try {
        const today = new Date().toISOString().slice(0, 10);
        const last = localStorage.getItem(dailyLockKey);
        if (last === today) {
          alert("You already completed today's speaking class 😊\nCome back tomorrow!");
          setConnecting(false);
          setStatus("Idle");
          return;
        }
      } catch {}

      await unlockAudio();

      // 1) MIC
      setStatus("Connecting... (mic)");
      logStep("Requesting mic permission...");
      const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      logStep("Mic OK ✅");
      localStreamRef.current = localStream;

      // 2) TOPIC
      const { lessonNumber, topicText } = getCourseTopic();
      const rules = getLevelRules(level);
      appendTranscript(`SYSTEM: Student=${studentName}, Level=${rules.label}, Lesson=${lessonNumber} (${topicText})`);

      // 3) TOKEN
      setStatus("Connecting... (token)");
      const token = await getEphemeralToken();

      // 4) PC
      setStatus("Connecting... (webrtc)");
      logStep("Creating RTCPeerConnection...");
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      pc.ontrack = async (event) => {
        const el = remoteAudioRef.current;
        const stream = event.streams?.[0];
        if (!el || !stream) return;

        el.srcObject = stream;
        el.autoplay = true;
        el.muted = false;
        el.playsInline = true;

        try {
          await el.play();
          logStep("Remote audio playing ✅");
        } catch {
          logStep("Remote audio play blocked (tap ▶)");
        }
      };

      // add mic track
      for (const track of localStream.getTracks()) pc.addTrack(track, localStream);

      // 5) DATA CHANNEL
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.onopen = () => {
        setConnected(true);
        setConnecting(false);
        setStatus("Connected ✅");
        logStep("DataChannel open ✅");

        // timer 10 min
        sessionStartedAtRef.current = Date.now();
        setTimeLeft(600);
        sessionTimerRef.current = setInterval(() => {
          const elapsed = Math.floor((Date.now() - sessionStartedAtRef.current) / 1000);
          const remaining = 600 - elapsed;
          setTimeLeft(remaining > 0 ? remaining : 0);
          if (remaining <= 0) {
            if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
            sessionTimerRef.current = null;
            endSessionDueToLimit();
          }
        }, 1000);

        // save daily lock AFTER connected
        try {
          const today = new Date().toISOString().slice(0, 10);
          localStorage.setItem(dailyLockKey, today);
        } catch {}

        const instructions = `You are Amin Sir AI Tutor.

LANGUAGE RULE (STRICT):
- Speak ONLY in English.
- You may use SMALL SIMPLE Hindi words in Roman letters only (Hinglish).
- Never output Arabic/Persian/Urdu script.
- If student speaks non-English, say: "Please speak in English."

Start like this:
"Hello ${studentName}! I am Amin Sir 😊"

Then:
"Today’s topic: ${topicText}"

Level: ${rules.label}. Speed: ${rules.speed}.
Ask ONE question at a time and wait for reply.`;

        dc.send(
          JSON.stringify({
            type: "session.update",
            session: {
              instructions,
              input_audio_transcription: { model: "gpt-4o-mini-transcribe", language: "en" },
            },
          })
        );

        dc.send(JSON.stringify({ type: "response.create", response: { modalities: ["text", "audio"] } }));
      };

      dc.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);

          const assistantText =
            msg?.delta ?? msg?.text ?? msg?.output_text ?? msg?.response?.output_text ?? msg?.content;
          if (typeof assistantText === "string" && assistantText.trim()) appendTranscript(`AI: ${assistantText}`);

          const tr =
            msg?.transcript ??
            msg?.input_audio_transcription?.transcript ??
            msg?.conversation?.item?.input_audio_transcription?.transcript;
          if (typeof tr === "string" && tr.trim()) appendTranscript(`STUDENT: ${tr}`);
        } catch {}
      };

      dc.onerror = () => setError("Data channel error");
      dc.onclose = () => {
        setConnected(false);
        setConnecting(false);
        setStatus("Disconnected");
        logStep("DataChannel closed");

        if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
        setTimeLeft(null);
      };

      // 6) SDP exchange
      logStep("Creating offer...");
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      setStatus("Connecting... (SDP)");
      logStep("PUT /api/realtime (SDP)...");
      const sdpResp = await fetchWithTimeout(
        "/api/realtime",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sdp: offer.sdp, token }),
        },
        20000
      );

      const { json, text } = await safeJsonAny(sdpResp);
      if (!sdpResp.ok) throw new Error(`PUT /api/realtime failed (${sdpResp.status}). Body: ${text}`);
      if (!json?.sdp) throw new Error(`Missing answer sdp from /api/realtime. Body: ${text}`);

      logStep("Answer SDP received ✅");
      await pc.setRemoteDescription({ type: "answer", sdp: json.sdp });

      setStatus("Live 🎤");
      logStep("RemoteDescription set ✅");
    } catch (e) {
      setConnecting(false);
      setError(String(e?.message || e));
      setStatus("Error");
      logStep(`ERROR: ${String(e?.message || e)}`);
      cleanup();
    }
  }

  // cleanup on exit
  useEffect(() => {
    return () => {
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showMobileStart = !connected;

  return (
    <main style={{ minHeight: "100vh", padding: 16, display: "grid", placeItems: "center" }}>
      <div style={{ width: "100%", maxWidth: 1100, border: "1px solid #e5e7eb", borderRadius: 18, padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>
              Welcome, {studentName} 👋{" "}
              <span style={{ fontSize: 14, fontWeight: 900, marginLeft: 10 }}>
                🔥 Streak: {streakCount} day{streakCount === 1 ? "" : "s"}
              </span>
              <span style={{ fontSize: 14, fontWeight: 900, marginLeft: 14 }}>
                {bestAvg === null ? "⭐ Best: Not set" : bestAvg >= 4.5 ? `🏆 Best: ${bestAvg.toFixed(1)}/5` : `⭐ Best: ${bestAvg.toFixed(1)}/5`}
              </span>
            </div>

            <div style={{ color: "#6b7280", marginTop: 4 }}>Status: {status}</div>

            {timeLeft !== null && (
              <div style={{ marginTop: 6, fontWeight: 800, color: "#b91c1c" }}>
                ⏱ Time left: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
              </div>
            )}

            {topic ? (
              <div style={{ marginTop: 6, fontSize: 14 }}>
                <b>Course Progress:</b> {topic}
              </div>
            ) : (
              <div style={{ marginTop: 6, fontSize: 14, color: "#6b7280" }}>Click Start Voice to begin.</div>
            )}

            <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <label style={{ fontSize: 14, fontWeight: 700 }}>Level:</label>
              <select
                value={level}
                disabled={connecting || connected}
                onChange={(e) => onChangeLevel(e.target.value)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid #d1d5db",
                  background: "white",
                  cursor: connecting || connected ? "not-allowed" : "pointer",
                  fontWeight: 700,
                }}
              >
                <option value="beginner">Beginner (slow + easy)</option>
                <option value="medium">Medium (balanced)</option>
                <option value="advanced">Advanced (long answers)</option>
              </select>
              <span style={{ fontSize: 12, color: "#9ca3af" }}>(Saved for {studentName})</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button
              onClick={() => router.push("/login")}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid #d1d5db",
                background: "white",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Change Name
            </button>

            <button
              onClick={resetProgress}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid #d1d5db",
                background: "white",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Reset Progress
            </button>

            <button
              onClick={requestSpeakingScore}
              disabled={scoring}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid #d1d5db",
                background: scoring ? "#f3f4f6" : "white",
                cursor: scoring ? "not-allowed" : "pointer",
                fontWeight: 800,
              }}
            >
              {scoring ? "Scoring..." : "Get Speaking Score"}
            </button>

            {!connected ? (
              <button
                onClick={startTalking}
                disabled={connecting}
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "none",
                  cursor: connecting ? "not-allowed" : "pointer",
                  fontWeight: 900,
                  background: connecting ? "#94a3b8" : "#16a34a",
                  color: "white",
                }}
              >
                {connecting ? "Connecting..." : "Start Voice 🎤"}
              </button>
            ) : (
              <button
                onClick={stopTalking}
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 900,
                  background: "#ef4444",
                  color: "white",
                }}
              >
                Stop
              </button>
            )}
          </div>
        </div>

        {error ? (
          <pre
            style={{
              marginTop: 14,
              padding: 12,
              borderRadius: 12,
              background: "#fff1f2",
              color: "#991b1b",
              whiteSpace: "pre-wrap",
              overflowX: "auto",
            }}
          >
            {error}
          </pre>
        ) : null}

        {/* AI Voice */}
        <div style={{ marginTop: 16, padding: 14, borderRadius: 14, border: "1px dashed #d1d5db" }}>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>AI Voice Output</div>
          <audio ref={remoteAudioRef} autoPlay playsInline controls />
          <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>
            If mobile is silent, tap the ▶ play once.
          </div>
        </div>

        {/* Transcript preview */}
        <div style={{ marginTop: 16, padding: 14, borderRadius: 14, border: "1px solid #e5e7eb" }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Transcript (preview)</div>
          <pre style={{ whiteSpace: "pre-wrap", overflowX: "auto", fontSize: 13, color: "#374151" }}>
            {transcriptPreview || "Start Voice to capture transcript..."}
          </pre>
        </div>

        {/* Debug box */}
        <div style={{ marginTop: 16, padding: 12, borderRadius: 12, border: "1px solid #e5e7eb" }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Debug (screenshot this if stuck)</div>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, color: "#374151" }}>
            {debug.length ? debug.join("\n") : "No debug yet"}
          </pre>
        </div>

        {/* CURRENT SCORE (simple) */}
        <div style={{ marginTop: 16, padding: 14, borderRadius: 14, border: "1px solid #e5e7eb" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 900 }}>Speaking Score</div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>{scoreStatus}</div>
          </div>

          {scoreObj ? (
            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
              <ScoreCard title="Pronunciation" value={scoreObj?.scores?.pronunciation} />
              <ScoreCard title="Grammar" value={scoreObj?.scores?.grammar} />
              <ScoreCard title="Fluency" value={scoreObj?.scores?.fluency} />
              <ScoreCard title="Confidence" value={scoreObj?.scores?.confidence} />
            </div>
          ) : (
            <div style={{ marginTop: 10, fontSize: 13, color: "#6b7280" }}>
              Click <b>Get Speaking Score</b> after speaking 30–60 seconds.
            </div>
          )}
        </div>
      </div>

      {/* MOBILE STICKY START BUTTON */}
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          padding: 12,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(6px)",
          display: "flex",
          justifyContent: "center",
          zIndex: 9999,
        }}
      >
        {!connected ? (
          <button
            onClick={startTalking}
            disabled={connecting}
            style={{
              width: "min(520px, 92vw)",
              padding: "14px 16px",
              borderRadius: 14,
              border: "none",
              fontWeight: 900,
              fontSize: 16,
              background: connecting ? "#94a3b8" : "#16a34a",
              color: "white",
              cursor: connecting ? "not-allowed" : "pointer",
            }}
          >
            {connecting ? "CONNECTING..." : "START VOICE 🎤 (Tap & Allow Mic)"}
          </button>
        ) : (
          <button
            onClick={stopTalking}
            style={{
              width: "min(520px, 92vw)",
              padding: "14px 16px",
              borderRadius: 14,
              border: "none",
              fontWeight: 900,
              fontSize: 16,
              background: "#ef4444",
              color: "white",
              cursor: "pointer",
            }}
          >
            STOP VOICE
          </button>
        )}
      </div>
    </main>
  );
}

function ScoreCard({ title, value }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 12 }}>
      <div style={{ fontSize: 13, color: "#6b7280" }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 900, marginTop: 6 }}>{value ?? "-"}/5</div>
    </div>
  );
}