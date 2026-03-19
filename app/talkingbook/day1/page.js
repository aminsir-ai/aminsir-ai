"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";

export default function AminSirDay1TalkingBook() {
  const pages = useMemo(
    () => [
      {
        id: "noun-1",
        lesson: "Day 1 - Noun",
        title: "Welcome + Course Purpose",
        emoji: "🎉",
        lines: [
          "Hey students! How are you all? Kaise ho aap sab? I hope aap sab ekdum mast honge!",
          "Sabse pehle congratulations! Aapne ek bahut powerful decision liya hai - Interactive Talking E-book + Amin Sir AI Tutor choose karke.",
          "Yeh course sirf English padhne ke liye nahi hai. Yeh course hai English bolne ke liye.",
          "Yahan hum simple English seekhenge, roz bolne ki practice karenge, aur confident speaker banenge.",
          "Learning system simple hai: Step 1 Read plus Listen. Step 2 Repeat. Step 3 Practice with AI.",
          "Agar aap roz 10 to 15 minute practice karoge, toh English aapko easy lagne lagegi.",
          "Aaj ka topic hai Noun. No tension. English is a piece of cake for me!",
        ],
        coachNote: "Read slowly. Smile. Feel confident.",
        affirmation: "English is a piece of cake for me!",
      },
      {
        id: "noun-2",
        lesson: "Day 1 - Noun",
        title: "What is a Noun?",
        emoji: "🧠",
        lines: [
          "Ek simple question: Kya duniya mein koi aisi cheez hai jiska naam nahi hota?",
          "Nahi na? Har cheez ka naam hota hai.",
          "Jiska bhi naam hota hai, wahi noun hota hai.",
          "Person ka name - Ali.",
          "Place ka name - Pune.",
          "Thing ka name - Mobile.",
          "Simple formula: Noun means name.",
        ],
        coachNote: "Say the examples loudly: Ali, Pune, Mobile.",
        affirmation: "I understand noun easily.",
      },
      {
        id: "noun-3",
        lesson: "Day 1 - Noun",
        title: "Noun Examples",
        emoji: "📘",
        lines: [
          "Ali is my friend.",
          "I live in Pune.",
          "This is my mobile.",
          "The book is on the table.",
          "My school is big.",
          "Smart note: Name equals Noun.",
          "Ab aap bhi nouns pehchano and bolo loudly.",
        ],
        coachNote: "Pause after each sentence and repeat once.",
        affirmation: "I can find nouns.",
      },
      {
        id: "noun-4",
        lesson: "Day 1 - Noun",
        title: "Noun Practice",
        emoji: "🎤",
        lines: [
          "My name is Ali.",
          "I live in Mumbai.",
          "This is my house.",
          "I have a bike.",
          "My father is a driver.",
          "My mother is at home.",
          "This is my bag.",
          "I have a mobile.",
          "Task: Apne ghar ke 10 nouns socho aur unpe sentence banao.",
        ],
        coachNote: "After listening, speak your own 3 noun sentences.",
        affirmation: "I can make noun sentences.",
      },
      {
        id: "pronoun-1",
        lesson: "Day 1 - Pronoun",
        title: "Pronoun Introduction",
        emoji: "✨",
        lines: [
          "Welcome back, my dear students! I hope aap sab ekdum jhakas honge!",
          "Aapka confidence improve ho raha hai. I am proud of you, my champions.",
          "Aaj ka topic hai Pronoun.",
          "No tension. This is also easy.",
          "Aur yaad rakho: Yes, I can do it!",
        ],
        coachNote: "Say the affirmation with energy.",
        affirmation: "Yes, I can do it!",
      },
      {
        id: "pronoun-2",
        lesson: "Day 1 - Pronoun",
        title: "Why do we need Pronouns?",
        emoji: "🤔",
        lines: [
          "Ahmed is my friend. Ahmed is good. Ahmed likes mango.",
          "Batao, baar baar Ahmed bolna acha lagta hai? No. It sounds boring.",
          "So we say: Ahmed is my friend. He is good. He likes mango.",
          "Now it sounds better, right?",
          "That is the magic of pronoun.",
        ],
        coachNote: "Read both versions and notice the difference.",
        affirmation: "I can use pronouns smartly.",
      },
      {
        id: "pronoun-3",
        lesson: "Day 1 - Pronoun",
        title: "What is a Pronoun?",
        emoji: "💡",
        lines: [
          "Noun ki jagah jo words use hote hain, unko kehte hain pronoun.",
          "He - boy ke liye.",
          "She - girl ke liye.",
          "It - thing ke liye.",
          "They - many people ke liye.",
          "We - hum sab ke liye.",
          "I - main.",
        ],
        coachNote: "Repeat: He, She, It, They, We, I.",
        affirmation: "Yes, I can do it!",
      },
      {
        id: "pronoun-4",
        lesson: "Day 1 - Pronoun",
        title: "Pronoun Examples + Practice",
        emoji: "🚀",
        lines: [
          "Ahmed is my friend. He is good.",
          "Sara is my sister. She is kind.",
          "This is my phone. It is new.",
          "My friends are here. They are happy.",
          "We are learning English.",
          "Task: Replace nouns with pronouns and speak 5 sentences.",
          "Final line: Yes, I can do it! English is a piece of cake for me!",
        ],
        coachNote: "After listening, create your own 5 pronoun sentences.",
        affirmation: "Yes, I can do it!",
      },
    ],
    []
  );

  const [pageIndex, setPageIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [voices, setVoices] = useState([]);
  const utteranceRef = useRef(null);

  const currentPage = pages[pageIndex];
  const progress = Math.round(((pageIndex + 1) / pages.length) * 100);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis?.getVoices?.() || [];
      setVoices(availableVoices);

      if (!selectedVoice && availableVoices.length > 0) {
        const englishVoice =
          availableVoices.find(
            (voice) =>
              /en/i.test(voice.lang) &&
              /female|zira|aria|samantha|google/i.test(voice.name)
          ) ||
          availableVoices.find((voice) => /en/i.test(voice.lang)) ||
          availableVoices[0];

        if (englishVoice) {
          setSelectedVoice(englishVoice.name);
        }
      }
    };

    loadVoices();

    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [selectedVoice]);

  const fullText = useMemo(() => {
    return `${currentPage.lesson}. ${currentPage.title}. ${currentPage.lines.join(
      " "
    )} Coach note: ${currentPage.coachNote}. Affirmation: ${
      currentPage.affirmation
    }`;
  }, [currentPage]);

  const stopSpeech = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    utteranceRef.current = null;
    setIsSpeaking(false);
  };

  const speakText = () => {
    if (!window.speechSynthesis) return;

    stopSpeech();

    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.rate = 0.88;
    utterance.pitch = 1;
    utterance.volume = 1;

    const chosenVoice = voices.find((voice) => voice.name === selectedVoice);
    if (chosenVoice) {
      utterance.voice = chosenVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const nextPage = () => {
    stopSpeech();
    setPageIndex((prev) => Math.min(prev + 1, pages.length - 1));
  };

  const prevPage = () => {
    stopSpeech();
    setPageIndex((prev) => Math.max(prev - 1, 0));
  };

const goToPractice = () => {
  const lesson = encodeURIComponent(currentPage.lesson);
  const title = encodeURIComponent(currentPage.title);
  window.location.href = `/chat?mode=ebook&lesson=${lesson}&title=${title}`;
};
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #fdf4ff 0%, #ffffff 50%, #ecfeff 100%)",
        padding: "16px",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div
          style={{
            borderRadius: "28px",
            padding: "24px",
            color: "white",
            background: "linear-gradient(90deg, #0f172a 0%, #581c87 50%, #0f172a 100%)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "20px",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-block",
                  padding: "8px 14px",
                  borderRadius: "999px",
                  background: "rgba(255,255,255,0.12)",
                  fontSize: "14px",
                  fontWeight: 700,
                }}
              >
                ✨ Amin Sir Interactive Talking E-book
              </div>
              <h1 style={{ margin: "16px 0 8px", fontSize: "40px", fontWeight: 800 }}>
                Day 1: Noun + Pronoun
              </h1>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.88)", maxWidth: "700px" }}>
                Read, listen, repeat, and build confidence step by step.
              </p>
            </div>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div
                style={{
                  background: "rgba(255,255,255,0.12)",
                  borderRadius: "18px",
                  padding: "14px 18px",
                  minWidth: "110px",
                }}
              >
                <div style={{ fontSize: "12px", opacity: 0.75 }}>Pages</div>
                <div style={{ fontSize: "28px", fontWeight: 800 }}>{pages.length}</div>
              </div>
              <div
                style={{
                  background: "rgba(255,255,255,0.12)",
                  borderRadius: "18px",
                  padding: "14px 18px",
                  minWidth: "110px",
                }}
              >
                <div style={{ fontSize: "12px", opacity: 0.75 }}>Progress</div>
                <div style={{ fontSize: "28px", fontWeight: 800 }}>{progress}%</div>
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: "18px",
              height: "10px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.18)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                borderRadius: "999px",
                background: "linear-gradient(90deg, #d946ef 0%, #22d3ee 100%)",
              }}
            />
          </div>
        </div>

        <div
          style={{
            marginTop: "24px",
            display: "grid",
            gridTemplateColumns: "300px 1fr",
            gap: "24px",
          }}
        >
          <aside
            style={{
              background: "rgba(255,255,255,0.88)",
              border: "1px solid rgba(255,255,255,0.8)",
              borderRadius: "28px",
              padding: "16px",
              boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
            }}
          >
            <h2 style={{ marginTop: 0, color: "#111827" }}>📘 Lesson Pages</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {pages.map((page, index) => (
                <button
                  key={page.id}
                  onClick={() => {
                    stopSpeech();
                    setPageIndex(index);
                  }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    border: "none",
                    borderRadius: "18px",
                    padding: "14px",
                    cursor: "pointer",
                    background:
                      index === pageIndex
                        ? "linear-gradient(90deg, #c026d3 0%, #7c3aed 100%)"
                        : "#f1f5f9",
                    color: index === pageIndex ? "white" : "#1f2937",
                    boxShadow:
                      index === pageIndex
                        ? "0 8px 20px rgba(124,58,237,0.25)"
                        : "none",
                  }}
                >
                  <div style={{ fontSize: "12px", fontWeight: 700, opacity: 0.85 }}>
                    {page.lesson}
                  </div>
                  <div style={{ marginTop: "4px", fontWeight: 700 }}>{page.title}</div>
                </button>
              ))}
            </div>
          </aside>

          <main
            style={{
              background: "rgba(255,255,255,0.92)",
              border: "1px solid rgba(255,255,255,0.8)",
              borderRadius: "28px",
              padding: "20px",
              boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 260px",
                gap: "16px",
                alignItems: "start",
              }}
            >
              <div>
                <div
                  style={{
                    display: "inline-block",
                    padding: "8px 14px",
                    borderRadius: "999px",
                    background: "#fae8ff",
                    color: "#a21caf",
                    fontSize: "14px",
                    fontWeight: 700,
                  }}
                >
                  🪄 {currentPage.lesson}
                </div>

                <h2 style={{ margin: "16px 0 0", fontSize: "36px", color: "#0f172a" }}>
                  <span style={{ marginRight: "10px" }}>{currentPage.emoji}</span>
                  {currentPage.title}
                </h2>
              </div>

              <div
                style={{
                  borderRadius: "24px",
                  padding: "16px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                }}
              >
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#334155",
                  }}
                >
                  🎙 Choose Voice
                </label>

                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  style={{
                    width: "100%",
                    borderRadius: "16px",
                    border: "1px solid #cbd5e1",
                    background: "white",
                    padding: "12px 14px",
                  }}
                >
                  {voices.map((voice) => (
                    <option key={`${voice.name}-${voice.lang}`} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>

                <p style={{ marginTop: "8px", fontSize: "12px", color: "#64748b" }}>
                  Browser voice is used only for prototype testing.
                </p>
              </div>
            </div>

            <div
              style={{
                marginTop: "24px",
                borderRadius: "28px",
                background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
                padding: "20px",
                border: "1px solid #e2e8f0",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {currentPage.lines.map((line, idx) => (
                  <div
                    key={idx}
                    style={{
                      borderRadius: "18px",
                      background: "white",
                      padding: "16px",
                      border: "1px solid #f1f5f9",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        color: "#1e293b",
                        fontSize: "18px",
                        lineHeight: 1.8,
                      }}
                    >
                      {line}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                marginTop: "24px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <div
                style={{
                  borderRadius: "24px",
                  padding: "20px",
                  background: "linear-gradient(135deg, #fffbeb 0%, #fff7ed 100%)",
                  border: "1px solid #fcd34d",
                }}
              >
                <div style={{ color: "#b45309", fontWeight: 800, fontSize: "14px" }}>
                  🏆 COACH NOTE
                </div>
                <p style={{ marginTop: "12px", color: "#1f2937", fontSize: "18px" }}>
                  {currentPage.coachNote}
                </p>
              </div>

              <div
                style={{
                  borderRadius: "24px",
                  padding: "20px",
                  background: "linear-gradient(135deg, #ecfdf5 0%, #ecfeff 100%)",
                  border: "1px solid #86efac",
                }}
              >
                <div style={{ color: "#047857", fontWeight: 800, fontSize: "14px" }}>
                  ✨ AFFIRMATION
                </div>
                <p
                  style={{
                    marginTop: "12px",
                    color: "#0f172a",
                    fontSize: "18px",
                    fontWeight: 800,
                  }}
                >
                  {currentPage.affirmation}
                </p>
              </div>
            </div>

            <div
              style={{
                marginTop: "24px",
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "12px",
              }}
            >
              <button
                onClick={speakText}
                style={{
                  border: "none",
                  borderRadius: "18px",
                  padding: "16px",
                  fontWeight: 800,
                  color: "white",
                  cursor: "pointer",
                  background: "linear-gradient(90deg, #d946ef 0%, #9333ea 100%)",
                  boxShadow: "0 10px 20px rgba(147,51,234,0.2)",
                }}
              >
                🔊 {isSpeaking ? "Speaking..." : "Play Talking Audio"}
              </button>

              <button
                onClick={stopSpeech}
                style={{
                  border: "none",
                  borderRadius: "18px",
                  padding: "16px",
                  fontWeight: 800,
                  color: "#0f172a",
                  cursor: "pointer",
                  background: "#e2e8f0",
                }}
              >
                ⏹ Stop Audio
              </button>

              <button
                onClick={prevPage}
                disabled={pageIndex === 0}
                style={{
                  borderRadius: "18px",
                  padding: "16px",
                  fontWeight: 800,
                  color: "#0f172a",
                  background: "white",
                  border: "1px solid #cbd5e1",
                  cursor: pageIndex === 0 ? "not-allowed" : "pointer",
                  opacity: pageIndex === 0 ? 0.4 : 1,
                }}
              >
                ← Previous
              </button>

              <button
                onClick={nextPage}
                disabled={pageIndex === pages.length - 1}
                style={{
                  borderRadius: "18px",
                  padding: "16px",
                  fontWeight: 800,
                  color: "#0f172a",
                  background: "white",
                  border: "1px solid #cbd5e1",
                  cursor: pageIndex === pages.length - 1 ? "not-allowed" : "pointer",
                  opacity: pageIndex === pages.length - 1 ? 0.4 : 1,
                }}
              >
                Next →
              </button>

              <button
                onClick={goToPractice}
                style={{
                  border: "none",
                  borderRadius: "18px",
                  padding: "16px",
                  fontWeight: 800,
                  color: "white",
                  cursor: "pointer",
                  background: "linear-gradient(90deg, #10b981 0%, #14b8a6 100%)",
                  boxShadow: "0 10px 20px rgba(20,184,166,0.2)",
                }}
              >
                Practice with AminSirAI
              </button>
            </div>

            <div
              style={{
                marginTop: "24px",
                borderRadius: "24px",
                padding: "18px",
                border: "1px dashed #d946ef",
                background: "#fdf4ff",
              }}
            >
              <div style={{ color: "#a21caf", fontWeight: 800, fontSize: "14px" }}>
                NEXT INTEGRATION STEP
              </div>
              <p style={{ marginTop: "8px", color: "#334155" }}>
                After Day 1 UI and lesson flow are approved, we will connect this
                page directly with AminSirAI speaking practice.
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

