"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// username -> email
function toEmail(username) {
  return `${(username || "").trim().toLowerCase()}@aminsir.ai`;
}

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onLogin(e) {
    e.preventDefault();
    setError("");
    setBusy(true);

    const u = (username || "").trim().toLowerCase();
    const p = (pin || "").trim();

    if (!u) {
      setBusy(false);
      return setError("Please enter username.");
    }
    if (!/^\d{4}$/.test(p)) {
      setBusy(false);
      return setError("PIN must be 4 digits.");
    }

    const email = toEmail(u);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: p,
    });

    if (error) {
      setBusy(false);
      return setError(error.message || "Login failed.");
    }

    if (!data?.session) {
      setBusy(false);
      return setError("No session received. Try again.");
    }

    router.replace("/chat");
  }

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: 18, fontFamily: "system-ui, Arial" }}>
      <h2 style={{ margin: "8px 0" }}>Amin Sir AI Tutor — Login</h2>

      <form onSubmit={onLogin} style={{ marginTop: 14, display: "grid", gap: 10 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 800 }}>Username</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Example: ali"
            autoCapitalize="none"
            autoCorrect="off"
            style={{ padding: "12px", borderRadius: 12, border: "1px solid #ddd", fontWeight: 700, fontSize: 16 }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 800 }}>4-digit PIN</span>
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/[^\d]/g, "").slice(0, 4))}
            placeholder="****"
            inputMode="numeric"
            type="password"
            style={{
              padding: "12px",
              borderRadius: 12,
              border: "1px solid #ddd",
              fontWeight: 800,
              letterSpacing: 3,
              fontSize: 16,
            }}
          />
        </label>

        <button
          type="submit"
          disabled={busy}
          style={{
            padding: "12px 14px",
            borderRadius: 12,
            border: "none",
            background: "#111",
            color: "#fff",
            fontWeight: 900,
            fontSize: 16,
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? "Logging in..." : "Login"}
        </button>

        {error ? (
          <div style={{ padding: 12, borderRadius: 12, border: "1px solid #fecdd3", background: "#fff1f2", color: "#7f1d1d", fontWeight: 700 }}>
            {error}
          </div>
        ) : null}

        <div style={{ marginTop: 6, fontSize: 13, color: "#666" }}>
          • Username small letters (example: ali) <br />
          • PIN is 4 digits
        </div>
      </form>
    </div>
  );
}