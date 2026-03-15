"use client";

import { useState } from "react";

export default function AdminPage() {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");

  async function addStudent() {
    setMessage("");

    if (!name || !pin) {
      setMessage("Please enter both name and PIN");
      return;
    }

    const res = await fetch("/api/add-student", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, pin }),
    });

    const data = await res.json();

    if (res.ok) {
      setMessage("Student added successfully!");
      setName("");
      setPin("");
    } else {
      setMessage(data.error || "Error adding student");
    }
  }

  return (
    <div style={{ padding: 40, fontFamily: "Arial" }}>
      <h2>Amin Sir AI Tutor - Admin</h2>
      <h3>Add Student</h3>

      <input
        placeholder="Student Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ display: "block", marginBottom: 10, padding: 8 }}
      />

      <input
        placeholder="PIN"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        style={{ display: "block", marginBottom: 10, padding: 8 }}
      />

      <button onClick={addStudent} style={{ padding: 10 }}>
        Add Student
      </button>

      {message && <p style={{ marginTop: 15 }}>{message}</p>}
    </div>
  );
}