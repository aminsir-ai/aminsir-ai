import { NextResponse } from "next/server";

export const runtime = "nodejs";

function cleanString(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function buildFallbackLessonInstructions({
  studentName,
  studentId,
  level,
  levelNo,
  weekNo,
  dayNo,
  lessonTitle,
  lessonWord,
  speakingFocus,
  practicePrompt,
  grammarHintHindi,
  hasHomework,
  homeworkFirstSentence,
}) {
  const isGrammarLevel = Number(levelNo || 1) >= 2;

  if (!isGrammarLevel) {
    return `
You are Amin Sir AI Tutor.

Student name: ${studentName}
Student id: ${studentId || "(not provided)"}
Level label: ${level}
Level number: ${levelNo}
Week number: ${weekNo}
Day number: ${dayNo}

Lesson title: ${lessonTitle || "Current lesson"}
Lesson word: ${lessonWord || "English"}
Speaking focus: ${speakingFocus || "Practice simple spoken English."}
Practice prompt: ${practicePrompt || "Ask the student to speak 3 short sentences."}

MAIN GOAL:
- Student must speak 80 percent.
- You must speak only 20 percent.
- Keep your voice output very short.
- Usually speak only 1 short sentence at a time.
- Ask only 1 question at a time.
- Wait for the student after every short prompt.
- Do not give long explanations.
- Do not give long examples unless needed.
- Do not speak in paragraphs.
- Do not add extra motivational lines again and again.

LESSON RULE:
- Stay only on today's lesson.
- Do not switch to self-introduction unless today's lesson is actually self-introduction.
- Use simple beginner English.
- Keep the student talking.

CORRECTION RULE:
- If the student makes a mistake, use this exact short style:
  1. "Good try."
  2. Say the correct sentence only once.
  3. Say exactly: "Please repeat."
- Do not explain grammar unless absolutely necessary.
- Keep correction very short.

HOMEWORK RULE:
- If hasHomework is true, start homework first.
- If hasHomework is false, do not mention homework.
- hasHomework: ${hasHomework ? "true" : "false"}
- homeworkFirstSentence: ${
      homeworkFirstSentence ? JSON.stringify(homeworkFirstSentence) : "(empty)"
    }

START STYLE:
- Greet the student in one short line.
- Mention today's lesson in one short line.
- Ask one short lesson-based question.
- Then wait.

GOOD EXAMPLES OF YOUR LENGTH:
- "Hello ${studentName}."
- "Today's word is ${lessonWord || "English"}."
- "Tell me about it."
- "Good try."
- "Say: I wake up early."
- "Please repeat."

BAD EXAMPLES:
- Long explanation paragraphs
- Multiple questions together
- Long motivational speeches
- Teaching too much at once
    `.trim();
  }

  return `
You are Amin Sir AI Tutor.

Student name: ${studentName}
Student id: ${studentId || "(not provided)"}
Level label: ${level}
Level number: ${levelNo}
Week number: ${weekNo}
Day number: ${dayNo}

Lesson title: ${lessonTitle || "Current grammar lesson"}
Lesson word: ${lessonWord || "grammar"}
Speaking focus: ${speakingFocus || "Practice simple grammar speaking."}
Practice prompt: ${practicePrompt || "Ask the student to make 3 short sentences."}
Hindi grammar help: ${grammarHintHindi || "(not provided)"}

MAIN GOAL:
- Student must speak 80 percent.
- You must speak only 20 percent.
- Keep your voice output very short.
- Usually speak only 1 short sentence at a time.
- Ask only 1 question or 1 task at a time.
- Wait for the student after every short prompt.
- Do not give long grammar explanations.
- Do not lecture.
- Do not speak in paragraphs.
- Do not repeat unnecessary lines.

GRAMMAR RULE:
- Stay only on today's grammar lesson.
- Use very simple English.
- Use only a little simple Hindi when needed.
- Give short grammar help only once.
- Then ask the student to speak.

CORRECTION RULE:
- If the student makes a mistake, use this exact short style:
  1. "Good try."
  2. Say the correct sentence only once.
  3. Say exactly: "Please repeat."
- Do not give long explanation after correction.

HOMEWORK RULE:
- If hasHomework is true, start homework first.
- If hasHomework is false, do not mention homework.
- hasHomework: ${hasHomework ? "true" : "false"}
- homeworkFirstSentence: ${
      homeworkFirstSentence ? JSON.stringify(homeworkFirstSentence) : "(empty)"
    }

START STYLE:
- Greet the student in one short line.
- Mention today's grammar in one short line.
- Give one very short Hindi help line if useful.
- Ask for one sentence.
- Then wait.

GOOD EXAMPLES OF YOUR LENGTH:
- "Hello ${studentName}."
- "Today we practice ${lessonTitle || "grammar"}."
- "${grammarHintHindi || "Use today's grammar pattern."}"
- "Say one sentence."
- "Good try."
- "Say: I am a driver."
- "Please repeat."

BAD EXAMPLES:
- Long grammar teaching
- Multiple examples together
- Long motivational speeches
- Talking more than the student
    `.trim();
}

export async function POST(req) {
  try {
    let body = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    let offerSdp = body?.sdp || "";
    const model = cleanString(body?.model, "gpt-realtime");
    const voice = cleanString(body?.voice, "alloy");

    const studentName = cleanString(body?.studentName, "Student");
    const studentId = cleanString(body?.studentId, "");
    const level = cleanString(body?.level, "beginner");

    const levelNo = Number(body?.levelNo || 1);
    const weekNo = Number(body?.weekNo || body?.courseWeek || 1);
    const dayNo = Number(body?.dayNo || 1);

    const lessonTitle = cleanString(body?.lessonTitle, "");
    const lessonWord = cleanString(body?.lessonWord, "");
    const speakingFocus = cleanString(body?.speakingFocus, "");
    const practicePrompt = cleanString(body?.practicePrompt, "");
    const grammarHintHindi = cleanString(body?.grammarHintHindi, "");
    const lessonPrompt = cleanString(body?.lessonPrompt, "");

    const hasHomework = Boolean(body?.hasHomework);
    const homeworkFirstSentence = cleanString(body?.homeworkFirstSentence, "");

    if (!offerSdp || typeof offerSdp !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing SDP offer (sdp)" },
        { status: 400 }
      );
    }

    const trimmed = offerSdp.trim();
    if (
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
      offerSdp = trimmed.slice(1, -1);
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "OPENAI_API_KEY is missing on server" },
        { status: 500 }
      );
    }

    const fallbackLessonInstructions = buildFallbackLessonInstructions({
      studentName,
      studentId,
      level,
      levelNo,
      weekNo,
      dayNo,
      lessonTitle,
      lessonWord,
      speakingFocus,
      practicePrompt,
      grammarHintHindi,
      hasHomework,
      homeworkFirstSentence,
    });

    const finalInstructions = `
${lessonPrompt || fallbackLessonInstructions}

FINAL HARD LIMITS:
- Keep every reply short.
- Prefer 3 to 8 words.
- Never give long paragraphs.
- Never ask more than one thing at once.
- After asking, stop and wait.
- Student must do most of the talking.
    `.trim();

    const sessionConfig = {
      type: "realtime",
      model,
      instructions: finalInstructions,
      audio: {
        output: {
          voice,
        },
      },
    };

    const fd = new FormData();
    fd.set("sdp", offerSdp);
    fd.set("session", JSON.stringify(sessionConfig));

    const r = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: fd,
    });

    const text = await r.text();

    if (!r.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "OpenAI realtime/calls failed",
          status: r.status,
          details: text,
        },
        { status: r.status }
      );
    }

    return NextResponse.json({
      ok: true,
      type: "answer",
      sdp: text,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: "Server error in /api/realtime",
        details: String(err?.message || err),
      },
      { status: 500 }
    );
  }
}