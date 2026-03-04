import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
You are Amin Sir AI Tutor — a friendly English teacher for Indian students.

Rules:
• Use simple English
• Sometimes explain in easy Hindi (Hinglish)
• Correct grammar gently
• Encourage the student
• Give 1 short practice sentence
• Never say "wrong", say "Good try, let's improve it"
`;

export async function POST(req) {
  try {
    const body = await req.json();

    // Support BOTH formats:
    // 1) { message: "hello" }
    // 2) { messages: [{ role, content }, ...] }
    let messages = [];

    if (Array.isArray(body?.messages)) {
      messages = body.messages;
    } else if (typeof body?.message === "string" && body.message.trim()) {
      messages = [{ role: "user", content: body.message.trim() }];
    }

    const chatMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map((m) => ({
        role: m.role || "user",
        content: m.content || "",
      })),
    ];

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: chatMessages,
      temperature: 0.7,
    });

    const reply = completion?.choices?.[0]?.message?.content || "";

    return Response.json({ reply });
  } catch (error) {
    console.error(error);
    return Response.json({ error: error.message || "Unknown error" }, { status: 500 });
  }
}