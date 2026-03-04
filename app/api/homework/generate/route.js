import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function POST(req) {
  try {
    const body = await req.json();

    const mistakesText = String(body?.mistakesText || "").trim();
    const level = String(body?.level || "beginner").trim();
    const studentName = String(body?.studentName || "Student").trim();

    if (!mistakesText) {
      return NextResponse.json({ ok: false, error: "mistakesText required" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "OPENAI_API_KEY missing" }, { status: 500 });
    }

    const model = process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini";

    const prompt = `
You are an English teacher.

CRITICAL LANGUAGE RULE:
- Output MUST be 100% ENGLISH only.
- Do NOT output Bengali, Hindi, Urdu, or any other language.
- If the input contains non-English, you may understand it internally, but the output must still be English.

Create homework based ONLY on the student's mistakes summary below.
Goal: Student will read these corrected sentences in the next session.

Return EXACTLY this JSON object (no extra text, no markdown):

{
  "mistakes": [
    { "wrong": "...", "right": "...", "rule": "..." }
  ],
  "homework": ["sentence1", "...", "sentence10"],
  "nextSessionPrompt": "one short English line the AI should say next session"
}

Rules:
- "homework" MUST contain exactly 10 English sentences.
- Keep "mistakes" to 3–6 items (most important).
- Keep sentences short and clear.
- Difficulty level: ${level}.
- Focus directly on mistakes (grammar, tense, word order, word choice).

Student: ${studentName}

Mistakes summary (from session):
${mistakesText}
`;

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You MUST respond in English only and output ONLY valid JSON. No markdown. No extra text.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
      }),
    });

    const raw = await r.text();

    if (!r.ok) {
      return NextResponse.json(
        { ok: false, error: "OpenAI generate failed", status: r.status, details: raw },
        { status: r.status }
      );
    }

    const json = JSON.parse(raw);
    const content = json?.choices?.[0]?.message?.content || "";

    let obj;
    try {
      obj = JSON.parse(content);
    } catch {
      return NextResponse.json(
        { ok: false, error: "Model did not return JSON", details: content },
        { status: 500 }
      );
    }

    const homework = Array.isArray(obj?.homework) ? obj.homework : [];
    const mistakes = Array.isArray(obj?.mistakes) ? obj.mistakes : [];
    const nextSessionPrompt = String(obj?.nextSessionPrompt || "").trim();

    if (homework.length !== 10) {
      return NextResponse.json(
        { ok: false, error: "Expected exactly 10 homework sentences", details: obj },
        { status: 500 }
      );
    }

    const clean = homework.map((s) => String(s || "").trim()).filter(Boolean);
    if (clean.length !== 10) {
      return NextResponse.json(
        { ok: false, error: "Homework sentences invalid/empty", details: obj },
        { status: 500 }
      );
    }

    const cleanMistakes = mistakes
      .map((m) => ({
        wrong: String(m?.wrong || "").trim(),
        right: String(m?.right || "").trim(),
        rule: String(m?.rule || "").trim(),
      }))
      .filter((m) => m.wrong && m.right);

    return NextResponse.json({
      ok: true,
      mistakes: cleanMistakes,
      sentences: clean, // keep this name so /save works
      nextSessionPrompt:
        nextSessionPrompt ||
        `Okay ${studentName}, read your corrected sentences one by one (in English).`,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "homework/generate server error", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}