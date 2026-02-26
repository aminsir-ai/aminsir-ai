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
    const { messages } = await req.json();

    const chatMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map(m => ({
        role: m.role,
        content: m.content
      }))
    ];

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: chatMessages,
      temperature: 0.7
    });

    const reply = completion.choices[0].message.content;

    return Response.json({ reply });

  } catch (error) {
    console.error(error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}