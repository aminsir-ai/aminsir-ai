"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { COURSE_DATA } from "@/lib/courseData";

function getLevels() {
  return Array.isArray(COURSE_DATA?.levels) ? COURSE_DATA.levels : [];
}

function getLevel(levelNo) {
  return (
    getLevels().find((lvl) => Number(lvl?.level) === Number(levelNo)) || null
  );
}

function getWeeks(levelNo) {
  const level = getLevel(levelNo);
  return Array.isArray(level?.weeks) ? level.weeks : [];
}

function getWeek(levelNo, weekNo) {
  return (
    getWeeks(levelNo).find((wk) => Number(wk?.week) === Number(weekNo)) || null
  );
}

function getDays(levelNo, weekNo) {
  const week = getWeek(levelNo, weekNo);
  return Array.isArray(week?.days) ? week.days : [];
}

function getDay(levelNo, weekNo, dayNo) {
  return (
    getDays(levelNo, weekNo).find((d) => Number(d?.day) === Number(dayNo)) ||
    null
  );
}

function getInitialLessonState() {
  return {
    level: 1,
    week: 1,
    day: 1,
  };
}

function cleanWords(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
}

function uniqueWords(text) {
  return [...new Set(cleanWords(text))];
}

function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num));
}

function round(num) {
  return Math.round(num);
}

function getLessonKeywords(lesson) {
  const stopWords = new Set([
    "the",
    "is",
    "are",
    "am",
    "was",
    "were",
    "be",
    "been",
    "being",
    "a",
    "an",
    "and",
    "or",
    "to",
    "of",
    "in",
    "on",
    "at",
    "for",
    "with",
    "from",
    "by",
    "about",
    "this",
    "that",
    "these",
    "those",
    "my",
    "your",
    "his",
    "her",
    "their",
    "our",
    "i",
    "you",
    "he",
    "she",
    "it",
    "we",
    "they",
    "me",
    "him",
    "them",
    "do",
    "does",
    "did",
    "have",
    "has",
    "had",
    "can",
    "could",
    "will",
    "would",
    "should",
    "today",
    "lesson",
    "day",
    "week",
    "level",
    "practice",
    "speaking",
    "english",
    "learn",
    "talk",
    "speak",
  ]);

  const combined = [
    lesson?.title || "",
    lesson?.topic || "",
    lesson?.description || "",
    lesson?.goal || "",
    lesson?.content || "",
    Array.isArray(lesson?.keywords) ? lesson.keywords.join(" ") : "",
  ].join(" ");

  return uniqueWords(combined).filter(
    (word) => word.length > 2 && !stopWords.has(word)
  );
}

