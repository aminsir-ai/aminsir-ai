"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");

  const onLogin = (e) => {
    e.preventDefault();
    setErr("");

    // ✅ Your demo users (you can expand later)
    const u = name.trim().toLowerCase();
    const p = pin.trim();

    if (u === "ali" && p === "2222") {
      localStorage.setItem(
        "aminsir_user",
        JSON.stringify({ name: "Ali", pin: "2222" })
      );
      router.push("/chat");
      return;
    }

    setErr("Invalid user or PIN");
  };

  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h2>Login</h2>

      <form onSubmit={onLogin} style={{ display: "grid", gap: 12, maxWidth: 340 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="User (example: Ali)"
          style={{ padding: 12, borderRadius: 10, border: "1px solid #ddd" }}
        />

        <input
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="PIN (example: 2222)"
          type="password"
          style={{ padding: 12, borderRadius: 10, border: "1px solid #ddd" }}
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

        {err ? (
          <div style={{ color: "crimson", fontWeight: 700 }}>{err}</div>
        ) : null}
      </form>
    </div>
  );
}