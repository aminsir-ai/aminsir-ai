"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const SESSION_TIME = 600;
const TOTAL_TOPICS = 10;
const PATTERNS = ["affirmative", "negative", "question", "exclamatory"];

const WORDS_OF_DAY = [
  { word: "magnificent", meaning: "bahut shandaar" },
  { word: "confident", meaning: "atma-vishwas wala" },
  { word: "brilliant", meaning: "bahut tez / zabardast" },
  { word: "excellent", meaning: "bahut accha / behtareen" },
  { word: "remarkable", meaning: "lajawab / khaas" },
];

const NOUN_ITEMS = [
  {
    type: "noun",
    label: "book",
    affirmative: "This is my book.",
    negative: "This is not my book.",
    question: "Is this your book?",
    exclamatory: "What a beautiful book!",
  },
  {
    type: "noun",
    label: "pen",
    affirmative: "This is my pen.",
    negative: "This is not my pen.",
    question: "Is this your pen?",
    exclamatory: "What a beautiful pen!",
  },
  {
    type: "noun",
    label: "car",
    affirmative: "This is my car.",
    negative: "This is not my car.",
    question: "Is this your car?",
    exclamatory: "What a beautiful car!",
  },
  {
    type: "noun",
    label: "teacher",
    affirmative: "This is my teacher.",
    negative: "This is not my teacher.",
    question: "Is this your teacher?",
    exclamatory: "What a great teacher!",
  },
  {
    type: "noun",
    label: "student",
    affirmative: "This is my student.",
    negative: "This is not my student.",
    question: "Is this your student?",
    exclamatory: "What a smart student!",
  },
];

const PRONOUN_ITEMS = [
  {
    type: "pronoun",
    label: "I",
    affirmative: "I am ready.",
    negative: "I am not ready.",
    question: "Am I ready?",
    exclamatory: "How ready I am!",
  },
  {
    type: "pronoun",
    label: "you",
    affirmative: "You are my friend.",
    negative: "You are not late.",
    question: "Are you my friend?",
    exclamatory: "How kind you are!",
  },
  {
    type: "pronoun",
    label: "he",
    affirmative: "He is my brother.",
    negative: "He is not weak.",
    question: "Is he my brother?",
    exclamatory: "How strong he is!",
  },
  {
    type: "pronoun",
    label: "she",
    affirmative: "She is my sister.",
    negative: "She is not sad.",
    question: "Is she my sister?",
    exclamatory: "How smart she is!",
  },
  {
    type: "pronoun",
    label: "we",
    affirmative: "We are students.",
    negative: "We are not tired.",
    question: "Are we students?",
    exclamatory: "How happy we are!",
  },
];

