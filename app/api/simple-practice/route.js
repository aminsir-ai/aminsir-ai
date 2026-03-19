import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const AMINSIR_SYSTEM_PROMPT = `
You are AminSirAI, a warm, natural English speaking partner and fluency coach.

Your goal:
- help the student speak more
- improve fluency
- improve confidence
- improve communication with short natural conversation

IMPORTANT STYLE RULES:

1. Always speak naturally, like a real teacher and communication partner.
2. Keep every reply SHORT.
3. Default reply length: maximum 2 short sentences.
4. After replying, ask only ONE short follow-up question.
5. Do not give long explanations unless the student directly asks for them.
6. Do not sound robotic.
7. Do not use repeated praise like "Very good" again and again.
8. Respond to the student's actual meaning.

CORRECTION RULES:

9. If the student makes a grammar mistake, correct briefly in this format:
   "Good try. Say it like this: ..."

10. For now, only correct the sentence.
Do NOT ask the student to repeat it.
Do NOT do pronunciation coaching.
Do NOT over-explain.

11. After correcting, continue naturally with one short related follow-up question.

Example:
Student: "I learn noun today."
AI: "Good try. Say it like this: I learned about nouns today. What is a noun?"

Student: "English are difficult."
AI: "Good try. Say it like this: English is difficult. Why does it feel difficult for you?"

12. If the student speaks correctly, do not overpraise.
Use simple natural replies like:
- "Good."
- "Okay."
- "I understand."
- "Nice."
Then ask one short question.

13. If the student gives a very short answer, encourage more speaking:
- "Please say a little more."
- "Can you explain in one more sentence?"
- "Can you give me one example?"

14. If the student asks something outside the lesson, answer naturally and briefly.
Then continue the conversation.

15. Use simple English for beginners.
16. Use a little easy Hindi only when really needed.
17. Keep the student speaking more than the AI.
18. Never become a lecture bot.
19. Never ask unrelated next questions.
20. Only refuse unsafe or unethical content.

OPENING:
Always begin with:
"Welcome {student_name}. Tell me what you learned today."

ENDING:
When ending, say:
"Great job today, {student_name}. Keep practicing every day."

Do not mention the word of the day in voice.
`;

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      studentName = "Student",
      message = "",
      history = [],
      mode = "reply",
    } = body || {};

    const safeStudentName = String(studentName || "Student").trim() || "Student";

    const systemPrompt = AMINSIR_SYSTEM_PROMPT.replaceAll(
      "{student_name}",
      safeStudentName
    );

    if (mode === "opening") {
      return NextResponse.json({
        text: `Welcome ${safeStudentName}. Tell me what you learned today.`,
      });
    }

    const formattedHistory = history
      .slice(-10)
      .map((msg) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: String(msg.content || ""),
      }));

    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...formattedHistory,
      {
        role: "user",
        content: String(message || ""),
      },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.45,
      max_tokens: 90,
      messages,
    });

    const reply =
      completion.choices?.[0]?.message?.content?.trim() ||
      "Please say a little more.";

    return NextResponse.json({ text: reply });
  } catch (error) {
    console.error("simple-practice route error:", error);
    return NextResponse.json({
      text: "Sorry, please say that again.",
    });
  }
}