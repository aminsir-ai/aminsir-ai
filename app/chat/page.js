"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { COURSE_DATA, getLessonWithContext } from "@/lib/courseData";

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

function normalizePhraseText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9\s']/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
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
    lesson?.meaning || "",
    lesson?.example || "",
    lesson?.speakingFocus || "",
    lesson?.practicePrompt || "",
    Array.isArray(lesson?.keywords) ? lesson.keywords.join(" ") : "",
    Array.isArray(lesson?.vocabulary) ? lesson.vocabulary.join(" ") : "",
    Array.isArray(lesson?.supportWords) ? lesson.supportWords.join(" ") : "",
  ].join(" ");

  return uniqueWords(combined).filter(
    (word) => word.length > 2 && !stopWords.has(word)
  );
}

function getLessonTargetPhrases(lesson) {
  if (Array.isArray(lesson?.targetPhrases)) {
    return lesson.targetPhrases
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .slice(0, 8);
  }

  if (Array.isArray(lesson?.phrases)) {
    return lesson.phrases
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (item && typeof item === "object") return String(item.english || "").trim();
        return "";
      })
      .filter(Boolean)
      .slice(0, 8);
  }

  return [];
}

function getPhraseObjects(lesson) {
  if (!Array.isArray(lesson?.phrases)) return [];

  return lesson.phrases
    .map((item, index) => {
      if (typeof item === "string") {
        return {
          id: index + 1,
          english: item.trim(),
          hindi: "",
          cue: "",
        };
      }

      return {
        id: item?.id || index + 1,
        english: String(item?.english || "").trim(),
        hindi: String(item?.hindi || "").trim(),
        cue: String(item?.cue || "").trim(),
      };
    })
    .filter((item) => item.english);
}

function getUsedTargetPhrases(utterances, targetPhrases) {
  const transcriptText = normalizePhraseText(
    Array.isArray(utterances) ? utterances.join(" ") : ""
  );

  if (!transcriptText) return [];
  if (!Array.isArray(targetPhrases) || targetPhrases.length === 0) return [];

  const used = [];

  for (const rawPhrase of targetPhrases) {
    const phrase = String(rawPhrase || "").trim();
    const normalizedPhrase = normalizePhraseText(phrase);

    if (!normalizedPhrase) continue;

    if (transcriptText.includes(normalizedPhrase)) {
      used.push(phrase);
    }
  }

  return [...new Set(used)];
}

function getPhraseStats(utterances, targetPhrases) {
  const safeTargetPhrases = Array.isArray(targetPhrases) ? targetPhrases : [];
  const usedPhrases = getUsedTargetPhrases(utterances, safeTargetPhrases);
  const total = safeTargetPhrases.length;
  const usedCount = usedPhrases.length;
  const percentage = total > 0 ? round((usedCount / total) * 100) : 0;

  let label = "Needs More Phrase Practice";
  if (percentage >= 80) label = "Excellent Phrase Use";
  else if (percentage >= 60) label = "Very Good Phrase Use";
  else if (percentage >= 40) label = "Good Phrase Practice";
  else if (percentage >= 20) label = "Started Using Phrases";

  return {
    usedPhrases,
    usedCount,
    total,
    percentage,
    label,
  };
}

