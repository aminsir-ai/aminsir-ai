import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function getDubaiDay() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dubai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function extractJsonArray(text) {
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {}

  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];

  try {
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    const studentId =
      body.studentId ||
      body.student_id ||
      "test_student";

    const transcript = (body.transcript || "").trim();

    if (!transcript) {
      return NextResponse.json(
        { ok: false, error: "Transcript is required" },
        { status: 400 }
      );
    }

    const today = getDubaiDay();

    const prompt = `
You are an English speaking tutor.

From the transcript below, create 5 short homework correction items for the student.

Return ONLY a valid JSON array.
Do not return markdown.
Do not return explanation outside JSON.

Each item must have exactly these keys:
- "wrong"
- "right"
- "rule"

Rules:
- Use simple English.
- Focus on real speaking mistakes if possible.
- If the transcript has very few mistakes, create useful practice corrections based on likely learner mistakes.
- Keep "wrong" and "right" short.
- Keep "rule" short and easy for a student.

Transcript:
${transcript}
`;

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const rawText =
      response.output_text ||
      "";

    let sentences = extractJsonArray(rawText);

    if (!Array.isArray(sentences)) {
      sentences = [];
    }

    sentences = sentences
      .filter(
        (item) =>
          item &&
          typeof item === "object" &&
          item.wrong &&
          item.right &&
          item.rule
      )
      .map((item) => ({
        wrong: String(item.wrong).trim(),
        right: String(item.right).trim(),
        rule: String(item.rule).trim(),
      }))
      .filter(
        (item) => item.wrong && item.right && item.rule
      )
      .slice(0, 5);

    if (sentences.length === 0) {
      sentences = [
        {
          wrong: "He go to school yesterday.",
          right: "He went to school yesterday.",
          rule: "Use past tense with yesterday.",
        },
        {
          wrong: "She have a book.",
          right: "She has a book.",
          rule: "Use has with he, she, it.",
        },
        {
          wrong: "I am study English.",
          right: "I am studying English.",
          rule: "Use verb + ing after am/is/are.",
        },
      ];
    }

    const payload = {
      student_id: studentId,
      day: today,
      sentences,
    };

    console.log("HOMEWORK SAVE PAYLOAD:", payload);

    const { data: savedRow, error: saveError } = await supabase
      .from("homework")
      .upsert(payload, { onConflict: "student_id,day" })
      .select()
      .single();

    if (saveError) {
      console.error("HOMEWORK SAVE ERROR:", saveError);

      return NextResponse.json(
        {
          ok: false,
          error: saveError.message,
          studentId,
          day: today,
          sentences,
        },
        { status: 500 }
      );
    }

    console.log("HOMEWORK SAVED ROW:", savedRow);

    return NextResponse.json({
      ok: true,
      studentId,
      day: today,
      sentences,
    });
  } catch (err) {
    console.error("HOMEWORK GENERATE API ERROR:", err);

    return NextResponse.json(
      {
        ok: false,
        error: err.message || "Unknown server error",
      },
      { status: 500 }
    );
  }
}