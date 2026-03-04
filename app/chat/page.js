"use client";

import { useState } from "react";

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");

  async function sendMessage() {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    const data = await res.json();
    setResponse(data.reply || "No response");
  }

  return (
    <div style={{ padding: 40, fontFamily: "Arial" }}>
      <h1>Amin Sir AI Tutor</h1>

      <input
        style={{ padding: 10, width: 300 }}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type something..."
      />

      <button
        style={{ marginLeft: 10, padding: 10 }}
        onClick={sendMessage}
      >
        Send
      </button>

      <div style={{ marginTop: 20 }}>
        <b>AI:</b> {response}
      </div>
    </div>
  );
}