// app/api/score/route.js
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { studentName, lesson, level, transcript } = body;

    if (!transcript || typeof transcript !== "string" || transcript.trim().length < 20) {
      return NextResponse.json(
        {
          error:
            "Transcript is missing or too short. Let the student speak for 30–60 seconds first.",
        },
        { status: 400 }
      );
    }

    const prompt = `You are an English speaking examiner for school students.

Student: ${studentName || "Student"}
Level: ${level || "Unknown"}
Lesson: ${lesson || "Unknown"}

Evaluate based ONLY on this transcript:
---
${transcript}
---

Return ONLY valid JSON in the required schema.`;

    const schema = {
      type: "object",
      additionalProperties: false,
      properties: {
        student: { type: "string" },
        level: { type: "string" },
        lesson: { type: "string" },

        scores: {
          type: "object",
          additionalProperties: false,
          properties: {
            pronunciation: { type: "integer", minimum: 1, maximum: 5 },
            grammar: { type: "integer", minimum: 1, maximum: 5 },
            fluency: { type: "integer", minimum: 1, maximum: 5 },
            confidence: { type: "integer", minimum: 1, maximum: 5 },
          },
          required: ["pronunciation", "grammar", "fluency", "confidence"],
        },

        strengths: {
          type: "array",
          items: { type: "string" },
          minItems: 2,
          maxItems: 4,
        },

        improvements: {
          type: "array",
          items: { type: "string" },
          minItems: 2,
          maxItems: 5,
        },

        corrected_sentences: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              student_said: { type: "string" },
              better: { type: "string" },
            },
            required: ["student_said", "better"],
          },
          // allow empty list too
          minItems: 0,
          maxItems: 3,
        },

        homework: { type: "string" },
      },

      // ✅ IMPORTANT: include EVERY top-level property you defined above
      required: [
        "student",
        "level",
        "lesson",
        "scores",
        "strengths",
        "improvements",
        "corrected_sentences",
        "homework",
      ],
    };

    const payload = {
      model: "gpt-4o-mini",
      input: prompt,
      text: {
        format: {
          type: "json_schema",
          name: "speaking_score",
          strict: true,
          schema,
        },
      },
    };

    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await r.json().catch(() => null);

    if (!r.ok) {
      return NextResponse.json(
        { error: "OpenAI scoring failed", details: data },
        { status: r.status }
      );
    }

    const outText =
      data?.output?.[0]?.content?.find?.((c) => c?.type === "output_text")?.text || "";

    let parsed;
    try {
      parsed = JSON.parse(outText);
    } catch {
      return NextResponse.json(
        {
          error: "Model did not return valid JSON text",
          details: { outText, raw: data },
        },
        { status: 500 }
      );
    }

    // Fill defaults (safe)
    parsed.student ||= studentName || "Student";
    parsed.level ||= level || "";
    parsed.lesson ||= lesson || "";
    if (!Array.isArray(parsed.corrected_sentences)) parsed.corrected_sentences = [];

    return NextResponse.json(parsed);
  } catch (e) {
    return NextResponse.json(
      { error: "Score route crashed", details: String(e?.message || e) },
      { status: 500 }
    );
  }
}