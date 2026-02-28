"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

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
  const [streakLastDay, setStreakLastDay] = useState(null); // YYYY-MM-DD

  // ⭐ Best average score (per student)
  const [bestAvg, setBestAvg] = useState(null);

  // ---------------- Student name ----------------
  const studentName = useMemo(() => {
    const fromUrl = (searchParams.get("name") || "").trim();
    if (fromUrl) return fromUrl;

    try {
      const fromLs = (localStorage.getItem("studentName") || "").trim();
      if (fromLs) return fromLs;
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

  // ✅ Streak keys
  const streakKey = useMemo(() => `streak_${safeStudentKey}`, [safeStudentKey]);
  const streakLastKey = useMemo(() => `streakLast_${safeStudentKey}`, [safeStudentKey]);

  // ✅ Best score key
  const bestKey = useMemo(() => `bestScore_${safeStudentKey}`, [safeStudentKey]);

  // ---------------- SESSION CONTROL (FINANCIAL SAFETY LOCK) ----------------
  const sessionTimerRef = useRef(null); // interval id
  const sessionStartedAtRef = useRef(null); // timestamp when session started
  const sessionEndedRef = useRef(false); // guard (avoid double alerts)
  const [timeLeft, setTimeLeft] = useState(null); // seconds left
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

  // ---------------- Load history + streak + best when student changes ----------------
  useEffect(() => {
    // history
    try {
      const raw = localStorage.getItem(historyKey);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) setHistory(parsed);
      else setHistory([]);
    } catch {
      setHistory([]);
    }
    setSelectedReportId(null);

    // streak
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

    // best
    try {
      const b = parseFloat(localStorage.getItem(bestKey));
      if (!Number.isNaN(b)) setBestAvg(b);
      else setBestAvg(null);
    } catch {
      setBestAvg(null);
    }

    // session timer reset
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
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

  async function getEphemeralToken() {
    const r = await fetch("/api/realtime", { method: "POST" });
    const { json, text } = await safeJsonAny(r);

    if (!r.ok) throw new Error(`POST /api/realtime failed (${r.status}). Body: ${text}`);
    if (!json?.value) throw new Error(`Token missing from /api/realtime. Body: ${text}`);
    return json.value;
  }

  function appendTranscript(line) {
    if (!line) return;
    transcriptRef.current += line.trim() + "\n";
    const t = transcriptRef.current;
    const preview = t.length > 700 ? "..." + t.slice(-700) : t;
    setTranscriptPreview(preview);
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

    setConnected(false);
    setStatus("Idle");
  }

  function stopTalking() {
    setError("");
    setStatus("Stopping...");

    // ✅ stop session timer
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
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
    const vals = [s.pronunciation, s.grammar, s.fluency, s.confidence].filter(
      (x) => typeof x === "number"
    );
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }

  function formatDelta(delta) {
    if (delta === null || delta === undefined) return "";
    const sign = delta > 0 ? "+" : "";
    return `${sign}${delta.toFixed(1)}`;
  }

  function ymd(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function addDays(ymdStr, days) {
    const [Y, M, D] = ymdStr.split("-").map((x) => parseInt(x, 10));
    const dt = new Date(Y, (M || 1) - 1, D || 1);
    dt.setDate(dt.getDate() + days);
    return ymd(dt);
  }

  function updateStreakOnSuccessfulScore() {
    const today = ymd(new Date());

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

    const yesterday = addDays(today, -1);

    let nextCount = 1;
    if (streakLastDay === yesterday) {
      nextCount = Math.max(1, (streakCount || 0) + 1);
    } else {
      nextCount = 1;
    }

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

  // ✅ Get score via API + save to history + streak + best
  async function requestSpeakingScore() {
    setError("");
    setScoreObj(null);

    const transcript = transcriptRef.current.trim();
    if (transcript.length < 20) {
      setError("Transcript too short. Start Talking and speak 30–60 seconds first.");
      return;
    }

    setScoring(true);
    setScoreStatus("Scoring... please wait");

    try {
      const r = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName,
          lesson: topic || "",
          level,
          transcript,
        }),
      });

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

      // ✅ update streak & best only on success
      updateStreakOnSuccessfulScore();
      updateBestOnSuccessfulScore(report.scores);
    } catch (e) {
      setScoreStatus("");
      setError(String(e?.message || e));
    } finally {
      setScoring(false);
    }
  }

  // ---------------- Start Talking ----------------
  async function startTalking() {
    setError("");
    setScoreObj(null);
    setScoreStatus("");

    // ✅ DAILY LOCK (1 session per day)
    try {
      const today = new Date().toISOString().slice(0, 10);
      const last = localStorage.getItem(dailyLockKey);
      if (last === today) {
        alert("You already completed today's speaking class 😊\nCome back tomorrow!");
        return;
      }
    } catch {}

    setStatus("Connecting...");
    setConnected(false);

    transcriptRef.current = "";
    setTranscriptPreview("");

    // reset session timer guards
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
    sessionStartedAtRef.current = null;
    sessionEndedRef.current = false;
    setTimeLeft(null);

    try {
      const { lessonNumber, topicText } = getCourseTopic();
      const rules = getLevelRules(level);

      appendTranscript(
        `SYSTEM: Student=${studentName}, Level=${rules.label}, Lesson=${lessonNumber} (${topicText})`
      );

      const token = await getEphemeralToken();

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      pc.ontrack = (event) => {
        if (remoteAudioRef.current) remoteAudioRef.current.srcObject = event.streams[0];
      };

      const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = localStream;
      for (const track of localStream.getTracks()) pc.addTrack(track, localStream);

      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.onopen = () => {
        setConnected(true);
        setStatus("Connected ✅");

        // ✅ Start 10-minute timer ONLY after connected
        sessionStartedAtRef.current = Date.now();
        setTimeLeft(600); // seconds

        sessionTimerRef.current = setInterval(() => {
          const elapsed = Math.floor((Date.now() - sessionStartedAtRef.current) / 1000);
          const remaining = 600 - elapsed;
          setTimeLeft(remaining > 0 ? remaining : 0);

          if (remaining <= 0) {
            if (sessionTimerRef.current) {
              clearInterval(sessionTimerRef.current);
              sessionTimerRef.current = null;
            }
            endSessionDueToLimit();
          }
        }, 1000);

        // ✅ Save daily lock date (so only 1 session/day)
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
              input_audio_transcription: {
                model: "gpt-4o-mini-transcribe",
                language: "en",
              },
            },
          })
        );

        dc.send(
          JSON.stringify({
            type: "response.create",
            response: { modalities: ["text", "audio"] },
          })
        );
      };

      dc.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);

          const assistantText =
            msg?.delta ??
            msg?.text ??
            msg?.output_text ??
            msg?.response?.output_text ??
            msg?.content;

          if (typeof assistantText === "string" && assistantText.trim()) {
            appendTranscript(`AI: ${assistantText}`);
          }

          const tr =
            msg?.transcript ??
            msg?.input_audio_transcription?.transcript ??
            msg?.conversation?.item?.input_audio_transcription?.transcript;

          if (typeof tr === "string" && tr.trim()) {
            appendTranscript(`STUDENT: ${tr}`);
          }
        } catch {}
      };

      dc.onerror = () => setError("Data channel error");
      dc.onclose = () => {
        setConnected(false);
        setStatus("Disconnected");

        // stop timer if disconnected
        if (sessionTimerRef.current) {
          clearInterval(sessionTimerRef.current);
          sessionTimerRef.current = null;
        }
        setTimeLeft(null);
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpResp = await fetch("/api/realtime", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sdp: offer.sdp, token }),
      });

      const { json, text } = await safeJsonAny(sdpResp);
      if (!sdpResp.ok) throw new Error(`PUT /api/realtime failed (${sdpResp.status}). Body: ${text}`);
      if (!json?.sdp) throw new Error(`Missing answer sdp from /api/realtime. Body: ${text}`);

      await pc.setRemoteDescription({ type: "answer", sdp: json.sdp });
      setStatus("Live 🎤");
    } catch (e) {
      setError(String(e?.message || e));
      setStatus("Error");
      cleanup();
    }
  }

  // ---------------- Improvement calculations ----------------
  function getPrevReportFor(report) {
    if (!report) return null;
    const idx = history.findIndex((h) => h.id === report.id);
    if (idx === -1) return null;
    // history is newest first, so "previous" means next index
    return history[idx + 1] || null;
  }

  function getDeltaFor(report) {
    const prev = getPrevReportFor(report);
    const curAvg = getAvg(report?.scores);
    const prevAvg = getAvg(prev?.scores);
    if (curAvg === null || prevAvg === null) return null;
    return curAvg - prevAvg;
  }

  const selectedDelta = useMemo(() => {
    if (!selectedReport) return null;
    return getDeltaFor(selectedReport);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedReportId, history]);

  useEffect(() => {
    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main style={{ minHeight: "100vh", padding: 24, display: "grid", placeItems: "center" }}>
      <div style={{ width: "100%", maxWidth: 1100, border: "1px solid #e5e7eb", borderRadius: 18, padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>
              Welcome, {studentName} 👋{" "}
              <span style={{ fontSize: 14, fontWeight: 900, marginLeft: 10 }}>
                🔥 Streak: {streakCount} day{streakCount === 1 ? "" : "s"}
              </span>
              <span style={{ fontSize: 14, fontWeight: 900, marginLeft: 14 }}>
                {bestAvg === null ? (
                  <>⭐ Best: Not set</>
                ) : bestAvg >= 4.5 ? (
                  <>🏆 Best: {bestAvg.toFixed(1)}/5</>
                ) : (
                  <>⭐ Best: {bestAvg.toFixed(1)}/5</>
                )}
              </span>
            </div>

            <div style={{ color: "#6b7280", marginTop: 4 }}>Status: {status}</div>

            {/* ✅ 10-minute countdown */}
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
              <div style={{ marginTop: 6, fontSize: 14, color: "#6b7280" }}>Click Start Talking to begin.</div>
            )}

            <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <label style={{ fontSize: 14, fontWeight: 700 }}>Level:</label>
              <select
                value={level}
                onChange={(e) => onChangeLevel(e.target.value)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid #d1d5db",
                  background: "white",
                  cursor: "pointer",
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

            {/* ✅ MOBILE VISIBLE VOICE BUTTONS */}
            {!connected ? (
              <button
                onClick={startTalking}
                style={{
                  padding: "12px 18px",
                  borderRadius: 14,
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 900,
                  background: "#22c55e",
                  color: "white",
                }}
              >
                🎤 START VOICE (Start Talking)
              </button>
            ) : (
              <button
                onClick={stopTalking}
                style={{
                  padding: "12px 18px",
                  borderRadius: 14,
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 900,
                  background: "#ef4444",
                  color: "white",
                }}
              >
                ⛔ STOP VOICE
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
          <audio ref={remoteAudioRef} autoPlay controls />
        </div>

        {/* Transcript preview */}
        <div style={{ marginTop: 16, padding: 14, borderRadius: 14, border: "1px solid #e5e7eb" }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Transcript (preview)</div>
          <pre style={{ whiteSpace: "pre-wrap", overflowX: "auto", fontSize: 13, color: "#374151" }}>
            {transcriptPreview || "Start Talking to capture transcript..."}
          </pre>
        </div>

        {/* HISTORY + IMPROVEMENT */}
        <div style={{ marginTop: 16, padding: 14, borderRadius: 14, border: "1px solid #e5e7eb" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 900 }}>History (Last {Math.min(history.length, 10)})</div>
            <button
              onClick={clearHistory}
              disabled={history.length === 0}
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                border: "1px solid #d1d5db",
                background: history.length === 0 ? "#f3f4f6" : "white",
                cursor: history.length === 0 ? "not-allowed" : "pointer",
                fontWeight: 800,
              }}
              title="Clear only this student's history"
            >
              Clear History
            </button>
          </div>

          {history.length === 0 ? (
            <div style={{ marginTop: 10, fontSize: 13, color: "#6b7280" }}>
              No reports yet. Generate a score once and it will save here.
            </div>
          ) : (
            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f9fafb" }}>
                      <th style={thStyle}>Date</th>
                      <th style={thStyle}>Lesson</th>
                      <th style={thStyle}>Level</th>
                      <th style={thStyle}>Avg</th>
                      <th style={thStyle}>Change</th>
                      <th style={thStyle}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h) => {
                      const avg = getAvg(h.scores);
                      const avgTxt = avg === null ? "-" : `${avg.toFixed(1)}/5`;

                      const delta = getDeltaFor(h);
                      const deltaTxt = delta === null ? "—" : formatDelta(delta);
                      const arrow = delta === null ? "" : delta > 0 ? "▲" : delta < 0 ? "▼" : "•";

                      const isSel = h.id === selectedReportId;

                      return (
                        <tr key={h.id} style={{ background: isSel ? "#eef2ff" : "white" }}>
                          <td style={tdStyle}>{formatDateTime(h.ts)}</td>
                          <td style={tdStyle}>{h.lesson || "-"}</td>
                          <td style={tdStyle}>{h.level || "-"}</td>
                          <td style={tdStyle}>{avgTxt}</td>
                          <td style={tdStyle}>
                            {delta === null ? (
                              <span style={{ color: "#6b7280" }}>—</span>
                            ) : (
                              <span style={{ fontWeight: 900 }}>
                                {arrow} {deltaTxt}
                              </span>
                            )}
                          </td>
                          <td style={{ ...tdStyle, textAlign: "right" }}>
                            <button
                              onClick={() => setSelectedReportId(h.id)}
                              style={{
                                padding: "6px 10px",
                                borderRadius: 10,
                                border: "1px solid #d1d5db",
                                background: "white",
                                cursor: "pointer",
                                fontWeight: 800,
                              }}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {selectedReport ? (
                <div style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ fontWeight: 900 }}>
                      Report: {formatDateTime(selectedReport.ts)} — {selectedReport.lesson || ""}
                    </div>
                    <div style={{ color: "#6b7280", fontSize: 13 }}>Student: {selectedReport.student}</div>
                  </div>

                  <div style={{ marginTop: 10, padding: 10, borderRadius: 12, border: "1px dashed #d1d5db" }}>
                    <b>Improvement vs last time:</b>{" "}
                    {selectedDelta === null ? (
                      <span style={{ color: "#6b7280" }}>Not enough reports yet.</span>
                    ) : (
                      <span style={{ fontWeight: 900 }}>
                        {selectedDelta > 0 ? "▲" : selectedDelta < 0 ? "▼" : "•"} {formatDelta(selectedDelta)}
                      </span>
                    )}
                  </div>

                  <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
                    <ScoreCard title="Pronunciation" value={selectedReport?.scores?.pronunciation} />
                    <ScoreCard title="Grammar" value={selectedReport?.scores?.grammar} />
                    <ScoreCard title="Fluency" value={selectedReport?.scores?.fluency} />
                    <ScoreCard title="Confidence" value={selectedReport?.scores?.confidence} />
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <b>Strengths:</b>
                    <ul style={{ marginTop: 6 }}>
                      {(selectedReport.strengths || []).map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <b>Improvements:</b>
                    <ul style={{ marginTop: 6 }}>
                      {(selectedReport.improvements || []).map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>

                  {Array.isArray(selectedReport.corrected_sentences) && selectedReport.corrected_sentences.length ? (
                    <div style={{ marginTop: 12 }}>
                      <b>Corrections:</b>
                      <ul style={{ marginTop: 6 }}>
                        {selectedReport.corrected_sentences.slice(0, 3).map((c, i) => (
                          <li key={i}>
                            <div><i>Student said:</i> {c.student_said}</div>
                            <div><i>Better:</i> {c.better}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {selectedReport.homework ? (
                    <div style={{ marginTop: 12, padding: 10, borderRadius: 12, border: "1px dashed #d1d5db" }}>
                      <b>Homework:</b> {selectedReport.homework}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* CURRENT SCORE */}
        <div style={{ marginTop: 16, padding: 14, borderRadius: 14, border: "1px solid #e5e7eb" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 900 }}>Speaking Score</div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>{scoreStatus}</div>
          </div>

          {scoreObj ? (
            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
                <ScoreCard title="Pronunciation" value={scoreObj?.scores?.pronunciation} />
                <ScoreCard title="Grammar" value={scoreObj?.scores?.grammar} />
                <ScoreCard title="Fluency" value={scoreObj?.scores?.fluency} />
                <ScoreCard title="Confidence" value={scoreObj?.scores?.confidence} />
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 10, fontSize: 13, color: "#6b7280" }}>
              Click <b>Get Speaking Score</b> after the student speaks for 30–60 seconds.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

const thStyle = { textAlign: "left", padding: 10, fontSize: 13, color: "#374151" };
const tdStyle = { padding: 10, borderTop: "1px solid #e5e7eb", fontSize: 13, color: "#111827" };

function formatDateTime(ts) {
  try {
    const d = new Date(ts);
    return d.toLocaleString();
  } catch {
    return "";
  }
}

function ScoreCard({ title, value }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 12 }}>
      <div style={{ fontSize: 13, color: "#6b7280" }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 900, marginTop: 6 }}>{value ?? "-"}/5</div>
    </div>
  );
}