"use client";

import { useSearchParams } from "next/navigation";

export default function PracticePage() {
  const searchParams = useSearchParams();

  const lesson = searchParams.get("lesson") || "Day 1";
  const title = searchParams.get("title") || "Practice Lesson";

  const goToBookPractice = () => {
    const encodedLesson = encodeURIComponent(lesson);
    const encodedTitle = encodeURIComponent(title);

    window.location.href = `/bookpractice?lesson=${encodedLesson}&title=${encodedTitle}`;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #fdf4ff 0%, #ffffff 50%, #ecfeff 100%)",
        padding: "20px",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          background: "white",
          borderRadius: "24px",
          padding: "30px",
          boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "8px 14px",
            borderRadius: "999px",
            background: "#dcfce7",
            color: "#047857",
            fontWeight: "700",
            fontSize: "14px",
          }}
        >
          AminSirAI Practice
        </div>

        <h1
          style={{
            marginTop: "18px",
            marginBottom: "10px",
            fontSize: "36px",
            fontWeight: "800",
            color: "#0f172a",
          }}
        >
          Practice with AminSirAI
        </h1>

        <p style={{ fontSize: "18px", color: "#334155" }}>
          You are ready to continue this lesson.
        </p>

        <div
          style={{
            marginTop: "24px",
            borderRadius: "20px",
            padding: "20px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
          }}
        >
          <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
            Lesson
          </p>
          <h2 style={{ marginTop: "8px", color: "#111827" }}>{lesson}</h2>

          <p
            style={{
              marginTop: "20px",
              marginBottom: 0,
              fontSize: "14px",
              color: "#64748b",
            }}
          >
            Title
          </p>
          <h3 style={{ marginTop: "8px", color: "#111827" }}>{title}</h3>
        </div>

        <div
          style={{
            marginTop: "24px",
            borderRadius: "20px",
            padding: "20px",
            background: "#faf5ff",
            border: "1px solid #e9d5ff",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "16px",
              lineHeight: "1.8",
              color: "#334155",
            }}
          >
            Click below to prepare your custom e-book speaking practice.
          </p>
        </div>

        <button
          onClick={goToBookPractice}
          style={{
            marginTop: "24px",
            border: "none",
            borderRadius: "18px",
            padding: "16px 24px",
            fontWeight: "800",
            fontSize: "16px",
            color: "white",
            cursor: "pointer",
            background: "linear-gradient(90deg, #10b981 0%, #14b8a6 100%)",
            boxShadow: "0 10px 20px rgba(20,184,166,0.2)",
          }}
        >
          Continue to Book Practice
        </button>
      </div>
    </div>
  );
}