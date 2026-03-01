"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const AUTH_KEY = "aminsir_auth_v1";

// ✅ Add / edit students here (username: "4-digit PIN")
const ALLOWED_USERS = {
  ali: "1111",
  rahul: "2222",
  fatima: "3333",
  // add more...
};

function normalizeName(s) {
  return (s || "").trim().toLowerCase();
}

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");

  const allowedListText = useMemo(() => Object.keys(ALLOWED_USERS).join(", "), []);

  useEffect(() => {
    // If already logged in, go to chat
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (raw) router.replace("/chat");
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function login() {
    setError("");

    const u = normalizeName(username);
    const p = (pin || "").trim();

    if (!u) return setError("Please enter username.");
    if (!/^\d{4}$/.test(p)) return setError("PIN must be 4 digits.");

    const expected = ALLOWED_USERS[u];
    if (!expected) return setError(`Username not found.`);
    if (p !== expected) return setError("Wrong PIN. Try again.");

    const auth = { user: u, at: Date.now() };
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
    } catch {}

    router.replace("/chat");
  }

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: 18, fontFamily: "system-ui, Arial" }}>
      <h2 style={{ margin: "8px 0" }}>Amin Sir AI Tutor — Login</h2>

      <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 800 }}>Username</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Example: ali"
            style={{
              padding: "12px 12px",
              borderRadius: 12,
              border: "1px solid #ddd",
              fontWeight: 700,
              fontSize: 16,
            }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 800 }}>4-digit PIN</span>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/[^\d]/g, "").slice(0, 4))}
              placeholder="****"
              inputMode="numeric"
              type={showPin ? "text" : "password"}
              style={{
                flex: 1,
                padding: "12px 12px",
                borderRadius: 12,
                border: "1px solid #ddd",
                fontWeight: 800,
                letterSpacing: 3,
                fontSize: 16,
              }}
            />
            <button
              onClick={() => setShowPin((v) => !v)}
              type="button"
              style={{
                padding: "12px 12px",
                borderRadius: 12,
                border: "1px solid #ddd",
                background: "#fff",
                fontWeight: 900,
              }}
            >
              {showPin ? "Hide" : "Show"}
            </button>
          </div>
        </label>

        <button
          onClick={login}
          style={{
            padding: "12px 14px",
            borderRadius: 12,
            border: "none",
            background: "#111",
            color: "#fff",
            fontWeight: 900,
            fontSize: 16,
          }}
        >
          Login
        </button>

        {error ? (
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              border: "1px solid #fecdd3",
              background: "#fff1f2",
              color: "#7f1d1d",
              fontWeight: 700,
            }}
          >
            {error}
          </div>
        ) : null}

        <div style={{ marginTop: 6, fontSize: 13, color: "#666" }}>
          <div style={{ fontWeight: 800, marginBottom: 4 }}>How to login:</div>
          <div>• Username small letters (example: ali)</div>
          <div>• PIN must be 4 digits</div>
        </div>
      </div>
    </div>
  );
}