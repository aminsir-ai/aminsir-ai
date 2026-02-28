"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  function onSubmit(e) {
    e.preventDefault();
    setErr("");

    const clean = name.trim();
    if (!clean) {
      setErr("Please enter your name");
      return;
    }

    setLoading(true);

    // Backup: store name locally too
    try {
      localStorage.setItem("studentName", clean);
    } catch {}

    // Send name to chat via URL
    router.push(`/chat?name=${encodeURIComponent(clean)}`);
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420, border: "1px solid #e5e7eb", borderRadius: 16, padding: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Amin Sir AI Tutor</h1>
        <p style={{ marginTop: 0, marginBottom: 18, color: "#6b7280" }}>
          Enter your name to start English speaking practice.
        </p>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 14, color: "#374151" }}>Student Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ali"
              style={{
                padding: "12px 12px",
                borderRadius: 12,
                border: "1px solid #d1d5db",
                outline: "none",
                fontSize: 16,
              }}
            />
          </label>

          {err ? <div style={{ color: "#b91c1c", fontSize: 14 }}>{err}</div> : null}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px 12px",
              borderRadius: 12,
              border: "none",
              fontSize: 16,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Starting..." : "Start"}
          </button>
        </form>
      </div>
    </main>
  );
}