const LESSON_ITEMS = [...NOUN_ITEMS, ...PRONOUN_ITEMS];
const LESSON_NAME = "Amin Sir AI E-Book Practice";

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text) {
  return normalizeText(text).split(" ").filter(Boolean);
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function exactishMatch(expected, actual) {
  const e = tokenize(expected);
  const a = tokenize(actual);

  if (normalizeText(expected) === normalizeText(actual)) return true;
  if (e.length !== a.length) return false;

  let same = 0;
  for (let i = 0; i < e.length; i += 1) {
    if (e[i] === a[i]) same += 1;
  }

  return same / e.length >= 0.85;
}

function getFeedback(score) {
  if (score >= 9) return "Excellent work!";
  if (score >= 7) return "Very good!";
  if (score >= 5) return "Good effort!";
  return "Keep practicing!";
}

function getTrophy(score) {
  if (score >= 9) return "🏆";
  if (score >= 7) return "🥇";
  if (score >= 5) return "🥈";
  return "🥉";
}

function getEmoji(score) {
  if (score >= 9) return "😄";
  if (score >= 7) return "🙂";
  if (score >= 5) return "😊";
  return "😌";
}

function getPatternLabel(pattern) {
  if (pattern === "affirmative") return "Affirmative";
  if (pattern === "negative") return "Negative";
  if (pattern === "question") return "Question";
  if (pattern === "exclamatory") return "Exclamatory";
  return "";
}

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef(null);
  const topicIndexRef = useRef(0);
  const patternIndexRef = useRef(0);
  const wrongCountRef = useRef(0);
  const finishedRef = useRef(false);
  const voicesRef = useRef([]);
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);

  const studentName = useMemo(() => {
    const fromQuery =
      searchParams.get("studentName") ||
      searchParams.get("student") ||
      searchParams.get("name");

    if (fromQuery?.trim()) return fromQuery.trim();

    if (typeof window !== "undefined") {
      try {
        const rawStudent = localStorage.getItem("student");
        const storedName = localStorage.getItem("studentName");

        if (rawStudent) {
          const parsed = JSON.parse(rawStudent);
          if (parsed?.name) return String(parsed.name).trim();
        }

        if (storedName) return String(storedName).trim();
      } catch {}
    }

    return "Student";
  }, [searchParams]);

  const studentId = useMemo(() => {
    const fromQuery =
      searchParams.get("studentId") ||
      searchParams.get("id");

    if (fromQuery?.trim()) return fromQuery.trim();

    if (typeof window !== "undefined") {
      try {
        const rawStudent = localStorage.getItem("student");
        const storedId = localStorage.getItem("studentId");

        if (rawStudent) {
          const parsed = JSON.parse(rawStudent);
          if (parsed?.id) return String(parsed.id).trim();
          if (parsed?.studentId) return String(parsed.studentId).trim();
        }

        if (storedId) return String(storedId).trim();
      } catch {}
    }

    return studentName.trim().toLowerCase().replace(/\s+/g, "_");
  }, [searchParams, studentName]);

  const [started, setStarted] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [timeLeft, setTimeLeft] = useState(SESSION_TIME);
  const [messages, setMessages] = useState([]);
  const [showScore, setShowScore] = useState(false);
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState("Ready");
  const [wordOfDay, setWordOfDay] = useState({ word: "", meaning: "" });
  const [saveStatus, setSaveStatus] = useState("idle");

  const [topicIndex, setTopicIndex] = useState(0);
  const [patternIndex, setPatternIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [currentTopicName, setCurrentTopicName] = useState("");
  const [currentTopicType, setCurrentTopicType] = useState("");
  const [lastResult, setLastResult] = useState("");
  const [voiceReady, setVoiceReady] = useState(false);
  const [speechReady, setSpeechReady] = useState(false);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const selected =
      WORDS_OF_DAY[Math.floor(Math.random() * WORDS_OF_DAY.length)];
    setWordOfDay(selected);
  }, []);

  useEffect(() => {
    if (!started || sessionEnded) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          stopSession(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [started, sessionEnded]);

  useEffect(() => {
    if (started && !sessionEnded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [started, sessionEnded, topicIndex, patternIndex, lastResult, answer]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    function loadVoices() {
      voicesRef.current = window.speechSynthesis.getVoices() || [];
      setVoiceReady(true);
    }

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechReady(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isListeningRef.current = true;
      setIsListening(true);
      setStatus("Listening...");
    };

    recognition.onend = () => {
      isListeningRef.current = false;
      setIsListening(false);
      if (started && !sessionEnded) {
        setStatus("Waiting for answer");
      }
    };

    recognition.onerror = () => {
      isListeningRef.current = false;
      setIsListening(false);
      if (started && !sessionEnded) {
        setStatus("Speech error");
      }
    };

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0]?.transcript || "";
        if (event.results[i].isFinal) {
          finalText += transcript + " ";
        } else {
          interimText += transcript + " ";
        }
      }

      const merged = `${finalText} ${interimText}`.trim();
      if (merged) {
        setAnswer(merged);
      }
    };

    recognitionRef.current = recognition;
    setSpeechReady(true);

    return () => {
      try {
        recognition.stop();
      } catch {}
    };
  }, [started, sessionEnded]);

  async function saveChatProgress({
    studentId,
    studentName,
    lessonName,
    score,
    totalTopics,
    timeSpentSeconds,
  }) {
    try {
      const response = await fetch("/api/student/save-chat-progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId,
          studentName,
          lessonName,
          score,
          totalTopics,
          timeSpentSeconds,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Failed to save chat progress:", result);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Save chat progress error:", error);
      return false;
    }
  }

  function speakText(text) {
    if (typeof window === "undefined" || !window.speechSynthesis || !text) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voices = voicesRef.current || [];
    const preferredVoice =
      voices.find((v) => /en-in/i.test(v.lang)) ||
      voices.find((v) => /en-gb/i.test(v.lang)) ||
      voices.find((v) => /english/i.test(v.name)) ||
      voices[0];

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      if (started && !sessionEnded) {
        setStatus("AI speaking");
      }
    };

    utterance.onend = () => {
      if (started && !sessionEnded && !isListeningRef.current) {
        setStatus("Waiting for answer");
      }
    };

    window.speechSynthesis.speak(utterance);
  }

  function startListening() {
    if (!recognitionRef.current || isListeningRef.current) return;

    try {
      setAnswer("");
      recognitionRef.current.start();
    } catch {}
  }

  function stopListening() {
    if (!recognitionRef.current || !isListeningRef.current) return;

    try {
      recognitionRef.current.stop();
    } catch {}
  }

  function addMessage(role, text) {
    setMessages((prev) => [...prev, { role, text }]);
  }

  function addAiMessage(text, shouldSpeak = true) {
    addMessage("ai", text);
    if (shouldSpeak) {
      speakText(text);
    }
  }

  function getCurrentItem() {
    return LESSON_ITEMS[topicIndexRef.current];
  }

  function getCurrentPattern() {
    return PATTERNS[patternIndexRef.current];
  }

  function getCurrentSentence() {
    const item = getCurrentItem();
    const pattern = getCurrentPattern();
    return item?.[pattern] || "";
  }

  function presentCurrentItem() {
    const item = getCurrentItem();
    const sentence = getCurrentSentence();
    const pattern = getCurrentPattern();

    setTopicIndex(topicIndexRef.current);
    setPatternIndex(patternIndexRef.current);
    setCurrentPrompt(sentence);
    setCurrentTopicName(item.label);
    setCurrentTopicType(item.type);
    setLastResult("");
    setAnswer("");

    if (item.type === "noun") {
      addAiMessage(
        `Aaj ka noun hai ${item.label}. ${getPatternLabel(
          pattern
        )} sentence English mein bolo. ${sentence}`
      );
    } else {
      addAiMessage(
        `Aaj ka pronoun hai ${item.label}. ${getPatternLabel(
          pattern
        )} sentence English mein bolo. ${sentence}`
      );
    }

    setStatus("Waiting for answer");
  }

  function moveToNextItem() {
    const isLastPattern = patternIndexRef.current >= PATTERNS.length - 1;
    const isLastTopic = topicIndexRef.current >= LESSON_ITEMS.length - 1;

    if (isLastPattern) {
      setScore((prev) => Math.min(prev + 1, TOTAL_TOPICS));
    }

    if (isLastPattern && isLastTopic) {
      stopSession(true);
      return;
    }

    if (isLastPattern) {
      topicIndexRef.current += 1;
      patternIndexRef.current = 0;
    } else {
      patternIndexRef.current += 1;
    }

    wrongCountRef.current = 0;
    setAnswer("");
    presentCurrentItem();
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!started || sessionEnded) return;

    const cleanAnswer = answer.trim();
    if (!cleanAnswer) return;

    stopListening();
    addMessage("you", cleanAnswer);

    const expected = getCurrentSentence();
    const correct = exactishMatch(expected, cleanAnswer);

    if (correct) {
      const okText = "Very good. Ab dusra.";
      addMessage("system", okText);
      speakText(okText);
      setStatus("Correct");
      setLastResult("correct");
      moveToNextItem();
      return;
    }

    wrongCountRef.current += 1;

    if (wrongCountRef.current >= 2) {
      const hintText = `Try this way: ${expected}`;
      addMessage("system", hintText);
      speakText(hintText);
    } else {
      addMessage("system", "Try again.");
      speakText("Try again.");
    }

    setStatus("Try again");
    setLastResult("wrong");
    setAnswer("");
  }

  function handleHint() {
    if (!started || sessionEnded) return;
    const expected = getCurrentSentence();
    const hintText = `Hint: ${expected}`;
    addMessage("system", hintText);
    speakText(expected);
  }

  function handleReplay() {
    if (!currentPrompt) return;
    speakText(currentPrompt);
  }

  function startSession() {
    topicIndexRef.current = 0;
    patternIndexRef.current = 0;
    wrongCountRef.current = 0;
    finishedRef.current = false;

    setMessages([]);
    setScore(0);
    setTimeLeft(SESSION_TIME);
    setTopicIndex(0);
    setPatternIndex(0);
    setAnswer("");
    setCurrentPrompt("");
    setCurrentTopicName("");
    setCurrentTopicType("");
    setLastResult("");
    setShowScore(false);
    setSessionEnded(false);
    setStarted(true);
    setStatus("Lesson started");
    setSaveStatus("idle");

    const welcomeText = `Welcome, ${studentName}. Aaj hamara lesson Noun aur Pronoun hai. Main aapko word dunga. Aapko English mein bolna hai. Speech box mein aapka jawab aa jayega. Sahi hua to very good. Galat hua to try again. Do baar galat hua to main sentence sikhaunga.`;
    addAiMessage(welcomeText);

    setTimeout(() => {
      presentCurrentItem();
    }, 400);
  }

  async function stopSession(showPopup = true) {
    if (finishedRef.current) return;
    finishedRef.current = true;

    stopListening();
    setStarted(false);
    setSessionEnded(true);
    setStatus("Session ended");
    setCurrentPrompt("");
    addAiMessage("Excellent work. Keep practicing.");

    const timeSpentSeconds = Math.max(SESSION_TIME - timeLeft, 0);
    setSaveStatus("saving");

    const saved = await saveChatProgress({
      studentId:
        studentId ||
        studentName.trim().toLowerCase().replace(/\s+/g, "_"),
      studentName: studentName || "Student",
      lessonName: LESSON_NAME,
      score,
      totalTopics: TOTAL_TOPICS,
      timeSpentSeconds,
    });

    setSaveStatus(saved ? "saved" : "error");

    if (showPopup) {
      setShowScore(true);
    }
  }

  function goToProgress() {
    router.push("/student/progress");
  }

  const progressPercent = Math.round((score / TOTAL_TOPICS) * 100);

  return (
    <div
      style={{
        padding: 16,
        fontFamily: "Arial, sans-serif",
        background: "#f6f7fb",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <h2 style={{ margin: 0 }}>Amin Sir AI E-Book Practice</h2>

          <button
            onClick={goToProgress}
            style={{
              padding: "10px 16px",
              border: "none",
              borderRadius: 10,
              background: "#0f172a",
              color: "#fff",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            📊 View Progress
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 14,
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ fontSize: 13, color: "#666" }}>Time Left</div>
            <div style={{ fontSize: 24, fontWeight: "bold" }}>
              ⏱ {formatTime(timeLeft)}
            </div>
          </div>

          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 14,
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ fontSize: 13, color: "#666" }}>Progress</div>
            <div style={{ fontSize: 24, fontWeight: "bold" }}>
              📊 {score} / {TOTAL_TOPICS}
            </div>
          </div>

          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 14,
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ fontSize: 13, color: "#666" }}>Word of the Day</div>
            <div style={{ fontSize: 18, fontWeight: "bold" }}>
              ⭐ {wordOfDay.word}
            </div>
            <div style={{ fontSize: 14, color: "#555" }}>
              {wordOfDay.meaning}
            </div>
          </div>

          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 14,
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ fontSize: 13, color: "#666" }}>Status</div>
            <div style={{ fontSize: 18, fontWeight: "bold" }}>{status}</div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
              Voice: {voiceReady ? "Ready" : "Loading"} | Speech:{" "}
              {speechReady ? "Ready" : "Not supported"}
            </div>
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: 14,
            padding: 16,
            marginBottom: 16,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ marginBottom: 10, fontSize: 14, color: "#666" }}>
            Topic: <b>{currentTopicName || "-"}</b> | Type:{" "}
            <b>{getPatternLabel(PATTERNS[patternIndex]) || "-"}</b> | Category:{" "}
            <b>{currentTopicType || "-"}</b>
          </div>

          <div
            style={{
              width: "100%",
              height: 10,
              background: "#eceef5",
              borderRadius: 999,
              overflow: "hidden",
              marginBottom: 18,
            }}
          >
            <div
              style={{
                width: `${progressPercent}%`,
                height: "100%",
                background: "#222",
                borderRadius: 999,
              }}
            />
          </div>

          <div
            style={{
              border: "2px solid #e5e7ef",
              borderRadius: 16,
              padding: 24,
              textAlign: "center",
              background:
                lastResult === "correct"
                  ? "#ecfff1"
                  : lastResult === "wrong"
                  ? "#fff4f4"
                  : "#fafbff",
            }}
          >
            <div style={{ fontSize: 14, color: "#666", marginBottom: 10 }}>
              Main Practice Sentence
            </div>
            <div
              style={{
                fontSize: 30,
                fontWeight: "bold",
                lineHeight: 1.4,
                color: "#111",
                marginBottom: 18,
              }}
            >
              {currentPrompt || "Click Start Practice to begin"}
            </div>

            <button
              type="button"
              onClick={handleReplay}
              disabled={!currentPrompt}
              style={{
                padding: "10px 16px",
                border: "none",
                borderRadius: 8,
                background: currentPrompt ? "#2b6cb0" : "#aaa",
                color: "#fff",
                cursor: currentPrompt ? "pointer" : "not-allowed",
                fontWeight: "bold",
              }}
            >
              🔊 Replay Sentence
            </button>
          </div>
        </div>

        {!started && !sessionEnded && (
          <button
            onClick={startSession}
            style={{
              marginBottom: 16,
              padding: "12px 22px",
              background: "green",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 16,
              fontWeight: "bold",
            }}
          >
            ▶ Start Practice
          </button>
        )}

        {started && !sessionEnded && (
          <button
            onClick={() => stopSession(true)}
            style={{
              marginBottom: 16,
              padding: "12px 22px",
              background: "#c62828",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 16,
              fontWeight: "bold",
            }}
          >
            ■ Stop Session
          </button>
        )}

        <div
          style={{
            background: "#fff",
            borderRadius: 14,
            padding: 16,
            marginBottom: 16,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ fontSize: 16, fontWeight: "bold", marginBottom: 12 }}>
            Conversation
          </div>

          <div
            style={{
              border: "1px solid #e5e7ef",
              borderRadius: 12,
              minHeight: 220,
              maxHeight: 360,
              overflowY: "auto",
              padding: 12,
              background: "#fafbff",
            }}
          >
            {messages.length === 0 ? (
              <div style={{ color: "#666" }}>Conversation will appear here.</div>
            ) : (
              messages.map((m, i) => (
                <div
                  key={i}
                  style={{
                    marginBottom: 10,
                    padding: 10,
                    borderRadius: 10,
                    background:
                      m.role === "ai"
                        ? "#eef4ff"
                        : m.role === "you"
                        ? "#f3fff2"
                        : "#fff7e8",
                  }}
                >
                  <b>
                    {m.role === "ai"
                      ? "AI"
                      : m.role === "you"
                      ? "You"
                      : "System"}
                    :
                  </b>{" "}
                  {m.text}
                </div>
              ))
            )}
          </div>
        </div>

        {started && !sessionEnded && (
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: 16,
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ marginBottom: 10, fontWeight: "bold" }}>
              Your Answer
            </div>

            <textarea
              ref={inputRef}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Speak or type your English sentence here"
              rows={3}
              style={{
                width: "100%",
                padding: "14px",
                border: "1px solid #d8dce8",
                borderRadius: 10,
                marginBottom: 12,
                fontSize: 16,
                outline: "none",
                resize: "vertical",
              }}
            />

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={startListening}
                disabled={!speechReady || isListening}
                style={{
                  padding: "12px 18px",
                  border: "none",
                  borderRadius: 8,
                  background: !speechReady || isListening ? "#aaa" : "#0f766e",
                  color: "#fff",
                  cursor:
                    !speechReady || isListening ? "not-allowed" : "pointer",
                  fontWeight: "bold",
                }}
              >
                🎤 Start Speaking
              </button>

              <button
                type="button"
                onClick={stopListening}
                disabled={!isListening}
                style={{
                  padding: "12px 18px",
                  border: "none",
                  borderRadius: 8,
                  background: !isListening ? "#aaa" : "#b91c1c",
                  color: "#fff",
                  cursor: !isListening ? "not-allowed" : "pointer",
                  fontWeight: "bold",
                }}
              >
                ⏹ Stop Speaking
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!answer.trim()}
                style={{
                  padding: "12px 18px",
                  border: "none",
                  borderRadius: 8,
                  background: !answer.trim() ? "#aaa" : "#222",
                  color: "#fff",
                  cursor: !answer.trim() ? "not-allowed" : "pointer",
                  fontWeight: "bold",
                }}
              >
                Submit Spoken Answer
              </button>

              <button
                type="button"
                onClick={handleHint}
                style={{
                  padding: "12px 18px",
                  border: "none",
                  borderRadius: 8,
                  background: "#555",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Show Hint
              </button>
            </div>
          </div>
        )}

        {showScore && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.65)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: 20,
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: 14,
                padding: 24,
                width: 340,
                maxWidth: "100%",
                textAlign: "center",
              }}
            >
              <h2 style={{ marginTop: 0 }}>Score Card</h2>
              <div style={{ fontSize: 42, marginBottom: 8 }}>
                {getTrophy(score)}
              </div>
              <div style={{ fontSize: 34, marginBottom: 8 }}>
                {getEmoji(score)}
              </div>
              <div style={{ fontSize: 26, fontWeight: "bold", marginBottom: 8 }}>
                {score} / {TOTAL_TOPICS}
              </div>
              <p style={{ marginBottom: 12 }}>{getFeedback(score)}</p>

              <p style={{ marginBottom: 16, fontSize: 13, color: "#555" }}>
                {saveStatus === "saving" && "Saving progress..."}
                {saveStatus === "saved" && "Progress saved successfully."}
                {saveStatus === "error" && "Progress save failed."}
                {saveStatus === "idle" && ""}
              </p>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexDirection: "column",
                }}
              >
                <button
                  onClick={() => window.location.reload()}
                  style={{
                    padding: "10px 18px",
                    border: "none",
                    borderRadius: 8,
                    background: "#222",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Restart
                </button>

                <button
                  onClick={goToProgress}
                  style={{
                    padding: "10px 18px",
                    border: "none",
                    borderRadius: 8,
                    background: "#1d4ed8",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  📊 View Progress
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}