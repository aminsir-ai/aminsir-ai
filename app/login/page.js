"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    const cleanLoginId = String(loginId || "").trim();
    const cleanPassword = String(password || "").trim();

    if (!cleanLoginId || !cleanPassword) {
      setError("Enter login ID and password");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/student-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          loginId: cleanLoginId,
          password: cleanPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || "Login failed");
        setLoading(false);
        return;
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("student", JSON.stringify(data.student));
        localStorage.setItem("studentName", data.student?.name || "Student");
        localStorage.setItem("studentId", String(data.student?.id || ""));
        localStorage.setItem("studentLoginId", data.student?.loginId || "");
      }

      router.push("/ebook");
    } catch (err) {
      setError("Something went wrong during login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center">
        <div className="w-full rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
          <div className="text-center">
            <p className="text-sm text-slate-400">AminSirAI</p>
            <h1 className="mt-2 text-2xl font-bold">Student Login</h1>
            <p className="mt-2 text-sm text-slate-300">
              Login to continue your speaking practice
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm text-slate-300">
                Login ID
              </label>
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="Enter login ID"
                autoComplete="username"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none"
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-800 bg-red-950/30 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-white px-4 py-3 font-semibold text-slate-950 disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}