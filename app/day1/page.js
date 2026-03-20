"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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
};

function getStoredStudentName() {
  if (typeof window === "undefined") return "Student";

  try {
    const rawStudent = localStorage.getItem("student");
    const storedName = localStorage.getItem("studentName");

    if (rawStudent) {
      const parsed = JSON.parse(rawStudent);
      if (parsed?.name) return String(parsed.name).trim();
      if (parsed?.studentName) return String(parsed.studentName).trim();
    }

    if (storedName) return String(storedName).trim();
  } catch {}

  return "Student";
}

export default function Day1Page() {
  const router = useRouter();

  const [studentName, setStudentName] = useState("Student");
  const [lessonSpeaking, setLessonSpeaking] = useState(false);
  const [currentAiText, setCurrentAiText] = useState("");

  const lessonSpeechQueueRef = useRef([]);

  useEffect(() => {
    const name = getStoredStudentName();
    setStudentName(name || "Student");
  }, []);

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
          /en-us|en-gb|en-in/i.test(v.lang) &&
          /google|microsoft|natural|david|mark|alex|aria|guy|samantha|daniel/i.test(v.name)
      ) ||
      voices.find((v) => /en-us|en-gb|en-in/i.test(v.lang)) ||
      voices[0];

    if (preferred) utterance.voice = preferred;

    utterance.onend = () => {
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  }

  function playLessonLines(lines, index = 0) {
    if (index >= lines.length) {
      setLessonSpeaking(false);
      setCurrentAiText("");
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
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setLessonSpeaking(false);
    setCurrentAiText("");
  }

  function goToPractice() {
    router.push("/ebook");
  }

  function goToStudentHome() {
    router.push("/student");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm text-slate-300">AminSirAI • Day 1 E-Book Lesson</p>
              <h1 className="mt-2 text-2xl font-bold">{DAY_1.shortTitle}</h1>
              <p className="mt-2 text-slate-300">{DAY_1.title}</p>
              <p className="mt-3 text-sm text-slate-400">
                Welcome, <span className="font-semibold text-white">{studentName}</span>
              </p>
            </div>

            <button
              onClick={goToStudentHome}
              className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold"
            >
              ← Back to Student Home
            </button>
          </div>
        </div>

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

            {currentAiText ? (
              <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-sm uppercase tracking-wide text-slate-400">
                  Current Lesson Voice
                </p>
                <p className="mt-2 leading-8 text-white">{currentAiText}</p>
              </div>
            ) : null}

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
                Read and understand these sentences first:
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

              <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-950 p-4">
                <p className="text-sm uppercase tracking-wide text-indigo-300">
                  Word of the Day
                </p>
                <p className="mt-2 text-xl font-bold">{DAY_1.wordOfTheDay.word}</p>
                <p className="mt-2 text-slate-200">{DAY_1.wordOfTheDay.meaning}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Example: {DAY_1.wordOfTheDay.example}
                </p>
              </div>

              <button
                onClick={goToPractice}
                className="mt-6 w-full rounded-2xl bg-white px-4 py-3 font-semibold text-slate-950 transition hover:opacity-90"
              >
                Practice with AminSirAI
              </button>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}