"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

function getTopicType(lesson = "", title = "") {
  const text = `${lesson} ${title}`.toLowerCase();

  if (text.includes("noun")) return "noun";
  if (text.includes("pronoun")) return "pronoun";
  if (text.includes("verb")) return "verb";
  if (text.includes("adjective")) return "adjective";
  if (text.includes("adverb")) return "adverb";
  if (text.includes("preposition")) return "preposition";
  if (text.includes("conjunction")) return "conjunction";
  if (text.includes("interjection")) return "interjection";
  if (text.includes("article")) return "article";

  return "general";
}

function buildNounPrompt(studentName, lesson, title) {
  const name = studentName || "my dear student";

  return `You are AminSirAI Speaking Coach.

MODE:
E-book Guided Practice Mode.

STUDENT NAME:
${name}

CURRENT LESSON:
${lesson}

CURRENT TITLE:
${title}

IMPORTANT RULES:
- Welcome the student by name.
- Speak in simple English.
- Keep replies very short.
- Talk less. Student should talk more.
- Stay only on the topic Noun.
- This is not free conversation.
- Do not go off-topic.
- Do not give long grammar explanations.
- Never say "Very good. Next sentence." if the student is silent.
- If the student is silent, wait first, then help with a clue.
- Use one noun at a time.
- Ask the student to make sentences one by one.
- Try to cover affirmative, negative, and interrogative sentences.
- Correct gently and shortly.

NOUN PRACTICE WORDS:
book, bag, house, school, mobile, teacher, mango, table, car, friend

OPENING:
Start with exactly:
"Welcome, ${name}. Today our topic is Noun. I will say a noun and you make a sentence. We will do affirmative, negative, and question sentences one by one."

MAIN FLOW:
1. Start with one noun only.
2. Say:
   "First noun is book. Make one affirmative sentence."
3. Wait for student response.
4. If student gives a correct sentence, reply shortly and move to next step.
5. Then say:
   "Now make one negative sentence with book."
6. Then say:
   "Now make one question sentence with book."
7. Then move to next noun.
8. Keep the same pattern with one noun at a time.

IF STUDENT IS SILENT:
- Do not praise.
- Do not move to next sentence.
- Wait mentally for 5 to 7 seconds.
- Then say one short helpful clue.
- Example:
  "Try like this: This is my book."
- Then ask student to say it again.

IF STUDENT MAKES A MISTAKE:
- Correct gently in one short line only.
- Example:
  "Good try. Say: This is my book."

SHORT REPLY EXAMPLES:
- "Very good."
- "Good try. Say: This is my book."
- "Now make a negative sentence."
- "Now make a question sentence."
- "Try like this: This is my book."
- "Good. Next noun."
- "Excellent work. Keep practicing."

ENDING:
After enough practice, say:
"Excellent work, ${name}. Keep practicing."`.trim();
}

function buildPronounPrompt(studentName, lesson, title) {
  const name = studentName || "my dear student";

  return `You are AminSirAI Speaking Coach.

MODE:
E-book Guided Practice Mode.

STUDENT NAME:
${name}

CURRENT LESSON:
${lesson}

CURRENT TITLE:
${title}

IMPORTANT RULES:
- Welcome the student by name.
- Speak in simple English.
- Keep replies very short.
- Talk less. Student should talk more.
- Stay only on the topic Pronoun.
- Do not go off-topic.
- Correct gently and shortly.
- If student is silent, do not praise. Help with one clue.

OPENING:
Start with exactly:
"Welcome, ${name}. Today our topic is Pronoun. I will give a word and you make a sentence using pronouns one by one."

FLOW:
- Ask for short pronoun sentences.
- Use he, she, it, they, we, I.
- Correct gently.
- Keep practice short and focused.

ENDING:
"Excellent work, ${name}. Keep practicing."`.trim();
}

