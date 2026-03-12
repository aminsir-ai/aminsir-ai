"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num));
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

function getIdiomObjects(lesson) {
  if (!Array.isArray(lesson?.idioms)) return [];
  return lesson.idioms
    .map((item, index) => {
      if (typeof item === "string") {
        return {
          id: index + 1,
          idiom: item.trim(),
          meaning: "",
          example: "",
        };
      }

      return {
        id: item?.id || index + 1,
        idiom: String(item?.idiom || item?.english || "").trim(),
        meaning: String(item?.meaning || "").trim(),
        example: String(item?.example || "").trim(),
      };
    })
    .filter((item) => item.idiom);
}

function getLessonTargetPhrases(phraseObjects) {
  if (!Array.isArray(phraseObjects)) return [];
  return phraseObjects
    .map((item) => String(item?.english || "").trim())
    .filter(Boolean);
}

function getLessonTargetIdioms(idiomObjects) {
  if (!Array.isArray(idiomObjects)) return [];
  return idiomObjects
    .map((item) => String(item?.idiom || "").trim())
    .filter(Boolean);
}

function getUsedTargets(utterances, targets) {
  const transcriptText = normalizePhraseText(
    Array.isArray(utterances) ? utterances.join(" ") : ""
  );

  if (!transcriptText) return [];
  if (!Array.isArray(targets) || targets.length === 0) return [];

  const used = [];

  for (const rawTarget of targets) {
    const target = String(rawTarget || "").trim();
    const normalizedTarget = normalizePhraseText(target);
    if (!normalizedTarget) continue;

    if (transcriptText.includes(normalizedTarget)) {
      used.push(target);
    }
  }

  return [...new Set(used)];
}

function getTargetStats(utterances, targets) {
  const safeTargets = Array.isArray(targets) ? targets : [];
  const usedTargets = getUsedTargets(utterances, safeTargets);
  const total = safeTargets.length;
  const usedCount = usedTargets.length;
  const percentage = total > 0 ? round((usedCount / total) * 100) : 0;

  let label = "Keep Practicing";
  if (percentage >= 80) label = "Excellent";
  else if (percentage >= 60) label = "Very Good";
  else if (percentage >= 40) label = "Good Progress";
  else if (percentage >= 20) label = "Started Well";

  return {
    usedTargets,
    usedCount,
    total,
    percentage,
    label,
  };
}

