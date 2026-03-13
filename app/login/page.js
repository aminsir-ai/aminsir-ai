"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onLogin(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const res = await fetch("/api/student-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ loginId, password }),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        setErr(data?.error || "Login failed");
        setLoading(false);
        return;
      }

      localStorage.setItem(
        "aminsir_user",
        JSON.stringify({
          id: data.student.id,
          name: data.student.name,
          loginId: data.student.loginId,
          loginTime: Date.now(),
        })
      );

      router.push("/chat");
    } catch (error) {
      setErr("Unable to login right now");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h2>Login</h2>

      <form onSubmit={onLogin} style={{ display: "grid", gap: 12, maxWidth: 340 }}>
        <input
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
          placeholder="Login ID"
          style={{ padding: 12, borderRadius: 10, border: "1px solid #ddd" }}
        />

        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          style={{ padding: 12, borderRadius: 10, border: "1px solid #ddd" }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: 12,
            borderRadius: 12,
            border: "none",
            background: "black",
            color: "white",
            fontWeight: 800,
            cursor: "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {err ? (
          <div style={{ color: "crimson", fontWeight: 700 }}>{err}</div>
        ) : null}
      </form>
    </div>
  );
}