function buildScoreCard({ utterances, lesson, gameBonus = 0, practiceMode = "normal" }) {
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

  const targetPhrases = getLessonTargetPhrases(lesson);
  const phraseStats = getPhraseStats(utterances, targetPhrases);

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

  const phraseUsageScore =
    phraseStats.total > 0
      ? clamp(round(35 + phraseStats.percentage * 0.65), 20, 98)
      : 0;

  const confidenceBonus =
    totalWords >= 80 && turnCount >= 6 ? 5 : totalWords >= 40 ? 3 : 0;

  const phraseBonus =
    phraseStats.total > 0
      ? phraseStats.usedCount >= 4
        ? 6
        : phraseStats.usedCount >= 3
        ? 4
        : phraseStats.usedCount >= 2
        ? 2
        : phraseStats.usedCount >= 1
        ? 1
        : 0
      : 0;

  const practiceModeBonus = practiceMode === "phrase" && phraseStats.usedCount >= 2 ? 2 : 0;

  const scoreParts = [
    participationScore,
    fluencyScore,
    pronunciationScore,
    lessonRelevanceScore,
  ];

  if (phraseStats.total > 0) {
    scoreParts.push(phraseUsageScore);
  }

  const overall = clamp(
    round(
      scoreParts.reduce((sum, value) => sum + value, 0) / scoreParts.length +
        confidenceBonus +
        phraseBonus +
        practiceModeBonus +
        gameBonus
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

  if (phraseStats.total > 0) {
    if (phraseStats.usedCount === 0) {
      feedback += " Try to use the target phrases during the lesson.";
    } else if (phraseStats.usedCount < phraseStats.total) {
      feedback += ` Good phrase effort. You used ${phraseStats.usedCount} of ${phraseStats.total} target phrases.`;
    } else {
      feedback += " Excellent use of the target phrases.";
    }
  }

  if (practiceMode === "phrase") {
    feedback += " Phrase Practice Mode was active.";
  }

  if (gameBonus > 0) {
    feedback += ` Game bonus added: +${gameBonus}.`;
  }

  return {
    overall,
    status,
    feedback,
    participationScore,
    fluencyScore,
    pronunciationScore,
    lessonRelevanceScore,
    phraseUsageScore,
    totalWords,
    turnCount,
    avgWordsPerTurn: round(avgWordsPerTurn),
    matchedKeywords,
    gameBonus,
    phraseBonus,
    practiceModeBonus,
    targetPhrases,
    usedPhrases: phraseStats.usedPhrases,
    phraseUsedCount: phraseStats.usedCount,
    phraseTotal: phraseStats.total,
    phrasePercentage: phraseStats.percentage,
    phraseLabel: phraseStats.label,
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

function formatSessionLabel(dateKey) {
  if (!dateKey) return "-";
  if (dateKey === getTodayKey()) return "Today";
  if (dateKey === getYesterdayKey()) return "Yesterday";

  try {
    const d = new Date(`${dateKey}T00:00:00`);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateKey;
  }
}

export default function ChatPage() {
  const router = useRouter();

  const [selectedLevel, setSelectedLevel] = useState(1);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedDay, setSelectedDay] = useState(1);

  const [practiceMode, setPracticeMode] = useState("normal");
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

  const [soundEnabled, setSoundEnabled] = useState(false);
  const [statusText, setStatusText] = useState("Ready");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);

  const [aiTranscript, setAiTranscript] = useState([]);
  const [userTranscript, setUserTranscript] = useState([]);
  const [scoreCard, setScoreCard] = useState(null);
  const [debugMessage, setDebugMessage] = useState("");
  const [practiceStats, setPracticeStats] = useState(getInitialStats());

  const [gameModeEnabled, setGameModeEnabled] = useState(false);
  const [gameSecondsLeft, setGameSecondsLeft] = useState(60);
  const [gameResult, setGameResult] = useState(null);

  const [sessionHistory, setSessionHistory] = useState([]);

  const peerConnectionRef = useRef(null);
  const dataChannelRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const audioContextRef = useRef(null);
  const gameTimerRef = useRef(null);
  const autoStoppingRef = useRef(false);

  const latestUserTranscriptRef = useRef([]);
  const latestGameSecondsLeftRef = useRef(60);
  const latestGameModeEnabledRef = useRef(false);
  const latestPracticeModeRef = useRef("normal");

  const GAME_DURATION = 60;
  const GAME_TARGET_TURNS = 5;

  const levels = useMemo(() => getLevels(), []);
  const weeks = useMemo(() => getWeeks(selectedLevel), [selectedLevel]);
  const days = useMemo(
    () => getDays(selectedLevel, selectedWeek),
    [selectedLevel, selectedWeek]
  );

  const lesson = useMemo(() => {
    return (
      getLessonWithContext(selectedLevel, selectedWeek, selectedDay) ||
      getDay(selectedLevel, selectedWeek, selectedDay)
    );
  }, [selectedLevel, selectedWeek, selectedDay]);

  const phraseObjects = useMemo(() => getPhraseObjects(lesson), [lesson]);
  const targetPhrases = useMemo(() => getLessonTargetPhrases(lesson), [lesson]);

  const currentPhrase = useMemo(() => {
    if (!phraseObjects.length) return null;
    return phraseObjects[currentPhraseIndex] || phraseObjects[0] || null;
  }, [phraseObjects, currentPhraseIndex]);

  const livePhraseStats = useMemo(() => {
    return getPhraseStats(userTranscript, targetPhrases);
  }, [userTranscript, targetPhrases]);

  const averageHistoryScore = useMemo(() => {
    if (!sessionHistory.length) return 0;
    const total = sessionHistory.reduce(
      (sum, item) => sum + Number(item?.score || 0),
      0
    );
    return round(total / sessionHistory.length);
  }, [sessionHistory]);

  useEffect(() => {
    latestUserTranscriptRef.current = userTranscript;
  }, [userTranscript]);

  useEffect(() => {
    latestGameSecondsLeftRef.current = gameSecondsLeft;
  }, [gameSecondsLeft]);

  useEffect(() => {
    latestGameModeEnabledRef.current = gameModeEnabled;
  }, [gameModeEnabled]);

  useEffect(() => {
    latestPracticeModeRef.current = practiceMode;
  }, [practiceMode]);

  useEffect(() => {
    setCurrentPhraseIndex(0);
  }, [selectedLevel, selectedWeek, selectedDay, practiceMode]);

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

    try {
      const savedHistory = JSON.parse(
        localStorage.getItem("aminsir_session_history") || "[]"
      );
      setSessionHistory(Array.isArray(savedHistory) ? savedHistory : []);
    } catch {
      setSessionHistory([]);
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
    localStorage.setItem(
      "aminsir_session_history",
      JSON.stringify(sessionHistory)
    );
  }, [sessionHistory]);

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

  useEffect(() => {
    if (currentPhraseIndex > phraseObjects.length - 1) {
      setCurrentPhraseIndex(0);
    }
  }, [currentPhraseIndex, phraseObjects.length]);

  const safeLessonTitle =
    lesson?.title ||
    lesson?.topic ||
    `Level ${selectedLevel} Week ${selectedWeek} Day ${selectedDay}`;

  const safeUserTurnCount = useMemo(() => {
    return userTranscript.filter((u) => String(u || "").trim()).length;
  }, [userTranscript]);

  const lessonPrompt = useMemo(() => {
    const phraseInstructions =
      targetPhrases.length > 0
        ? `
Target Phrase Practice:
- Today's target phrases are:
${targetPhrases.map((phrase, index) => `  ${index + 1}. ${phrase}`).join("\n")}
- Encourage the student to use these phrases naturally.
- Introduce only 1 or 2 target phrases at a time.
- Do not read the full phrase list repeatedly.
- Ask short questions that make the student use the target phrases.
- Praise the student when a target phrase is used correctly.
- If the student is not using them, gently remind the student to try one target phrase in the answer.
`
        : "";

    const phraseModeInstructions =
      practiceMode === "phrase" && phraseObjects.length > 0
        ? `
Phrase Practice Mode is ON.
- This is not a general lesson chat.
- Focus on phrase-by-phrase speaking practice.
- Start with the current phrase first: "${currentPhrase?.english || ""}"
- Ask the student to repeat or use the phrase in a short sentence.
- Keep replies short.
- Let the student speak more than you.
- Correct gently.
- Move naturally to the next phrase after successful use.
- Use Hindi support only if truly needed, but keep the main session in easy English.
`
        : "";

    const gameInstructions = gameModeEnabled
      ? `
Game Mode is ON.
Challenge duration: ${GAME_DURATION} seconds.
Encourage the student to speak quickly and clearly.
Ask short questions.
Keep energy high.
Help the student complete at least ${GAME_TARGET_TURNS} speaking turns.
`
      : "";

    return `
You are Amin Sir AI Speaking Coach.

Student lesson details:
- Level: ${selectedLevel}
- Week: ${selectedWeek}
- Day: ${selectedDay}
- Lesson title: ${lesson?.title || ""}
- Lesson meaning: ${lesson?.meaning || ""}
- Lesson example: ${lesson?.example || ""}
- Lesson speaking focus: ${lesson?.speakingFocus || ""}
- Lesson practice prompt: ${lesson?.practicePrompt || ""}
- Lesson type: ${lesson?.lessonType || ""}
- Practice mode: ${practiceMode}

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

${phraseInstructions}

${phraseModeInstructions}

${gameInstructions}

Start by greeting the student and introducing today's lesson.
`.trim();
  }, [
    selectedLevel,
    selectedWeek,
    selectedDay,
    lesson,
    gameModeEnabled,
    targetPhrases,
    practiceMode,
    phraseObjects,
    currentPhrase,
  ]);

  const clearGameTimer = useCallback(() => {
    if (gameTimerRef.current) {
      clearInterval(gameTimerRef.current);
      gameTimerRef.current = null;
    }
  }, []);

  const resetSessionUi = useCallback(() => {
    setAiTranscript([]);
    setUserTranscript([]);
    latestUserTranscriptRef.current = [];
    setScoreCard(null);
    setDebugMessage("");
    setGameResult(null);
    setGameSecondsLeft(GAME_DURATION);
    latestGameSecondsLeftRef.current = GAME_DURATION;
    autoStoppingRef.current = false;
    clearGameTimer();
  }, [GAME_DURATION, clearGameTimer]);

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
      clearGameTimer();

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
  }, [clearGameTimer]);

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

  const addSessionHistory = useCallback(
    ({ score, gameBonus, mode, phraseUsedCount = 0, phraseTotal = 0 }) => {
      const today = getTodayKey();

      const entry = {
        id: `${Date.now()}`,
        dateKey: today,
        lessonTitle: safeLessonTitle,
        score: Number(score || 0),
        gameBonus: Number(gameBonus || 0),
        mode: mode || "Normal",
        level: selectedLevel,
        week: selectedWeek,
        day: selectedDay,
        phraseUsedCount: Number(phraseUsedCount || 0),
        phraseTotal: Number(phraseTotal || 0),
      };

      setSessionHistory((prev) => {
        const next = [entry, ...prev];
        return next.slice(0, 7);
      });
    },
    [safeLessonTitle, selectedLevel, selectedWeek, selectedDay]
  );

  const finalizeScore = useCallback(() => {
    const latestUtterances = latestUserTranscriptRef.current || [];
    const latestTurnCount = latestUtterances.filter((u) =>
      String(u || "").trim()
    ).length;

    let gameBonus = 0;
    let completed = false;

    if (latestGameModeEnabledRef.current) {
      completed = latestTurnCount >= GAME_TARGET_TURNS;
      gameBonus = completed ? 8 : latestTurnCount >= 3 ? 3 : 0;

      setGameResult({
        completed,
        turns: latestTurnCount,
        targetTurns: GAME_TARGET_TURNS,
        bonus: gameBonus,
        timeUsed: GAME_DURATION - latestGameSecondsLeftRef.current,
      });
    } else {
      setGameResult(null);
    }

    const result = buildScoreCard({
      utterances: latestUtterances,
      lesson,
      gameBonus,
      practiceMode: latestPracticeModeRef.current,
    });

    setScoreCard(result);
    updatePracticeStats(result.overall);

    addSessionHistory({
      score: result.overall,
      gameBonus,
      mode:
        latestGameModeEnabledRef.current
          ? latestPracticeModeRef.current === "phrase"
            ? "Game + Phrase"
            : "Game"
          : latestPracticeModeRef.current === "phrase"
          ? "Phrase"
          : "Normal",
      phraseUsedCount: result.phraseUsedCount,
      phraseTotal: result.phraseTotal,
    });
  }, [lesson, updatePracticeStats, addSessionHistory]);

  useEffect(() => {
    if (!gameModeEnabled || !isSessionActive) return;

    gameTimerRef.current = setInterval(() => {
      setGameSecondsLeft((prev) => {
        if (prev <= 1) {
          if (!autoStoppingRef.current) {
            autoStoppingRef.current = true;
            setStatusText("Game finished");
            setTimeout(() => {
              stopVoice(true);
            }, 100);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearGameTimer();
    };
  }, [gameModeEnabled, isSessionActive, clearGameTimer]);

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
    setStatusText(gameModeEnabled ? "Game connecting..." : "Connecting...");

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
        setStatusText(gameModeEnabled ? "Game live" : "Connected");

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

        const openingInstruction =
          practiceMode === "phrase"
            ? `Greet the student warmly and begin Phrase Practice Mode for today's lesson: ${safeLessonTitle}. Start with this phrase: "${currentPhrase?.english || ""}". Ask the student to repeat it or use it in a sentence. Keep the coaching short and supportive.`
            : gameModeEnabled
            ? `Game Mode is ON. Greet the student warmly and start a fast speaking challenge for today's lesson: ${safeLessonTitle}. Encourage target phrase use naturally if target phrases exist.`
            : `Greet the student warmly and begin today's lesson: ${safeLessonTitle}. Encourage target phrase use naturally if target phrases exist.`;

        dc.send(
          JSON.stringify({
            type: "response.create",
            response: {
              modalities: ["audio", "text"],
              instructions: openingInstruction,
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
      if (gameModeEnabled) {
        setGameSecondsLeft(GAME_DURATION);
        latestGameSecondsLeftRef.current = GAME_DURATION;
      }
      setStatusText(
        practiceMode === "phrase"
          ? gameModeEnabled
            ? "Phrase game live"
            : "Phrase practice live"
          : gameModeEnabled
          ? "Game live"
          : "Lesson live"
      );
    } catch (error) {
      console.error("Start voice error:", error);
      setDebugMessage(error?.message || "Unknown start voice error");
      setStatusText("Connection failed");
      await closeSession();
    } finally {
      setIsConnecting(false);
    }
  };

  async function stopVoice(fromAutoStop = false) {
    setStatusText(fromAutoStop ? "Challenge complete" : "Stopping...");
    await closeSession();
    finalizeScore();
    setStatusText(fromAutoStop ? "Game stopped" : "Stopped");
  }

  const transcriptPreview = useMemo(() => {
    return userTranscript
      .filter(Boolean)
      .slice(-5)
      .map((item, index) => `${index + 1}. ${item}`)
      .join("\n");
  }, [userTranscript]);

  const goToNextPhrase = () => {
    if (!phraseObjects.length) return;
    setCurrentPhraseIndex((prev) => {
      if (prev >= phraseObjects.length - 1) return prev;
      return prev + 1;
    });
  };

  const goToPrevPhrase = () => {
    if (!phraseObjects.length) return;
    setCurrentPhraseIndex((prev) => {
      if (prev <= 0) return 0;
      return prev - 1;
    });
  };

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

        <div className="mb-4 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 p-4 text-white shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-base font-bold">Speaking Game Mode</div>
              <div className="mt-1 text-sm text-violet-100">
                60-second challenge with bonus score
              </div>
            </div>

            <button
              onClick={() => setGameModeEnabled((prev) => !prev)}
              disabled={isSessionActive || isConnecting}
              className={`rounded-full px-4 py-2 text-sm font-bold shadow-sm ${
                gameModeEnabled
                  ? "bg-white text-violet-700"
                  : "bg-white/15 text-white ring-1 ring-white/30"
              } ${
                isSessionActive || isConnecting
                  ? "opacity-60"
                  : "active:scale-[0.98]"
              }`}
            >
              {gameModeEnabled ? "ON" : "OFF"}
            </button>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-white/15 p-3 text-center">
              <div className="text-xs opacity-90">Timer</div>
              <div className="mt-1 text-xl font-extrabold">
                {gameSecondsLeft}s
              </div>
            </div>

            <div className="rounded-xl bg-white/15 p-3 text-center">
              <div className="text-xs opacity-90">Target</div>
              <div className="mt-1 text-xl font-extrabold">
                {GAME_TARGET_TURNS}
              </div>
              <div className="text-xs opacity-90">turns</div>
            </div>

            <div className="rounded-xl bg-white/15 p-3 text-center">
              <div className="text-xs opacity-90">Current</div>
              <div className="mt-1 text-xl font-extrabold">
                {safeUserTurnCount}
              </div>
              <div className="text-xs opacity-90">turns</div>
            </div>
          </div>

          <div className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-sm">
            Mode:{" "}
            <span className="font-semibold">
              {gameModeEnabled ? "Challenge Active" : "Normal Lesson"}
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

        <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold">Practice Mode</h2>
              <p className="mt-1 text-sm text-slate-600">
                Choose normal lesson or phrase-by-phrase practice
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              onClick={() => setPracticeMode("normal")}
              disabled={isSessionActive || isConnecting}
              className={`rounded-2xl px-4 py-3 text-sm font-bold shadow-sm ${
                practiceMode === "normal"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700 ring-1 ring-slate-200"
              } ${isSessionActive || isConnecting ? "opacity-60" : "active:scale-[0.99]"}`}
            >
              Normal Lesson
            </button>

            <button
              onClick={() => setPracticeMode("phrase")}
              disabled={isSessionActive || isConnecting || phraseObjects.length === 0}
              className={`rounded-2xl px-4 py-3 text-sm font-bold shadow-sm ${
                practiceMode === "phrase"
                  ? "bg-amber-500 text-white"
                  : "bg-slate-100 text-slate-700 ring-1 ring-slate-200"
              } ${
                isSessionActive || isConnecting || phraseObjects.length === 0
                  ? "opacity-60"
                  : "active:scale-[0.99]"
              }`}
            >
              Phrase Practice
            </button>
          </div>

          <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
            Current Mode:{" "}
            <span className="font-semibold">
              {practiceMode === "phrase" ? "Phrase Practice" : "Normal Lesson"}
            </span>
          </div>
        </div>

        <div className="mb-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-4 text-white shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide opacity-90">
            Lesson of the Day
          </div>
          <div className="mt-2 text-lg font-bold">{safeLessonTitle}</div>

          {lesson?.meaning ? (
            <p className="mt-2 text-sm leading-6 text-blue-50">
              {lesson.meaning}
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

          {targetPhrases.length > 0 ? (
            <div className="mt-4 rounded-2xl bg-white/10 p-3">
              <div className="text-sm font-bold">Target Phrases</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {targetPhrases.map((phrase) => {
                  const isUsed = livePhraseStats.usedPhrases.includes(phrase);
                  return (
                    <span
                      key={phrase}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        isUsed
                          ? "bg-emerald-300 text-emerald-950"
                          : "bg-white/15 text-white"
                      }`}
                    >
                      {phrase}
                    </span>
                  );
                })}
              </div>

              <div className="mt-3 text-xs text-blue-50">
                Use these phrases naturally while speaking.
              </div>
            </div>
          ) : null}
        </div>

        {practiceMode === "phrase" && currentPhrase ? (
          <div className="mb-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-4 text-white shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-bold">Phrase Practice</div>
                <div className="mt-1 text-xs text-amber-100">
                  Phrase {currentPhraseIndex + 1} of {phraseObjects.length}
                </div>
              </div>

              <div className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                Active
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-white/10 p-4">
              <div className="text-xs uppercase tracking-wide text-amber-100">
                English Phrase
              </div>
              <div className="mt-2 text-lg font-bold leading-7">
                {currentPhrase.english}
              </div>

              {currentPhrase.hindi ? (
                <>
                  <div className="mt-4 text-xs uppercase tracking-wide text-amber-100">
                    Hindi Help
                  </div>
                  <div className="mt-2 text-sm leading-6 text-white/95">
                    {currentPhrase.hindi}
                  </div>
                </>
              ) : null}

              {currentPhrase.cue ? (
                <>
                  <div className="mt-4 text-xs uppercase tracking-wide text-amber-100">
                    Practice Cue
                  </div>
                  <div className="mt-2 text-sm leading-6 text-white/95">
                    {currentPhrase.cue}
                  </div>
                </>
              ) : null}
            </div>

            <div className="mt-3 flex gap-3">
              <button
                onClick={goToPrevPhrase}
                disabled={currentPhraseIndex === 0}
                className={`flex-1 rounded-2xl px-4 py-3 text-sm font-bold ${
                  currentPhraseIndex === 0
                    ? "bg-white/10 text-white/60"
                    : "bg-white text-amber-700"
                }`}
              >
                Previous
              </button>

              <button
                onClick={goToNextPhrase}
                disabled={currentPhraseIndex >= phraseObjects.length - 1}
                className={`flex-1 rounded-2xl px-4 py-3 text-sm font-bold ${
                  currentPhraseIndex >= phraseObjects.length - 1
                    ? "bg-white/10 text-white/60"
                    : "bg-white text-amber-700"
                }`}
              >
                Next Phrase
              </button>
            </div>
          </div>
        ) : null}

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
            {isConnecting
              ? "Connecting..."
              : practiceMode === "phrase" && gameModeEnabled
              ? "Start Phrase Game Voice"
              : practiceMode === "phrase"
              ? "Start Phrase Voice"
              : gameModeEnabled
              ? "Start Game Voice"
              : "Start Voice"}
          </button>

          <button
            onClick={() => stopVoice(false)}
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

        {gameResult ? (
          <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-base font-bold">Game Result</h2>

            <div
              className={`mt-3 rounded-2xl p-4 text-white ${
                gameResult.completed
                  ? "bg-gradient-to-br from-emerald-600 to-teal-600"
                  : "bg-gradient-to-br from-amber-500 to-orange-500"
              }`}
            >
              <div className="text-sm opacity-90">
                {gameResult.completed ? "Challenge Complete" : "Challenge Attempt"}
              </div>
              <div className="mt-1 text-2xl font-extrabold">
                {gameResult.completed ? "Well Done!" : "Keep Going!"}
              </div>
              <div className="mt-2 text-sm">
                Turns: {gameResult.turns} / {gameResult.targetTurns}
              </div>
              <div className="mt-1 text-sm">Bonus Score: +{gameResult.bonus}</div>
              <div className="mt-1 text-sm">Time Used: {gameResult.timeUsed}s</div>
            </div>
          </div>
        ) : null}

        <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold">Progress History</h2>
              <p className="mt-1 text-sm text-slate-600">
                Last 7 practice sessions
              </p>
            </div>

            <div className="rounded-xl bg-slate-100 px-3 py-2 text-right">
              <div className="text-[11px] text-slate-500">Avg Score</div>
              <div className="text-lg font-extrabold text-slate-900">
                {averageHistoryScore}
              </div>
            </div>
          </div>

          {!sessionHistory.length ? (
            <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
              No practice history yet.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {sessionHistory.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900">
                        {formatSessionLabel(item.dateKey)}
                      </div>
                      <div className="mt-1 truncate text-sm text-slate-600">
                        {item.lessonTitle}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                          L{item.level}-W{item.week}-D{item.day}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 font-medium ${
                            item.mode === "Game" || item.mode === "Game + Phrase"
                              ? "bg-violet-100 text-violet-700"
                              : item.mode === "Phrase"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {item.mode}
                        </span>
                        {Number(item.gameBonus || 0) > 0 ? (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-medium text-emerald-700">
                            Bonus +{item.gameBonus}
                          </span>
                        ) : null}
                        {Number(item.phraseTotal || 0) > 0 ? (
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 font-medium text-amber-700">
                            Phrases {item.phraseUsedCount}/{item.phraseTotal}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="rounded-xl bg-slate-900 px-3 py-2 text-center text-white">
                      <div className="text-[11px] opacity-80">Score</div>
                      <div className="text-xl font-extrabold">{item.score}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-base font-bold">Speaking Score</h2>
          <p className="mt-1 text-sm text-slate-600">
            Score appears after you press Stop
          </p>

          {!scoreCard ? (
            <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
              Finish one speaking session to see score, feedback, lesson relevance.
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
                {scoreCard.gameBonus > 0 ? (
                  <div className="mt-2 text-sm text-emerald-300">
                    Game Bonus Applied: +{scoreCard.gameBonus}
                  </div>
                ) : null}
                {scoreCard.phraseBonus > 0 ? (
                  <div className="mt-2 text-sm text-amber-300">
                    Phrase Bonus Applied: +{scoreCard.phraseBonus}
                  </div>
                ) : null}
                {scoreCard.practiceModeBonus > 0 ? (
                  <div className="mt-2 text-sm text-blue-300">
                    Phrase Practice Bonus Applied: +{scoreCard.practiceModeBonus}
                  </div>
                ) : null}
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

              {scoreCard.phraseTotal > 0 ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-amber-50 p-3">
                      <div className="text-xs text-amber-700">Phrase Score</div>
                      <div className="mt-1 text-lg font-bold text-amber-900">
                        {scoreCard.phraseUsageScore}
                      </div>
                    </div>

                    <div className="rounded-xl bg-amber-50 p-3">
                      <div className="text-xs text-amber-700">Phrases Used</div>
                      <div className="mt-1 text-lg font-bold text-amber-900">
                        {scoreCard.phraseUsedCount}/{scoreCard.phraseTotal}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <div className="text-sm font-semibold text-amber-900">
                      {scoreCard.phraseLabel}
                    </div>
                    <div className="mt-1 text-sm text-amber-800">
                      Coverage: {scoreCard.phrasePercentage}%
                    </div>

                    <div className="mt-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                        Target Phrases
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {scoreCard.targetPhrases.map((phrase) => {
                          const used = scoreCard.usedPhrases.includes(phrase);
                          return (
                            <span
                              key={phrase}
                              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                used
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-white text-slate-700 ring-1 ring-amber-200"
                              }`}
                            >
                              {phrase}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {scoreCard.usedPhrases.length > 0 ? (
                      <div className="mt-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                          Phrases You Used
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {scoreCard.usedPhrases.map((phrase) => (
                            <span
                              key={phrase}
                              className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800"
                            >
                              {phrase}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </>
              ) : null}

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

          {targetPhrases.length > 0 ? (
            <div className="mt-3 rounded-xl bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Live Phrase Tracking
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    {livePhraseStats.label}
                  </div>
                </div>

                <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                  {livePhraseStats.usedCount}/{livePhraseStats.total}
                </div>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all"
                  style={{ width: `${livePhraseStats.percentage}%` }}
                />
              </div>
            </div>
          ) : null}

          <div className="mt-3 min-h-[100px] whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
            {transcriptPreview || "No student speech captured yet."}
          </div>
        </div>
      </div>
    </div>
  );
}