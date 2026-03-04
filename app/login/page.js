"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [msg, setMsg] = useState("");

  // If already logged in, go to chat
  useEffect(() => {
    const savedId = localStorage.getItem("studentId");
    const savedName = localStorage.getItem("studentName");
    if (savedId && savedName) router.replace("/chat");
  }, [router]);

  async function handleLogin(e) {
    e.preventDefault();
    setMsg("");

    const n = name.trim();
    const p = pin.trim();

    if (!n || !p) {
      setMsg("Please enter name and PIN.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("students")
        .select("id,name,pin")
        .eq("name", n)
        .eq("pin", p)
        .maybeSingle();

      if (error) {
        setMsg("Supabase error: " + error.message);
        return;
      }

      if (!data) {
        setMsg("Wrong name or PIN.");
        return;
      }

      // ✅ store BOTH name + id (important for usage control)
      localStorage.setItem("studentId", String(data.id));
      localStorage.setItem("studentName", data.name);

      router.replace("/chat");
    } catch (err) {
      setMsg("Login failed: " + (err?.message || String(err)));
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
        Amin Sir AI Tutor
      </h1>
      <p style={{ marginBottom: 18, opacity: 0.8 }}>
        Login with your Name + PIN
      </p>

      <form onSubmit={handleLogin} style={{ display: "grid", gap: 12 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name (example: Ali)"
          style={{
            padding: 14,
            borderRadius: 10,
            border: "1px solid #ddd",
            fontSize: 16,
          }}
        />

        <input
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="PIN (example: 2222)"
          type="password"
          style={{
            padding: 14,
            borderRadius: 10,
            border: "1px solid #ddd",
            fontSize: 16,
          }}
        />

        <button
          type="submit"
          style={{
            padding: 14,
            borderRadius: 12,
            border: "none",
            fontSize: 16,
            fontWeight: 700,
            background: "black",
            color: "white",
            cursor: "pointer",
          }}
        >
          Login
        </button>

        {msg ? (
          <div
            style={{
              padding: 12,
              borderRadius: 10,
              background: "#ffe9e9",
              border: "1px solid #ffb3b3",
              color: "#6b0000",
              whiteSpace: "pre-wrap",
            }}
          >
            {msg}
          </div>
        ) : null}
      </form>
    </div>
  );
}