"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onLogin(e) {
    e.preventDefault();
    setError("");
    setBusy(true);

    const name = username.trim();
    const enteredPin = pin.trim();

    if (!name) {
      setBusy(false);
      return setError("Enter username");
    }
    if (!enteredPin) {
      setBusy(false);
      return setError("Enter PIN");
    }

    // 🔴 Check Supabase students table
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .ilike("name", name)   // case-insensitive match
      .eq("pin", enteredPin)
      .eq("active", true)
      .single();

    if (error || !data) {
      setBusy(false);
      return setError("Invalid username or PIN");
    }

    // Save login session locally
    localStorage.setItem(
      "aminsir_auth_v1",
      JSON.stringify({
        user: data.name,
        id: data.id,
        time: Date.now(),
      })
    );

    router.replace("/chat");
  }

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: 18, fontFamily: "system-ui, Arial" }}>
      <h2>Amin Sir AI Tutor — Login</h2>

      <form onSubmit={onLogin} style={{ marginTop: 14, display: "grid", gap: 10 }}>
        <label>
          Username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Example: Ali"
            style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd", width: "100%" }}
          />
        </label>

        <label>
          4-digit PIN
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            inputMode="numeric"
            style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd", width: "100%" }}
          />
        </label>

        <button
          type="submit"
          disabled={busy}
          style={{
            padding: 12,
            borderRadius: 12,
            background: "#111",
            color: "#fff",
            fontWeight: 800,
          }}
        >
          {busy ? "Checking..." : "Login"}
        </button>

        {error && (
          <div style={{ color: "red", fontWeight: 700 }}>
            {error}
          </div>
        )}
      </form>
    </div>
  );
}