import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
You are Amin Sir AI Speaking Coach.

IDENTITY:
- You are a speaking partner and spoken-English coach.
- You are NOT a grammar lecturer.
- You are NOT here to teach the whole lesson again.
- The student has already listened to the e-book lesson.
- Your job is to help the student speak about what they learned.

MAIN GOAL:
- Keep the student talking.
- Help the student express ideas in simple English.
- Correct briefly when needed.
- Encourage natural spoken English.
- Let the student lead when possible.

SPEAKING RATIO:
- Student should speak most of the time.
- You should speak very little.
- Keep your replies short, usually 1 or 2 short sentences.
- Maximum 3 short sentences only if really needed.

VERY IMPORTANT BEHAVIOR:
- Start from the lesson, but do not re-teach the lesson.
- Ask what the student learned and understood.
- Ask the student to make sentences from the lesson.
- If the student goes slightly off-script but stays normal and ethical, continue naturally.
- If the student asks for help, help naturally.
- If the student asks for the full sentence, give the full sentence and ask them to repeat.
- If the student speaks in Hindi or Hinglish, reply naturally in simple Hindi/Hinglish and guide them back into simple English speaking.
- If the student is trying to speak, do not keep blocking them with rigid correction.
- Be flexible, natural, friendly, and teacher-like.

LESSON SCOPE:
- Today's lesson is only about:
  - English is a language.
  - English has parts of speech.
  - English needs structure like a house needs materials.
- Today lesson introduces the idea of parts of speech only.
- Do NOT start teaching noun, verb, adjective, adverb, or grammar details on your own.
- Do NOT ask questions about noun, verb, adjective, article, etc. unless the student clearly brings them up first.
- Stay within today's lesson scope.

WHAT TO ASK:
- What did you learn today?
- What did you understand from the lesson?
- Can you say it in one full sentence?
- Can you make your own sentence?
- Can you say that in simple English?
- Good, now speak one more sentence.

WHAT NOT TO DO:
- Do not behave like a grammar examiner.
- Do not ask random grammar questions.
- Do not introduce future topics by yourself.
- Do not give long explanations.
- Do not lecture.
- Do not ask random unrelated questions.
- Do not ask the student's name if already known.
- Do not keep repeating only "Good try" without useful help.

CORRECTION STYLE:
- First appreciate briefly.
- Then correct simply.
- Then push the student to speak again.
- Keep correction short and spoken-English focused.

GOOD EXAMPLES:
- "Good. Now say it in one full sentence."
- "Very good. Ab bolo: English is a language."
- "Theek hai. Repeat karo: Today I learned about parts of speech."
- "Nice. What did you understand?"
- "Good. Make one more sentence."
- "Achha. Simple English mein bolo."

OPENING STYLE:
- Start naturally.
- Example style:
  "Welcome Ali. Chaliye, jo aapne e-book mein lesson suna uski speaking practice karte hain. What did you learn today?"

TONE:
- Friendly
- Natural
- Supportive
- Spoken-English practice partner
`;

function buildOpening(studentName) {
  return `Welcome ${studentName}. Chaliye, jo aapne e-book mein lesson suna uski speaking practice karte hain. What did you learn today?`;
}

function isHindiOrHinglish(text) {
  const t = String(text || "").toLowerCase();

  const hints = [
    "aaj",
    "maine",
    "seekha",
    "kya",
    "kaise",
    "bolo",
    "bataye",
    "batao",
    "aap",
    "main",
    "mujhe",
    "samjhao",
    "samjha",
    "hindi",
    "theek",
    "sahi",
    "achha",
    "chaliye",
    "karte hain",
    "practice",
    "repeat karo",
    "sentence bolo",
    "full sentence bolo",
    "samjha kya",
    "samajh",
  ];

  return hints.some((w) => t.includes(w));
}

function wantsModelSentence(text) {
  const t = String(text || "").toLowerCase();

  const patterns = [
    "you tell me",
    "tell me the full sentence",
    "say the full sentence",
    "you say the sentence",
    "aap bolo",
    "aap full sentence bolo",
    "full sentence bolo",
    "aap sentence bolo",
    "aap batao",
    "pehle aap bolo",
    "main repeat karunga",
    "main repeat karoonga",
    "i will repeat",
    "repeat ke liye bolo",
    "you say first",
  ];

  return patterns.some((p) => t.includes(p));
}

function mentionsLessonIdea(text) {
  const t = String(text || "").toLowerCase();

  return (
    t.includes("english") ||
    t.includes("language") ||
    t.includes("parts of speech") ||
    t.includes("part of speech") ||
    t.includes("structure") ||
    t.includes("materials") ||
    t.includes("house")
  );
}

function asksGrammarDetail(text) {
  const t = String(text || "").toLowerCase();

  const patterns = [
    "what is noun",
    "what is verb",
    "what is adjective",
    "define noun",
    "define verb",
    "define adjective",
    "noun kya hai",
    "verb kya hai",
    "adjective kya hai",
  ];

  return patterns.some((p) => t.includes(p));
}

function buildMessages({ mode, message, history, studentName }) {
  const messages = [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
  ];

  if (mode === "opening") {
    messages.push({
      role: "user",
      content: `Start speaking practice for ${studentName}. Greet the student naturally, say that now you will do speaking practice from the e-book lesson they listened to, and ask what they learned today. Keep it short, natural, and friendly.`,
    });
    return messages;
  }

  const safeHistory = Array.isArray(history) ? history.slice(-10) : [];

  for (const item of safeHistory) {
    if (!item || !item.role || !item.content) continue;
    if (item.role === "assistant" || item.role === "user") {
      messages.push({
        role: item.role,
        content: String(item.content),
      });
    }
  }

  messages.push({
    role: "user",
    content: `
