"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const SESSION_TIME = 600;
const LESSON_NAME = "Amin Sir AI E-Book Practice";

const WORDS_OF_DAY = [
  { word: "magnificent", meaning: "bahut shandaar" },
  { word: "confident", meaning: "atma-vishwas wala" },
  { word: "brilliant", meaning: "bahut tez / zabardast" },
  { word: "excellent", meaning: "bahut accha / behtareen" },
  { word: "remarkable", meaning: "lajawab / khaas" },
];

const SUPPORT_LINES = [
  "English is a language.",
  "English has parts of speech.",
  "A house needs materials.",
  "English also needs structure.",
  "Parts of speech are important in English.",
  "I want to improve my fluency.",
];

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function getFeedback(score) {
  if (score >= 90) return "Excellent work!";
  if (score >= 75) return "Very good!";
  if (score >= 60) return "Good effort!";
  return "Keep practicing!";
}

function getTrophy(score) {
  if (score >= 90) return "🏆";
  if (score >= 75) return "🥇";
  if (score >= 60) return "🥈";
  return "🥉";
}

function getEmoji(score) {
  if (score >= 90) return "😄";
  if (score >= 75) return "🙂";
  if (score >= 60) return "😊";
  return "😌";
}

function getStudentName(searchParams) {
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
}

