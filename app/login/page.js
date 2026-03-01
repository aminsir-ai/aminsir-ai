"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

const AUTH_KEY = "aminsir_auth_v1";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    if (busy) return;

    setError("");
    setBusy(true);

    const nameInput = (username || "").trim();
    const pinInput = (pin || "").trim();

    if (!nameInput) {
      setBusy(false);
      return setError("Enter username");
    }
    if (!/^\d{4}$/.test(pinInput)) {
      setBusy(false);
      return setError("PIN must be 4 digits");
    }

    try {
      // ✅ Find active student by name (case-insensitive) + exact pin
      const { data, error } = await supabase
        .from("students")
        .select("id,name,active,pin")
        .ilike("name", nameInput) // case-insensitive match
        .eq("pin", pinInput)
        .eq("active", true)
        .single();

      if (error || !data) {
        setBusy(false);
        return setError("Invalid username or PIN");
      }

      // ✅ Save login session locally
      localStorage.setItem(
        AUTH_KEY,
        JSON.stringify({
          id: data.id,
          user: data.name, // keep original name (Ali / Amin Test)
          time: Date.now(),
        })
      );

      router.replace("/chat");
    } catch (e) {
      console.error(e);
      setError("Login failed. Try again.");
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: 18, fontFamily: "system-ui, Arial" }}>
      <h2 style={{ margin: "8px 0" }}>DB LOGIN ✅ (SUPABASE)</h2>

      <form onSubmit={onSubmit} style={{ marginTop: 14, display: "grid", gap: 10 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 800 }}>Username</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Example: Ali"
            autoCapitalize="none"
            autoCorrect="off"
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
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/[^\d]/g, "").slice(0, 4))}
            placeholder="****"
            inputMode="numeric"
            type="password"
            style={{
              padding: "12px 12px",
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
          {busy ? "Checking..." : "Login"}
        </button>

        {error ? (
          <div style={{ padding: 12, borderRadius: 12, background: "#fff1f2", border: "1px solid #fecdd3", color: "#7f1d1d", fontWeight: 700 }}>
            {error}
          </div>
        ) : null}

        <div style={{ marginTop: 6, fontSize: 13, color: "#666" }}>
          • Username can be Ali / Amin Test <br />
          • PIN must be 4 digits
        </div>
      </form>
    </div>
  );
}