function buildScoreCard({ utterances, lesson }) {
  const joinedText = utterances.join(" ").trim();
  const totalWords = cleanWords(joinedText).length;
  const turnCount = utterances.filter((u) => String(u || "").trim()).length;
  const avgWordsPerTurn = turnCount > 0 ? totalWords / turnCount : 0;

  const lessonKeywords = getLessonKeywords(lesson);
  const spokenWordsSet = new Set(uniqueWords(joinedText));
  const matchedKeywords = lessonKeywords.filter((k) => spokenWordsSet.has(k));
  const keywordCoverage =
    lessonKeywords.length > 0
      ? matchedKeywords.length / lessonKeywords.length
      : 0;

  let participationScore = 0;
  if (turnCount >= 10) participationScore = 95;
  else if (turnCount >= 8) participationScore = 88;
  else if (turnCount >= 6) participationScore = 80;
  else if (turnCount >= 4) participationScore = 68;
  else if (turnCount >= 2) participationScore = 55;
  else if (turnCount >= 1) participationScore = 40;
  else participationScore = 20;

  let fluencyScore = 0;
  if (avgWordsPerTurn >= 18) fluencyScore = 94;
  else if (avgWordsPerTurn >= 14) fluencyScore = 88;
  else if (avgWordsPerTurn >= 10) fluencyScore = 80;
  else if (avgWordsPerTurn >= 7) fluencyScore = 70;
  else if (avgWordsPerTurn >= 4) fluencyScore = 58;
  else if (avgWordsPerTurn >= 1) fluencyScore = 45;
  else fluencyScore = 20;

  let pronunciationScore = 0;
  if (totalWords >= 120) pronunciationScore = 90;
  else if (totalWords >= 90) pronunciationScore = 84;
  else if (totalWords >= 60) pronunciationScore = 77;
  else if (totalWords >= 35) pronunciationScore = 68;
  else if (totalWords >= 15) pronunciationScore = 58;
  else if (totalWords >= 1) pronunciationScore = 45;
  else pronunciationScore = 20;

  const lessonRelevanceScore = clamp(
    round(40 + keywordCoverage * 60),
    20,
    98
  );

  const confidenceBonus =
    totalWords >= 80 && turnCount >= 6 ? 5 : totalWords >= 40 ? 3 : 0;

  const overall = clamp(
    round(
      (participationScore +
        fluencyScore +
        pronunciationScore +
        lessonRelevanceScore) /
        4 +
        confidenceBonus
    ),
    20,
    99
  );

  let status = "Keep Practicing";
  if (overall >= 90) status = "Excellent";
  else if (overall >= 80) status = "Very Good";
  else if (overall >= 70) status = "Good Job";
  else if (overall >= 60) status = "Good Start";

  let feedback = "Speak more full sentences next time.";
  if (overall >= 90) {
    feedback = "Excellent speaking. Keep this same confidence and clarity.";
  } else if (overall >= 80) {
    feedback =
      "Very good work. Try to give slightly longer answers for even better fluency.";
  } else if (overall >= 70) {
    feedback =
      "Good job. Try to answer with more detail and use lesson words naturally.";
  } else if (overall >= 60) {
    feedback =
      "Good start. Speak a little more and try to make complete sentences.";
  }

  return {
    overall,
    status,
    feedback,
    participationScore,
    fluencyScore,
    pronunciationScore,
    lessonRelevanceScore,
    totalWords,
    turnCount,
    avgWordsPerTurn: round(avgWordsPerTurn),
    matchedKeywords,
  };
}

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getYesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatPracticeDate(dateKey) {
  if (!dateKey) return "Not yet";
  if (dateKey === getTodayKey()) return "Today";
  if (dateKey === getYesterdayKey()) return "Yesterday";

  try {
    const date = new Date(`${dateKey}T00:00:00`);
    return date.toLocaleDateString();
  } catch {
    return dateKey;
  }
}

function getInitialStats() {
  return {
    currentStreak: 0,
    bestScore: 0,
    lastPracticeDate: "",
    totalPracticeSessions: 0,
  };
}

