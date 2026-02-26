"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

export default function ChatPage() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I am Amin Sir 😊 What do you want to practice today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Voice settings
  const [voiceOn, setVoiceOn] = useState(true);
  const [listening, setListening] = useState(false);

  const recognitionRef = useRef(null);
  const lastAssistantSpokenRef = useRef("");

  // --- Text to Speech (Amin Sir speaks back) ---
  function speak(text) {
    try {
      if (!voiceOn) return;
      if (!window.speechSynthesis) return;

      // stop any ongoing speech
      window.speechSynthesis.cancel();

      const utter = new SpeechSynthesisUtterance(text);

      // Try to pick a good English voice
      const voices = window.speechSynthesis.getVoices?.() || [];
      const prefer = voices.find(v => /en/i.test(v.lang) && /male|david|mark|google/i.test(v.name)) ||
                     voices.find(v => /en/i.test(v.lang)) ||
                     voices[0];

      if (prefer) utter.voice = prefer;
      utter.rate = 1.0;   // 0.1 to 10
      utter.pitch = 1.0;  // 0 to 2

      window.speechSynthesis.speak(utter);
    } catch (e) {
      // ignore speech errors
    }
  }

  // Some browsers load voices async
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.speechSynthesis) return;
    window.speechSynthesis.onvoiceschanged = () => {};
  }, []);

  // --- Speech to Text (Student speaks, we convert to text) ---
  const SpeechRecognition = useMemo(() => {
    if (typeof window === "undefined") return null;
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  }, []);

  function startListening() {
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser. Use Chrome/Edge on Windows.");
      return;
    }

    // If already created, reuse
    if (!recognitionRef.current) {
      const rec = new SpeechRecognition();
      rec.lang = "en-US";
      rec.interimResults = true;
      rec.continuous = false;

      rec.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInput(transcript.trim());
      };

      rec.onerror = () => {
        setListening(false);
      };

      rec.onend = () => {
        setListening(false);
      };

      recognitionRef.current = rec;
    }

    setListening(true);
    recognitionRef.current.start();
  }

  function stopListening() {
    try {
      recognitionRef.current?.stop();
    } catch {}
    setListening(false);
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: `Server error: ${data?.error || "Unknown"}` },
        ]);
      } else {
        const reply = data.reply || "";
        setMessages((m) => [...m, { role: "assistant", content: reply }]);

        // Speak only if new reply
        if (reply && reply !== lastAssistantSpokenRef.current) {
          lastAssistantSpokenRef.current = reply;
          speak(reply);
        }
      }
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: "Network error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#020617", color: "white", fontFamily: "Arial" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h1 style={{ margin: 0 }}>Amin Sir AI Tutor</h1>
          <Link href="/" style={{ color: "#93c5fd" }}>← Home</Link>
        </div>

        {/* Controls */}
        <div style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          marginBottom: 10,
          flexWrap: "wrap"
        }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={voiceOn}
              onChange={(e) => setVoiceOn(e.target.checked)}
            />
            Voice Reply
          </label>

          <button
            onClick={() => (listening ? stopListening() : startListening())}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid #334155",
              background: listening ? "#ef4444" : "#0b1220",
              color: "white",
              cursor: "pointer",
              fontWeight: 700
            }}
          >
            {listening ? "Stop Mic" : "🎤 Speak"}
          </button>

          <button
            onClick={() => window.speechSynthesis?.cancel?.()}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid #334155",
              background: "#0b1220",
              color: "white",
              cursor: "pointer",
              fontWeight: 700
            }}
          >
            🔇 Stop Voice
          </button>
        </div>

        {/* Chat box */}
        <div style={{ background: "#0f172a", borderRadius: 14, padding: 14, height: "70vh", overflowY: "auto" }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
              <div
                style={{
                  maxWidth: "80%",
                  padding: "10px 12px",
                  borderRadius: 12,
                  marginBottom: 10,
                  background: msg.role === "user" ? "#22c55e" : "#1f2937",
                  color: msg.role === "user" ? "#0b1220" : "white",
                  lineHeight: 1.4,
                  whiteSpace: "pre-line",
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={loading ? "Amin Sir is typing..." : (listening ? "Listening..." : "Type your message...")}
            style={{
              flex: 1,
              padding: "12px 12px",
              borderRadius: 12,
              border: "1px solid #334155",
              background: "#0b1220",
              color: "white",
              outline: "none",
            }}
          />
          <button
            onClick={send}
            disabled={loading}
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              border: "none",
              background: "#22c55e",
              fontWeight: 800,
              cursor: "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </main>
  );
}