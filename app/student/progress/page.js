"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function formatSecondsToMinSec(totalSeconds) {
  const secs = Number(totalSeconds || 0);
  const minutes = Math.floor(secs / 60);
  const remainingSeconds = secs % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function formatSessionDate(dateValue) {
  if (!dateValue) return "-";

  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return "-";

  return d.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getStoredStudent() {
  if (typeof window === "undefined") return null;

  const possibleKeys = [
    "student",
    "studentUser",
    "student_user",
    "loggedInStudent",
    "studentSession",
    "aminsirai_student",
    "aminsir_student",
    "user",
  ];

  for (const key of possibleKeys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw);

      if (parsed && (parsed.studentId || parsed.id || parsed.student_id)) {
        return parsed;
      }
    } catch (_) {}
  }

  try {
    const directId = localStorage.getItem("studentId");
    const directName = localStorage.getItem("studentName");

    if (directId) {
      return {
        studentId: directId,
        studentName: directName || "",
      };
    }
  } catch (_) {}

  return null;
}

function getStudentId(student) {
  if (!student) return "";
  return String(
    student.studentId || student.id || student.student_id || ""
  ).trim();
}

function getStudentName(student) {
  if (!student) return "Student";
  return String(
    student.studentName || student.name || student.student_name || "Student"
  ).trim();
}

function SummaryCard({ title, value, subtitle }) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        padding: 16,
        boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          fontSize: 13,
          color: "#6b7280",
          marginBottom: 8,
          fontWeight: 500,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: "#111827",
          lineHeight: 1.1,
          marginBottom: 6,
        }}
      >
        {value}
      </div>

      <div
        style={{
          fontSize: 12,
          color: "#9ca3af",
        }}
      >
        {subtitle}
      </div>
    </div>
  );
}

export default function StudentProgressPage() {
  const router = useRouter();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiLoading, setApiLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState({
    totalSessions: 0,
    bestScore: 0,
    todayUsageSeconds: 0,
    streak: 0,
  });
  const [recentSessions, setRecentSessions] = useState([]);

  useEffect(() => {
    const storedStudent = getStoredStudent();

    if (!storedStudent) {
      router.replace("/login");
      return;
    }

    setStudent(storedStudent);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    async function fetchSummary() {
      if (!student) return;

      const studentId = getStudentId(student);

      if (!studentId) {
        setError("Student ID not found. Please login again.");
        setApiLoading(false);
        return;
      }

      try {
        setApiLoading(true);
        setError("");

        const response = await fetch(
          `/api/student/progress-summary?studentId=${encodeURIComponent(
            studentId
          )}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Failed to load progress");
        }

        setSummary({
          totalSessions: Number(data?.summary?.totalSessions || 0),
          bestScore: Number(data?.summary?.bestScore || 0),
          todayUsageSeconds: Number(data?.summary?.todayUsageSeconds || 0),
          streak: Number(data?.summary?.streak || 0),
        });

        setRecentSessions(Array.isArray(data?.recentSessions) ? data.recentSessions : []);
      } catch (err) {
        setError(err?.message || "Failed to load progress");
      } finally {
        setApiLoading(false);
      }
    }

    fetchSummary();
  }, [student]);

  const studentName = useMemo(() => getStudentName(student), [student]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f9fafb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <div
          style={{
            fontSize: 16,
            color: "#374151",
            fontWeight: 600,
          }}
        >
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f9fafb",
        padding: "16px 14px 28px",
      }}
    >
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => router.back()}
            style={{
              border: "none",
              background: "#ffffff",
              borderRadius: 12,
              padding: "10px 14px",
              fontSize: 14,
              fontWeight: 600,
              color: "#111827",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              cursor: "pointer",
            }}
          >
            ← Back
          </button>

          <button
            onClick={() => window.location.reload()}
            style={{
              border: "none",
              background: "#111827",
              color: "#ffffff",
              borderRadius: 12,
              padding: "10px 14px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 18,
            padding: 18,
            marginBottom: 16,
            boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: "#111827",
              marginBottom: 6,
            }}
          >
            Student Progress
          </div>

          <div
            style={{
              fontSize: 15,
              color: "#4b5563",
            }}
          >
            Welcome, <strong>{studentName}</strong>
          </div>
        </div>

        {error ? (
          <div
            style={{
              background: "#fef2f2",
              color: "#b91c1c",
              border: "1px solid #fecaca",
              borderRadius: 14,
              padding: 14,
              marginBottom: 16,
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        ) : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <SummaryCard
            title="Total Sessions"
            value={apiLoading ? "..." : summary.totalSessions}
            subtitle="All completed sessions"
          />

          <SummaryCard
            title="Best Score"
            value={apiLoading ? "..." : summary.bestScore}
            subtitle="Highest overall score"
          />

          <SummaryCard
            title="Today's Usage"
            value={apiLoading ? "..." : formatSecondsToMinSec(summary.todayUsageSeconds)}
            subtitle="Used today"
          />

          <SummaryCard
            title="Streak"
            value={apiLoading ? "..." : summary.streak}
            subtitle="Consecutive active days"
          />
        </div>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 18,
            padding: 16,
            boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#111827",
              marginBottom: 14,
            }}
          >
            Recent Sessions
          </div>

          {apiLoading ? (
            <div
              style={{
                fontSize: 14,
                color: "#6b7280",
                padding: "8px 0",
              }}
            >
              Loading recent sessions...
            </div>
          ) : recentSessions.length === 0 ? (
            <div
              style={{
                fontSize: 14,
                color: "#6b7280",
                padding: "8px 0",
              }}
            >
              No recent sessions found.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: 10,
              }}
            >
              {recentSessions.map((item, index) => (
                <div
                  key={`${item?.sessionDate || "session"}-${index}`}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 14,
                    padding: 14,
                    background: "#f9fafb",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#111827",
                      }}
                    >
                      {item?.lesson || "Practice Session"}
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#111827",
                        background: "#e5f3ff",
                        borderRadius: 999,
                        padding: "6px 10px",
                      }}
                    >
                      Score: {Number(item?.score || 0)}
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      color: "#4b5563",
                      marginBottom: 4,
                    }}
                  >
                    Duration: {formatSecondsToMinSec(item?.durationSeconds || 0)}
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      color: "#4b5563",
                      marginBottom: 4,
                    }}
                  >
                    Level {Number(item?.levelNo || 0)} • Week {Number(item?.weekNo || 0)} • Day{" "}
                    {Number(item?.dayNo || 0)}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                    }}
                  >
                    {formatSessionDate(item?.sessionDate)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}