Student name: ${studentName}
Student message: "${String(message || "").trim()}"

Signals:
- Hindi/Hinglish: ${isHindiOrHinglish(message) ? "yes" : "no"}
- Wants model sentence: ${wantsModelSentence(message) ? "yes" : "no"}
- Mentions lesson idea: ${mentionsLessonIdea(message) ? "yes" : "no"}
- Asks grammar detail: ${asksGrammarDetail(message) ? "yes" : "no"}

Reply instructions:
- You are a speaking partner, not a grammar teacher.
- Keep the reply short: 1 or 2 short sentences, maximum 3 if needed.
- First briefly appreciate or correct.
- Then ask one short speaking question or give one short speaking prompt.
- Stay within today's lesson scope.
- Do not start teaching grammar details unless the student clearly asks.
- If the student asks for the full sentence, give the full sentence.
- If the student speaks in Hindi/Hinglish, reply naturally in simple Hindi/Hinglish and guide back to simple English speaking.
- If the student says something normal and ethical that is slightly outside the exact lesson line, continue naturally and keep it as speaking practice.
- Keep student talking.

Good style examples:
- "Good. Now say it in one full sentence."
- "Bahut achha. Ab bolo: English is a language."
- "Theek hai. Repeat karo: Today I learned about parts of speech."
- "Nice. What did you understand from the lesson?"
- "Good. Make one more sentence."
- "Achha. Simple English mein bolo."

Now write the best next coach reply.
    `.trim(),
  });

  return messages;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const mode = String(body?.mode || "reply");
    const message = String(body?.message || "").trim();
    const history = Array.isArray(body?.history) ? body.history : [];
    const studentName = String(body?.studentName || "Student").trim() || "Student";

    if (mode !== "opening" && !message) {
      return Response.json(
        { error: "Message is required for reply mode" },
        { status: 400 }
      );
    }

    if (mode === "reply" && wantsModelSentence(message) && message.toLowerCase().includes("parts of speech")) {
      const directReply = isHindiOrHinglish(message)
        ? "Theek hai. Repeat karo: Today I learned about parts of speech."
        : "Okay. Repeat after me: Today I learned about parts of speech.";
      return Response.json({ text: directReply });
    }

    if (mode === "reply" && wantsModelSentence(message) && message.toLowerCase().includes("english")) {
      const directReply = isHindiOrHinglish(message)
        ? "Theek hai. Repeat karo: English is a language."
        : "Okay. Repeat after me: English is a language.";
      return Response.json({ text: directReply });
    }

    if (mode === "reply" && wantsModelSentence(message)) {
      const directReply = isHindiOrHinglish(message)
        ? "Theek hai. Main bolta hoon. Repeat karo: Today I learned about the lesson."
        : "Okay. Repeat after me: Today I learned about the lesson.";
      return Response.json({ text: directReply });
    }

    if (mode === "reply" && asksGrammarDetail(message)) {
      const directReply = isHindiOrHinglish(message)
        ? "Aaj hum grammar detail mein nahi ja rahe. Abhi speaking practice karte hain. Bolo: English has parts of speech."
        : "Today we are not going into grammar detail. Now say: English has parts of speech.";
      return Response.json({ text: directReply });
    }

    const messages = buildMessages({
      mode,
      message,
      history,
      studentName,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.3,
      max_tokens: 90,
    });

    let text = completion.choices?.[0]?.message?.content?.trim() || "";

    if (!text) {
      text =
        mode === "opening"
          ? buildOpening(studentName)
          : "Good. Now say: English is a language.";
    }

    return Response.json({ text });
  } catch (error) {
    console.error("simple-practice route error:", error);

    return Response.json(
      {
        text: "Theek hai. Ab bolo: English is a language.",
      },
      { status: 200 }
    );
  }
}