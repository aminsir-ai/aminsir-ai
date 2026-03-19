"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const DAY_1 = {
  title: "What is English? + Parts of Speech (Foundation)",
  shortTitle: "Day 1 - Foundation",
  lessonIntro: [
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
  partsOfSpeech: [
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
  closingLesson:
    "Aaj se hum ek ek karke yeh sab seekhenge, aur aap dekhoge English sach mein a piece of cake ban jayegi.",
  paragraph: [
    "English is a language, and I want to learn it.",
    "I understand that English has parts of speech.",
    "Just like a house needs materials, English also needs structure.",
    "I am ready to learn step by step.",
    "I believe English will become easy for me.",
  ],
  guidedSpeakingLines: [
    "English is a language.",
    "I want to learn English.",
    "English has parts of speech.",
    "A house needs materials.",
    "English also needs structure.",
    "I am ready to learn step by step.",
  ],
  wordOfTheDay: {
    word: "Foundation",
    meaning: "The base or starting point of something important.",
    example: "A strong foundation is essential for learning English well.",
  },
  aiQuestions: [
    "Welcome to AminSirAI, Ali.",
    "Don't worry about mistakes. Just speak confidently.",
    "Please read the speaking sentences on your screen.",
    "Now tell me, what is English?",
    "Can you explain the house example in your own words?",
    "Why are parts of speech important in English?",
    "Do you think English is difficult or easy? Why?",
    "Now tell me the phrase you learned today and its meaning.",
    "Please explain today's lesson in five simple sentences.",
  ],
};

function formatTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function getSimpleScore(answerCount, elapsedSeconds) {
  const progressScore = Math.min(answerCount * 10, 70);
  const speakingBonus = answerCount >= 5 ? 12 : answerCount >= 3 ? 8 : 4;
  const timeBonus = elapsedSeconds >= 180 ? 10 : elapsedSeconds >= 90 ? 7 : 4;
  const overall = Math.min(progressScore + speakingBonus + timeBonus, 95);

  return {
    overall,
    speaking: answerCount >= 5 ? 8 : answerCount >= 3 ? 7 : 6,
    grammar: answerCount >= 5 ? 8 : answerCount >= 3 ? 7 : 6,
    vocabulary: answerCount >= 5 ? 8 : answerCount >= 3 ? 7 : 6,
    confidence: elapsedSeconds >= 180 ? 8 : 7,
  };
}

function normalizeText(text) {
  return text.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
}

function getCorrection(answer, currentQuestionIndex) {
  const raw = answer.trim();
  const text = normalizeText(answer);

  if (!text) return null;

  if (text.includes("english are")) {
    return "Good try. Say: English is a language.";
  }

  if (text.includes("house need materials")) {
    return "Good try. Say: A house needs materials.";
  }

  if (text.includes("english need structure")) {
    return "Good try. Say: English needs structure.";
  }

  if (text.includes("parts of speech is important")) {
    return "Good try. Say: Parts of speech are important.";
  }

  if (currentQuestionIndex === 3) {
    if (text.includes("english is language")) {
      return "Better sentence: English is a language.";
    }
  }

  if (currentQuestionIndex === 4) {
    if (text.includes("house is need") || text.includes("house need")) {
      return "Better sentence: A house needs materials, and English also needs structure.";
    }
  }

  if (currentQuestionIndex === 5) {
    if (text.includes("parts of speech is")) {
      return "Better sentence: Parts of speech are important in English.";
    }
  }

  return null;
}

function getPraiseOrPrompt(answer) {
  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;

  if (wordCount <= 3) {
    return {
      kind: "expand",
      text: "Please speak a little more. Try to explain in a full sentence.",
    };
  }

  if (wordCount <= 7) {
    return {
      kind: "medium",
      text: "Good. Please add one more sentence.",
    };
  }

  return {
    kind: "enough",
    text: "Very nice.",
  };
}

export default function Day1Page() {
  const [studentName, setStudentName] = useState("Ali");
  const [phase, setPhase] = useState("lesson");
  const [timeLeft, setTimeLeft] = useState(10 * 60);
  const [timerRunning, setTimerRunning] = useState(false);

  const [conversation, setConversation] = useState([]);
  const [currentAiText, setCurrentAiText] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);

  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [lessonSpeaking, setLessonSpeaking] = useState(false);

  const [score, setScore] = useState(null);
  const [showScoreCard, setShowScoreCard] = useState(false);

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const answerBufferRef = useRef("");
  const autoContinueRef = useRef(false);
  const isFinishingRef = useRef(false);
  const awaitingExpansionRef = useRef(false);
  const lessonSpeechQueueRef = useRef([]);

  const personalizedQuestions = useMemo(() => {
    return DAY_1.aiQuestions.map((line) =>
      line.replaceAll("Ali", studentName || "Student")
    );
  }, [studentName]);

  useEffect(() => {
    const SpeechRecognition =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (SpeechRecognition) {
      setRecognitionSupported(true);

      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListening(true);
        answerBufferRef.current = "";
      };

      recognition.onresult = (event) => {
        let finalText = "";
        for (let i = 0; i < event.results.length; i += 1) {
          finalText += event.results[i][0].transcript + " ";
        }
        answerBufferRef.current = finalText.trim();
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);

        if (!autoContinueRef.current || isFinishingRef.current) return;

        const cleaned = answerBufferRef.current.trim();

        if (cleaned) {
          handleStudentAnswer(cleaned);
        } else {
          setTimeout(() => {
            if (!isFinishingRef.current && autoContinueRef.current) {
              startListening();
            }
          }, 500);
        }
      };

      recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => {
    if (!timerRunning) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          finishSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  function speakText(text, onEnd, options = {}) {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      if (onEnd) onEnd();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options.lang || "en-US";
    utterance.rate = options.rate ?? 0.82;
    utterance.pitch = options.pitch ?? 0.95;

    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find(
        (v) =>
          /en-us|en-gb/i.test(v.lang) &&
          /google|microsoft|natural|david|mark|alex|aria|guy|samantha|daniel/i.test(v.name)
      ) ||
      voices.find((v) => /en-us|en-gb/i.test(v.lang)) ||
      voices[0];

    if (preferred) utterance.voice = preferred;

    utterance.onend = () => {
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  }

  function addAiMessage(text, speak = true, afterSpeak) {
    setCurrentAiText(text);
    setConversation((prev) => [...prev, { role: "ai", text }]);

    if (speak) {
      setTimeout(() => {
        speakText(text, afterSpeak);
      }, 200);
    } else if (afterSpeak) {
      afterSpeak();
    }
  }

  function startListening() {
    if (!recognitionRef.current || isListening || isFinishingRef.current) return;

    try {
      answerBufferRef.current = "";
      recognitionRef.current.start();
    } catch {}
  }

  function stopListening() {
    try {
      recognitionRef.current?.stop();
    } catch {}
  }

  function playLessonLines(lines, index = 0) {
    if (index >= lines.length) {
      setLessonSpeaking(false);
      return;
    }

    setLessonSpeaking(true);
    setCurrentAiText(lines[index]);

    speakText(
      lines[index],
      () => {
        setTimeout(() => {
          playLessonLines(lines, index + 1);
        }, 250);
      },
      { rate: 0.8, pitch: 0.95 }
    );
  }

  function listenLesson() {
    const lessonLines = [
      ...DAY_1.lessonIntro,
      ...DAY_1.partsOfSpeech,
      DAY_1.closingLesson,
    ];
    lessonSpeechQueueRef.current = lessonLines;
    playLessonLines(lessonLines, 0);
  }

  function stopLessonVoice() {
    window.speechSynthesis?.cancel?.();
    setLessonSpeaking(false);
    setCurrentAiText("");
  }

  function startPractice() {
    stopLessonVoice();
    setPhase("speaking");
    setTimeLeft(10 * 60);
    setTimerRunning(true);
    setConversation([]);
    setCurrentAiText("");
    setCurrentQuestionIndex(-1);
    setSessionStarted(true);
    autoContinueRef.current = false;
    isFinishingRef.current = false;
    awaitingExpansionRef.current = false;

    setTimeout(() => {
      addAiMessage(personalizedQuestions[0], true, () => {
        setTimeout(() => {
          addAiMessage(personalizedQuestions[1], true, () => {
            setTimeout(() => {
              addAiMessage(personalizedQuestions[2], true, () => {
                autoContinueRef.current = true;
                setCurrentQuestionIndex(2);
                startListening();
              });
            }, 400);
          });
        }, 400);
      });
    }, 300);
  }

  function askNextQuestion() {
    if (isFinishingRef.current) return;

    setCurrentQuestionIndex((prev) => {
      const nextIndex = prev + 1;

      if (nextIndex >= personalizedQuestions.length) {
        finishSession();
        return prev;
      }

      addAiMessage(personalizedQuestions[nextIndex], true, () => {
        if (!isFinishingRef.current) {
          setTimeout(() => {
            startListening();
          }, 500);
        }
      });

      return nextIndex;
    });
  }

  function handleStudentAnswer(answerText) {
    if (isFinishingRef.current) return;

    setConversation((prev) => [...prev, { role: "student", text: answerText }]);

    const correction = getCorrection(answerText, currentQuestionIndex);

    if (correction) {
      awaitingExpansionRef.current = false;
      setTimeout(() => {
        addAiMessage(correction, true, () => {
          setTimeout(() => {
            askNextQuestion();
          }, 450);
        });
      }, 250);
      return;
    }

    const responseCheck = getPraiseOrPrompt(answerText);

    if (responseCheck.kind === "expand" || responseCheck.kind === "medium") {
      awaitingExpansionRef.current = true;
      setTimeout(() => {
        addAiMessage(responseCheck.text, true, () => {
          setTimeout(() => {
            startListening();
          }, 450);
        });
      }, 250);
      return;
    }

    awaitingExpansionRef.current = false;
    setTimeout(() => {
      addAiMessage(responseCheck.text, true, () => {
        setTimeout(() => {
          askNextQuestion();
        }, 450);
      });
    }, 250);
  }

  function finishSession() {
    if (isFinishingRef.current) return;
    isFinishingRef.current = true;

    clearInterval(timerRef.current);
    setTimerRunning(false);
    autoContinueRef.current = false;

    stopListening();
    window.speechSynthesis?.cancel?.();

    const answerCount = conversation.filter((item) => item.role === "student").length;
    const elapsedSeconds = 10 * 60 - timeLeft;
    const finalScore = getSimpleScore(answerCount, elapsedSeconds);

    const closing = `Great job today, ${studentName || "student"}. Keep practicing daily.`;

    setConversation((prev) => [...prev, { role: "ai", text: closing }]);
    setCurrentAiText(closing);
    speakText(closing);

    setPhase("finished");
    setScore(finalScore);
    setShowScoreCard(true);
  }

  function restartSession() {
    clearInterval(timerRef.current);
    autoContinueRef.current = false;
    isFinishingRef.current = false;
    awaitingExpansionRef.current = false;

    stopListening();
    window.speechSynthesis?.cancel?.();

    setPhase("lesson");
    setTimeLeft(10 * 60);
    setTimerRunning(false);
    setConversation([]);
    setCurrentAiText("");
    setCurrentQuestionIndex(-1);
    setScore(null);
    setShowScoreCard(false);
    setIsListening(false);
    setSessionStarted(false);
    setLessonSpeaking(false);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
          <p className="text-sm text-slate-300">AminSirAI • Simple MVP</p>
          <h1 className="mt-2 text-2xl font-bold">{DAY_1.shortTitle}</h1>
          <p className="mt-2 text-slate-300">{DAY_1.title}</p>

          <div className="mt-4 max-w-sm">
            <label className="mb-2 block text-sm text-slate-300">Student Name</label>
            <input
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none"
              placeholder="Enter student name"
            />
          </div>
        </div>

        {phase === "lesson" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-xl lg:col-span-2">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={listenLesson}
                  disabled={lessonSpeaking}
                  className="rounded-2xl bg-white px-4 py-3 font-semibold text-slate-950 disabled:opacity-50"
                >
                  {lessonSpeaking ? "Playing Lesson..." : "Listen Lesson"}
                </button>

                <button
                  onClick={stopLessonVoice}
                  className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 font-semibold"
                >
                  Stop Lesson Voice
                </button>
              </div>

              <h2 className="mt-5 text-xl font-semibold">Talking E-book Lesson</h2>

              <div className="mt-5 space-y-4 text-[16px] leading-8 text-slate-200">
                {DAY_1.lessonIntro.map((line, index) => (
                  <p key={index}>{line}</p>
                ))}

                <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4">
                  <h3 className="mb-3 text-lg font-semibold">9 Materials of English</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {DAY_1.partsOfSpeech.map((item) => (
                      <div
                        key={item}
                        className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-slate-200"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <p>{DAY_1.closingLesson}</p>
              </div>
            </section>

            <aside className="space-y-6">
              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
                <h3 className="text-lg font-semibold">Reading Paragraph</h3>
                <div className="mt-4 space-y-3 leading-7 text-slate-200">
                  {DAY_1.paragraph.map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-indigo-700 bg-indigo-950/30 p-5 shadow-xl">
                <h3 className="text-lg font-semibold">Today's Speaking Practice</h3>
                <p className="mt-3 text-slate-300">
                  Read and speak these sentences first:
                </p>

                <div className="mt-4 space-y-3 text-slate-100">
                  {DAY_1.guidedSpeakingLines.map((line) => (
                    <div
                      key={line}
                      className="rounded-2xl border border-indigo-800 bg-slate-950 px-4 py-3"
                    >
                      {line}
                    </div>
                  ))}
                </div>

                <button
                  onClick={startPractice}
                  className="mt-6 w-full rounded-2xl bg-white px-4 py-3 font-semibold text-slate-950 transition hover:opacity-90"
                >
                  Practice with AminSirAI
                </button>
              </div>
            </aside>
          </div>
        )}

        {(phase === "speaking" || phase === "finished") && (
          <div className="grid gap-6 lg:grid-cols-3">
            <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-xl lg:col-span-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-400">Practice with AminSirAI</p>
                  <h2 className="text-xl font-semibold">{DAY_1.title}</h2>
                </div>

                <div className="rounded-2xl border border-emerald-700 bg-emerald-950/40 px-4 py-3">
                  <p className="text-sm text-emerald-300">
                    {phase === "speaking" ? "Session Timer" : "Session Complete"}
                  </p>
                  <p className="text-2xl font-bold">
                    {phase === "speaking" ? formatTime(timeLeft) : "Done"}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-sm uppercase tracking-wide text-slate-400">Current AI Voice</p>
                <p className="mt-2 text-lg leading-8 text-white">{currentAiText}</p>
              </div>

              <div className="mt-6 max-h-[420px] space-y-3 overflow-y-auto pr-1">
                {conversation.map((item, index) => (
                  <div
                    key={`${item.role}-${index}`}
                    className={`rounded-2xl px-4 py-3 ${
                      item.role === "ai"
                        ? "border border-slate-700 bg-slate-950"
                        : "border border-indigo-700 bg-indigo-950/30"
                    }`}
                  >
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      {item.role === "ai" ? "AminSirAI" : studentName || "Student"}
                    </p>
                    <p className="mt-1 leading-7 text-slate-100">{item.text}</p>
                  </div>
                ))}
              </div>
            </section>

            <aside className="space-y-6">
              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
                <h3 className="text-lg font-semibold">Speak These First</h3>
                <div className="mt-4 space-y-3 text-slate-100">
                  {DAY_1.guidedSpeakingLines.map((line) => (
                    <div
                      key={line}
                      className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3"
                    >
                      {line}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
                <h3 className="text-lg font-semibold">Live Conversation</h3>
                <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-slate-300">
                    {isListening
                      ? "Listening... please complete your answer."
                      : sessionStarted && phase === "speaking"
                      ? "AminSirAI is speaking or preparing next response..."
                      : "Session not started yet."}
                  </p>
                </div>

                <div className="mt-4 grid gap-3">
                  <button
                    onClick={startListening}
                    disabled={!recognitionSupported || isListening || phase === "finished"}
                    className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 font-medium disabled:opacity-50"
                  >
                    {isListening
                      ? "Listening..."
                      : recognitionSupported
                      ? "Speak Now"
                      : "Voice input not supported"}
                  </button>

                  <button
                    onClick={finishSession}
                    className="rounded-2xl border border-red-700 bg-red-950/30 px-4 py-3 font-medium"
                  >
                    End Session
                  </button>
                </div>
              </div>
            </aside>
          </div>
        )}

        {showScoreCard && score && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
              <h2 className="text-2xl font-bold">Session Complete</h2>
              <p className="mt-2 text-slate-300">Great job, {studentName || "student"}.</p>

              <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-sm uppercase tracking-wide text-slate-400">Overall Score</p>
                <p className="mt-2 text-4xl font-bold">{score.overall}/100</p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-slate-400">Speaking</p>
                  <p className="mt-1 text-2xl font-semibold">{score.speaking}/10</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-slate-400">Grammar</p>
                  <p className="mt-1 text-2xl font-semibold">{score.grammar}/10</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-slate-400">Vocabulary</p>
                  <p className="mt-1 text-2xl font-semibold">{score.vocabulary}/10</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-slate-400">Confidence</p>
                  <p className="mt-1 text-2xl font-semibold">{score.confidence}/10</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-indigo-700 bg-indigo-950/30 p-4">
                <p className="text-sm uppercase tracking-wide text-indigo-300">
                  Advanced Word of the Day
                </p>
                <p className="mt-2 text-2xl font-bold">{DAY_1.wordOfTheDay.word}</p>
                <p className="mt-2 text-slate-200">{DAY_1.wordOfTheDay.meaning}</p>
                <p className="mt-2 text-slate-300">
                  Example: {DAY_1.wordOfTheDay.example}
                </p>
              </div>

              <div className="mt-5 rounded-2xl border border-emerald-700 bg-emerald-950/20 p-4">
                <p className="font-semibold">Improvement Tip</p>
                <p className="mt-2 text-slate-200">
                  Try to answer in full sentences and explain ideas clearly in your own words.
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={restartSession}
                  className="flex-1 rounded-2xl bg-white px-4 py-3 font-semibold text-slate-950"
                >
                  Restart Day-1
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