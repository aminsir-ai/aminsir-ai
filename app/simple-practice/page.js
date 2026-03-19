"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const LESSON = {
  title: "Day 1 - Foundation",
  subtitle: "What is English? + Parts of Speech",
  content: [
    "My dear student, first of all congratulations for choosing AminSirAI as your communication partner.",
    "Main aapko guarantee deta hoon — agar aap thoda serious ho gaye, toh aapko ek strong communicator banne se koi nahi rok sakta.",
    "Aap already smart ho. Bas direction chahiye.",
    "Chaliye, ab topic pe aate hain.",
    "What is English? Of course, it is a language.",
    "Lekin ek important question — hum English easily kaise seekh sakte hain?",
    "Chaliye ek simple example se samajhte hain.",
    "Agar aap thoda focus karoge, toh English aapko a piece of cake lagegi.",
    "A piece of cake ka matlab hota hai: bahut easy.",
    "Toh aaj se yeh nahi bolna bahut easy hai. Bolna: It is a piece of cake.",
    "Ab English ko ek powerful example se samajhte hain.",
    "Socho aapko ek new house banana hai.",
    "Agar main poochu ghar banane ke liye kya kya chahiye, toh aap kahoge: land, cement, sand, bricks, water, labour, paint.",
    "Bilkul sahi.",
    "Jaise bina material ke ghar nahi ban sakta, waise hi bina Parts of Speech ke English nahi ban sakti.",
    "Repeat kariye: Parts of Speech.",
    "English ek language house hai, aur usko banane ke liye 9 materials lagte hain:",
  ],
  parts: [
    "1. Noun",
    "2. Pronoun",
    "3. Verb",
    "4. Adjective",
    "5. Adverb",
    "6. Conjunction",
    "7. Interjection",
    "8. Preposition",
    "9. Articles",
  ],
  closing:
    "Aaj se hum ek ek karke yeh sab seekhenge, aur aap dekhoge English sach mein a piece of cake ban jayegi.",
  speakingLines: [
    "English is a language.",
    "I want to learn English.",
    "English has parts of speech.",
    "A house needs materials.",
    "English also needs structure.",
    "I am ready to learn step by step.",
  ],
  wordOfDay: {
    word: "Foundation",
    hindiMeaning: "नींव / बुनियाद",
    example: "A strong foundation is essential for learning English well.",
  },
};

function formatTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function simpleScore(conversation, elapsedSeconds) {
  const studentTurns = conversation.filter((m) => m.role === "user").length;
  const score = Math.min(60 + studentTurns * 5 + (elapsedSeconds > 120 ? 10 : 0), 95);

  return {
    overall: score,
    speaking: Math.min(6 + studentTurns, 10),
    grammar: studentTurns >= 3 ? 7 : 6,
    vocabulary: studentTurns >= 4 ? 8 : 7,
    confidence: elapsedSeconds > 180 ? 8 : 7,
  };
}

function getScoreCardMeta(overall) {
  if (overall >= 90) {
    return {
      title: "Outstanding Performance",
      subtitle: "You spoke with excellent confidence and clarity.",
      trophy: "🏆",
      badge: "Champion",
      border: "border-yellow-500",
      bg: "bg-yellow-950/30",
      text: "text-yellow-300",
      image: "🥇",
      tip: "Excellent work. Now focus on speaking longer and more naturally.",
    };
  }

  if (overall >= 80) {
    return {
      title: "Excellent Work",
      subtitle: "You are becoming a stronger English speaker.",
      trophy: "🏆",
      badge: "Excellent",
      border: "border-emerald-500",
      bg: "bg-emerald-950/30",
      text: "text-emerald-300",
      image: "🌟",
      tip: "Very good. Try to use slightly longer answers in your next session.",
    };
  }

  if (overall >= 70) {
    return {
      title: "Very Good Progress",
      subtitle: "Your speaking confidence is growing well.",
      trophy: "🥈",
      badge: "Very Good",
      border: "border-sky-500",
      bg: "bg-sky-950/30",
      text: "text-sky-300",
      image: "👏",
      tip: "Good progress. Keep improving grammar and sentence flow.",
    };
  }

  if (overall >= 60) {
    return {
      title: "Good Start",
      subtitle: "You are on the right path. Keep practicing daily.",
      trophy: "🥉",
      badge: "Good Start",
      border: "border-violet-500",
      bg: "bg-violet-950/30",
      text: "text-violet-300",
      image: "📘",
      tip: "Speak more confidently and try to answer in full sentences.",
    };
  }

  return {
    title: "Keep Practicing",
    subtitle: "Daily speaking practice will make you stronger.",
    trophy: "🎯",
    badge: "Practice Mode",
    border: "border-orange-500",
    bg: "bg-orange-950/30",
    text: "text-orange-300",
    image: "💪",
    tip: "Do not worry. Practice every day and your fluency will improve.",
  };
}