function buildScoreCard({
  utterances,
  lesson,
  practiceMode,
  phraseTargets,
  idiomTargets,
}) {
  const joinedText = utterances.join(" ").trim();
  const totalWords = cleanWords(joinedText).length;
  const turnCount = utterances.filter((u) => String(u || "").trim()).length;
  const avgWordsPerTurn = turnCount > 0 ? totalWords / turnCount : 0;

  const phraseStats = getTargetStats(utterances, phraseTargets);
  const idiomStats = getTargetStats(utterances, idiomTargets);

  let participationScore = 0;
  if (turnCount >= 8) participationScore = 90;
  else if (turnCount >= 6) participationScore = 80;
  else if (turnCount >= 4) participationScore = 70;
  else if (turnCount >= 2) participationScore = 55;
  else if (turnCount >= 1) participationScore = 40;
  else participationScore = 20;

  let fluencyScore = 0;
  if (avgWordsPerTurn >= 10) fluencyScore = 88;
  else if (avgWordsPerTurn >= 7) fluencyScore = 76;
  else if (avgWordsPerTurn >= 4) fluencyScore = 62;
  else if (avgWordsPerTurn >= 1) fluencyScore = 45;
  else fluencyScore = 20;

  let usageScore = 0;
  if (practiceMode === "phrase" && phraseStats.total > 0) {
    usageScore = clamp(round(35 + phraseStats.percentage * 0.6), 20, 98);
  } else if (practiceMode === "idiom" && idiomStats.total > 0) {
    usageScore = clamp(round(35 + idiomStats.percentage * 0.6), 20, 98);
  } else {
    usageScore = totalWords >= 30 ? 75 : totalWords >= 15 ? 60 : 40;
  }

  const overall = clamp(
    round((participationScore + fluencyScore + usageScore) / 3),
    20,
    99
  );

  let status = "Keep Practicing";
  if (overall >= 90) status = "Excellent";
  else if (overall >= 80) status = "Very Good";
  else if (overall >= 70) status = "Good Job";
  else if (overall >= 60) status = "Good Start";

  let feedback = "Try to speak more in full sentences.";
  if (overall >= 90) feedback = "Excellent speaking. Keep going.";
  else if (overall >= 80) feedback = "Very good work. Speak a little longer.";
  else if (overall >= 70) feedback = "Good job. Keep practicing daily.";
  else if (overall >= 60) feedback = "Good start. Try to speak more clearly.";

  return {
    overall,
    status,
    feedback,
    participationScore,
    fluencyScore,
    usageScore,
    totalWords,
    turnCount,
    avgWordsPerTurn: round(avgWordsPerTurn),
    phraseStats,
    idiomStats,
    practiceMode,
    lessonTitle: lesson?.title || "",
  };
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

  const [userTranscript, setUserTranscript] = useState([]);
  const [scoreCard, setScoreCard] = useState(null);

  const audioContextRef = useRef(null);

  const levels = useMemo(() => getLevels(), []);
  const weeks = useMemo(() => getWeeks(selectedLevel), [selectedLevel]);
  const days = useMemo(
    () => getDays(selectedLevel, selectedWeek),
    [selectedLevel, selectedWeek]
  );

  const lesson = useMemo(() => {
    return getLessonWithContext(selectedLevel, selectedWeek, selectedDay);
  }, [selectedLevel, selectedWeek, selectedDay]);

  const phraseObjects = useMemo(() => getPhraseObjects(lesson), [lesson]);
  const idiomObjects = useMemo(() => getIdiomObjects(lesson), [lesson]);

  const targetPhrases = useMemo(
    () => getLessonTargetPhrases(phraseObjects),
    [phraseObjects]
  );

  const targetIdioms = useMemo(
    () => getLessonTargetIdioms(idiomObjects),
    [idiomObjects]
  );

  const currentPhrase = useMemo(() => {
    if (practiceMode === "phrase" && phraseObjects.length > 0) {
      return phraseObjects[currentPhraseIndex] || phraseObjects[0];
    }

    if (practiceMode === "idiom" && idiomObjects.length > 0) {
      return idiomObjects[currentPhraseIndex] || idiomObjects[0];
    }

    return null;
  }, [practiceMode, phraseObjects, idiomObjects, currentPhraseIndex]);

  const livePhraseStats = useMemo(() => {
    return getTargetStats(userTranscript, targetPhrases);
  }, [userTranscript, targetPhrases]);

  const liveIdiomStats = useMemo(() => {
    return getTargetStats(userTranscript, targetIdioms);
  }, [userTranscript, targetIdioms]);

  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("aminsir_mobile_lesson_selection") || "{}"
      );
      const fallback = getInitialLessonState();

      const level = Number(saved?.level || fallback.level);
      const week = Number(saved?.week || fallback.week);
      const day = Number(saved?.day || fallback.day);

      setSelectedLevel(getLevel(level) ? level : 1);
      setSelectedWeek(getWeek(level, week) ? week : 1);
      setSelectedDay(getDay(level, week, day) ? day : 1);
    } catch {
      setSelectedLevel(1);
      setSelectedWeek(1);
      setSelectedDay(1);
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
    setCurrentPhraseIndex(0);
    setUserTranscript([]);
    setScoreCard(null);
  }, [selectedLevel, selectedWeek, selectedDay, practiceMode]);

  async function unlockAudio() {
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new AudioCtx();
      }

      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }

      setSoundEnabled(true);
      setStatusText("Sound enabled");
    } catch {
      setStatusText("Could not enable sound");
    }
  }

  function startPractice() {
    setStatusText(
      practiceMode === "phrase"
        ? "Phrase mode ready"
        : practiceMode === "idiom"
        ? "Idiom mode ready"
        : "Lesson mode ready"
    );
  }

  function stopPractice() {
    const result = buildScoreCard({
      utterances: userTranscript,
      lesson,
      practiceMode,
      phraseTargets: targetPhrases,
      idiomTargets: targetIdioms,
    });

    setScoreCard(result);
    setStatusText("Stopped");
  }

  function addTestLine() {
    if (practiceMode === "phrase" && currentPhrase?.english) {
      setUserTranscript((prev) => [...prev, currentPhrase.english]);
      return;
    }

    if (practiceMode === "idiom" && currentPhrase?.idiom) {
      setUserTranscript((prev) => [...prev, currentPhrase.idiom]);
      return;
    }

    setUserTranscript((prev) => [
      ...prev,
      lesson?.example || "I am practicing English.",
    ]);
  }

  const safeLessonTitle =
    lesson?.title ||
    `Level ${selectedLevel} Week ${selectedWeek} Day ${selectedDay}`;

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
            Lesson, phrase and idiom speaking practice
          </p>
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
                    Level {lvl.level}
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
          <h2 className="mb-3 text-base font-bold">Practice Mode</h2>

          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setPracticeMode("normal")}
              className={`rounded-2xl px-4 py-3 text-sm font-bold shadow-sm ${
                practiceMode === "normal"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700 ring-1 ring-slate-200"
              }`}
            >
              Normal
            </button>

            <button
              onClick={() => setPracticeMode("phrase")}
              className={`rounded-2xl px-4 py-3 text-sm font-bold shadow-sm ${
                practiceMode === "phrase"
                  ? "bg-amber-500 text-white"
                  : "bg-slate-100 text-slate-700 ring-1 ring-slate-200"
              }`}
            >
              Phrase
            </button>

            <button
              onClick={() => setPracticeMode("idiom")}
              className={`rounded-2xl px-4 py-3 text-sm font-bold shadow-sm ${
                practiceMode === "idiom"
                  ? "bg-violet-600 text-white"
                  : "bg-slate-100 text-slate-700 ring-1 ring-slate-200"
              }`}
            >
              Idiom
            </button>
          </div>
        </div>

        <div className="mb-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-4 text-white shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide opacity-90">
            Current Lesson
          </div>
          <div className="mt-2 text-lg font-bold">{safeLessonTitle}</div>
          <div className="mt-2 text-sm text-blue-50">
            {lesson?.meaning || lesson?.speakingFocus || "Speaking practice"}
          </div>
        </div>

        {practiceMode === "phrase" && currentPhrase?.english ? (
          <div className="mb-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-4 text-white shadow-sm">
            <div className="text-sm font-bold">Phrase Practice</div>
            <div className="mt-3 rounded-2xl bg-white/10 p-4">
              <div className="text-xs uppercase tracking-wide text-amber-100">
                English Phrase
              </div>
              <div className="mt-2 text-lg font-bold">{currentPhrase.english}</div>
              {currentPhrase.cue ? (
                <div className="mt-3 text-sm text-white/95">{currentPhrase.cue}</div>
              ) : null}
            </div>

            <div className="mt-3 flex gap-3">
              <button
                onClick={() =>
                  setCurrentPhraseIndex((prev) => Math.max(prev - 1, 0))
                }
                className="flex-1 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-amber-700"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPhraseIndex((prev) =>
                    Math.min(prev + 1, phraseObjects.length - 1)
                  )
                }
                className="flex-1 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-amber-700"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}

        {practiceMode === "idiom" && currentPhrase?.idiom ? (
          <div className="mb-4 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 p-4 text-white shadow-sm">
            <div className="text-sm font-bold">Idiom Practice</div>
            <div className="mt-3 rounded-2xl bg-white/10 p-4">
              <div className="text-xs uppercase tracking-wide text-violet-100">
                Idiom
              </div>
              <div className="mt-2 text-lg font-bold">{currentPhrase.idiom}</div>

              {currentPhrase.meaning ? (
                <>
                  <div className="mt-4 text-xs uppercase tracking-wide text-violet-100">
                    Meaning
                  </div>
                  <div className="mt-2 text-sm text-white/95">
                    {currentPhrase.meaning}
                  </div>
                </>
              ) : null}

              {currentPhrase.example ? (
                <>
                  <div className="mt-4 text-xs uppercase tracking-wide text-violet-100">
                    Example
                  </div>
                  <div className="mt-2 text-sm text-white/95">
                    {currentPhrase.example}
                  </div>
                </>
              ) : null}
            </div>

            <div className="mt-3 flex gap-3">
              <button
                onClick={() =>
                  setCurrentPhraseIndex((prev) => Math.max(prev - 1, 0))
                }
                className="flex-1 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-violet-700"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPhraseIndex((prev) =>
                    Math.min(prev + 1, idiomObjects.length - 1)
                  )
                }
                className="flex-1 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-violet-700"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}

        <div className="mb-4 grid grid-cols-1 gap-3">
          <button
            onClick={unlockAudio}
            className="rounded-2xl bg-emerald-600 px-4 py-4 text-sm font-bold text-white shadow-sm"
          >
            Enable Sound
          </button>

          <button
            onClick={startPractice}
            className="rounded-2xl bg-blue-600 px-4 py-4 text-sm font-bold text-white shadow-sm"
          >
            Start Practice
          </button>

          <button
            onClick={addTestLine}
            className="rounded-2xl bg-slate-800 px-4 py-4 text-sm font-bold text-white shadow-sm"
          >
            Add Test Speech
          </button>

          <button
            onClick={stopPractice}
            className="rounded-2xl bg-rose-600 px-4 py-4 text-sm font-bold text-white shadow-sm"
          >
            Stop
          </button>
        </div>

        <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-base font-bold">Recent Student Speech</h2>
          <div className="mt-3 min-h-[100px] whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
            {userTranscript.length
              ? userTranscript.map((line, index) => `${index + 1}. ${line}`).join("\n")
              : "No student speech captured yet."}
          </div>
        </div>

        {practiceMode === "phrase" && targetPhrases.length > 0 ? (
          <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold">Live Phrase Tracking</div>
              <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                {livePhraseStats.usedCount}/{livePhraseStats.total}
              </div>
            </div>
            <div className="mt-2 text-sm text-slate-600">{livePhraseStats.label}</div>
          </div>
        ) : null}

        {practiceMode === "idiom" && targetIdioms.length > 0 ? (
          <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold">Live Idiom Tracking</div>
              <div className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-800">
                {liveIdiomStats.usedCount}/{liveIdiomStats.total}
              </div>
            </div>
            <div className="mt-2 text-sm text-slate-600">{liveIdiomStats.label}</div>
          </div>
        ) : null}

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-base font-bold">Speaking Score</h2>

          {!scoreCard ? (
            <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
              Press Stop after adding test speech to see score.
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

              <div className="grid grid-cols-3 gap-3">
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
                  <div className="text-xs text-slate-500">Usage</div>
                  <div className="mt-1 text-lg font-bold">
                    {scoreCard.usageScore}
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                <div className="font-semibold">Feedback</div>
                <div className="mt-1">{scoreCard.feedback}</div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 text-center text-xs text-slate-500">
          Sound: {soundEnabled ? "Enabled" : "Not enabled"}
        </div>
      </div>
    </div>
  );
}