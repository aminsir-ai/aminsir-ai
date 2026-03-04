import { NextResponse } from "next/server";

export const runtime = "nodejs";

function clamp20(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(20, Math.round(x)));
}

export async function POST(req) {
  try {
    const body = await req.json();

    const transcript = String(body?.transcript || "").trim();
    const studentId = String(body?.studentId || "").trim();
    const courseWeek = Number(body?.courseWeek || 1);
    const level = String(body?.level || "beginner").trim();

    if (!studentId) {
      return NextResponse.json({ ok: false, error: "studentId required" }, { status: 400 });
    }

    if (!transcript || transcript.length < 20) {
      return NextResponse.json(
        { ok: false, error: "Transcript required (too short)" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "OPENAI_API_KEY missing" }, { status: 500 });
    }

    // Build rubric depending on week/level (simple but effective)
    const rubric = `
You are an English speaking examiner.
Speak ONLY in ENGLISH.

Student level: ${level}
Course week: ${courseWeek}

Grade this transcript as a WEEKLY speaking test.
Transcript:
${transcript}

Scoring (0–20 each):
- Fluency
- Grammar
- Vocabulary
- Pronunciation (best estimate from transcript)
- Confidence

Return STRICT JSON ONLY (no extra words, no markdown):

{
  "fluency": number,
  "grammar": number,
  "vocabulary": number,
  "pronunciation": number,
  "confidence": number,
  "total": number,
  "feedback": "1-2 short lines of feedback in English"
}

Total MUST equal sum of the 5 categories (0–100).
`.trim();

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          { role: "system", content: "Return strict JSON only." },
          { role: "user", content: rubric },
        ],
      }),
    });

    const raw = await r.json();
    const text = raw?.choices?.[0]?.message?.content || "";

    let scoreObj;
    try {
      scoreObj = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { ok: false, error: "AI returned invalid JSON", raw: text },
        { status: 500 }
      );
    }

    // Normalize and enforce total correctness
    const fluency = clamp20(scoreObj.fluency);
    const grammar = clamp20(scoreObj.grammar);
    const vocabulary = clamp20(scoreObj.vocabulary);
    const pronunciation = clamp20(scoreObj.pronunciation);
    const confidence = clamp20(scoreObj.confidence);
    const total = fluency + grammar + vocabulary + pronunciation + confidence;

    const feedback = String(scoreObj.feedback || "").trim().slice(0, 300);

    const normalized = { fluency, grammar, vocabulary, pronunciation, confidence, total, feedback };

    // ✅ call save using same origin (no env needed)
    const origin = new URL(req.url).origin;

    const saveRes = await fetch(`${origin}/api/week-test/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, score: total }),
    });

    const saveData = await saveRes.json().catch(() => null);

    return NextResponse.json({
      ok: true,
      score: normalized,
      progression: saveData,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "AI grading failed", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}