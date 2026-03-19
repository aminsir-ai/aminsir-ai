"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");

  async function onLogin(e) {
    e.preventDefault();
    setErr("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErr(data.error || "Login failed");
        return;
      }

      localStorage.setItem("aminsir_user", JSON.stringify(data.student));
      localStorage.setItem("aminsir_student_name", name);
      router.push("/chat");
    } catch (error) {
      setErr("Something went wrong");
    }
  }

  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h2>Student Login</h2>

      <form
        onSubmit={onLogin}
        style={{ display: "grid", gap: 12, maxWidth: 340 }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Student Name"
          style={{
            padding: 12,
            borderRadius: 10,
            border: "1px solid #ddd",
          }}
        />

        <input
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="PIN"
          type="password"
          style={{
            padding: 12,
            borderRadius: 10,
            border: "1px solid #ddd",
          }}
        />

        <button
          type="submit"
          style={{
            padding: 12,
            borderRadius: 12,
            border: "none",
            background: "black",
            color: "white",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Login
        </button>

        {err && (
          <div style={{ color: "crimson", fontWeight: 700 }}>{err}</div>
        )}
      </form>
    </div>
  );
}