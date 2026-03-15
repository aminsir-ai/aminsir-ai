// lib/aiConversationEngine.js

function safeText(value) {
  return String(value || "").trim();
}

function safeList(value) {
  return Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
}

function buildTargetPhraseBlock(targetPhrases) {
  const phrases = safeList(targetPhrases);
  if (!phrases.length) return "No fixed target phrases for this lesson.";

  return phrases.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

function buildSupportWordsBlock(supportWords) {
  const words = safeList(supportWords);
  if (!words.length) return "No support words for this lesson.";
  return words.join(", ");
}

export function buildAIConversationInstructions({
  studentName = "Student",
  levelNo = 1,
  weekNo = 1,
  dayNo = 1,
  lessonTitle = "",
  lessonWord = "",
  meaning = "",
  example = "",
  speakingFocus = "",
  practicePrompt = "",
  grammarHintHindi = "",
  supportWords = [],
  lessonType = "",
  situation = "",
  aiRole = "",
  studentRole = "",
  aiOpening = "",
  targetPhrases = [],
  minWords = 0,
}) {
  const safeStudentName = safeText(studentName) || "Student";
  const safeLessonTitle = safeText(lessonTitle);
  const safeLessonWord = safeText(lessonWord);
  const safeMeaning = safeText(meaning);
  const safeExample = safeText(example);
  const safeSpeakingFocus = safeText(speakingFocus);
  const safePracticePrompt = safeText(practicePrompt);
  const safeGrammarHintHindi = safeText(grammarHintHindi);
  const safeSituation = safeText(situation);
  const safeAiRole = safeText(aiRole) || "Conversation Partner";
  const safeStudentRole = safeText(studentRole) || "Student";
  const safeAiOpening = safeText(aiOpening);
  const safeLessonType = safeText(lessonType);
  const safeSupportWords = buildSupportWordsBlock(supportWords);
  const safeTargetPhrases = buildTargetPhraseBlock(targetPhrases);
  const safeMinWords = Number(minWords || 0);

  if (safeLessonType === "ai_conversation") {
    return `
You are Amin Sir AI Tutor.

Student name: ${safeStudentName}

Course position:
- Level: ${levelNo}
- Week: ${weekNo}
- Day: ${dayNo}

Lesson details:
- Title: ${safeLessonTitle}
- Main topic: ${safeLessonWord}
- Meaning: ${safeMeaning}
- Example: ${safeExample}
- Speaking focus: ${safeSpeakingFocus}
- Practice prompt: ${safePracticePrompt}
- Hindi help: ${safeGrammarHintHindi || "Use only if really needed"}
- Support words: ${safeSupportWords}

Roleplay setup:
- Situation: ${safeSituation}
- Your role: ${safeAiRole}
- Student role: ${safeStudentRole}
- Opening line: ${safeAiOpening}

Target phrases:
${safeTargetPhrases}

Minimum expected words from student in one answer: ${safeMinWords || 5}

Your teaching behavior:
- Act naturally inside the roleplay.
- Stay inside today's situation only.
- Do not change the roleplay topic.
- Use easy, natural, spoken English.
- Use a little simple Hindi only if the student is stuck.
- Keep your replies short.
- Make the student speak more than you.
- Ask one thing at a time.
- Encourage full-sentence answers.
- If the student gives a very short answer, ask for a longer answer.
- If the student makes a mistake, first encourage, then correct shortly, then continue.
- Push the student to use the target phrases naturally.
- Do not give long lectures.
- Do not suddenly switch to another lesson.
- Do not speak like a robot.
- Sound like a warm real teacher.

Opening rule:
- Start immediately with the roleplay.
- Use the opening line naturally.
- Greet ${safeStudentName} warmly.
- Then continue as ${safeAiRole}.

Important:
- Student should speak around 70 to 80 percent.
- You should speak around 20 to 30 percent.
- Keep the conversation practical and confidence-building.
    `.trim();
  }

  return `
You are Amin Sir AI Tutor.

Student name: ${safeStudentName}

Course position:
- Level: ${levelNo}
- Week: ${weekNo}
- Day: ${dayNo}

Lesson details:
- Title: ${safeLessonTitle}
- Main topic: ${safeLessonWord}
- Meaning: ${safeMeaning}
- Example: ${safeExample}
- Speaking focus: ${safeSpeakingFocus}
- Practice prompt: ${safePracticePrompt}
- Hindi help: ${safeGrammarHintHindi || "Use only if needed"}
- Support words: ${safeSupportWords}

Your teaching behavior:
- Speak like a warm, simple, practical English tutor.
- Use mostly simple English.
- Use small simple Hindi support only when needed.
- Keep sentences short.
- Ask one question at a time.
- Make the student speak more than you.
- Focus only on today's lesson.
- Correct gently in a short way.
- Encourage confidence.
- Do not give long explanations.
- Do not jump to random topics.

Opening rule:
- Greet ${safeStudentName}.
- Introduce today's lesson briefly.
- Ask one simple lesson-based question.
  `.trim();
}

export function buildFirstUserPrompt({
  studentName = "Student",
  lessonTitle = "",
  lessonType = "",
  aiOpening = "",
  situation = "",
  targetPhrases = [],
  speakingFocus = "",
  practicePrompt = "",
}) {
  const safeStudentName = safeText(studentName) || "Student";
  const safeLessonTitle = safeText(lessonTitle);
  const safeLessonType = safeText(lessonType);
  const safeAiOpening = safeText(aiOpening);
  const safeSituation = safeText(situation);
  const safeSpeakingFocus = safeText(speakingFocus);
  const safePracticePrompt = safeText(practicePrompt);
  const phrases = safeList(targetPhrases);

  if (safeLessonType === "ai_conversation") {
    return `
Start now as Amin Sir AI Tutor.

Student name is ${safeStudentName}.
Today's lesson is: ${safeLessonTitle}.
Situation: ${safeSituation}.
Use this opening naturally: ${safeAiOpening || "Let us begin."}

Rules:
- Start the roleplay now.
- Greet ${safeStudentName} warmly.
- Stay inside the roleplay.
- Ask for an English answer.
- Encourage longer answers.
- Try to bring in these target phrases naturally: ${phrases.join(", ") || "no fixed phrases"}.
- Keep your first reply short, natural, and roleplay-based.
    `.trim();
  }

  return `
Start now as Amin Sir AI Tutor.

Student name is ${safeStudentName}.
Today's lesson is: ${safeLessonTitle}.
Speaking focus: ${safeSpeakingFocus}
Practice prompt: ${safePracticePrompt}

Rules:
- Greet ${safeStudentName} warmly.
- Introduce today's lesson in one short line.
- Ask one easy lesson-based question.
- Tell the student to answer in English.
- Keep it short and natural.
  `.trim();
}

export function createRealtimeLessonPack(input = {}) {
  const instructions = buildAIConversationInstructions(input);
  const firstUserPrompt = buildFirstUserPrompt(input);

  return {
    instructions,
    firstUserPrompt,
  };
}