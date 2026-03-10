"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProgressPage() {
  const router = useRouter();

  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");

  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    const sid = localStorage.getItem("studentId");
    const sname = localStorage.getItem("studentName");

    if (!sid || !sname) {
      router.replace("/login");
      return;
    }

    setStudentId(String(sid));
    setStudentName(String(sname));

    loadProgress(String(sid));
  }, [router]);

  async function loadProgress(sid) {
    try {
      setLoading(true);
      setErrMsg("");

      const res = await fetch(
        `/api/progress/sessions?studentId=${encodeURIComponent(sid)}&limit=50`
      );

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to load progress");
      }

      setStats(data.stats || null);
      setSessions(Array.isArray(data.sessions) ? data.sessions : []);
    } catch (e) {
      setErrMsg(e?.message || "Error loading progress");
    } finally {
      setLoading(false);
    }
  }

  function secToMin(sec) {
    return Math.round((Number(sec || 0) / 60) * 10) / 10;
  }

  if (loading) {
    return (
      <div style={{ padding: 30, fontFamily: "system-ui" }}>
        Loading progress...
      </div>
    );
  }

  if (errMsg) {
    return (
      <div style={{ padding: 30, fontFamily: "system-ui" }}>
        <h1 style={{ margin: 0 }}>📊 Progress Dashboard</h1>
        <div style={{ marginTop: 12, color: "crimson" }}>Error: {errMsg}</div>
        <button
          onClick={() => router.push("/chat")}
          style={{
            marginTop: 18,
            padding: "12px 16px",
            borderRadius: 12,
            border: "1px solid #ddd",
            background: "white",
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          ⬅ Back to Chat
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 30, fontFamily: "system-ui" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 40 }}>📊 Progress Dashboard</h1>
          <div style={{ marginTop: 6, fontSize: 18, opacity: 0.85 }}>
            Student: <b>{studentName}</b> (ID: {studentId})
          </div>
        </div>

        <button
          onClick={() => router.push("/chat")}
          style={{
            height: 44,
            padding: "0 16px",
            borderRadius: 14,
            border: "1px solid #ddd",
            background: "white",
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          ⬅ Back to Chat
        </button>
      </div>

      <div
        style={{
          marginTop: 18,
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        }}
      >
        <Stat title="🔥 Streak" value={`${stats?.streak ?? 0} days`} />
        <Stat title="🎯 Best Score" value={`${stats?.bestScore ?? 0}/10`} />
        <Stat title="📈 Avg Score" value={`${stats?.avgScore ?? 0}/10`} />
        <Stat
          title="⏱ Practice Time"
          value={`${secToMin(stats?.totalSeconds ?? 0)} min`}
        />
        <Stat title="🎤 Sessions" value={`${stats?.totalSessions ?? 0}`} />
      </div>

      <h2 style={{ marginTop: 28 }}>Recent Sessions</h2>

      {sessions.length === 0 ? (
        <div style={{ opacity: 0.8 }}>
          No sessions yet. Go to chat and speak.
        </div>
      ) : (
        <div style={{ marginTop: 10 }}>
          {sessions.slice(0, 15).map((s) => (
            <div
              key={s.id}
              style={{
                border: "1px solid #eee",
                padding: 12,
                borderRadius: 14,
                marginBottom: 10,
                background: "white",
              }}
            >
              <div style={{ fontWeight: 1000 }}>
                {s.day || (s.created_at || "").slice(0, 10) || "—"} — Score:{" "}
                {Number(s.overall_score || 0)}/10 — Duration:{" "}
                {Math.round(Number(s.duration_sec || 0))} sec
              </div>
              <div style={{ marginTop: 6, opacity: 0.8 }}>
                {(s.transcript || "").slice(0, 160) || "—"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ title, value }) {
  return (
    <div
      style={{
        border: "1px solid #eee",
        padding: 16,
        borderRadius: 16,
        background: "#fafafa",
      }}
    >
      <div style={{ fontWeight: 900, opacity: 0.85 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 1000, marginTop: 8 }}>{value}</div>
    </div>
  );
}