export default function ChatPage() {
  const router = useRouter();

  const [selectedLevel, setSelectedLevel] = useState(1);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedDay, setSelectedDay] = useState(1);

  const [soundEnabled, setSoundEnabled] = useState(false);
  const [statusText, setStatusText] = useState("Ready");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);

  const [aiTranscript, setAiTranscript] = useState([]);
  const [userTranscript, setUserTranscript] = useState([]);
  const [scoreCard, setScoreCard] = useState(null);
  const [debugMessage, setDebugMessage] = useState("");
  const [practiceStats, setPracticeStats] = useState(getInitialStats());

  const peerConnectionRef = useRef(null);
  const dataChannelRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const audioContextRef = useRef(null);

  const levels = useMemo(() => getLevels(), []);
  const weeks = useMemo(() => getWeeks(selectedLevel), [selectedLevel]);
  const days = useMemo(
    () => getDays(selectedLevel, selectedWeek),
    [selectedLevel, selectedWeek]
  );

  const lesson = useMemo(
    () => getDay(selectedLevel, selectedWeek, selectedDay),
    [selectedLevel, selectedWeek, selectedDay]
  );

  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("aminsir_mobile_lesson_selection") || "{}"
      );
      const fallback = getInitialLessonState();

      const level = Number(saved?.level || fallback.level);
      const week = Number(saved?.week || fallback.week);
      const day = Number(saved?.day || fallback.day);

      const validLevel = getLevel(level) ? level : 1;
      const validWeek = getWeek(validLevel, week) ? week : 1;
      const validDay = getDay(validLevel, validWeek, day) ? day : 1;

      setSelectedLevel(validLevel);
      setSelectedWeek(validWeek);
      setSelectedDay(validDay);
    } catch {
      setSelectedLevel(1);
      setSelectedWeek(1);
      setSelectedDay(1);
    }
  }, []);

  useEffect(() => {
    try {
      const savedStats = JSON.parse(
        localStorage.getItem("aminsir_practice_stats") || "{}"
      );
      setPracticeStats({
        currentStreak: Number(savedStats?.currentStreak || 0),
        bestScore: Number(savedStats?.bestScore || 0),
        lastPracticeDate: savedStats?.lastPracticeDate || "",
        totalPracticeSessions: Number(savedStats?.totalPracticeSessions || 0),
      });
    } catch {
      setPracticeStats(getInitialStats());
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "aminsir_mobile_lesson_selection",
      JSON.stringify({
        level: selectedLevel,
        week: selectedWeek,
        day: selectedDay,
      })
    );
  }, [selectedLevel, selectedWeek, selectedDay]);

  useEffect(() => {
    localStorage.setItem(
      "aminsir_practice_stats",
      JSON.stringify(practiceStats)
    );
  }, [practiceStats]);

  useEffect(() => {
    const validWeeks = getWeeks(selectedLevel);
    if (!validWeeks.find((w) => Number(w?.week) === Number(selectedWeek))) {
      setSelectedWeek(1);
      setSelectedDay(1);
      return;
    }

    const validDays = getDays(selectedLevel, selectedWeek);
    if (!validDays.find((d) => Number(d?.day) === Number(selectedDay))) {
      setSelectedDay(1);
    }
  }, [selectedLevel, selectedWeek, selectedDay]);

  const safeLessonTitle =
    lesson?.title ||
    lesson?.topic ||
    `Level ${selectedLevel} Week ${selectedWeek} Day ${selectedDay}`;

  const lessonPrompt = useMemo(() => {
    return `
You are Amin Sir AI Speaking Coach.

Student lesson details:
- Level: ${selectedLevel}
- Week: ${selectedWeek}
- Day: ${selectedDay}
- Lesson title: ${lesson?.title || ""}
- Lesson topic: ${lesson?.topic || ""}
- Lesson description: ${lesson?.description || ""}
- Lesson goal: ${lesson?.goal || ""}
- Lesson content: ${lesson?.content || ""}

Teaching style:
- Speak in simple, clear English
- Use very short sentences
- Keep conversation mobile-friendly and easy
- Encourage the student to speak more
- Ask one question at a time
- Do not give long lectures
- Let the student speak most of the time
- Correct politely
- Motivate the student
- Focus on today's lesson only

Start by greeting the student and introducing today's lesson.
`.trim();
  }, [selectedLevel, selectedWeek, selectedDay, lesson]);

  const resetSessionUi = useCallback(() => {
    setAiTranscript([]);
    setUserTranscript([]);
    setScoreCard(null);
    setDebugMessage("");
  }, []);

  const unlockAudio = async () => {
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new AudioCtx();
      }

      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }

      const oscillator = audioContextRef.current.createOscillator();
      const gain = audioContextRef.current.createGain();
      gain.gain.value = 0.0001;
      oscillator.connect(gain);
      gain.connect(audioContextRef.current.destination);
      oscillator.start();
      oscillator.stop(audioContextRef.current.currentTime + 0.05);

      setSoundEnabled(true);
      setStatusText("Sound enabled");
    } catch (error) {
      console.error("Audio unlock error:", error);
      setStatusText("Could not enable sound");
      setDebugMessage(error?.message || "Audio unlock failed");
    }
  };

  const closeSession = useCallback(async () => {
    try {
      if (dataChannelRef.current) {
        try {
          dataChannelRef.current.close();
        } catch {}
        dataChannelRef.current = null;
      }

      if (peerConnectionRef.current) {
        try {
          peerConnectionRef.current.getSenders().forEach((sender) => {
            try {
              sender.track?.stop();
            } catch {}
          });
          peerConnectionRef.current.close();
        } catch {}
        peerConnectionRef.current = null;
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch {}
        });
        localStreamRef.current = null;
      }

      if (remoteAudioRef.current) {
        try {
          remoteAudioRef.current.pause();
          remoteAudioRef.current.srcObject = null;
        } catch {}
      }
    } finally {
      setIsSessionActive(false);
      setIsConnecting(false);
    }
  }, []);

  const updatePracticeStats = useCallback((latestScore) => {
    const today = getTodayKey();
    const yesterday = getYesterdayKey();

    setPracticeStats((prev) => {
      let nextStreak = 1;

      if (prev.lastPracticeDate === today) {
        nextStreak = prev.currentStreak || 1;
      } else if (prev.lastPracticeDate === yesterday) {
        nextStreak = (prev.currentStreak || 0) + 1;
      } else {
        nextStreak = 1;
      }

      return {
        currentStreak: nextStreak,
        bestScore: Math.max(Number(prev.bestScore || 0), Number(latestScore || 0)),
        lastPracticeDate: today,
        totalPracticeSessions:
          prev.lastPracticeDate === today
            ? Number(prev.totalPracticeSessions || 0)
            : Number(prev.totalPracticeSessions || 0) + 1,
      };
    });
  }, []);

  const finalizeScore = useCallback(() => {
    const result = buildScoreCard({
      utterances: userTranscript,
      lesson,
    });
    setScoreCard(result);
    updatePracticeStats(result.overall);
  }, [userTranscript, lesson, updatePracticeStats]);

  const handleRealtimeEvent = useCallback((event) => {
    if (!event || typeof event !== "object") return;

    const type = event.type || "";

    if (type === "response.audio_transcript.delta") {
      const delta = event.delta || "";
      if (!delta) return;
      setAiTranscript((prev) => {
        const copy = [...prev];
        if (copy.length === 0) {
          copy.push(delta);
        } else {
          copy[copy.length - 1] = (copy[copy.length - 1] || "") + delta;
        }
        return copy;
      });
      return;
    }

    if (type === "response.audio_transcript.done") {
      setAiTranscript((prev) => {
        const copy = [...prev];
        if (copy.length === 0) return prev;
        copy.push("");
        return copy;
      });
      return;
    }

    if (type === "conversation.item.input_audio_transcription.completed") {
      const text = event.transcript || event.text || "";
      if (text.trim()) {
        setUserTranscript((prev) => [...prev, text.trim()]);
      }
      return;
    }

    if (type === "conversation.item.created") {
      const item = event.item || {};
      const role = item.role || "";
      const content = Array.isArray(item.content) ? item.content : [];

      const textParts = content
        .map((c) => c?.transcript || c?.text || c?.value || "")
        .filter(Boolean)
        .join(" ")
        .trim();

      if (!textParts) return;

      if (role === "user") {
        setUserTranscript((prev) => [...prev, textParts]);
      } else if (role === "assistant") {
        setAiTranscript((prev) => [...prev, textParts]);
      }
    }
  }, []);

  const startVoice = async () => {
    if (isConnecting || isSessionActive) return;

    resetSessionUi();
    setIsConnecting(true);
    setStatusText("Connecting...");

    try {
      if (!soundEnabled) {
        await unlockAudio();
      }

      const tokenResponse = await fetch("/api/realtime", {
        method: "GET",
        cache: "no-store",
      });

      const rawText = await tokenResponse.text();

      let tokenData = null;
      try {
        tokenData = rawText ? JSON.parse(rawText) : null;
      } catch {
        tokenData = null;
      }

      if (!tokenResponse.ok) {
        const errorMessage =
          tokenData?.details ||
          tokenData?.error ||
          rawText ||
          `HTTP ${tokenResponse.status}`;
        throw new Error(errorMessage);
      }

      const ephemeralKey =
        tokenData?.client_secret?.value ||
        tokenData?.client_secret ||
        tokenData?.value ||
        tokenData?.token ||
        tokenData?.ephemeralKey ||
        "";

      const model =
        tokenData?.model || "gpt-4o-realtime-preview-2024-12-17";

      if (!ephemeralKey) {
        throw new Error("Realtime client_secret.value missing from /api/realtime");
      }

      const pc = new RTCPeerConnection();
      peerConnectionRef.current = pc;

      const remoteAudio = new Audio();
      remoteAudio.autoplay = true;
      remoteAudio.playsInline = true;
      remoteAudioRef.current = remoteAudio;

      pc.ontrack = (event) => {
        const [stream] = event.streams || [];
        if (stream && remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = stream;
          remoteAudioRef.current
            .play()
            .catch((err) => console.error("Remote audio play error:", err));
        }
      };

      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      localStreamRef.current = localStream;

      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });

      const dc = pc.createDataChannel("oai-events");
      dataChannelRef.current = dc;

      dc.onopen = () => {
        setStatusText("Connected");

        dc.send(
          JSON.stringify({
            type: "session.update",
            session: {
              modalities: ["text", "audio"],
              instructions: lessonPrompt,
              input_audio_transcription: {
                model: "gpt-4o-mini-transcribe",
              },
            },
          })
        );

        dc.send(
          JSON.stringify({
            type: "response.create",
            response: {
              modalities: ["audio", "text"],
              instructions: `Greet the student warmly and begin today's lesson: ${safeLessonTitle}.`,
            },
          })
        );
      };

      dc.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleRealtimeEvent(data);
        } catch (err) {
          console.error("Data channel parse error:", err);
        }
      };

      dc.onerror = (err) => {
        console.error("Data channel error:", err);
      };

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
      });
      await pc.setLocalDescription(offer);

      const sdpResponse = await fetch(
        `https://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`,
        {
          method: "POST",
          body: offer.sdp,
          headers: {
            Authorization: `Bearer ${ephemeralKey}`,
            "Content-Type": "application/sdp",
          },
        }
      );

      const sdpText = await sdpResponse.text();

      if (!sdpResponse.ok) {
        throw new Error(sdpText || "Failed to connect realtime session");
      }

      await pc.setRemoteDescription({
        type: "answer",
        sdp: sdpText,
      });

      setIsSessionActive(true);
      setStatusText("Lesson live");
    } catch (error) {
      console.error("Start voice error:", error);
      setDebugMessage(error?.message || "Unknown start voice error");
      setStatusText("Connection failed");
      await closeSession();
    } finally {
      setIsConnecting(false);
    }
  };

  const stopVoice = async () => {
    setStatusText("Stopping...");
    await closeSession();
    finalizeScore();
    setStatusText("Stopped");
  };

  const transcriptPreview = useMemo(() => {
    return userTranscript
      .filter(Boolean)
      .slice(-5)
      .map((item, index) => `${index + 1}. ${item}`)
      .join("\n");
  }, [userTranscript]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-md px-4 pb-24 pt-4">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="rounded-xl bg-white px-3 py-2 text-sm font-medium shadow-sm ring-1 ring-slate-200"
          >
            Back
          </button>

          <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold shadow-sm ring-1 ring-slate-200">
            {statusText}
          </div>
        </div>

        <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-xl font-bold">Amin Sir AI Speaking Coach</h1>
          <p className="mt-1 text-sm text-slate-600">
            Mobile lesson speaking practice
          </p>
        </div>

        <div className="mb-4 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 p-4 text-white shadow-sm">
          <div className="text-sm font-bold">Daily Practice Progress</div>

          <div className="mt-3 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-white/15 p-3 text-center">
              <div className="text-xs opacity-90">Streak</div>
              <div className="mt-1 text-xl font-extrabold">
                {practiceStats.currentStreak}
              </div>
              <div className="text-xs opacity-90">days</div>
            </div>

            <div className="rounded-xl bg-white/15 p-3 text-center">
              <div className="text-xs opacity-90">Best Score</div>
              <div className="mt-1 text-xl font-extrabold">
                {practiceStats.bestScore}
              </div>
              <div className="text-xs opacity-90">/100</div>
            </div>

            <div className="rounded-xl bg-white/15 p-3 text-center">
              <div className="text-xs opacity-90">Sessions</div>
              <div className="mt-1 text-xl font-extrabold">
                {practiceStats.totalPracticeSessions}
              </div>
              <div className="text-xs opacity-90">total</div>
            </div>
          </div>

          <div className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-sm">
            Last Practice:{" "}
            <span className="font-semibold">
              {formatPracticeDate(practiceStats.lastPracticeDate)}
            </span>
          </div>
        </div>

        <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-3 text-base font-bold">Choose Lesson</h2>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Level</label>
              <select
                value={selectedLevel}
                onChange={(e) => {
                  const nextLevel = Number(e.target.value);
                  setSelectedLevel(nextLevel);
                  setSelectedWeek(1);
                  setSelectedDay(1);
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none"
              >
                {levels.map((lvl) => (
                  <option key={lvl.level} value={lvl.level}>
                    Level {lvl.level} ({Array.isArray(lvl.weeks) ? lvl.weeks.length : 0} weeks)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Week</label>
              <select
                value={selectedWeek}
                onChange={(e) => {
                  setSelectedWeek(Number(e.target.value));
                  setSelectedDay(1);
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none"
              >
                {weeks.map((wk) => (
                  <option key={wk.week} value={wk.week}>
                    Week {wk.week}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Day</label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none"
              >
                {days.map((d) => (
                  <option key={d.day} value={d.day}>
                    Day {d.day}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mb-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-4 text-white shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide opacity-90">
            Lesson of the Day
          </div>
          <div className="mt-2 text-lg font-bold">{safeLessonTitle}</div>

          {lesson?.description ? (
            <p className="mt-2 text-sm leading-6 text-blue-50">
              {lesson.description}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-white/15 px-3 py-1">
              Level {selectedLevel}
            </span>
            <span className="rounded-full bg-white/15 px-3 py-1">
              Week {selectedWeek}
            </span>
            <span className="rounded-full bg-white/15 px-3 py-1">
              Day {selectedDay}
            </span>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3">
          <button
            onClick={unlockAudio}
            className="rounded-2xl bg-emerald-600 px-4 py-4 text-sm font-bold text-white shadow-sm active:scale-[0.99]"
          >
            Enable Sound
          </button>

          <button
            onClick={startVoice}
            disabled={isConnecting || isSessionActive}
            className={`rounded-2xl px-4 py-4 text-sm font-bold text-white shadow-sm active:scale-[0.99] ${
              isConnecting || isSessionActive ? "bg-slate-400" : "bg-blue-600"
            }`}
          >
            {isConnecting ? "Connecting..." : "Start Voice"}
          </button>

          <button
            onClick={stopVoice}
            disabled={!isSessionActive && !isConnecting}
            className={`rounded-2xl px-4 py-4 text-sm font-bold text-white shadow-sm active:scale-[0.99] ${
              !isSessionActive && !isConnecting ? "bg-slate-400" : "bg-rose-600"
            }`}
          >
            Stop
          </button>
        </div>

        {debugMessage ? (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <div className="text-sm font-bold text-rose-800">Connection Error</div>
            <div className="mt-2 whitespace-pre-wrap break-words text-sm text-rose-700">
              {debugMessage}
            </div>
          </div>
        ) : null}

        <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-base font-bold">Speaking Score</h2>
          <p className="mt-1 text-sm text-slate-600">
            Score appears after you press Stop
          </p>

          {!scoreCard ? (
            <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
              Finish one speaking session to see score, feedback, and lesson relevance.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-slate-900 p-4 text-white">
                <div className="text-sm opacity-80">Overall Score</div>
                <div className="mt-1 text-4xl font-extrabold">
                  {scoreCard.overall}/100
                </div>
                <div className="mt-2 inline-flex rounded-full bg-white/10 px-3 py-1 text-sm font-semibold">
                  {scoreCard.status}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">Participation</div>
                  <div className="mt-1 text-lg font-bold">
                    {scoreCard.participationScore}
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">Fluency</div>
                  <div className="mt-1 text-lg font-bold">
                    {scoreCard.fluencyScore}
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">Pronunciation</div>
                  <div className="mt-1 text-lg font-bold">
                    {scoreCard.pronunciationScore}
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">Lesson Match</div>
                  <div className="mt-1 text-lg font-bold">
                    {scoreCard.lessonRelevanceScore}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                <div className="text-sm font-semibold">Session Details</div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-slate-50 p-2">
                    <div className="text-xs text-slate-500">Turns</div>
                    <div className="text-base font-bold">
                      {scoreCard.turnCount}
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2">
                    <div className="text-xs text-slate-500">Words</div>
                    <div className="text-base font-bold">
                      {scoreCard.totalWords}
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2">
                    <div className="text-xs text-slate-500">Avg/Turn</div>
                    <div className="text-base font-bold">
                      {scoreCard.avgWordsPerTurn}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                <div className="font-semibold">Feedback</div>
                <div className="mt-1">{scoreCard.feedback}</div>
              </div>

              {scoreCard.matchedKeywords?.length > 0 ? (
                <div className="rounded-xl bg-emerald-50 p-3">
                  <div className="text-sm font-semibold text-emerald-900">
                    Lesson words you used
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {scoreCard.matchedKeywords.slice(0, 10).map((word) => (
                      <span
                        key={word}
                        className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-base font-bold">Recent Student Speech</h2>
          <p className="mt-1 text-sm text-slate-600">
            Last captured speaking lines
          </p>

          <div className="mt-3 min-h-[100px] whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
            {transcriptPreview || "No student speech captured yet."}
          </div>
        </div>
      </div>
    </div>
  );
}