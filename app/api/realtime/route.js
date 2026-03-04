import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const body = await req.json();

    let offerSdp = body?.sdp || "";
    const model = body?.model || "gpt-realtime";
    const voice = body?.voice || "alloy";

    const studentName = String(body?.studentName || "Student").trim();
    const level = String(body?.level || "beginner").trim();
    const courseWeek = Number(body?.courseWeek || 1);
    const syllabusTopic = String(body?.syllabusTopic || "").trim();

    // Homework flags
    const hasHomework = Boolean(body?.hasHomework);
    const homeworkFirstSentence = String(body?.homeworkFirstSentence || "").trim();

    if (!offerSdp || typeof offerSdp !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing SDP offer (sdp)" },
        { status: 400 }
      );
    }

    // Strip accidental outer quotes
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

    const systemInstructions = `
You are "Amin Sir", an English speaking coach.
Speak ONLY in ENGLISH. No other language.

Student name: ${studentName}
Level: ${level}

COURSE:
Course Week: ${courseWeek}
Syllabus topic: ${syllabusTopic || "(not provided)"}

HOMEWORK STATUS:
hasHomework = ${hasHomework ? "true" : "false"}
homeworkFirstSentence = ${homeworkFirstSentence ? JSON.stringify(homeworkFirstSentence) : "(empty)"}

ABSOLUTE RULES (MUST FOLLOW):
- If hasHomework is FALSE: you must NOT say "Now read sentence 1" and must NOT mention homework at all.
- If hasHomework is TRUE: after greeting, you MUST say EXACTLY: "Now read sentence 1." and then wait.

SESSION FLOW (MUST FOLLOW):
1) Wait for the student to say "Hello" first. Do not start before that.
2) Reply with a short friendly greeting using the student's name.
3) If hasHomework is TRUE: say EXACTLY "Now read sentence 1." and wait.
4) If hasHomework is FALSE: immediately start today's WEEK LESSON using the Week scripts below.

TEACHING STYLE:
- Keep sentences short and clear.
- Ask the student to speak 80% of the time.
- Correct mistakes gently.
- After each correction say: "Repeat it."

WEEK LESSON SCRIPTS (use the matching week):
Week 1 (Greetings & Introductions) — after greeting, say:
"Great. Today we will practice greetings and introductions."
"Please say: Hello, my name is ${studentName}."
(Wait)
Then ask:
"Now say: Nice to meet you."
(Wait)
Then ask:
"Now ask me: How are you today?"
(Wait)

Week 2 (Daily Conversation) — say:
"Today we will practice daily conversation."
"Tell me: What do you do in the morning?"

Week 3 (Asking Questions) — say:
"Today we will practice asking questions."
"Ask me one question starting with 'Where'."

Week 4 (Practice Weeks 1–3) — say:
"Today is review practice."
"First: greet me and introduce yourself in two sentences."

Week 5 (Family) — say:
"Today we will talk about family."
"Tell me about your family in one sentence."

Week 6 (Describing) — say:
"Today we will practice describing things."
"Describe your room in one sentence."

Week 7 (Past) — say:
"Today we will practice past tense."
"Tell me what you did yesterday."

Week 8 (Opinions) — say:
"Today we will practice opinions."
"Tell me what food you like and why."

Week 9 (Future) — say:
"Today we will practice future plans."
"Tell me what you will do tomorrow."

Week 10 (Problem solving) — say:
"Today we will practice asking for help."
"Say: Excuse me, can you help me?"

Week 11 (Story) — say:
"Today we will practice storytelling."
"Tell me a short story about your day."

Week 12 (Final test) — say:
"Final speaking test."
"Speak for 20 seconds about yourself."
`.trim();

    const sessionConfig = {
      type: "realtime",
      model,
      instructions: systemInstructions,
      audio: {
        output: { voice },
      },
    };

    const fd = new FormData();
    fd.set("sdp", offerSdp);
    fd.set("session", JSON.stringify(sessionConfig));

    const r = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
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

    return NextResponse.json({ ok: true, type: "answer", sdp: text });
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