function getStudentId(searchParams, fallbackName) {
  const fromQuery = searchParams.get("studentId") || searchParams.get("id");

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

  return String(fallbackName || "student")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function getLightCorrection(answer) {
  const text = normalizeText(answer);

  if (!text) return "";

  if (text.includes("english are")) {
    return "Good try. Say: English is a language.";
  }

  if (text.includes("house need materials")) {
    return "Good try. Say: A house needs materials.";
  }

  if (text.includes("english need structure")) {
    return "Good try. Say: English needs structure.";
  }

  if (text.includes("parts of speech is")) {
    return "Good try. Say: Parts of speech are important.";
  }

  return "";
}

function buildReply(answer, stage, studentName) {
  const text = normalizeText(answer);
  const words = text.split(" ").filter(Boolean);
  const wordCount = words.length;

  if (stage === 0) {
    if (
      text.includes("parts of speech") ||
      text.includes("english is a language") ||
      text.includes("house") ||
      text.includes("structure") ||
      text.includes("english")
    ) {
      return "Very good. Do you want to share something more about today's lesson, or do you want to talk about something else?";
    }

    if (wordCount <= 3) {
      return "Good start. Please tell me a little more about what you learned today in the ebook.";
    }

    return "Good. Do you want to share something more about today's lesson, or do you want to talk about something else?";
  }

  if (stage === 1) {
    if (
      text.includes("lesson") ||
      text.includes("today lesson") ||
      text.includes("parts of speech") ||
      text.includes("house") ||
      text.includes("ebook") ||
      text.includes("english")
    ) {
      return "Very nice. Then tell me, what do you understand by parts of speech, and why are they important?";
    }

    if (
      text.includes("something else") ||
      text.includes("other topic") ||
      text.includes("another topic") ||
      text.includes("different topic") ||
      text.includes("talk something else") ||
      text.includes("my hobby") ||
      text.includes("my day") ||
      text.includes("my family") ||
      text.includes("my future")
    ) {
      return "Sure. What would you like to talk about? You can speak about your day, your hobby, your family, your goals, or anything you like.";
    }

    if (wordCount <= 4) {
      return "Please choose one. Do you want to continue about today's lesson, or do you want to talk about something else?";
    }

    return "Good. Please continue in your own way. I am listening.";
  }

  if (
    text.includes("parts of speech") ||
    text.includes("noun") ||
    text.includes("pronoun") ||
    text.includes("verb") ||
    text.includes("house") ||
    text.includes("structure") ||
    text.includes("english")
  ) {
    if (wordCount <= 5) {
      return "Good. Please explain a little more in full sentences.";
    }

    if (text.includes("house")) {
      return "Excellent. Can you explain the house example again in simple words, but with a little more detail?";
    }

    if (text.includes("parts of speech")) {
      return "Very good. Can you name some parts of speech and tell me why they help us make sentences?";
    }

    return "Nice answer. Please continue. What part of today's lesson did you like most?";
  }

  if (
    text.includes("hobby") ||
    text.includes("day") ||
    text.includes("family") ||
    text.includes("future") ||
    text.includes("goal") ||
    text.includes("village") ||
    text.includes("job") ||
    text.includes("school") ||
    text.includes("study")
  ) {
    if (wordCount <= 5) {
      return "Good topic. Please tell me more in two or three full sentences.";
    }

    return "Very nice. Please continue. Why is this important to you?";
  }

  if (text.includes("hello") || text.includes("hi")) {
    return `Hello ${studentName}. Please tell me something more. You can continue about today's lesson, or you can talk about something else.`;
  }

  if (wordCount <= 3) {
    return "Good. Please speak a little more. Try to answer in a full sentence.";
  }

  return "Very good. Please continue. Tell me more.";
}

function getConversationScore(conversation, elapsedSeconds) {
  const studentTurns = conversation.filter((m) => m.role === "you").length;

  const overall = Math.min(
    55 + studentTurns * 6 + (elapsedSeconds >= 180 ? 10 : elapsedSeconds >= 90 ? 6 : 3),
    95
  );

  return {
    overall,
    speaking: studentTurns >= 6 ? 8 : studentTurns >= 4 ? 7 : 6,
    grammar: studentTurns >= 6 ? 8 : studentTurns >= 4 ? 7 : 6,
    vocabulary: studentTurns >= 6 ? 8 : studentTurns >= 4 ? 7 : 6,
    confidence: elapsedSeconds >= 180 ? 8 : 7,
  };
}

export default function EbookPracticePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const voicesRef = useRef([]);
  const timerRef = useRef(null);
  const finishedRef = useRef(false);
  const isListeningRef = useRef(false);
  const isAiSpeakingRef = useRef(false);
  const autoModeRef = useRef(false);
  const processingRef = useRef(false);
  const stageRef = useRef(0);
  const silenceTimerRef = useRef(null);
  const latestAnswerRef = useRef("");

  const studentName = useMemo(() => getStudentName(searchParams), [searchParams]);
  const studentId = useMemo(
    () => getStudentId(searchParams, studentName),
    [searchParams, studentName]
  );

  const [started, setStarted] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [timeLeft, setTimeLeft] = useState(SESSION_TIME);
  const [messages, setMessages] = useState([]);
  const [showScore, setShowScore] = useState(false);
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState("Ready");
  const [wordOfDay, setWordOfDay] = useState({ word: "", meaning: "" });
  const [saveStatus, setSaveStatus] = useState("idle");

  const [answer, setAnswer] = useState("");
  const [currentPrompt, setCurrentPrompt] = useState("");
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

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          stopSession(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [started, sessionEnded]);

  useEffect(() => {
    if (started && !sessionEnded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [started, sessionEnded, answer, lastResult]);

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

    recognition.onresult = (event) => {
      let merged = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        merged += `${event.results[i][0]?.transcript || ""} `;
      }

      const cleaned = merged.trim();

      if (cleaned) {
        latestAnswerRef.current = cleaned;
        setAnswer(cleaned);

        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        silenceTimerRef.current = setTimeout(() => {
          if (
            autoModeRef.current &&
            !processingRef.current &&
            latestAnswerRef.current.trim()
          ) {
            processStudentAnswer(latestAnswerRef.current.trim());
          }
        }, 1800);
      }
    };

    recognition.onend = () => {
      isListeningRef.current = false;
      setIsListening(false);

      if (!started || sessionEnded || finishedRef.current) return;

      setStatus("Waiting for answer");

      if (
        autoModeRef.current &&
        !processingRef.current &&
        !isAiSpeakingRef.current &&
        latestAnswerRef.current.trim()
      ) {
        processStudentAnswer(latestAnswerRef.current.trim());
      }
    };

    recognition.onerror = () => {
      isListeningRef.current = false;
      setIsListening(false);

      if (!started || sessionEnded || finishedRef.current) return;

      setStatus("Speech error");
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

  function speakText(text, onEnd) {
    if (typeof window === "undefined" || !window.speechSynthesis || !text) {
      if (onEnd) onEnd();
      return;
    }

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
      isAiSpeakingRef.current = true;
      if (started && !sessionEnded) {
        setStatus("AI speaking");
      }
    };

    utterance.onend = () => {
      isAiSpeakingRef.current = false;
      if (started && !sessionEnded) {
        setStatus("Waiting for answer");
      }
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  }

  function startListening() {
    if (
      !recognitionRef.current ||
      isListeningRef.current ||
      isAiSpeakingRef.current ||
      finishedRef.current
    ) {
      return;
    }

    try {
      latestAnswerRef.current = "";
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

  function addAiMessage(text, autoListen = false) {
    addMessage("ai", text);
    setCurrentPrompt(text);

    speakText(text, () => {
      if (
        autoListen &&
        autoModeRef.current &&
        !finishedRef.current &&
        !sessionEnded
      ) {
        setTimeout(() => {
          startListening();
        }, 500);
      }
    });
  }

  async function processStudentAnswer(rawAnswer) {
    if (processingRef.current || finishedRef.current) return;

    const cleanAnswer = String(rawAnswer || "").trim();
    if (!cleanAnswer) return;

    processingRef.current = true;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }

    stopListening();

    addMessage("you", cleanAnswer);
    setAnswer("");
    latestAnswerRef.current = "";

    const correction = getLightCorrection(cleanAnswer);

    if (correction) {
      addMessage("system", correction);
      setLastResult("wrong");
      setStatus("Correction");

      setTimeout(() => {
        addAiMessage(correction, true);
        processingRef.current = false;
      }, 250);

      return;
    }

    const studentTurns = messages.filter((m) => m.role === "you").length + 1;

    if (studentTurns >= 10) {
      processingRef.current = false;
      setTimeout(() => {
        stopSession(true);
      }, 300);
      return;
    }

    const aiReply = buildReply(cleanAnswer, stageRef.current, studentName);

    setLastResult("correct");
    setStatus("Good");

    if (stageRef.current < 2) {
      stageRef.current += 1;
    }

    setTimeout(() => {
      addAiMessage(aiReply, true);
      processingRef.current = false;
    }, 250);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!started || sessionEnded) return;
    if (!answer.trim()) return;

    processStudentAnswer(answer.trim());
  }

  function handleReplay() {
    if (!currentPrompt) return;
    speakText(currentPrompt);
  }

  function handleHint() {
    const hintText =
      "You can say: I learned that English is a language and it has parts of speech.";
    addMessage("system", hintText);
    speakText(hintText);
  }

  function startSession() {
    finishedRef.current = false;
    autoModeRef.current = true;
    processingRef.current = false;
    stageRef.current = 0;

    setMessages([]);
    setScore(0);
    setTimeLeft(SESSION_TIME);
    setAnswer("");
    latestAnswerRef.current = "";
    setCurrentPrompt("");
    setLastResult("");
    setShowScore(false);
    setSessionEnded(false);
    setStarted(true);
    setStatus("Lesson started");
    setSaveStatus("idle");

    const openingText = `Welcome, ${studentName}. What did you learn today in the ebook?`;

    setTimeout(() => {
      addAiMessage(openingText, true);
    }, 250);
  }

  async function stopSession(showPopup = true) {
    if (finishedRef.current) return;
    finishedRef.current = true;
    autoModeRef.current = false;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }

    stopListening();
    setStarted(false);
    setSessionEnded(true);
    setStatus("Session ended");
    setCurrentPrompt("");

    const elapsedSeconds = Math.max(SESSION_TIME - timeLeft, 0);
    const conversationForScore = [...messages];
    const finalScoreObj = getConversationScore(conversationForScore, elapsedSeconds);

    setScore(finalScoreObj.overall);
    setSaveStatus("saving");

    const closingText = `Very good, ${studentName}. You spoke well today. Keep practicing every day.`;
    addMessage("ai", closingText);
    speakText(closingText);

    const saved = await saveChatProgress({
      studentId:
        studentId || studentName.trim().toLowerCase().replace(/\s+/g, "_"),
      studentName: studentName || "Student",
      lessonName: LESSON_NAME,
      score: finalScoreObj.overall,
      totalTopics: 10,
      timeSpentSeconds: elapsedSeconds,
    });

    setSaveStatus(saved ? "saved" : "error");

    if (showPopup) {
      setShowScore(true);
    }
  }

  function goToProgress() {
    router.push("/student/progress");
  }

  function restartPage() {
    window.location.reload();
  }

  const studentTurns = messages.filter((m) => m.role === "you").length;
  const progressPercent = Math.min(Math.round((studentTurns / 10) * 100), 100);

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
              📊 {studentTurns} / 10
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
            Topic: <b>Day 1 Ebook Recall</b> | Type: <b>Student-led Conversation</b> | Category:{" "}
            <b>Fluency Practice</b>
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
              Current AI Prompt
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
              🔊 Replay Prompt
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
            Day 1 Support Sentences
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {SUPPORT_LINES.map((line) => (
              <div
                key={line}
                style={{
                  border: "1px solid #e5e7ef",
                  borderRadius: 10,
                  padding: 12,
                  background: "#fafbff",
                  color: "#222",
                }}
              >
                {line}
              </div>
            ))}
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
            <div style={{ marginBottom: 10, fontWeight: "bold" }}>Your Answer</div>

            <textarea
              ref={inputRef}
              value={answer}
              onChange={(e) => {
                setAnswer(e.target.value);
                latestAnswerRef.current = e.target.value;
              }}
              placeholder="Speak or type your answer here"
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
                {score} / 100
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
                  onClick={restartPage}
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