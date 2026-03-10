"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProgressPage() {
  const router = useRouter();

  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");

  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);

  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const sid = localStorage.getItem("studentId");
    const sname = localStorage.getItem("studentName");

    if (!sid || !sname) {
      router.replace("/login");
      return;
    }

    setStudentId(sid);
    setStudentName(sname);

    loadProgress(sid);
  }, []);

  async function loadProgress(sid) {
    const res = await fetch(`/api/progress/sessions?studentId=${sid}&limit=50`);
    const data = await res.json();

    setStats(data.stats);
    setSessions(data.sessions || []);
  }

  function secToMin(sec) {
    return Math.round((sec || 0) / 60 * 10) / 10;
  }

  return (
    <div style={{ padding: 30, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 48 }}>📊 Progress Dashboard</h1>

      <div style={{ marginBottom: 20 }}>
        Student: <b>{studentName}</b> (ID: {studentId})
      </div>

      {stats && (
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <Stat title="🔥 Streak" value={`${stats.streak} days`} />
          <Stat title="🎯 Best Score" value={`${stats.bestScore}/10`} />
          <Stat title="📈 Avg Score" value={`${stats.avgScore}/10`} />
          <Stat title="⏱ Practice Time" value={`${secToMin(stats.totalSeconds)} min`} />
          <Stat title="🎤 Sessions" value={stats.totalSessions} />
        </div>
      )}

      <h2 style={{ marginTop: 40 }}>Recent Sessions</h2>

      {sessions.map((s) => (
        <div
          key={s.id}
          onClick={() => setSelected(s)}
          style={{
            border: "1px solid #ddd",
            borderRadius: 12,
            padding: 14,
            marginBottom: 10,
            cursor: "pointer",
            background: "#fafafa"
          }}
        >
          <b>
            {s.day} — Score: {s.overall_score}/10 — Duration: {s.duration_sec} sec
          </b>

          <div style={{ marginTop: 6, opacity: 0.8 }}>
            {s.transcript?.slice(0, 120)}
          </div>
        </div>
      ))}

      <button
        onClick={() => router.push("/chat")}
        style={{
          marginTop: 30,
          padding: "12px 18px",
          borderRadius: 12,
          border: "1px solid #ddd",
          background: "white",
          fontWeight: "bold",
        }}
      >
        ⬅ Back to Chat
      </button>

      {/* SESSION REPORT MODAL */}

      {selected && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h2>Speaking Report</h2>

            <div style={{ fontSize: 20, marginBottom: 10 }}>
              Score: <b>{selected.overall_score}/10</b>
            </div>

            <div>Pronunciation: {selected.pronunciation}</div>
            <div>Fluency: {selected.fluency}</div>
            <div>Grammar: {selected.grammar}</div>
            <div>Vocabulary: {selected.vocabulary}</div>
            <div>Confidence: {selected.confidence}</div>

            <hr style={{ margin: "14px 0" }} />

            <div>
              <b>Good</b>
              <p>{selected.good}</p>
            </div>

            <div>
              <b>Fix</b>
              <p>{selected.fix}</p>
            </div>

            <div>
              <b>Vocabulary</b>
              <p>{selected.vocab}</p>
            </div>

            <div>
              <b>Tip</b>
              <p>{selected.tip}</p>
            </div>

            <hr style={{ margin: "14px 0" }} />

            <div>
              <b>Full Transcript</b>
              <p style={{ opacity: 0.85 }}>{selected.transcript}</p>
            </div>

            <button
              onClick={() => setSelected(null)}
              style={{
                marginTop: 16,
                padding: "10px 16px",
                borderRadius: 10,
                border: "1px solid #ddd",
                background: "white",
                fontWeight: "bold"
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ title, value }) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        padding: 16,
        borderRadius: 12,
        background: "#fafafa",
        minWidth: 180,
      }}
    >
      <div style={{ fontWeight: "bold" }}>{title}</div>
      <div style={{ fontSize: 26 }}>{value}</div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
};

const modalStyle = {
  background: "white",
  padding: 24,
  borderRadius: 14,
  maxWidth: 500,
  width: "90%"
};