function buildGeneralPrompt(studentName, lesson, title) {
  const name = studentName || "my dear student";

  return `You are AminSirAI Speaking Coach.

MODE:
E-book Guided Practice Mode.

STUDENT NAME:
${name}

CURRENT LESSON:
${lesson}

CURRENT TITLE:
${title}

IMPORTANT RULES:
- Welcome the student by name.
- Speak in simple English.
- Keep replies very short.
- Talk less. Student should talk more.
- Stay only on the current lesson.
- Do not go off-topic.
- If student is silent, do not praise. Give one short clue.
- Correct gently and shortly.

OPENING:
Start with exactly:
"Welcome, ${name}. Today we will practice ${title}. Please speak one by one. I will help you and correct your mistakes where needed."

ENDING:
"Excellent work, ${name}. Keep practicing."`.trim();
}

export default function BookPracticePage() {
  const searchParams = useSearchParams();

  const lesson = searchParams.get("lesson") || "Day 1";
  const title = searchParams.get("title") || "Practice Lesson";

  const [studentName, setStudentName] = useState("my dear student");

  useEffect(() => {
    try {
      const directName = localStorage.getItem("aminsir_student_name");
      if (directName && directName.trim()) {
        setStudentName(directName.trim());
        return;
      }

      const raw = localStorage.getItem("aminsir_user");
      if (!raw) return;

      const user = JSON.parse(raw);
      const possibleName =
        user?.name ||
        user?.student_name ||
        user?.full_name ||
        user?.username ||
        "";

      if (possibleName) {
        setStudentName(String(possibleName).trim());
      }
    } catch (err) {
      console.error("Failed to read student name:", err);
    }
  }, []);

  const topicType = useMemo(() => {
    return getTopicType(lesson, title);
  }, [lesson, title]);

  const aiPrompt = useMemo(() => {
    if (topicType === "noun") {
      return buildNounPrompt(studentName, lesson, title);
    }

    if (topicType === "pronoun") {
      return buildPronounPrompt(studentName, lesson, title);
    }

    return buildGeneralPrompt(studentName, lesson, title);
  }, [studentName, lesson, title, topicType]);

  const goToChat = () => {
    const encodedLesson = encodeURIComponent(lesson);
    const encodedTitle = encodeURIComponent(title);
    const encodedPrompt = encodeURIComponent(aiPrompt);
    const encodedStudentName = encodeURIComponent(studentName);

    window.location.href = `/chat?mode=ebook&lesson=${encodedLesson}&title=${encodedTitle}&studentName=${encodedStudentName}&prompt=${encodedPrompt}`;
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
          maxWidth: "1000px",
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
          AminSirAI Book Practice
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
          Book Practice Mode
        </h1>

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
            Student Name
          </p>
          <h2 style={{ marginTop: "8px", color: "#111827" }}>{studentName}</h2>

          <p
            style={{
              marginTop: "20px",
              marginBottom: 0,
              fontSize: "14px",
              color: "#64748b",
            }}
          >
            Lesson
          </p>
          <h3 style={{ marginTop: "8px", color: "#111827" }}>{lesson}</h3>

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

          <p
            style={{
              marginTop: "20px",
              marginBottom: 0,
              fontSize: "14px",
              color: "#64748b",
            }}
          >
            Topic Type
          </p>
          <h3
            style={{
              marginTop: "8px",
              color: "#111827",
              textTransform: "capitalize",
            }}
          >
            {topicType}
          </h3>
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
              fontSize: "14px",
              color: "#7c3aed",
              fontWeight: "700",
            }}
          >
            Current AI Prompt
          </p>

          <pre
            style={{
              marginTop: "12px",
              whiteSpace: "pre-wrap",
              fontFamily: "inherit",
              fontSize: "15px",
              lineHeight: "1.7",
              color: "#334155",
            }}
          >
            {aiPrompt}
          </pre>
        </div>

        <button
          onClick={goToChat}
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
          Continue to AminSirAI Chat
        </button>
      </div>
    </div>
  );
}