export default function SimplePracticePage() {
  const [studentName, setStudentName] = useState("Student");
  const [phase, setPhase] = useState("lesson");
  const [conversation, setConversation] = useState([]);
  const [currentAiText, setCurrentAiText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [lessonSpeaking, setLessonSpeaking] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showScoreCard, setShowScoreCard] = useState(false);
  const [score, setScore] = useState(null);
  const [voiceStatus, setVoiceStatus] = useState("idle");
  const [saveStatus, setSaveStatus] = useState("idle");

  const recognitionRef = useRef(null);
  const transcriptRef = useRef("");
  const timerRef = useRef(null);
  const stoppedRef = useRef(false);
  const currentAudioRef = useRef(null);
  const isAiSpeakingRef = useRef(false);
  const phaseRef = useRef("lesson");
  const conversationRef = useRef([]);
  const endingSessionRef = useRef(false);

  const lessonSpeechLines = useMemo(
    () => [...LESSON.content, ...LESSON.parts, LESSON.closing],
    []
  );

  const scoreMeta = score ? getScoreCardMeta(score.overall) : null;

  async function saveProgressToSupabase({
    studentId,
    studentName,
    levelNo = 1,
    weekNo = 1,
    dayNo = 1,
    lesson = "Day 1",
    duration = 0,
    score = {},
    starsEarned = 0,
    sentencesSpoken = 0,
    roundsCompleted = 0,
    completed = true,
  }) {
    try {
      const response = await fetch("/api/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId,
          studentName,
          levelNo,
          weekNo,
          dayNo,
          lesson,
          duration,
          score,
          starsEarned,
          sentencesSpoken,
          roundsCompleted,
          completed,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Failed to save progress:", result);
        return false;
      }

      console.log("Progress saved:", result);
      return true;
    } catch (error) {
      console.error("Save progress error:", error);
      return false;
    }
  }

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  useEffect(() => {
    const storedName =
      typeof window !== "undefined" ? localStorage.getItem("studentName") : null;
    if (storedName) setStudentName(storedName);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("studentName", studentName);
    }
  }, [studentName]);

  useEffect(() => {
    const SpeechRecognition =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
      transcriptRef.current = "";
    };

    recognition.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i += 1) {
        text += `${event.results[i][0].transcript} `;
      }
      transcriptRef.current = text.trim();
    };

    recognition.onend = () => {
      setIsListening(false);

      if (stoppedRef.current || endingSessionRef.current) return;

      const finalText = transcriptRef.current.trim();

      if (finalText) {
        handleStudentMessage(finalText);
      } else {
        setTimeout(() => {
          if (
            !isAiSpeakingRef.current &&
            phaseRef.current === "practice" &&
            !endingSessionRef.current
          ) {
            startListening();
          }
        }, 700);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  useEffect(() => {
    if (!timerRunning) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          endSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  async function speakText(text, onEnd) {
    try {
      stopCurrentAudio();
      isAiSpeakingRef.current = true;
      setVoiceStatus("generating");

      const res = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        throw new Error("TTS request failed");
      }

      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
        isAiSpeakingRef.current = false;
        setVoiceStatus("idle");
        if (onEnd) onEnd();
      };

      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
        isAiSpeakingRef.current = false;
        setVoiceStatus("idle");
        if (onEnd) onEnd();
      };

      setVoiceStatus("playing");
      await audio.play();
    } catch (error) {
      console.error("speakText error:", error);
      isAiSpeakingRef.current = false;
      setVoiceStatus("idle");
      if (onEnd) onEnd();
    }
  }

  function stopCurrentAudio() {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    isAiSpeakingRef.current = false;
    setVoiceStatus("idle");
  }

  function listenLesson(index = 0) {
    if (index >= lessonSpeechLines.length) {
      setLessonSpeaking(false);
      return;
    }

    setLessonSpeaking(true);
    setCurrentAiText(lessonSpeechLines[index]);

    speakText(lessonSpeechLines[index], () => {
      setTimeout(() => listenLesson(index + 1), 250);
    });
  }

  function stopLessonVoice() {
    stopCurrentAudio();
    setLessonSpeaking(false);
    setCurrentAiText("");
  }

  async function callAminSirApi({ mode = "reply", message = "", history = [] }) {
    const res = await fetch("/api/simple-practice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentName, mode, message, history }),
    });

    const data = await res.json();
    return data?.text || "Please say that again.";
  }

  function startListening() {
    if (
      !recognitionRef.current ||
      isListening ||
      isAiSpeakingRef.current ||
      phaseRef.current !== "practice" ||
      endingSessionRef.current
    ) {
      return;
    }

    try {
      stoppedRef.current = false;
      recognitionRef.current.start();
    } catch {}
  }

  function stopListening() {
    try {
      stoppedRef.current = true;
      recognitionRef.current?.stop();
    } catch {}
  }

  async function startPractice() {
    stopLessonVoice();
    endingSessionRef.current = false;
    setPhase("practice");
    phaseRef.current = "practice";
    setConversation([]);
    conversationRef.current = [];
    setCurrentAiText("");
    setTimeLeft(10 * 60);
    setTimerRunning(true);
    setShowScoreCard(false);
    setScore(null);
    setSaveStatus("idle");

    const opening = await callAminSirApi({ mode: "opening" });
    const nextConversation = [{ role: "assistant", content: opening }];
    setConversation(nextConversation);
    conversationRef.current = nextConversation;
    setCurrentAiText(opening);

    speakText(opening, () => {
      setTimeout(() => startListening(), 500);
    });
  }

  async function handleStudentMessage(text) {
    if (endingSessionRef.current || phaseRef.current !== "practice") return;

    const updatedConversation = [
      ...conversationRef.current,
      { role: "user", content: text },
    ];

    setConversation(updatedConversation);
    conversationRef.current = updatedConversation;

    const aiReply = await callAminSirApi({
      mode: "reply",
      message: text,
      history: updatedConversation,
    });

    const nextConversation = [
      ...updatedConversation,
      { role: "assistant", content: aiReply },
    ];

    setConversation(nextConversation);
    conversationRef.current = nextConversation;
    setCurrentAiText(aiReply);

    speakText(aiReply, () => {
      setTimeout(() => {
        if (phaseRef.current === "practice" && !endingSessionRef.current) {
          startListening();
        }
      }, 500);
    });
  }

  async function endSession() {
    if (endingSessionRef.current) return;
    endingSessionRef.current = true;

    clearInterval(timerRef.current);
    stopListening();
    stopCurrentAudio();

    const liveConversation = conversationRef.current;
    const elapsedSeconds = 10 * 60 - timeLeft;
    const finalScore = simpleScore(liveConversation, elapsedSeconds);
    const closing = `Great job today, ${studentName}. Keep practicing every day.`;

    const studentTurns = liveConversation.filter((m) => m.role === "user").length;
    const earnedStars =
      finalScore.overall >= 90 ? 3 : finalScore.overall >= 75 ? 2 : 1;

    const finalConversation = [
      ...liveConversation,
      { role: "assistant", content: closing },
    ];

    setConversation(finalConversation);
    conversationRef.current = finalConversation;
    setCurrentAiText(closing);

    setTimerRunning(false);
    setPhase("finished");
    phaseRef.current = "finished";
    setScore(finalScore);
    setShowScoreCard(true);
    setSaveStatus("saving");

    speakText(closing);

    const saved = await saveProgressToSupabase({
      studentId:
        studentName?.trim()?.toLowerCase().replace(/\s+/g, "_") || "student",
      studentName: studentName?.trim() || "Student",
      levelNo: 1,
      weekNo: 1,
      dayNo: 1,
      lesson: LESSON.title || "Day 1",
      duration: elapsedSeconds,
      score: {
        overall: finalScore.overall || 0,
        breakdown: {
          speaking: finalScore.speaking || 0,
          grammar: finalScore.grammar || 0,
          vocabulary: finalScore.vocabulary || 0,
          confidence: finalScore.confidence || 0,
        },
      },
      starsEarned: earnedStars,
      sentencesSpoken: studentTurns,
      roundsCompleted: 1,
      completed: true,
    });

    setSaveStatus(saved ? "saved" : "error");
  }

  function restart() {
    clearInterval(timerRef.current);
    stopListening();
    stopCurrentAudio();
    endingSessionRef.current = false;

    setPhase("lesson");
    phaseRef.current = "lesson";
    setConversation([]);
    conversationRef.current = [];
    setCurrentAiText("");
    setIsListening(false);
    setLessonSpeaking(false);
    setTimeLeft(10 * 60);
    setTimerRunning(false);
    setShowScoreCard(false);
    setScore(null);
    setSaveStatus("idle");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-3 py-4 text-white sm:px-4 sm:py-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 rounded-3xl border border-slate-800 bg-slate-900 p-4 sm:mb-6 sm:p-5">
          <p className="text-sm text-slate-300">AminSirAI • OpenAI TTS Voice</p>
          <h1 className="mt-2 text-xl font-bold leading-snug sm:text-2xl">
            {LESSON.title}
          </h1>
          <p className="mt-2 text-sm text-slate-300 sm:text-base">{LESSON.subtitle}</p>

          <div className="mt-4 max-w-sm">
            <label className="mb-2 block text-sm text-slate-300">Student Name</label>
            <input
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none"
              placeholder="Enter logged-in student name"
            />
          </div>
        </div>

        {phase === "lesson" && (
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
            <section className="rounded-3xl border border-slate-800 bg-slate-900 p-4 sm:p-5 lg:col-span-2">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => listenLesson(0)}
                  disabled={lessonSpeaking}
                  className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50 sm:text-base"
                >
                  {lessonSpeaking ? "Playing Lesson..." : "Listen Lesson"}
                </button>

                <button
                  onClick={stopLessonVoice}
                  className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold sm:text-base"
                >
                  Stop Lesson Voice
                </button>
              </div>

              <h2 className="mt-5 text-lg font-semibold sm:text-xl">Talking E-book Lesson</h2>

              <div className="mt-5 space-y-4 text-[15px] leading-7 text-slate-200 sm:text-[16px] sm:leading-8">
                {LESSON.content.map((line, index) => (
                  <p key={index}>{line}</p>
                ))}

                <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4">
                  <h3 className="mb-3 text-base font-semibold sm:text-lg">9 Materials of English</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {LESSON.parts.map((item) => (
                      <div
                        key={item}
                        className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-slate-200"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <p>{LESSON.closing}</p>
              </div>
            </section>

            <aside className="space-y-4 sm:space-y-6">
              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
                <h3 className="text-lg font-semibold">Speaking Practice Lines</h3>
                <div className="mt-4 space-y-3">
                  {LESSON.speakingLines.map((line) => (
                    <div
                      key={line}
                      className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm leading-6 text-slate-100 sm:text-base"
                    >
                      {line}
                    </div>
                  ))}
                </div>

                <button
                  onClick={startPractice}
                  className="mt-6 w-full rounded-2xl bg-white px-4 py-3 font-semibold text-slate-950"
                >
                  Practice with AminSirAI
                </button>
              </div>
            </aside>
          </div>
        )}

        {(phase === "practice" || phase === "finished") && (
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
            <section className="rounded-3xl border border-slate-800 bg-slate-900 p-4 sm:p-5 lg:col-span-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-400">Practice with AminSirAI</p>
                  <h2 className="text-lg font-semibold sm:text-xl">{LESSON.title}</h2>
                </div>

                <div className="rounded-2xl border border-emerald-700 bg-emerald-950/40 px-4 py-3">
                  <p className="text-sm text-emerald-300">
                    {phase === "practice" ? "Session Timer" : "Session Complete"}
                  </p>
                  <p className="text-xl font-bold sm:text-2xl">
                    {phase === "practice" ? formatTime(timeLeft) : "Done"}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:mt-6">
                <p className="text-sm uppercase tracking-wide text-slate-400">Current AI Voice</p>
                <p className="mt-2 text-base leading-7 text-white sm:text-lg sm:leading-8">
                  {currentAiText}
                </p>
              </div>

              <div className="mt-4 max-h-[340px] space-y-3 overflow-y-auto pr-1 sm:mt-6 sm:max-h-[440px]">
                {conversation.map((item, index) => (
                  <div
                    key={`${item.role}-${index}`}
                    className={`rounded-2xl px-3 py-3 sm:px-4 ${
                      item.role === "assistant"
                        ? "border border-slate-700 bg-slate-950"
                        : "border border-indigo-700 bg-indigo-950/30"
                    }`}
                  >
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      {item.role === "assistant" ? "AminSirAI" : studentName}
                    </p>
                    <p className="mt-1 break-words text-sm leading-6 text-slate-100 sm:text-base sm:leading-7">
                      {item.content}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <aside className="space-y-4 sm:space-y-6">
              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
                <h3 className="text-lg font-semibold">Live Conversation</h3>
                <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm text-slate-300 sm:text-base">
                    {isListening
                      ? "Listening... please speak now."
                      : voiceStatus === "generating"
                      ? "Generating natural voice..."
                      : voiceStatus === "playing"
                      ? "AminSirAI is speaking..."
                      : phase === "practice"
                      ? "Waiting for next response..."
                      : "Session not started yet."}
                  </p>
                </div>

                <div className="mt-4 grid gap-3">
                  <button
                    onClick={startListening}
                    disabled={isListening || phase === "finished" || isAiSpeakingRef.current}
                    className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 font-medium disabled:opacity-50"
                  >
                    {isListening ? "Listening..." : "Speak Now"}
                  </button>

                  <button
                    onClick={endSession}
                    className="rounded-2xl border border-red-700 bg-red-950/30 px-4 py-3 font-medium"
                  >
                    End Session
                  </button>
                </div>
              </div>
            </aside>
          </div>
        )}

        {showScoreCard && score && scoreMeta && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-3 py-4 sm:px-4">
            <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-4 shadow-2xl sm:p-6">
              <div className={`rounded-3xl border ${scoreMeta.border} ${scoreMeta.bg} p-3 sm:p-5`}>
                <div className="flex flex-col items-center text-center">
                  <div className="text-4xl sm:text-6xl">{scoreMeta.trophy}</div>
                  <div className="mt-2 text-3xl sm:mt-3 sm:text-5xl">{scoreMeta.image}</div>
                  <p
                    className={`mt-3 inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold sm:px-4 sm:text-sm ${scoreMeta.border} ${scoreMeta.text}`}
                  >
                    {scoreMeta.badge}
                  </p>
                  <h2 className="mt-3 text-lg font-bold leading-snug sm:mt-4 sm:text-2xl">
                    {scoreMeta.title}
                  </h2>
                  <p className="mt-1 text-xs text-slate-300 sm:mt-2 sm:text-base">
                    {scoreMeta.subtitle}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-3 text-center sm:mt-5 sm:p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400 sm:text-sm">
                  Overall Score
                </p>
                <p className="mt-1 text-3xl font-bold sm:mt-2 sm:text-5xl">
                  {score.overall}/100
                </p>
                <p className="mt-1 text-xs text-slate-300 sm:mt-2 sm:text-base">
                  Great job, {studentName}.
                </p>
              </div>

              <div className="mt-4 grid gap-2 sm:mt-5 sm:gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 sm:p-4">
                  <p className="text-slate-400">Speaking</p>
                  <p className="mt-1 text-xl font-semibold sm:text-2xl">{score.speaking}/10</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 sm:p-4">
                  <p className="text-slate-400">Grammar</p>
                  <p className="mt-1 text-xl font-semibold sm:text-2xl">{score.grammar}/10</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 sm:p-4">
                  <p className="text-slate-400">Vocabulary</p>
                  <p className="mt-1 text-xl font-semibold sm:text-2xl">{score.vocabulary}/10</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 sm:p-4">
                  <p className="text-slate-400">Confidence</p>
                  <p className="mt-1 text-xl font-semibold sm:text-2xl">{score.confidence}/10</p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-indigo-700 bg-indigo-950/30 p-3 sm:mt-5 sm:p-4">
                <p className="text-xs uppercase tracking-wide text-indigo-300 sm:text-sm">
                  Advanced Word of the Day
                </p>
                <p className="mt-1 break-words text-xl font-bold sm:mt-2 sm:text-2xl">
                  {LESSON.wordOfDay.word}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-200 sm:mt-2 sm:text-base">
                  <span className="font-semibold">Hindi Meaning:</span>{" "}
                  {LESSON.wordOfDay.hindiMeaning}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-300 sm:mt-2 sm:text-base sm:leading-7">
                  <span className="font-semibold">Example:</span> {LESSON.wordOfDay.example}
                </p>
              </div>

              <div className={`mt-4 rounded-2xl border ${scoreMeta.border} ${scoreMeta.bg} p-3 sm:mt-5 sm:p-4`}>
                <p className="text-sm font-semibold sm:text-base">Coach Tip</p>
                <p className="mt-1 text-sm leading-6 text-slate-200 sm:mt-2 sm:text-base">
                  {scoreMeta.tip}
                </p>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-3 sm:mt-5 sm:p-4">
                <p className="text-sm font-semibold text-slate-200">Progress Save Status</p>
                <p className="mt-1 text-sm text-slate-300">
                  {saveStatus === "saving" && "Saving progress to Supabase..."}
                  {saveStatus === "saved" && "Progress saved successfully."}
                  {saveStatus === "error" && "Progress save failed. Please check API route or env keys."}
                  {saveStatus === "idle" && "Progress not saved yet."}
                </p>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:mt-6 sm:flex-row">
                <button
                  onClick={restart}
                  className="flex-1 rounded-2xl bg-white px-4 py-3 font-semibold text-slate-950"
                >
                  Restart
                </button>

                <button
                  onClick={() => setShowScoreCard(false)}
                  className="flex-1 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}