"use client";

import { useState } from "react";
import Link from "next/link";

export default function ChatPage() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I am Amin Sir 😊 What do you want to practice today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();

      setMessages([
        ...newMessages,
        { role: "assistant", content: data?.reply || "Sorry, I didn’t understand. Try again." },
      ]);
    } catch (err) {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Server error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#071321] text-white flex flex-col">
      <div className="px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Amin Sir AI Tutor</h1>
        <Link href="/" className="text-sm opacity-80 hover:opacity-100">
          ← Home
        </Link>
      </div>

      <div className="flex-1 px-6 pb-6">
        <div className="max-w-4xl mx-auto bg-[#0b1b2f] rounded-2xl p-6 h-[70vh] overflow-y-auto">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`mb-4 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  m.role === "user" ? "bg-green-600" : "bg-[#122a47]"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
        </div>

        <div className="max-w-4xl mx-auto mt-4 flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 rounded-xl px-4 py-3 bg-[#0b1b2f] border border-[#15365c] outline-none"
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 disabled:opacity-50 px-6 py-3 rounded-xl font-semibold"
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}