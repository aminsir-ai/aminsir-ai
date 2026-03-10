"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { COURSE_DATA } from "@/lib/courseData";

const LEVEL1_OBJECTS = [
  { word: "water", emoji: "💧", verb: "drink" },
  { word: "milk", emoji: "🥛", verb: "drink" },
  { word: "tea", emoji: "☕", verb: "drink" },
  { word: "juice", emoji: "🧃", verb: "drink" },
  { word: "apple", emoji: "🍎", verb: "eat" },
  { word: "banana", emoji: "🍌", verb: "eat" },
  { word: "orange", emoji: "🍊", verb: "eat" },
  { word: "mango", emoji: "🥭", verb: "eat" },
  { word: "rice", emoji: "🍚", verb: "eat" },
  { word: "bread", emoji: "🍞", verb: "eat" },
  { word: "egg", emoji: "🥚", verb: "eat" },
  { word: "cake", emoji: "🍰", verb: "eat" },
  { word: "book", emoji: "📘", verb: "read" },
  { word: "story book", emoji: "📖", verb: "read" },
  { word: "lesson", emoji: "📚", verb: "read" },
  { word: "note", emoji: "📝", verb: "read" },
  { word: "pen", emoji: "🖊️", verb: "write" },
  { word: "pencil", emoji: "✏️", verb: "write" },
  { word: "notebook", emoji: "📓", verb: "write" },
  { word: "paper", emoji: "📄", verb: "write" },
  { word: "bed", emoji: "🛏️", verb: "sleep" },
  { word: "pillow", emoji: "🛌", verb: "sleep" },
  { word: "ball", emoji: "⚽", verb: "play" },
  { word: "football", emoji: "⚽", verb: "play" },
  { word: "cricket", emoji: "🏏", verb: "play" },
  { word: "song", emoji: "🎤", verb: "sing" },
  { word: "music", emoji: "🎵", verb: "sing" },
  { word: "school", emoji: "🏫", verb: "go" },
  { word: "home", emoji: "🏠", verb: "go" },
  { word: "park", emoji: "🌳", verb: "go" },
  { word: "market", emoji: "🛒", verb: "go" },
  { word: "mosque", emoji: "🕌", verb: "go" },
  { word: "friend", emoji: "🧑", verb: "meet" },
  { word: "teacher", emoji: "👨‍🏫", verb: "meet" },
  { word: "doctor", emoji: "🩺", verb: "meet" },
  { word: "mother", emoji: "👩", verb: "call" },
  { word: "father", emoji: "👨", verb: "call" },
  { word: "chair", emoji: "🪑", verb: "sit" },
  { word: "bench", emoji: "🪑", verb: "sit" },
  { word: "sofa", emoji: "🛋️", verb: "sit" },
  { word: "door", emoji: "🚪", verb: "open" },
  { word: "window", emoji: "🪟", verb: "open" },
  { word: "box", emoji: "📦", verb: "open" },
  { word: "bag", emoji: "🎒", verb: "carry" },
  { word: "school bag", emoji: "🎒", verb: "carry" },
  { word: "basket", emoji: "🧺", verb: "carry" },
  { word: "bicycle", emoji: "🚲", verb: "ride" },
  { word: "bike", emoji: "🏍️", verb: "ride" },
  { word: "bus", emoji: "🚌", verb: "ride" },
  { word: "car", emoji: "🚗", verb: "drive" },
  { word: "road", emoji: "🛣️", verb: "walk" },
  { word: "street", emoji: "🚶", verb: "walk" },
  { word: "field", emoji: "🏃", verb: "run" },
  { word: "computer", emoji: "💻", verb: "work" },
  { word: "laptop", emoji: "💻", verb: "work" },
  { word: "desk", emoji: "🪑", verb: "work" },
  { word: "class", emoji: "🏫", verb: "study" },
  { word: "English", emoji: "🔤", verb: "study" },
  { word: "lesson book", emoji: "📘", verb: "study" },
  { word: "student", emoji: "🧑‍🎓", verb: "teach" },
  { word: "classroom", emoji: "🏫", verb: "teach" },
  { word: "board", emoji: "⬛", verb: "teach" },
  { word: "English words", emoji: "🔤", verb: "learn" },
  { word: "vocabulary", emoji: "📚", verb: "learn" },
  { word: "lesson card", emoji: "🗂️", verb: "learn" },
  { word: "flower", emoji: "🌸", verb: "buy" },
  { word: "shirt", emoji: "👕", verb: "buy" },
  { word: "shoes", emoji: "👟", verb: "buy" },
  { word: "fruits", emoji: "🍎", verb: "buy" },
  { word: "rain", emoji: "🌧️", verb: "watch" },
  { word: "movie", emoji: "🎬", verb: "watch" },
  { word: "TV", emoji: "📺", verb: "watch" },
  { word: "moon", emoji: "🌙", verb: "watch" },
  { word: "parents", emoji: "👨‍👩‍👧", verb: "help" },
  { word: "tree", emoji: "🌳", verb: "see" },
  { word: "bird", emoji: "🐦", verb: "see" },
  { word: "cat", emoji: "🐱", verb: "see" },
  { word: "dog", emoji: "🐶", verb: "see" },
  { word: "sun", emoji: "☀️", verb: "see" },
  { word: "star", emoji: "⭐", verb: "see" },
  { word: "clock", emoji: "⏰", verb: "see" },
];

const LEVEL1_PATTERNS = [
  {
    key: "i",
    label: "I",
    hint: "I eat = main khaata hoon. Now speak in English only.",
    build: (verb, word) => {
      if (word === "school") return "I go to school";
      if (word === "home") return "I go home";
      if (word === "market") return "I go to the market";
      if (word === "park" && verb === "go") return "I go to the park";
      if (word === "mosque") return "I go to the mosque";
      if (word === "tea") return "I drink tea";
      if (word === "juice") return "I drink juice";
      if (word === "milk") return "I drink milk";
      if (word === "water") return "I drink water";
      if (word === "rice") return "I eat rice";
      if (word === "bread") return "I eat bread";
      if (word === "cake") return "I eat cake";
      if (word === "egg") return "I eat an egg";
      if (word === "apple") return "I eat an apple";
      if (word === "banana") return "I eat a banana";
      if (word === "orange") return "I eat an orange";
      if (word === "mango") return "I eat a mango";
      if (word === "book") return "I read a book";
      if (word === "story book") return "I read a story book";
      if (word === "lesson") return "I read the lesson";
      if (word === "note") return "I read a note";
      if (word === "pen") return "I write with a pen";
      if (word === "pencil") return "I write with a pencil";
      if (word === "notebook") return "I write in a notebook";
      if (word === "paper") return "I write on paper";
      if (word === "bed") return "I sleep on the bed";
      if (word === "pillow") return "I sleep on the pillow";
      if (word === "ball") return "I play with a ball";
      if (word === "football") return "I play football";
      if (word === "cricket") return "I play cricket";
      if (word === "song") return "I sing a song";
      if (word === "music") return "I sing music";
      if (word === "friend" && verb === "meet") return "I meet my friend";
      if (word === "teacher" && verb === "meet") return "I meet my teacher";
      if (word === "doctor" && verb === "meet") return "I meet the doctor";
      if (word === "mother" && verb === "call") return "I call my mother";
      if (word === "father" && verb === "call") return "I call my father";
      if (word === "chair") return "I sit on a chair";
      if (word === "bench") return "I sit on the bench";
      if (word === "sofa") return "I sit on the sofa";
      if (word === "door") return "I open the door";
      if (word === "window") return "I open the window";
      if (word === "box") return "I open the box";
      if (word === "bag" || word === "school bag") return "I carry a bag";
      if (word === "basket") return "I carry a basket";
      if (word === "bicycle") return "I ride a bicycle";
      if (word === "bike") return "I ride a bike";
      if (word === "bus") return "I ride a bus";
      if (word === "car") return "I drive a car";
      if (word === "road") return "I walk on the road";
      if (word === "street") return "I walk on the street";
      if (word === "field") return "I run in the field";
      if (word === "computer") return "I work on the computer";
      if (word === "laptop") return "I work on the laptop";
      if (word === "desk") return "I work at the desk";
      if (word === "class") return "I study in class";
      if (word === "lesson book") return "I study from the lesson book";
      if (word === "English") return "I study English";
      if (word === "student") return "I teach a student";
      if (word === "classroom") return "I teach in the classroom";
      if (word === "board") return "I teach on the board";
      if (word === "English words") return "I learn English words";
      if (word === "vocabulary") return "I learn vocabulary";
      if (word === "lesson card") return "I learn from the lesson card";
      if (word === "flower") return "I buy a flower";
      if (word === "shirt") return "I buy a shirt";
      if (word === "shoes") return "I buy shoes";
      if (word === "fruits") return "I buy fruits";
      if (word === "rain") return "I watch the rain";
      if (word === "movie") return "I watch a movie";
      if (word === "TV") return "I watch TV";
      if (word === "moon" && verb === "watch") return "I watch the moon";
      if (word === "parents") return "I help my parents";
      if (word === "tree") return "I see a tree";
      if (word === "bird") return "I see a bird";
      if (word === "cat") return "I see a cat";
      if (word === "dog") return "I see a dog";
      if (word === "sun") return "I see the sun";
      if (word === "star") return "I see a star";
      if (word === "clock") return "I see a clock";
      return `I ${verb} ${/^[aeiou]/i.test(word) ? "an" : "a"} ${word}`;
    },
  },
  {
    key: "letme",
    label: "Let me",
    hint: "Let me eat = mujhe khaane do. Now speak in English only.",
    build: (verb, word) =>
      `Let me ${LEVEL1_PATTERNS[0].build(verb, word).replace(/^I\s+/i, "")}`,
  },
  {
    key: "iwantto",
    label: "I want to",
    hint: "I want to eat = main khaana chahta hoon. Now speak in English only.",
    build: (verb, word) =>
      `I want to ${LEVEL1_PATTERNS[0].build(verb, word).replace(/^I\s+/i, "")}`,
  },
];

const TOTAL_GAME_ROUNDS = 3;
const CARDS_PER_ROUND = 5;
const TOTAL_GAME_CARDS = TOTAL_GAME_ROUNDS * CARDS_PER_ROUND;

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePhraseText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectTargetPhrasesInText(text, targetPhrases = []) {
  const normalizedText = normalizePhraseText(text);
  if (!normalizedText) return [];

  const found = [];

  targetPhrases.forEach((phrase) => {
    const normalizedPhrase = normalizePhraseText(phrase);
    if (!normalizedPhrase) return;

    if (
      normalizedText.includes(normalizedPhrase) ||
      normalizedPhrase.split(" ").every((word) => normalizedText.includes(word))
    ) {
      found.push(phrase);
    }
  });

  return Array.from(new Set(found));
}

function getLevelMeta(levelNo) {
  const levelObj =
    COURSE_DATA?.levels?.find((item) => item.id === `level${Number(levelNo || 1)}`) || null;
  const weeks = Array.isArray(levelObj?.weeks) ? levelObj.weeks : [];
  return { levelObj, weeks };
}

function getTotalWeeksInLevel(levelNo) {
  const { weeks } = getLevelMeta(levelNo);
  return weeks.length || 4;
}

function getDaysInWeek(levelNo, weekNo) {
  const { weeks } = getLevelMeta(levelNo);
  const weekObj = weeks.find((item) => item.id === `week${Number(weekNo || 1)}`) || null;
  return Array.isArray(weekObj?.days) && weekObj.days.length ? weekObj.days.length : 7;
}

function getLastLessonPosition(levelNo) {
  const safeLevel = Number(levelNo || 1);
  const totalWeeks = getTotalWeeksInLevel(safeLevel);
  return {
    levelNo: safeLevel,
    weekNo: totalWeeks,
    dayNo: getDaysInWeek(safeLevel, totalWeeks),
  };
}

function isLastLessonOfLevel(levelNo, weekNo, dayNo) {
  const last = getLastLessonPosition(levelNo);
  return (
    Number(levelNo) === last.levelNo &&
    Number(weekNo) === last.weekNo &&
    Number(dayNo) === last.dayNo
  );
}

function getNextLessonPosition(levelNo, weekNo, dayNo) {
  const safeLevel = Number(levelNo || 1);
  const safeWeek = Number(weekNo || 1);
  const safeDay = Number(dayNo || 1);
  const totalWeeks = getTotalWeeksInLevel(safeLevel);
  const daysInCurrentWeek = getDaysInWeek(safeLevel, safeWeek);

  if (safeDay < daysInCurrentWeek) {
    return { levelNo: safeLevel, weekNo: safeWeek, dayNo: safeDay + 1 };
  }

  if (safeWeek < totalWeeks) {
    return { levelNo: safeLevel, weekNo: safeWeek + 1, dayNo: 1 };
  }

  return null;
}

function compareLessonPosition(a, b) {
  const la = Number(a?.levelNo || 0);
  const lb = Number(b?.levelNo || 0);
  if (la !== lb) return la - lb;

  const wa = Number(a?.weekNo || 0);
  const wb = Number(b?.weekNo || 0);
  if (wa !== wb) return wa - wb;

  return Number(a?.dayNo || 0) - Number(b?.dayNo || 0);
}

function getShadowProgressKey(studentId) {
  return `aminSirLevelProgressShadow:${String(studentId || "").trim()}`;
}

function readShadowProgress(studentId) {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(getShadowProgressKey(studentId));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return {
      levelNo: Number(parsed?.levelNo || 1),
      weekNo: Number(parsed?.weekNo || 1),
      dayNo: Number(parsed?.dayNo || 1),
      completed: Boolean(parsed?.completed),
    };
  } catch {
    return null;
  }
}

function writeShadowProgress(studentId, progress) {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(getShadowProgressKey(studentId), JSON.stringify(progress));
  } catch {}
}

function clearShadowProgress(studentId) {
  try {
    if (typeof window === "undefined") return;
    localStorage.removeItem(getShadowProgressKey(studentId));
  } catch {}
}

function getFallbackWordData(level, week, day) {
  return {
    id: `fallback-level${level}-week${week}-day${day}`,
    dayNumber: day,
    title: `Level ${level} Week ${week} Day ${day}`,
    word: `Lesson ${day}`,
    meaning: `Practice simple English speaking for Week ${week}, Day ${day}.`,
    example: `Today I will practice English speaking with confidence.`,
    supportWords: ["speak", "practice", "sentence", "confidence", "daily"],
    speakingFocus: `Day ${day}: Speak 3 to 5 simple sentences with confidence.`,
    grammarHintHindi: "",
    grammarCoachVoice: "",
    practicePrompt: "Speak 3 to 5 simple English sentences.",
    lessonType: "",
    situation: "",
    aiRole: "",
    studentRole: "",
    aiOpening: "",
    targetPhrases: [],
    minWords: 0,
  };
}

function getWordOfDay(level, week, day) {
  const levelObj =
    COURSE_DATA?.levels?.find((item) => item.id === `level${level}`) || null;
  const weekObj = levelObj?.weeks?.find((item) => item.id === `week${week}`) || null;
  const dayObj = weekObj?.days?.find((item) => item.id === `day${day}`) || null;
  return dayObj || getFallbackWordData(level, week, day);
}

function isGrammarLevel(levelNo) {
  return Number(levelNo || 1) === 2;
}

function isLevel3(levelNo) {
  return Number(levelNo || 1) === 3;
}

function isLevel5(levelNo) {
  return Number(levelNo || 1) === 5;
}

function isAIConversationLesson(levelNo, lesson) {
  return isLevel5(levelNo) && lesson?.lessonType === "ai_conversation";
}

function getReadablePatternTitle(levelNo, weekNo) {
  const safeLevel = Number(levelNo || 1);
  const safeWeek = Number(weekNo || 1);

  if (safeLevel === 1) {
    if (safeWeek === 1) return "I + verb";
    if (safeWeek === 2) return "Let me + verb";
    if (safeWeek === 3) return "I want to + verb";
    return "Mixed speaking practice";
  }

  if (safeLevel === 2) {
    if (safeWeek === 1) return "am / are grammar";
    if (safeWeek === 2) return "is grammar";
    if (safeWeek === 3) return "have / has grammar";
    if (safeWeek === 4) return "simple present grammar";
    if (safeWeek === 5) return "question answer grammar";
    return "spoken grammar practice";
  }

  if (safeLevel === 3) {
    if (safeWeek === 1) return "Daily life conversation";
    if (safeWeek === 2) return "Question practice";
    if (safeWeek === 3) return "Description practice";
    if (safeWeek === 4) return "Likes and opinions";
    if (safeWeek === 5) return "Real-life situations";
    if (safeWeek === 6) return "Storytelling and confidence";
    return "Conversation practice";
  }

  if (safeLevel === 5) {
    return "AI conversation practice";
  }

  return "Speaking practice";
}

function getWeekPatternText(levelNo, weekNo) {
  const safeLevel = Number(levelNo || 1);
  const safeWeek = Number(weekNo || 1);

  if (safeLevel === 1) {
    if (safeWeek === 1) return "Pattern: I + verb";
    if (safeWeek === 2) return "Pattern: Let me + verb";
    if (safeWeek === 3) return "Pattern: I want to + verb";
    return "Pattern: Mixed practice";
  }

  if (safeLevel === 2) {
    if (safeWeek === 1) return "Grammar: I / You / We / They + am / are";
    if (safeWeek === 2) return "Grammar: He / She / It + is";
    if (safeWeek === 3) return "Grammar: Have / Has";
    if (safeWeek === 4) return "Grammar: Simple Present Actions";
    if (safeWeek === 5) return "Grammar: Basic Questions and Answers";
    return "Grammar: Spoken English practice";
  }

  if (safeLevel === 3) {
    if (safeWeek === 1) return "Conversation: Daily life and routine";
    if (safeWeek === 2) return "Conversation: Asking and answering questions";
    if (safeWeek === 3) return "Conversation: Describing people, places, and things";
    if (safeWeek === 4) return "Conversation: Likes, dislikes, and opinions";
    if (safeWeek === 5) return "Conversation: Real-life situations";
    if (safeWeek === 6) return "Conversation: Storytelling and confident speaking";
    return "Conversation: Spoken English practice";
  }

  if (safeLevel === 5) {
    return "Conversation: Level 5 AI roleplay practice";
  }

  return "Speaking practice";
}

function getRoundModeText(roundNumber) {
  if (roundNumber === 1) return "Easy Round";
  if (roundNumber === 2) return "Medium Round";
  if (roundNumber === 3) return "Confidence Round";
  return "Practice Round";
}

function getRoundModeHelp(roundNumber) {
  if (roundNumber === 1) return "Round 1: First listen and repeat clearly.";
  if (roundNumber === 2) return "Round 2: Say the sentence more smoothly.";
  if (roundNumber === 3) return "Round 3: Speak naturally with confidence.";
  return "Speak simple English sentences.";
}

function getWeekButtonState(currentLevelNo, selectedLevelNo, currentWeekNo, week) {
  const safeCurrentLevel = Number(currentLevelNo || 1);
  const safeSelectedLevel = Number(selectedLevelNo || 1);
  const safeCurrentWeek = Number(currentWeekNo || 1);
  const safeWeek = Number(week || 1);

  if (safeSelectedLevel < safeCurrentLevel) return "completed";

  if (safeSelectedLevel > safeCurrentLevel) {
    if (safeWeek === 1) return "active";
    return "available";
  }

  if (safeWeek < safeCurrentWeek) return "completed";
  if (safeWeek === safeCurrentWeek) return "active";
  return "available";
}

function getDayButtonState(
  currentLevelNo,
  selectedLevelNo,
  currentWeekNo,
  currentDayNo,
  viewWeek,
  day
) {
  const safeCurrentLevel = Number(currentLevelNo || 1);
  const safeSelectedLevel = Number(selectedLevelNo || 1);
  const safeCurrentWeek = Number(currentWeekNo || 1);
  const safeCurrentDay = Number(currentDayNo || 1);
  const safeViewWeek = Number(viewWeek || 1);
  const safeDay = Number(day || 1);

  if (safeSelectedLevel < safeCurrentLevel) return "completed";

  if (safeSelectedLevel > safeCurrentLevel) {
    if (safeViewWeek === 1 && safeDay === 1) return "active";
    return "available";
  }

  if (safeViewWeek < safeCurrentWeek) return "completed";
  if (safeViewWeek > safeCurrentWeek) return "available";

  if (safeDay < safeCurrentDay) return "completed";
  if (safeDay === safeCurrentDay) return "active";
  return "available";
}

function getLevelButtonState(currentLevelNo, level) {
  if (level < currentLevelNo) return "completed";
  if (level === currentLevelNo) return "active";
  return "available";
}

function getMaxLevelNumber() {
  return Array.isArray(COURSE_DATA?.levels) ? COURSE_DATA.levels.length : 3;
}
function getLessonPriorityObjects(wordData, allObjects) {
  const lessonTerms = [
    wordData?.word,
    ...(Array.isArray(wordData?.supportWords) ? wordData.supportWords : []),
  ]
    .filter(Boolean)
    .map(normalizeText);

  if (!lessonTerms.length) return [];

  return shuffleArray(
    allObjects.filter((item) => {
      const w = normalizeText(item.word);
      return lessonTerms.some((term) => w.includes(term) || term.includes(w));
    })
  );
}

function buildLevel1GameSet(levelNo, weekNo, wordData) {
  const fixedPattern =
    weekNo >= 1 && weekNo <= 3 ? LEVEL1_PATTERNS[weekNo - 1] : null;

  const lessonPriority = getLessonPriorityObjects(wordData, LEVEL1_OBJECTS);
  const mixedPool = shuffleArray(LEVEL1_OBJECTS);
  const used = new Set();
  const cards = [];

  function addCard(item, idx) {
    const key = `${item.word}|${item.verb}|${item.emoji}`;
    if (used.has(key)) return;
    used.add(key);

    const pattern = fixedPattern || LEVEL1_PATTERNS[idx % LEVEL1_PATTERNS.length];

    cards.push({
      ...item,
      roundNumber: Math.floor(idx / CARDS_PER_ROUND) + 1,
      roundMode: getRoundModeText(Math.floor(idx / CARDS_PER_ROUND) + 1),
      patternReadable: getReadablePatternTitle(levelNo, weekNo),
      expected: pattern.build(item.verb, item.word),
      lessonRelated: true,
      promptLine: wordData?.speakingFocus || "Speak the target sentence.",
    });
  }

  [...lessonPriority, ...mixedPool].forEach((item) => {
    if (cards.length < TOTAL_GAME_CARDS) addCard(item, cards.length);
  });

  return cards.slice(0, TOTAL_GAME_CARDS);
}

function buildLevel2ExpectedOptions(wordData) {
  const list = [];
  const baseExample = String(wordData?.example || "").trim();
  const supportWords = Array.isArray(wordData?.supportWords) ? wordData.supportWords : [];
  const title = normalizeText(wordData?.title);
  const word = normalizeText(wordData?.word);

  if (baseExample) list.push(baseExample);

  if (title.includes("i am")) {
    supportWords.forEach((w) =>
      list.push(`I am ${/^(a|e|i|o|u)/i.test(w) ? "an" : "a"} ${w}.`)
    );
    list.push("I am happy.", "I am ready.", "I am at home.");
  } else if (title.includes("you are")) {
    supportWords.forEach((w) => list.push(`You are ${w}.`));
    list.push("You are my friend.", "You are ready.");
  } else if (title.includes("we are")) {
    supportWords.forEach((w) => list.push(`We are ${w}.`));
    list.push("We are friends.", "We are ready.");
  } else if (title.includes("they are")) {
    supportWords.forEach((w) => list.push(`They are ${w}.`));
    list.push("They are workers.", "They are happy.");
  } else if (title.includes("he is")) {
    list.push("He is a doctor.", "He is a driver.", "He is tired.");
  } else if (title.includes("she is")) {
    list.push("She is a teacher.", "She is happy.", "She is strong.");
  } else if (title.includes("it is")) {
    list.push("It is a car.", "It is big.", "It is new.");
  } else if (word === "have") {
    list.push("I have a bike.", "You have a bag.", "We have a plan.", "They have a house.");
  } else if (word === "has") {
    list.push("He has a car.", "She has a phone.", "It has four wheels.");
  } else if (title.includes("what is your name")) {
    list.push("My name is Ali.", "My name is Amin.", "My name is Ahmed.");
  } else if (title.includes("where do you live")) {
    list.push("I live in Abu Dhabi.", "I live in Dubai.", "I live in a village.");
  } else if (title.includes("what do you do")) {
    list.push("I am a driver.", "I work in a shop.", "I work in a company.");
  } else if (title.includes("how are you")) {
    list.push("I am fine, thank you.", "I am good today.", "I am happy.");
  } else if (title.includes("self introduction") || title.includes("basic self introduction")) {
    list.push("My name is Ali.", "I am a driver.", "I live in Dubai.");
  } else if (title.includes("conversation")) {
    list.push("Hello. My name is Ali.", "What is your name?", "I am fine, thank you.");
  } else {
    list.push(baseExample || "I am ready.");
  }

  return Array.from(new Set(list.filter(Boolean))).slice(0, TOTAL_GAME_CARDS);
}

function getGrammarRepeatExamples(wordData) {
  const title = normalizeText(wordData?.title);
  const supportWords = Array.isArray(wordData?.supportWords) ? wordData.supportWords : [];
  const examples = [];

  const add = (text) => {
    const clean = String(text || "").trim();
    if (clean && !examples.includes(clean)) examples.push(clean);
  };

  add(wordData?.example);

  if (title.includes("i am")) {
    add("I am a driver.");
    add("I am a worker.");
    add("I am a student.");
    add("I am happy.");
    add("I am ready.");
  } else if (title.includes("you are")) {
    add("You are my friend.");
    add("You are strong.");
    add("You are a good student.");
  } else if (title.includes("we are")) {
    add("We are students.");
    add("We are friends.");
    add("We are ready.");
  } else if (title.includes("they are")) {
    add("They are workers.");
    add("They are busy.");
    add("They are happy.");
  } else if (title.includes("he is")) {
    add("He is a doctor.");
    add("He is a driver.");
    add("He is tired.");
  } else if (title.includes("she is")) {
    add("She is a teacher.");
    add("She is kind.");
    add("She is happy.");
  } else if (title.includes("it is")) {
    add("It is a car.");
    add("It is big.");
    add("It is new.");
  } else if (title.includes("i have")) {
    add("I have a bike.");
    add("I have a phone.");
    add("I have a bag.");
  } else if (title.includes("you have")) {
    add("You have a good job.");
    add("You have a car.");
    add("You have a nice bag.");
  } else if (title.includes("we have")) {
    add("We have a plan.");
    add("We have work.");
    add("We have friends.");
  } else if (title.includes("they have")) {
    add("They have a house.");
    add("They have a car.");
    add("They have work.");
  } else if (title.includes("he has")) {
    add("He has a car.");
    add("He has a bike.");
    add("He has a job.");
  } else if (title.includes("she has")) {
    add("She has a phone.");
    add("She has a bag.");
    add("She has a book.");
  } else if (title.includes("it has")) {
    add("It has four wheels.");
    add("It has two doors.");
    add("It has a red color.");
  } else if (title.includes("what is your name")) {
    add("My name is Ali.");
    add("My name is Amin.");
    add("My name is Ahmed.");
  } else if (title.includes("where do you live")) {
    add("I live in Abu Dhabi.");
    add("I live in Dubai.");
    add("I live in a village.");
  } else if (title.includes("what do you do")) {
    add("I am a driver.");
    add("I work in a company.");
    add("I work in a shop.");
  } else if (title.includes("how are you")) {
    add("I am fine, thank you.");
    add("I am good today.");
    add("I am happy.");
  } else {
    supportWords.slice(0, 3).forEach((item) => add(item));
  }

  return examples.slice(0, 3);
}

function buildLevel2GameSet(levelNo, weekNo, wordData) {
  const expectedOptions = buildLevel2ExpectedOptions(wordData);

  while (expectedOptions.length < TOTAL_GAME_CARDS) {
    expectedOptions.push(String(wordData?.example || "I am ready.").trim());
  }

  const emoji =
    weekNo === 1
      ? "🧑"
      : weekNo === 2
      ? "👤"
      : weekNo === 3
      ? "🎒"
      : weekNo === 4
      ? "🗣️"
      : "❓";

  return expectedOptions.slice(0, TOTAL_GAME_CARDS).map((sentence, index) => ({
    id: `grammar-${levelNo}-${weekNo}-${index + 1}`,
    word: wordData?.word || "grammar",
    emoji,
    verb: "speak",
    roundNumber: Math.floor(index / CARDS_PER_ROUND) + 1,
    roundMode: getRoundModeText(Math.floor(index / CARDS_PER_ROUND) + 1),
    patternReadable: getReadablePatternTitle(levelNo, weekNo),
    expected: sentence,
    lessonRelated: true,
    promptLine:
      wordData?.practicePrompt || wordData?.speakingFocus || "Speak the grammar sentence.",
  }));
}

function buildLevel3ExpectedOptions(wordData, levelNo, weekNo) {
  const list = [];
  const title = String(wordData?.title || "").trim();
  const example = String(wordData?.example || "").trim();
  const speakingFocus = String(wordData?.speakingFocus || "").trim();
  const word = String(wordData?.word || "").trim();

  const add = (text) => {
    const clean = String(text || "").trim();
    if (!clean) return;
    if (clean.length < 6) return;
    if (!list.includes(clean)) list.push(clean);
  };

  add(example);

  if (Number(levelNo) === 3) {
    if (weekNo === 1) {
      add("I wake up early in the morning.");
      add("I have breakfast and get ready for work.");
      add("I go to work in the morning.");
      add("In the evening, I come home and rest.");
      add("My daily routine is simple and busy.");
      add("At home, I help my family.");
      add("I like spending time with my family.");
    } else if (weekNo === 2) {
      add("What do you do every day?");
      add("Where do you live?");
      add("When do you study English?");
      add("Why do you want to improve your English?");
      add("How do you travel to work?");
      add("I study English in the evening.");
      add("I want to learn English for my future.");
    } else if (weekNo === 3) {
      add("My friend is kind and helpful.");
      add("My village is peaceful and clean.");
      add("My house has three rooms and a kitchen.");
      add("My workplace is busy but organized.");
      add("This chair is wooden and comfortable.");
      add("I live in a simple and peaceful place.");
      add("The people in my area are friendly.");
    } else if (weekNo === 4) {
      add("I like tea and simple food.");
      add("I do not like too much noise.");
      add("I prefer tea to coffee.");
      add("I think English is important for my future.");
      add("I agree with this idea.");
      add("I like learning new English words.");
      add("In my opinion, daily practice is very important.");
    } else if (weekNo === 5) {
      add("I want to buy a shirt.");
      add("When will the bus arrive?");
      add("I have a headache.");
      add("Excuse me, can you help me?");
      add("Hello, can I speak to Ali?");
      add("Nice to meet you.");
      add("I need help, please.");
    } else if (weekNo === 6) {
      add("Yesterday I went to the market.");
      add("One happy day, I visited my friend.");
      add("Yesterday was a busy day for me.");
      add("In my childhood, I played in the village.");
      add("First I woke up, then I went to work.");
      add("After that, I came home and rested.");
      add("Now I can speak English with more confidence.");
    }
  }

  add(title ? `Today's topic is ${title}.` : "");
  add(word ? `This lesson is about ${word}.` : "");
  add(speakingFocus ? `Practice focus: ${speakingFocus}` : "");

  return list.slice(0, TOTAL_GAME_CARDS);
}

function buildLevel3GameSet(levelNo, weekNo, wordData) {
  const expectedOptions = buildLevel3ExpectedOptions(wordData, levelNo, weekNo);

  while (expectedOptions.length < TOTAL_GAME_CARDS) {
    expectedOptions.push(String(wordData?.example || "I can speak simple English.").trim());
  }

  const emoji =
    weekNo === 1
      ? "🏠"
      : weekNo === 2
      ? "❓"
      : weekNo === 3
      ? "🧾"
      : weekNo === 4
      ? "💬"
      : weekNo === 5
      ? "🛒"
      : "📖";

  return expectedOptions.slice(0, TOTAL_GAME_CARDS).map((sentence, index) => ({
    id: `level3-${levelNo}-${weekNo}-${index + 1}`,
    word: wordData?.word || "conversation",
    emoji,
    verb: "speak",
    roundNumber: Math.floor(index / CARDS_PER_ROUND) + 1,
    roundMode: getRoundModeText(Math.floor(index / CARDS_PER_ROUND) + 1),
    patternReadable: getReadablePatternTitle(levelNo, weekNo),
    expected: sentence,
    lessonRelated: true,
    promptLine:
      wordData?.speakingFocus ||
      wordData?.practicePrompt ||
      "Speak naturally in simple English.",
  }));
}

function buildLevel5GameSet(levelNo, weekNo, wordData) {
  const phrases = Array.isArray(wordData?.targetPhrases) ? wordData.targetPhrases : [];
  const example = String(wordData?.example || "").trim();
  const aiOpening = String(wordData?.aiOpening || "").trim();
  const supportWords = Array.isArray(wordData?.supportWords) ? wordData.supportWords : [];
  const list = [];

  const add = (text) => {
    const clean = String(text || "").trim();
    if (!clean) return;
    if (!list.includes(clean)) list.push(clean);
  };

  add(example);
  add(aiOpening);

  phrases.forEach((phrase) => add(phrase));
  phrases.forEach((phrase) => add(`I can say: ${phrase}`));
  supportWords.slice(0, 5).forEach((item) => add(item));

  if (!list.length) {
    add(wordData?.example || "Hello, good to see you.");
  }

  while (list.length < TOTAL_GAME_CARDS) {
    add(wordData?.example || "Hello, good to see you.");
    if (list.length < TOTAL_GAME_CARDS) add(aiOpening || "How are you today?");
  }

  return list.slice(0, TOTAL_GAME_CARDS).map((sentence, index) => ({
    id: `level5-${levelNo}-${weekNo}-${index + 1}`,
    word: wordData?.word || "phrase",
    emoji: "💬",
    verb: "speak",
    roundNumber: Math.floor(index / CARDS_PER_ROUND) + 1,
    roundMode: getRoundModeText(Math.floor(index / CARDS_PER_ROUND) + 1),
    patternReadable: getReadablePatternTitle(levelNo, weekNo),
    expected: sentence,
    lessonRelated: true,
    promptLine:
      wordData?.speakingFocus ||
      wordData?.practicePrompt ||
      "Use the target phrase naturally.",
  }));
}

function buildFullGameSet(levelNo, weekNo, wordData) {
  if (isLevel5(levelNo)) return buildLevel5GameSet(levelNo, weekNo, wordData);
  if (isLevel3(levelNo)) return buildLevel3GameSet(levelNo, weekNo, wordData);
  if (isGrammarLevel(levelNo)) return buildLevel2GameSet(levelNo, weekNo, wordData);
  return buildLevel1GameSet(levelNo, weekNo, wordData);
}

function getRoundCards(allCards, roundNumber) {
  const start = (roundNumber - 1) * CARDS_PER_ROUND;
  return allCards.slice(start, start + CARDS_PER_ROUND);
}

function getRoundBadge(starCount) {
  if (starCount >= 5) return { emoji: "🌟", text: "Super Star" };
  if (starCount === 4) return { emoji: "⭐", text: "Great Job" };
  if (starCount >= 2) return { emoji: "👍", text: "Nice Try" };
  return { emoji: "💪", text: "Keep Going" };
}

function getLocalSuccessFeedback(roundNumber, isLessonRelated) {
  if (roundNumber === 1) {
    return isLessonRelated
      ? "Excellent! Good speaking."
      : "Excellent! Easy round done well.";
  }
  if (roundNumber === 2) {
    return isLessonRelated
      ? "Very good! Your sentence flow is improving."
      : "Very good! Medium round is going well.";
  }
  return isLessonRelated
    ? "Excellent confidence! Strong speaking."
    : "Excellent confidence! Strong round done well.";
}

function getLocalRetryFeedback(roundNumber, expectedText, isLessonRelated) {
  if (roundNumber === 1) {
    return isLessonRelated
      ? `Good try. Repeat clearly: ${expectedText}`
      : `Good try. Say slowly: ${expectedText}`;
  }
  if (roundNumber === 2) {
    return `Close try. Say the full sentence: ${expectedText}`;
  }
  return isLessonRelated
    ? `Almost there. Say with confidence: ${expectedText}`
    : `Almost there. Speak strongly: ${expectedText}`;
}

function getFinalMotivationMessage(correctCount, totalCount) {
  const percent = totalCount ? Math.round((correctCount / totalCount) * 100) : 0;
  if (percent >= 90) {
    return "Outstanding work! Your speaking was strong, clear, and confident today.";
  }
  if (percent >= 70) {
    return "Very good job! Your speaking is improving nicely. Keep this confidence.";
  }
  if (percent >= 50) {
    return "Good effort! You are building confidence step by step.";
  }
  return "Nice try today. Keep practicing slowly and clearly. Tomorrow will feel easier.";
}

function buildRealtimeLessonPrompt(levelNo, lesson, studentName) {
  const safeLevel = Number(levelNo || 1);
  const safeName = String(studentName || "Student").trim() || "Student";

  const title = String(lesson?.title || "").trim();
  const word = String(lesson?.word || "").trim();
  const meaning = String(lesson?.meaning || "").trim();
  const example = String(lesson?.example || "").trim();
  const speakingFocus = String(lesson?.speakingFocus || "").trim();
  const practicePrompt = String(lesson?.practicePrompt || "").trim();
  const grammarHintHindi = String(lesson?.grammarHintHindi || "").trim();
  const supportWords = Array.isArray(lesson?.supportWords) ? lesson.supportWords : [];
  const supportWordsText = supportWords.length ? supportWords.slice(0, 6).join(", ") : "";
  const situation = String(lesson?.situation || "").trim();
  const aiRole = String(lesson?.aiRole || "").trim();
  const studentRole = String(lesson?.studentRole || "").trim();
  const aiOpening = String(lesson?.aiOpening || "").trim();
  const minWords = Number(lesson?.minWords || 0);
  const targetPhrases = Array.isArray(lesson?.targetPhrases) ? lesson.targetPhrases : [];
  const targetPhrasesText = targetPhrases.length ? targetPhrases.join(", ") : "";

  if (safeLevel === 1) {
    return `
You are Amin Sir AI Tutor.
The student's name is ${safeName}.

Today's lesson is for Level 1 spoken English vocabulary practice.

Lesson title: ${title}
Main word: ${word}
Meaning: ${meaning}
Example: ${example}
Support words: ${supportWordsText}
Speaking focus: ${speakingFocus}

Your job:
- Greet the student warmly by name.
- Practice only today's lesson topic.
- Ask simple beginner-friendly speaking questions based on the lesson.
- Encourage the student to speak in short easy English sentences.
- Keep your English simple and slow.
- If needed, use a little simple Hindi support, but mostly use easy English.
- Focus on today's word and speaking focus.
- Give short encouragement.
- Do not start with self-introduction unless the lesson is actually about self-introduction.
- Keep responses short so the student speaks more.
- The student should speak more than you.

Start by introducing today's lesson and asking the first lesson-based question.
    `.trim();
  }

  if (safeLevel === 2) {
    return `
You are Amin Sir AI Tutor.
The student's name is ${safeName}.

Today's lesson is for Level 2 spoken English grammar practice.

Lesson title: ${title}
Main grammar word: ${word}
Meaning: ${meaning}
Example: ${example}
Hindi grammar help: ${grammarHintHindi}
Practice prompt: ${practicePrompt}
Speaking focus: ${speakingFocus}
Support words: ${supportWordsText}

Your job:
- Greet the student warmly by name.
- Practice only today's grammar lesson.
- Briefly explain today's grammar in very simple English.
- Use a little simple Hindi support for meaning when helpful.
- Ask the student to repeat today's grammar pattern.
- Ask the student to make 3 to 5 simple sentences based on today's lesson.
- Stay focused on today's lesson only.
- Do not switch to self-introduction unless today's lesson is about that.
- Keep your responses short, simple, and clear.
- Let the student speak more than you.
- Correct gently if the student is confused, but keep correction very simple.

Start by explaining today's grammar lesson and asking the student for the first sentence.
    `.trim();
  }

  if (safeLevel === 5 && lesson?.lessonType === "ai_conversation") {
    return `
You are Amin Sir AI Tutor.
The student's name is ${safeName}.

Today's lesson is for Level 5 AI conversation roleplay.

Lesson title: ${title}
Key phrase: ${word}
Meaning: ${meaning}
Example: ${example}
Situation: ${situation}
AI role: ${aiRole}
Student role: ${studentRole}
AI opening line: ${aiOpening}
Target phrases: ${targetPhrasesText}
Minimum words expected from student per answer: ${minWords}
Speaking focus: ${speakingFocus}
Support words: ${supportWordsText}

Your job:
- Greet the student warmly by name.
- Start the roleplay exactly based on today's situation.
- Act only as: ${aiRole || "the conversation partner"}.
- Treat the student as: ${studentRole || "the other speaker"}.
- Use today's AI opening line naturally.
- Encourage the student to answer in English.
- Push the student to use today's target phrases naturally.
- If the student speaks too little, ask for a longer answer.
- Keep your replies short so the student speaks more.
- Correct gently and practically.
- Focus only on this lesson and this situation.
- Do not change the situation.
- Use easy natural English.
- If needed, give a little simple Hindi support, but keep most speaking in English.

Start now with the roleplay opening line and continue the conversation naturally.
    `.trim();
  }

  return `
You are Amin Sir AI Tutor.
The student's name is ${safeName}.

Today's lesson is for spoken English conversation practice.

Lesson title: ${title}
Main topic word: ${word}
Meaning: ${meaning}
Example: ${example}
Speaking focus: ${speakingFocus}
Support words: ${supportWordsText}

Your job:
- Greet the student warmly by name.
- Practice only today's speaking topic.
- Ask short conversation questions based on today's topic.
- Help the student answer in 4 to 6 simple English sentences.
- Use easy English and keep your responses short.
- If needed, use a little simple Hindi support for meaning only.
- Encourage full-sentence speaking.
- Gently correct the student and ask them to repeat the improved sentence.
- Keep the lesson practical, natural, and confidence-building.
- Let the student speak more than you.

Start by introducing today's topic and asking the first short conversation question.
  `.trim();
}

export default function ChatPage() {
  const router = useRouter();

  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");

  const [hwDay, setHwDay] = useState("");
  const [homework, setHomework] = useState([]);
  const [hwLoading, setHwLoading] = useState(false);
  const [hwError, setHwError] = useState("");

  const [levelProgressLoading, setLevelProgressLoading] = useState(false);
  const [levelProgressError, setLevelProgressError] = useState("");
  const [levelNo, setLevelNo] = useState(1);
  const [weekNo, setWeekNo] = useState(1);
  const [dayNo, setDayNo] = useState(1);
  const [dayCompleted, setDayCompleted] = useState(false);

  const [selectedLevel, setSelectedLevel] = useState(1);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedDay, setSelectedDay] = useState(1);

  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");

  const [voiceStatus, setVoiceStatus] = useState("Idle");
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);

  const [transcript, setTranscript] = useState("");
  const [transcriptOn, setTranscriptOn] = useState(false);
  const recogRef = useRef(null);

  const [scoreOpen, setScoreOpen] = useState(false);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [scoreData, setScoreData] = useState(null);

  const [sessionSec, setSessionSec] = useState(0);
  const timerRef = useRef(null);

  const [gameOpen, setGameOpen] = useState(false);
  const [gameAllCards, setGameAllCards] = useState([]);
  const [gameCards, setGameCards] = useState([]);
  const [gameCardIndex, setGameCardIndex] = useState(0);
  const [gameTranscript, setGameTranscript] = useState("");
  const [gameFeedback, setGameFeedback] = useState("");
  const [gameListening, setGameListening] = useState(false);
  const [gameRoundDone, setGameRoundDone] = useState(false);
  const [gameRoundNumber, setGameRoundNumber] = useState(1);
  const [gameTotalCorrectCount, setGameTotalCorrectCount] = useState(0);
  const [gameRoundCorrectCount, setGameRoundCorrectCount] = useState(0);
  const [gameSessionDone, setGameSessionDone] = useState(false);
  const [gameStarResults, setGameStarResults] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationType, setCelebrationType] = useState("");
  const [savingLevelProgress, setSavingLevelProgress] = useState(false);

  const [certificate, setCertificate] = useState(null);
  const [showCertificate, setShowCertificate] = useState(false);

  const [usedTargetPhrases, setUsedTargetPhrases] = useState([]);
  const [missedTargetPhrases, setMissedTargetPhrases] = useState([]);
  const [liveTargetPhraseHits, setLiveTargetPhraseHits] = useState([]);

  const gameRecogRef = useRef(null);
  const audioCtxRef = useRef(null);
  const progressSavedRef = useRef(false);

  const wordData = getWordOfDay(selectedLevel, selectedWeek, selectedDay);
  const activeLessonData = getWordOfDay(levelNo, weekNo, dayNo);
  const supportWords = Array.isArray(wordData?.supportWords) ? wordData.supportWords : [];

  const isGrammarMode = isGrammarLevel(selectedLevel);
  const isConversationMode = isLevel3(selectedLevel);
  const isLevel5Mode = isLevel5(selectedLevel);
  const isAILessonMode = isAIConversationLesson(selectedLevel, wordData);

  const isTestingDifferentLesson =
    Number(selectedLevel) !== Number(levelNo) ||
    Number(selectedWeek) !== Number(weekNo) ||
    Number(selectedDay) !== Number(dayNo);

  const totalWeeksInLevel = getTotalWeeksInLevel(selectedLevel);
  const totalDaysInSelectedWeek = getDaysInWeek(selectedLevel, selectedWeek);
  const maxLevelNumber = getMaxLevelNumber();

  const finalMotivationMessage = useMemo(
    () => getFinalMotivationMessage(gameTotalCorrectCount, TOTAL_GAME_ROUNDS * CARDS_PER_ROUND),
    [gameTotalCorrectCount]
  );

  useEffect(() => {
    const sid = localStorage.getItem("studentId");
    const sname = localStorage.getItem("studentName");

    if (!sid || !sname) {
      router.replace("/login");
      return;
    }

    const safeSid = String(sid);
    setStudentId(safeSid);
    setStudentName(String(sname));

    loadTodayHomework(safeSid);
    loadTodayLevelProgress(safeSid);
  }, [router]);

  async function loadTodayHomework(sid) {
    try {
      setHwLoading(true);
      setHwError("");

      const res = await fetch(`/api/homework/today?studentId=${encodeURIComponent(sid)}`);
      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to load homework");
      }

      setHwDay(data.day || "");
      setHomework(Array.isArray(data.sentences) ? data.sentences : []);
    } catch (e) {
      setHwError(e?.message || "Homework load error");
      setHomework([]);
    } finally {
      setHwLoading(false);
    }
  }

  async function loadTodayLevelProgress(sid) {
    try {
      setLevelProgressLoading(true);
      setLevelProgressError("");

      const res = await fetch(`/api/level-progress/today?studentId=${encodeURIComponent(sid)}`);
      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to load level progress");
      }

      const backendProgress = {
        levelNo: Number(data.levelNo || 1),
        weekNo: Number(data.weekNo || 1),
        dayNo: Number(data.dayNo || 1),
        completed: Boolean(data.completed),
      };

      const shadowProgress = readShadowProgress(sid);
      const effective =
        shadowProgress && compareLessonPosition(shadowProgress, backendProgress) > 0
          ? shadowProgress
          : backendProgress;

      setLevelNo(effective.levelNo);
      setWeekNo(effective.weekNo);
      setDayNo(effective.dayNo);
      setSelectedLevel(effective.levelNo);
      setSelectedWeek(effective.weekNo);
      setSelectedDay(effective.dayNo);
      setDayCompleted(Boolean(effective.completed));

      if (
        effective.completed &&
        isLastLessonOfLevel(effective.levelNo, effective.weekNo, effective.dayNo)
      ) {
        await checkLevelCompletion(sid, effective.levelNo);
      }

      return effective;
    } catch (e) {
      setLevelProgressError(e?.message || "Level progress load error");
      setLevelNo(1);
      setWeekNo(1);
      setDayNo(1);
      setSelectedLevel(1);
      setSelectedWeek(1);
      setSelectedDay(1);
      setDayCompleted(false);
      return { levelNo: 1, weekNo: 1, dayNo: 1, completed: false };
    } finally {
      setLevelProgressLoading(false);
    }
  }

  async function checkLevelCompletion(studentIdArg, levelNoArg) {
    try {
      const res = await fetch("/api/level-progress/complete-level", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: studentIdArg, level_no: levelNoArg }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok || !data?.levelCompleted) return;

      const certRes = await fetch("/api/certificate/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: studentIdArg, level_no: levelNoArg }),
      });

      const certData = await certRes.json();
      if (certData?.ok && certData?.certificate) {
        setCertificate(certData.certificate);
        setShowCertificate(true);

        const last = getLastLessonPosition(levelNoArg);
        writeShadowProgress(studentIdArg, { ...last, completed: true });
      }
    } catch (err) {
      console.error("Certificate check error:", err);
    }
  }

  async function saveTodayLevelProgress() {
    try {
      if (!studentId || progressSavedRef.current || isTestingDifferentLesson) return;

      setSavingLevelProgress(true);

      const res = await fetch("/api/level-progress/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          levelNo,
          weekNo,
          dayNo,
          starsEarned: Number(gameTotalCorrectCount || 0),
          sentencesSpoken: TOTAL_GAME_ROUNDS * CARDS_PER_ROUND,
          roundsCompleted: TOTAL_GAME_ROUNDS,
          completed: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to save level progress");
      }

      progressSavedRef.current = true;

      if (isLastLessonOfLevel(levelNo, weekNo, dayNo)) {
        writeShadowProgress(studentId, { levelNo, weekNo, dayNo, completed: true });
        setDayCompleted(true);
        await checkLevelCompletion(studentId, levelNo);
      } else {
        const next = getNextLessonPosition(levelNo, weekNo, dayNo);
        if (next) {
          writeShadowProgress(studentId, { ...next, completed: false });
          setLevelNo(next.levelNo);
          setWeekNo(next.weekNo);
          setDayNo(next.dayNo);
          setSelectedLevel(next.levelNo);
          setSelectedWeek(next.weekNo);
          setSelectedDay(next.dayNo);
          setDayCompleted(false);
        }
      }
    } catch (e) {
      setLevelProgressError(e?.message || "Progress save error");
    } finally {
      setSavingLevelProgress(false);
    }
  }

  async function generateHomework(customFixText = "") {
    try {
      if (!studentId) {
        setHwError("Student not found. Please login again.");
        return;
      }

      setHwLoading(true);
      setHwError("");

      const cleanTranscript = (transcript || "").replace(/\n?\[LIVE\][\s\S]*$/g, "").trim();
      const scoreFixText = Array.isArray(scoreData?.fix)
        ? scoreData.fix.join(" ")
        : String(scoreData?.fix || "").trim();
      const finalFixText = String(customFixText || scoreFixText).trim();

      const finalTranscript =
        cleanTranscript.length >= 10
          ? cleanTranscript
          : finalFixText.length >= 10
          ? finalFixText
          : "";

      if (!finalTranscript) {
        throw new Error(
          "No transcript available yet. Please speak first, then click Generate Homework."
        );
      }

      const res = await fetch("/api/homework/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, studentName, transcript: finalTranscript }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Homework generate failed");
      }

      setHwDay(data.day || "");
      setHomework(Array.isArray(data.sentences) ? data.sentences : []);
      await loadTodayHomework(studentId);
    } catch (e) {
      setHwError(e?.message || "Homework generate error");
    } finally {
      setHwLoading(false);
    }
  }

  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => setSessionSec((s) => s + 1), 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const fmt = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

  function speakText(text, options = {}) {
    try {
      if (!window.speechSynthesis || !text) return;

      window.speechSynthesis.cancel();

      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = options.rate ?? 0.95;
      utter.pitch = options.pitch ?? 1;
      utter.volume = options.volume ?? 1;

      const voices = window.speechSynthesis.getVoices?.() || [];
      const englishVoice = voices.find((v) => /en-/i.test(v.lang)) || null;
      if (englishVoice) utter.voice = englishVoice;

      window.speechSynthesis.speak(utter);
    } catch {}
  }
  function startGrammarCoachForSelected() {
    if (!isGrammarMode) return;

    const coachVoice = String(wordData?.grammarCoachVoice || "").trim();
    const fallbackHint = String(wordData?.grammarHintHindi || "").trim();
    const repeatExamples = getGrammarRepeatExamples(wordData);
    const prompt = String(wordData?.practicePrompt || wordData?.speakingFocus || "").trim();

    const repeatBlock = repeatExamples.length
      ? `Repeat after me. ${repeatExamples.join(" ... ")}`
      : "";

    const lines = [
      coachVoice || fallbackHint || "",
      repeatBlock,
      prompt ? `Now practice. ${prompt}` : "",
    ].filter(Boolean);

    speakText(lines.join(" "), { rate: 0.9 });
  }

  function getAudioContext() {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return null;
        audioCtxRef.current = new AudioCtx();
      }

      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume().catch(() => {});
      }

      return audioCtxRef.current;
    } catch {
      return null;
    }
  }

  function playTone(freq = 660, duration = 0.12, type = "sine", gainValue = 0.03) {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(gainValue, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration + 0.02);
    } catch {}
  }

  const playCardAppearSound = () => {
    playTone(520, 0.08, "sine", 0.02);
    setTimeout(() => playTone(660, 0.08, "sine", 0.02), 70);
  };

  const playSuccessSound = () => {
    playTone(660, 0.08, "sine", 0.03);
    setTimeout(() => playTone(880, 0.11, "sine", 0.03), 80);
    setTimeout(() => playTone(1040, 0.14, "sine", 0.03), 170);
  };

  const playRetrySound = () => {
    playTone(420, 0.08, "triangle", 0.02);
    setTimeout(() => playTone(360, 0.1, "triangle", 0.02), 90);
  };

  const playCelebrationSound = () => {
    playTone(880, 0.15, "sine", 0.05);
    setTimeout(() => playTone(1040, 0.18, "sine", 0.05), 120);
    setTimeout(() => playTone(1320, 0.22, "sine", 0.05), 240);
  };

  const startTranscript = () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setTranscriptOn(false);
        return;
      }

      const rec = new SpeechRecognition();
      recogRef.current = rec;

      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      setTranscript("");
      setTranscriptOn(true);

      rec.onresult = (event) => {
        let finalText = "";
        let interimText = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const txt = event.results[i][0].transcript;
          if (event.results[i].isFinal) finalText += `${txt} `;
          else interimText += `${txt} `;
        }

        setTranscript((prev) => {
          const base = prev.replace(/\s*\[LIVE\][\s\S]*$/g, "").trim();
          const nextBase = `${base} ${finalText}`.trim();
          const live = interimText.trim();
          const combined = live ? `${nextBase}\n[LIVE] ${live}` : nextBase;

          if (isLevel5Mode && Array.isArray(wordData?.targetPhrases)) {
            const detected = detectTargetPhrasesInText(combined, wordData.targetPhrases);
            setLiveTargetPhraseHits(detected);
            setUsedTargetPhrases(detected);
            setMissedTargetPhrases(
              wordData.targetPhrases.filter((phrase) => !detected.includes(phrase))
            );
          }

          return combined;
        });
      };

      rec.onerror = () => setTranscriptOn(false);
      rec.onend = () => setTranscriptOn(false);

      rec.start();
    } catch {
      setTranscriptOn(false);
    }
  };

  const stopTranscript = () => {
    try {
      if (recogRef.current) {
        recogRef.current.onresult = null;
        recogRef.current.onerror = null;
        recogRef.current.onend = null;
        recogRef.current.stop();
      }
    } catch {}

    recogRef.current = null;
    setTranscriptOn(false);
    setTranscript((t) => t.replace(/\n?\[LIVE\][\s\S]*$/g, "").trim());
  };

  async function openGame() {
    await stopVoiceOnly();

    const lesson = getWordOfDay(selectedLevel, selectedWeek, selectedDay);
    const fullSet = buildFullGameSet(selectedLevel, selectedWeek, lesson);

    setGameAllCards(fullSet);
    setGameCards(getRoundCards(fullSet, 1));
    setGameCardIndex(0);
    setGameTranscript("");
    setGameFeedback("");
    setGameRoundDone(false);
    setGameRoundNumber(1);
    setGameRoundCorrectCount(0);
    setGameTotalCorrectCount(0);
    setGameSessionDone(false);
    setGameStarResults(Array(CARDS_PER_ROUND).fill(false));
    setShowCelebration(false);
    setCelebrationType("");

    const lessonTargetPhrases = Array.isArray(lesson?.targetPhrases) ? lesson.targetPhrases : [];
    setUsedTargetPhrases([]);
    setLiveTargetPhraseHits([]);
    setMissedTargetPhrases(lessonTargetPhrases);

    setGameOpen(true);
    progressSavedRef.current = false;

    setTimeout(() => {
      playCardAppearSound();
      if (isGrammarMode) {
        startGrammarCoachForSelected();
      } else if (isConversationMode || isLevel5Mode) {
        speakText(
          `Level ${selectedLevel} conversation game started. Today's topic is ${
            lesson?.title || lesson?.word || "English speaking"
          }. ${getRoundModeHelp(1)}`
        );
      } else {
        speakText(
          `Level ${selectedLevel} speaking game started. Today's lesson word is ${
            lesson?.word || "English"
          }. ${getRoundModeHelp(1)}`
        );
      }
    }, 80);
  }

  function startNextRound(nextRoundNumber) {
    stopGameListening();
    try {
      window.speechSynthesis?.cancel();
    } catch {}

    setGameCards(getRoundCards(gameAllCards, nextRoundNumber));
    setGameCardIndex(0);
    setGameTranscript("");
    setGameFeedback("");
    setGameRoundDone(false);
    setGameRoundCorrectCount(0);
    setGameStarResults(Array(CARDS_PER_ROUND).fill(false));
    setShowCelebration(false);
    setCelebrationType("");

    setTimeout(() => {
      playCardAppearSound();
      if (isGrammarMode) {
        startGrammarCoachForSelected();
      } else {
        speakText(`Round ${nextRoundNumber} started. ${getRoundModeHelp(nextRoundNumber)}`);
      }
    }, 80);
  }

  function closeGame() {
    stopGameListening();
    setGameOpen(false);
    setGameTranscript("");
    setGameFeedback("");
    setGameRoundDone(false);
    setGameSessionDone(false);
    setShowCelebration(false);
    setCelebrationType("");
    try {
      window.speechSynthesis?.cancel();
    } catch {}
  }

  function stopGameListening() {
    try {
      if (gameRecogRef.current) {
        gameRecogRef.current.onresult = null;
        gameRecogRef.current.onerror = null;
        gameRecogRef.current.onend = null;
        gameRecogRef.current.stop();
      }
    } catch {}

    gameRecogRef.current = null;
    setGameListening(false);
  }

  function checkGameAnswer(spokenText, expectedText) {
    const spoken = normalizeText(spokenText);
    const expected = normalizeText(expectedText);

    if (!spoken || !expected) return false;
    if (spoken === expected || spoken.includes(expected)) return true;

    const expectedWords = expected.split(" ").filter(Boolean);
    const matchedWords = expectedWords.filter((w) => spoken.includes(w));

    return matchedWords.length >= Math.max(2, expectedWords.length - 1);
  }

  function markStar(index, value) {
    setGameStarResults((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function startGameListening() {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setGameFeedback("Speech recognition is not supported in this browser.");
        speakText("Speech recognition is not supported in this browser.");
        return;
      }

      stopGameListening();

      const currentCard = gameCards[gameCardIndex];
      if (!currentCard) return;

      const rec = new SpeechRecognition();
      gameRecogRef.current = rec;

      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = "en-US";

      setGameTranscript("");
      setGameFeedback("Listening...");
      setGameListening(true);

      rec.onresult = (event) => {
        let spoken = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          spoken += `${event.results[i][0].transcript} `;
        }

        const finalSpoken = spoken.trim();
        setGameTranscript(finalSpoken);

        if (event.results[event.results.length - 1]?.isFinal) {
          if (isLevel5Mode && Array.isArray(wordData?.targetPhrases)) {
            const detected = detectTargetPhrasesInText(finalSpoken, wordData.targetPhrases);

            if (detected.length) {
              setUsedTargetPhrases((prev) => {
                const merged = Array.from(new Set([...prev, ...detected]));
                setMissedTargetPhrases(
                  wordData.targetPhrases.filter((phrase) => !merged.includes(phrase))
                );
                return merged;
              });
            }
          }

          const ok = checkGameAnswer(finalSpoken, currentCard.expected);

          if (ok) {
            const successText = getLocalSuccessFeedback(gameRoundNumber, true);
            setGameFeedback(successText);
            setGameRoundCorrectCount((prev) => prev + 1);
            setGameTotalCorrectCount((prev) => prev + 1);
            markStar(gameCardIndex, true);
            playSuccessSound();
            speakText(successText);
          } else {
            const retryText = getLocalRetryFeedback(
              gameRoundNumber,
              currentCard.expected,
              true
            );
            setGameFeedback(retryText);
            markStar(gameCardIndex, false);
            playRetrySound();
            speakText(retryText);
          }
        }
      };

      rec.onerror = () => {
        setGameListening(false);
        setGameFeedback("Could not hear clearly. Please try again.");
        playRetrySound();
        speakText("Could not hear clearly. Please try again.");
      };

      rec.onend = () => setGameListening(false);
      rec.start();
    } catch {
      setGameListening(false);
      setGameFeedback("Could not start listening.");
    }
  }

  async function nextGameCard() {
    stopGameListening();
    try {
      window.speechSynthesis?.cancel();
    } catch {}

    if (gameCardIndex >= gameCards.length - 1) {
      setGameRoundDone(true);

      if (gameRoundCorrectCount === 5) {
        setCelebrationType("super");
        setShowCelebration(true);
        playCelebrationSound();
      } else if (gameRoundCorrectCount === 4) {
        setCelebrationType("trophy");
        setShowCelebration(true);
        playCelebrationSound();
      }

      if (gameRoundNumber >= TOTAL_GAME_ROUNDS) {
        setGameSessionDone(true);
        setGameFeedback(`🔥 Session Complete! Great speaking, ${studentName || "Student"}!`);
        playSuccessSound();
        await saveTodayLevelProgress();
      } else {
        setGameFeedback(`🔥 ${getRoundModeText(gameRoundNumber)} Complete!`);
        playSuccessSound();
      }

      return;
    }

    setGameCardIndex((prev) => prev + 1);
    setGameTranscript("");
    setGameFeedback("");
    setTimeout(playCardAppearSound, 60);
  }

  async function sendMessage() {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();
      setResponse(data.reply || "No response");
    } catch {
      setResponse("Error calling /api/chat");
    }
  }

  async function startVoice() {
    try {
      setVoiceStatus("Requesting microphone permission...");

      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      localStreamRef.current = localStream;

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      for (const track of localStream.getTracks()) {
        pc.addTrack(track, localStream);
      }

      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
          remoteAudioRef.current.play().catch(() => {});
        }
      };

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      });
      await pc.setLocalDescription(offer);

      startTranscript();
      setSessionSec(0);
      startTimer();

      const currentLesson = getWordOfDay(selectedLevel, selectedWeek, selectedDay);
      const lessonPrompt = buildRealtimeLessonPrompt(
        selectedLevel,
        currentLesson,
        studentName || "Student"
      );

      const res = await fetch("/api/realtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sdp: offer.sdp,
          model: "gpt-realtime",
          voice: "alloy",
          studentName: studentName || "Student",
          studentId: studentId || "",
          level:
            isConversationMode || isLevel5Mode
              ? "conversation-beginner"
              : isGrammarMode
              ? "grammar-beginner"
              : "beginner",
          courseWeek: selectedWeek,
          lessonPrompt,
          levelNo: selectedLevel,
          weekNo: selectedWeek,
          dayNo: selectedDay,
          lessonTitle: currentLesson?.title || "",
          lessonWord: currentLesson?.word || "",
          speakingFocus: currentLesson?.speakingFocus || "",
          practicePrompt: currentLesson?.practicePrompt || "",
          grammarHintHindi: currentLesson?.grammarHintHindi || "",
          lessonType: currentLesson?.lessonType || "",
          situation: currentLesson?.situation || "",
          aiRole: currentLesson?.aiRole || "",
          studentRole: currentLesson?.studentRole || "",
          aiOpening: currentLesson?.aiOpening || "",
          targetPhrases: Array.isArray(currentLesson?.targetPhrases)
            ? currentLesson.targetPhrases
            : [],
          minWords: Number(currentLesson?.minWords || 0),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        setVoiceStatus(`Voice start failed: ${data?.error || res.status}`);
        stopTranscript();
        stopTimer();
        return;
      }

      await pc.setRemoteDescription({ type: "answer", sdp: data.sdp });
      setVoiceStatus(
        isTestingDifferentLesson
          ? `✅ Test mode connected: Level ${selectedLevel}, Week ${selectedWeek}, Day ${selectedDay}`
          : "✅ Connected. Speak now..."
      );
    } catch (err) {
      setVoiceStatus(`Voice start failed: ${err?.message || String(err)}`);
      stopTranscript();
      stopTimer();
    }
  }

  async function stopVoiceOnly() {
    try {
      setVoiceStatus("Stopping...");

      if (pcRef.current) {
        pcRef.current.ontrack = null;
        pcRef.current.close();
        pcRef.current = null;
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }

      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = null;
      }

      stopTimer();
      stopTranscript();
      setVoiceStatus("Idle");
    } catch {
      stopTimer();
      stopTranscript();
      setVoiceStatus("Stopped (with warnings)");
    }
  }

  async function stopAndAutoScore() {
    await stopVoiceOnly();

    const scoreResult = await getSpeakingScore(true);
    const fixText = Array.isArray(scoreResult?.fix)
      ? scoreResult.fix.join(" ")
      : String(scoreResult?.fix || "").trim();

    await generateHomework(fixText);
  }

  const medalFromScore = (score) =>
    score >= 90 ? "🥇" : score >= 75 ? "🥈" : score >= 60 ? "🥉" : "⭐";

  async function getSpeakingScore(autoOpen = false) {
    try {
      setScoreLoading(true);

      const cleanTranscript = (transcript || "").replace(/\n?\[LIVE\][\s\S]*$/g, "").trim();

      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          studentName,
          transcript: cleanTranscript,
          seconds: sessionSec,
          levelNo: selectedLevel,
          weekNo: selectedWeek,
          dayNo: selectedDay,
        }),
      });

      const data = await res.json();

      const normalized = res.ok
        ? {
            score: Number(data?.score ?? data?.overall ?? 0),
            level: data?.level || data?.band || "Beginner",
            good: data?.good || data?.strengths || [],
            fix: data?.fix || data?.improve || [],
            vocab: data?.vocab || data?.vocabularyWords || [],
            tip: data?.tip || data?.homeworkTip || "",
            categories: data?.categories || {
              pronunciation: Number(data?.pronunciation ?? 0),
              vocabulary: Number(data?.vocabulary ?? 0),
              fluency: Number(data?.fluency ?? 0),
              grammar: Number(data?.grammar ?? 0),
              confidence: Number(data?.confidence ?? 0),
            },
          }
        : {
            score: 0,
            level: "Beginner",
            good: ["Score API error"],
            fix: [data?.error || "Please check /api/score route"],
            vocab: [],
            tip: "Try again after speaking a bit.",
            categories: {
              pronunciation: 0,
              vocabulary: 0,
              fluency: 0,
              grammar: 0,
              confidence: 0,
            },
          };

      setScoreData(normalized);
      setScoreLoading(false);
      setScoreOpen(true);

      if (studentId) loadTodayHomework(studentId);
      if (autoOpen) setScoreOpen(true);

      return normalized;
    } catch (e) {
      const fallback = {
        score: 0,
        level: "Beginner",
        good: [],
        fix: [`Score failed: ${e?.message || String(e)}`],
        vocab: [],
        tip: "Try again.",
        categories: {
          pronunciation: 0,
          vocabulary: 0,
          fluency: 0,
          grammar: 0,
          confidence: 0,
        },
      };

      setScoreLoading(false);
      setScoreData(fallback);
      setScoreOpen(true);
      return fallback;
    }
  }

  const logout = () => {
    clearShadowProgress(studentId);
    localStorage.removeItem("studentId");
    localStorage.removeItem("studentName");
    router.replace("/login");
  };

  const currentGameCard = gameCards[gameCardIndex];
  const roundBadge = getRoundBadge(gameRoundCorrectCount);

  const HomeworkItem = ({ item }) => {
    if (typeof item === "string") return <li>{item}</li>;

    if (item && typeof item === "object") {
      return (
        <li style={{ marginBottom: 12 }}>
          <div>
            <b>❌ Wrong:</b> {item.wrong ?? ""}
          </div>
          <div>
            <b>✅ Right:</b> {item.right ?? ""}
          </div>
          {item.rule ? (
            <div style={{ opacity: 0.85 }}>
              <b>📌 Rule:</b> {item.rule}
            </div>
          ) : null}
        </li>
      );
    }

    return <li>{String(item)}</li>;
  };

  const CatRow = ({ label, value }) => (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <div style={{ fontWeight: 800 }}>{label}</div>
      <div style={{ fontWeight: 900 }}>{Number(value || 0)} / 100</div>
    </div>
  );

  return (
    <div style={{ padding: 28, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 44, margin: "0 0 18px 0" }}>Amin Sir AI Tutor</h1>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 18,
          padding: 16,
          marginBottom: 18,
          background: "#fff",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontSize: 22, fontWeight: 1000 }}>
            📚 Today’s Homework{" "}
            <span style={{ fontSize: 14, opacity: 0.7 }}>{hwDay ? `(${hwDay})` : ""}</span>
          </div>

          <button
            onClick={generateHomework}
            disabled={hwLoading}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid #ddd",
              background: "white",
              fontWeight: 900,
              cursor: "pointer",
              opacity: hwLoading ? 0.7 : 1,
            }}
          >
            ✨ Generate Homework
          </button>
        </div>

        {hwError ? (
          <div style={{ marginTop: 10, color: "crimson", fontWeight: 900 }}>{hwError}</div>
        ) : hwLoading ? (
          <div style={{ marginTop: 10, opacity: 0.8 }}>Loading homework...</div>
        ) : homework.length ? (
          <ol style={{ marginTop: 10, fontSize: 16, lineHeight: 1.6 }}>
            {homework.map((item, i) => (
              <HomeworkItem key={i} item={item} />
            ))}
          </ol>
        ) : (
          <div style={{ marginTop: 10, opacity: 0.8 }}>
            No homework for today yet. Click <b>Generate Homework</b>.
          </div>
        )}
      </div>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 18,
          padding: 18,
          marginBottom: 18,
          background: "#fafafa",
        }}
      >
        <div style={{ fontSize: 30, fontWeight: 900, marginBottom: 10 }}>
          Welcome {studentName || "Student"} 👋
        </div>

        <div style={{ fontSize: 22, fontWeight: 800, opacity: 0.95 }}>
          ⏱ Session Time: {fmt(sessionSec)}
        </div>

        <div
          style={{
            marginTop: 14,
            padding: 14,
            borderRadius: 14,
            background: "#ffffff",
            border: "1px solid #e5e7eb",
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 1000 }}>
            🟢 Level {selectedLevel} – Week {selectedWeek}
          </div>
          <div style={{ marginTop: 6, fontSize: 18, fontWeight: 800 }}>
            Day {selectedDay} of {getDaysInWeek(selectedLevel, selectedWeek)}
          </div>
          <div style={{ marginTop: 6, fontSize: 16, fontWeight: 800, color: "#166534" }}>
            {getWeekPatternText(selectedLevel, selectedWeek)}
          </div>

          {levelProgressLoading ? (
            <div style={{ marginTop: 8, opacity: 0.7 }}>Loading level progress...</div>
          ) : levelProgressError ? (
            <div style={{ marginTop: 8, color: "crimson", fontWeight: 800 }}>
              {levelProgressError}
            </div>
          ) : dayCompleted && !isTestingDifferentLesson ? (
            <div style={{ marginTop: 8, color: "#166534", fontWeight: 900 }}>
              ✅ Today already completed
            </div>
          ) : isTestingDifferentLesson ? (
            <div style={{ marginTop: 8, color: "#7c2d12", fontWeight: 900 }}>
              🧪 Test Mode: exploring selected lesson without changing real progress
            </div>
          ) : (
            <div style={{ marginTop: 8, opacity: 0.8 }}>
              {isLevel5Mode
                ? "Level-5 AI conversation test mode"
                : isConversationMode
                ? "Conversation-based speaking practice for today"
                : isGrammarMode
                ? "Grammar-based speaking practice for today"
                : "Pattern-based confidence practice for today"}
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: 14,
            padding: 14,
            borderRadius: 16,
            background: "#ffffff",
            border: "1px solid #e5e7eb",
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 1000, marginBottom: 10 }}>🪜 Level Selector</div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {Array.from({ length: maxLevelNumber }, (_, i) => i + 1).map((level) => {
              const state = getLevelButtonState(levelNo, level);
              const isSelected = selectedLevel === level;

              const bg =
                state === "active"
                  ? "#16a34a"
                  : state === "completed"
                  ? "#dcfce7"
                  : "#f0f9ff";

              const color =
                state === "active"
                  ? "white"
                  : state === "completed"
                  ? "#166534"
                  : "#075985";

              const border =
                state === "active"
                  ? "none"
                  : state === "completed"
                  ? "1px solid #86efac"
                  : "1px solid #bae6fd";

              const label =
                state === "completed"
                  ? `✅ Level ${level}`
                  : state === "active"
                  ? `🟢 Level ${level}`
                  : `👁️ Level ${level}`;

              return (
                <button
                  key={level}
                  onClick={() => {
                    setSelectedLevel(level);

                    if (level === levelNo) {
                      setSelectedWeek(weekNo);
                      setSelectedDay(dayNo);
                    } else {
                      setSelectedWeek(1);
                      setSelectedDay(1);
                    }
                  }}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 14,
                    border: isSelected ? "2px solid #111827" : border,
                    background: bg,
                    color,
                    fontWeight: 900,
                    cursor: "pointer",
                    minWidth: 130,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 10, fontSize: 14, opacity: 0.8 }}>
            Current active level: <b>Level {levelNo}</b>. You are viewing: <b>Level {selectedLevel}</b>.
          </div>
        </div>

        <div
          style={{
            marginTop: 14,
            padding: 14,
            borderRadius: 16,
            background: "#ffffff",
            border: "1px solid #e5e7eb",
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 1000, marginBottom: 10 }}>📅 Week Selector</div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {Array.from({ length: totalWeeksInLevel }, (_, i) => i + 1).map((week) => {
              const state = getWeekButtonState(levelNo, selectedLevel, weekNo, week);
              const isSelected = selectedWeek === week;

              const bg =
                state === "active"
                  ? "#16a34a"
                  : state === "completed"
                  ? "#dcfce7"
                  : "#f0f9ff";

              const color =
                state === "active"
                  ? "white"
                  : state === "completed"
                  ? "#166534"
                  : "#075985";

              const border =
                state === "active"
                  ? "none"
                  : state === "completed"
                  ? "1px solid #86efac"
                  : "1px solid #bae6fd";

              const label =
                state === "completed"
                  ? `✅ Week ${week}`
                  : state === "active"
                  ? `🟢 Week ${week}`
                  : `👁️ Week ${week}`;

              return (
                <button
                  key={week}
                  onClick={() => {
                    setSelectedWeek(week);

                    if (selectedLevel === levelNo && week === weekNo) {
                      setSelectedDay(dayNo);
                    } else {
                      setSelectedDay(1);
                    }
                  }}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 14,
                    border: isSelected ? "2px solid #111827" : border,
                    background: bg,
                    color,
                    fontWeight: 900,
                    cursor: "pointer",
                    minWidth: 120,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 10, fontSize: 14, opacity: 0.8 }}>
            Current active week: <b>Week {weekNo}</b>. You are viewing: <b>Week {selectedWeek}</b>.
          </div>
        </div>

        <div
          style={{
            marginTop: 14,
            padding: 14,
            borderRadius: 16,
            background: "#ffffff",
            border: "1px solid #e5e7eb",
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 1000, marginBottom: 10 }}>📘 Day Selector</div>

          <div style={{ marginBottom: 10, fontSize: 15, opacity: 0.85 }}>
            Selected week: <b>Week {selectedWeek}</b>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {Array.from({ length: totalDaysInSelectedWeek }, (_, i) => i + 1).map((day) => {
              const state = getDayButtonState(
                levelNo,
                selectedLevel,
                weekNo,
                dayNo,
                selectedWeek,
                day
              );
              const isSelected = selectedDay === day;

              const bg =
                state === "active"
                  ? "#2563eb"
                  : state === "completed"
                  ? "#dbeafe"
                  : "#eff6ff";

              const color =
                state === "active"
                  ? "white"
                  : state === "completed"
                  ? "#1d4ed8"
                  : "#1e40af";

              const border =
                state === "active"
                  ? "none"
                  : state === "completed"
                  ? "1px solid #93c5fd"
                  : "1px solid #bfdbfe";

              const label =
                state === "completed"
                  ? `✅ Day ${day}`
                  : state === "active"
                  ? `🔵 Day ${day}`
                  : `👁️ Day ${day}`;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 14,
                    border: isSelected ? "2px solid #111827" : border,
                    background: bg,
                    color,
                    fontWeight: 900,
                    cursor: "pointer",
                    minWidth: 110,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 10, fontSize: 14, opacity: 0.8 }}>
            Current active day: <b>Day {dayNo}</b>. You are viewing: <b>Day {selectedDay}</b>.
          </div>
        </div>

        <div
          style={{
            marginTop: 14,
            padding: 16,
            borderRadius: 16,
            background: "#ffffff",
            border: "1px solid #e5e7eb",
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 1000 }}>📘 Lesson of the Day</div>

          <div style={{ marginTop: 10, fontSize: 28, fontWeight: 1000 }}>
            {wordData.title || wordData.word}
          </div>

          <div style={{ marginTop: 6, fontSize: 16 }}>
            <b>Key word:</b> {wordData.word}
          </div>
          <div style={{ marginTop: 6, fontSize: 16 }}>
            <b>Meaning:</b> {wordData.meaning}
          </div>
          <div style={{ marginTop: 6, fontSize: 16 }}>
            <b>Example:</b> {wordData.example}
          </div>

          {isGrammarMode && (
            <div
              style={{
                marginTop: 14,
                padding: 14,
                borderRadius: 14,
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 1000, color: "#1d4ed8" }}>
                🧠 Grammar Coach
              </div>

              <div style={{ marginTop: 10, fontSize: 16, lineHeight: 1.6 }}>
                <b>Pattern:</b>{" "}
                {getWeekPatternText(selectedLevel, selectedWeek).replace(/^Grammar:\s*/i, "")}
              </div>

              <div style={{ marginTop: 8, fontSize: 16, lineHeight: 1.6 }}>
                <b>Hindi Help:</b> {wordData.grammarHintHindi || "—"}
              </div>

              <div style={{ marginTop: 8, fontSize: 16, lineHeight: 1.6 }}>
                <b>Voice Coach Line:</b>{" "}
                {wordData.grammarCoachVoice || wordData.grammarHintHindi || "—"}
              </div>

              <div style={{ marginTop: 8, fontSize: 16, lineHeight: 1.6 }}>
                <b>Repeat After Me:</b>
                <ul style={{ marginTop: 8, paddingLeft: 22 }}>
                  {getGrammarRepeatExamples(wordData).map((item, index) => (
                    <li key={`repeat-example-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>

              <div style={{ marginTop: 8, fontSize: 16, lineHeight: 1.6 }}>
                <b>Your Practice:</b> {wordData.practicePrompt || wordData.speakingFocus}
              </div>

              <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={startGrammarCoachForSelected}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: "1px solid #93c5fd",
                    background: "white",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  🔊 Start Grammar Coach
                </button>

                <button
                  onClick={() =>
                    speakText(getGrammarRepeatExamples(wordData).join(" ... "), { rate: 0.9 })
                  }
                  style={{
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: "1px solid #93c5fd",
                    background: "white",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  🔁 Repeat Example
                </button>
              </div>
            </div>
          )}

          <div
            style={{
              marginTop: 14,
              padding: 14,
              borderRadius: 14,
              background: "#fff7ed",
              border: "1px solid #fed7aa",
            }}
          >
            <div style={{ fontSize: 17, fontWeight: 1000, color: "#9a3412" }}>
              📦 Support Vocabulary
            </div>

            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {supportWords.length ? (
                supportWords.map((item, index) => (
                  <span
                    key={`${item}-${index}`}
                    style={{
                      padding:                      "8px 12px",
                      borderRadius: 999,
                      background: "#ffedd5",
                      border: "1px solid #fdba74",
                      fontWeight: 800,
                      fontSize: 14,
                      color: "#9a3412",
                    }}
                  >
                    {item}
                  </span>
                ))
              ) : (
                <span style={{ opacity: 0.75 }}>No support words yet.</span>
              )}
            </div>
          </div>

          <div
            style={{
              marginTop: 14,
              padding: 14,
              borderRadius: 14,
              background: "#ecfdf5",
              border: "1px solid #bbf7d0",
            }}
          >
            <div style={{ fontSize: 17, fontWeight: 1000, color: "#166534" }}>
              🎤 Speaking Focus
            </div>
            <div style={{ marginTop: 8, fontSize: 16, lineHeight: 1.5 }}>
              {wordData.speakingFocus || "Practice 3 to 5 simple English sentences."}
            </div>
          </div>

          {isAILessonMode && (
            <div
              style={{
                marginTop: 14,
                padding: 14,
                borderRadius: 14,
                background: "#f5f3ff",
                border: "1px solid #d8b4fe",
              }}
            >
              <div style={{ fontSize: 17, fontWeight: 1000, color: "#6d28d9" }}>
                🤖 AI Conversation Mode
              </div>

              <div style={{ marginTop: 8, fontSize: 16, lineHeight: 1.6 }}>
                <b>Situation:</b> {wordData.situation || "—"}
              </div>

              <div style={{ marginTop: 8, fontSize: 16, lineHeight: 1.6 }}>
                <b>AI Role:</b> {wordData.aiRole || "—"}
              </div>

              <div style={{ marginTop: 8, fontSize: 16, lineHeight: 1.6 }}>
                <b>Your Role:</b> {wordData.studentRole || "—"}
              </div>

              <div style={{ marginTop: 8, fontSize: 16, lineHeight: 1.6 }}>
                <b>AI Opening:</b> {wordData.aiOpening || "—"}
              </div>

              <div style={{ marginTop: 8, fontSize: 16, lineHeight: 1.6 }}>
                <b>Minimum Words:</b> {wordData.minWords || 0}
              </div>

              <div style={{ marginTop: 10, fontSize: 16, fontWeight: 900 }}>
                🎯 Target Phrases
              </div>

              <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {Array.isArray(wordData.targetPhrases) && wordData.targetPhrases.length ? (
                  wordData.targetPhrases.map((phrase, index) => (
                    <span
                      key={`${phrase}-${index}`}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 999,
                        background: "#ede9fe",
                        border: "1px solid #c4b5fd",
                        fontWeight: 800,
                        fontSize: 14,
                        color: "#5b21b6",
                      }}
                    >
                      {phrase}
                    </span>
                  ))
                ) : (
                  <span style={{ opacity: 0.75 }}>No target phrases yet.</span>
                )}
              </div>

              {isLevel5Mode && (
                <>
                  <div style={{ marginTop: 14, fontSize: 16, fontWeight: 900, color: "#166534" }}>
                    ✅ Used Target Phrases
                  </div>
                  <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {usedTargetPhrases.length ? (
                      usedTargetPhrases.map((phrase, index) => (
                        <span
                          key={`used-${phrase}-${index}`}
                          style={{
                            padding: "8px 12px",
                            borderRadius: 999,
                            background: "#dcfce7",
                            border: "1px solid #86efac",
                            fontWeight: 800,
                            fontSize: 14,
                            color: "#166534",
                          }}
                        >
                          ✅ {phrase}
                        </span>
                      ))
                    ) : (
                      <span style={{ opacity: 0.75 }}>No phrase used yet.</span>
                    )}
                  </div>

                  <div style={{ marginTop: 14, fontSize: 16, fontWeight: 900, color: "#9a3412" }}>
                    ⏳ Remaining Target Phrases
                  </div>
                  <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {missedTargetPhrases.length ? (
                      missedTargetPhrases.map((phrase, index) => (
                        <span
                          key={`missed-${phrase}-${index}`}
                          style={{
                            padding: "8px 12px",
                            borderRadius: 999,
                            background: "#fff7ed",
                            border: "1px solid #fdba74",
                            fontWeight: 800,
                            fontSize: 14,
                            color: "#9a3412",
                          }}
                        >
                          {phrase}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: "#166534", fontWeight: 800 }}>
                        All target phrases used. Excellent!
                      </span>
                    )}
                  </div>

                  <div style={{ marginTop: 14, fontSize: 16, fontWeight: 900, color: "#1d4ed8" }}>
                    🎧 Live Phrase Detection
                  </div>
                  <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {liveTargetPhraseHits.length ? (
                      liveTargetPhraseHits.map((phrase, index) => (
                        <span
                          key={`live-${phrase}-${index}`}
                          style={{
                            padding: "8px 12px",
                            borderRadius: 999,
                            background: "#dbeafe",
                            border: "1px solid #93c5fd",
                            fontWeight: 800,
                            fontSize: 14,
                            color: "#1d4ed8",
                          }}
                        >
                          🎯 {phrase}
                        </span>
                      ))
                    ) : (
                      <span style={{ opacity: 0.75 }}>Speak and detected phrases will appear here.</span>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={logout}
            style={{
              padding: "12px 18px",
              borderRadius: 14,
              border: "1px solid #ddd",
              background: "white",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Logout
          </button>

          <button
            onClick={() => router.push("/progress")}
            style={{
              padding: "12px 18px",
              borderRadius: 14,
              border: "1px solid #ddd",
              background: "white",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            📊 Progress Dashboard
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <input
            style={{
              padding: 14,
              width: "min(700px, 100%)",
              borderRadius: 14,
              border: "1px solid #ddd",
              fontSize: 16,
            }}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type something..."
          />
          <button
            style={{
              padding: "12px 18px",
              borderRadius: 14,
              border: "1px solid #ddd",
              background: "white",
              fontWeight: 900,
              cursor: "pointer",
            }}
            onClick={sendMessage}
          >
            Send
          </button>
        </div>

        <div style={{ marginTop: 14 }}>
          <b>AI:</b> {response}
        </div>
      </div>

      <hr style={{ margin: "22px 0" }} />
      <h2 style={{ fontSize: 34, margin: "0 0 12px 0" }}>Voice Tutor</h2>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button
          style={{
            padding: "14px 18px",
            fontSize: 18,
            borderRadius: 16,
            border: "1px solid #ddd",
            background: "white",
            fontWeight: 900,
            cursor: "pointer",
          }}
          onClick={startVoice}
        >
          🎤 Start Voice Session
        </button>

        <button
          style={{
            padding: "14px 18px",
            fontSize: 18,
            borderRadius: 16,
            border: "1px solid #ddd",
            background: "white",
            fontWeight: 900,
            cursor: "pointer",
          }}
          onClick={stopAndAutoScore}
        >
          ⛔ Stop (Auto Score)
        </button>

        <button
          style={{
            padding: "14px 18px",
            fontSize: 18,
            borderRadius: 16,
            border: "none",
            background: "black",
            color: "white",
            fontWeight: 900,
            cursor: "pointer",
          }}
          onClick={() => getSpeakingScore(false)}
        >
          ⭐ Get Speaking Score
        </button>

        <button
          style={{
            padding: "14px 18px",
            fontSize: 18,
            borderRadius: 16,
            border: "none",
            background: "#16a34a",
            color: "white",
            fontWeight: 900,
            cursor: "pointer",
            opacity: !isTestingDifferentLesson && dayCompleted ? 0.7 : 1,
          }}
          onClick={openGame}
        >
          🟢 Level-{selectedLevel} Speaking Game
        </button>
      </div>

      <div style={{ marginTop: 10, fontSize: 16 }}>
        Status: <b>{voiceStatus}</b> | Transcript: <b>{transcriptOn ? "ON ✅" : "OFF"}</b>
      </div>

      {gameOpen && (
        <div
          style={{
            marginTop: 18,
            border: "2px solid #d1fae5",
            borderRadius: 20,
            padding: 18,
            background: "#f0fdf4",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 1000 }}>
                🟢 Level-{selectedLevel} Speaking Game
              </div>
              <div style={{ marginTop: 4, fontSize: 16, opacity: 0.85 }}>
                Level {selectedLevel} • Week {selectedWeek} • Day {selectedDay}
              </div>
              <div style={{ marginTop: 4, fontSize: 15, fontWeight: 800, color: "#166534" }}>
                {getWeekPatternText(selectedLevel, selectedWeek)}
              </div>
              {isTestingDifferentLesson ? (
                <div style={{ marginTop: 4, fontSize: 14, fontWeight: 900, color: "#7c2d12" }}>
                  🧪 Test Mode
                </div>
              ) : null}
            </div>

            <button
              onClick={closeGame}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid #ddd",
                background: "white",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              ❌ Close Game
            </button>
          </div>

          {isGrammarMode && (
            <div
              style={{
                marginTop: 16,
                borderRadius: 18,
                background: "white",
                border: "1px solid #bfdbfe",
                padding: 16,
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 1000, color: "#1d4ed8" }}>
                🧠 Grammar Coach Flow
              </div>

              <div style={{ marginTop: 8, fontSize: 16, lineHeight: 1.6 }}>
                <b>Hindi Help:</b> {wordData?.grammarHintHindi || "—"}
              </div>

              <div style={{ marginTop: 8, fontSize: 16, lineHeight: 1.6 }}>
                <b>Voice Coach Line:</b> {wordData?.grammarCoachVoice || wordData?.grammarHintHindi || "—"}
              </div>

              <div style={{ marginTop: 8, fontSize: 16, lineHeight: 1.6 }}>
                <b>Repeat:</b>
                <ul style={{ marginTop: 8, paddingLeft: 22 }}>
                  {getGrammarRepeatExamples(wordData).map((item, index) => (
                    <li key={`game-repeat-example-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>

              <div style={{ marginTop: 8, fontSize: 16, lineHeight: 1.6 }}>
                <b>Now Practice:</b> {wordData?.practicePrompt || wordData?.speakingFocus || "—"}
              </div>
            </div>
          )}

          {!gameRoundDone && currentGameCard ? (
            <>
              <div
                style={{
                  marginTop: 18,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 800 }}>
                  Round {gameRoundNumber} of {TOTAL_GAME_ROUNDS}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>
                  Card {gameCardIndex + 1} of {gameCards.length}
                </div>
              </div>

              <div
                style={{
                  marginTop: 10,
                  padding: 12,
                  borderRadius: 14,
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 1000, color: "#1d4ed8" }}>
                  {currentGameCard.roundMode}
                </div>
                <div style={{ marginTop: 6, fontSize: 15, lineHeight: 1.5 }}>
                  {getRoundModeHelp(gameRoundNumber)}
                </div>
              </div>

              <div style={{ marginTop: 12, fontSize: 22, fontWeight: 900, textAlign: "center" }}>
                Score This Round:{" "}
                {gameStarResults.map((ok, i) => (
                  <span key={i}>{ok ? "⭐ " : "⬜ "}</span>
                ))}
              </div>

              <div
                style={{
                  marginTop: 18,
                  borderRadius: 24,
                  background: "linear-gradient(180deg, #ffffff 0%, #f8fff9 100%)",
                  border: "2px solid #bbf7d0",
                  padding: 24,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    margin: "0 auto",
                    width: "min(240px, 100%)",
                    borderRadius: 22,
                    background: "#f0fdf4",
                    border: "2px solid #dcfce7",
                    padding: "18px 12px",
                  }}
                >
                  <div style={{ fontSize: 110, lineHeight: 1 }}>{currentGameCard.emoji}</div>
                  <div
                    style={{
                      marginTop: 12,
                      fontSize: 26,
                      fontWeight: 1000,
                      color: "#111827",
                    }}
                  >
                    {String(currentGameCard.word || "SPEAK").toUpperCase()}
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 14,
                      fontWeight: 800,
                      color: "#166534",
                    }}
                  >
                    {currentGameCard.patternReadable}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 16,
                    borderRadius: 16,
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    padding: 14,
                    textAlign: "left",
                  }}
                >
                  <div style={{ fontSize: 16, fontWeight: 1000, marginBottom: 8 }}>
                    ✅ Target Sentence
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: "#111827" }}>
                    {currentGameCard.expected}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 20,
                    display: "flex",
                    gap: 12,
                    justifyContent: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    onClick={() => speakText(currentGameCard.expected, { rate: 0.9 })}
                    style={{
                      padding: "16px 20px",
                      borderRadius: 16,
                      border: "1px solid #d1d5db",
                      background: "#f9fafb",
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                  >
                    🔊 Example
                  </button>

                  {isGrammarMode && (
                    <button
                      onClick={startGrammarCoachForSelected}
                      style={{
                        padding: "16px 20px",
                        borderRadius: 16,
                        border: "1px solid #d1d5db",
                        background: "white",
                        fontWeight: 900,
                        cursor: "pointer",
                      }}
                    >
                      🧠 Coach
                    </button>
                  )}

                  <button
                    onClick={startGameListening}
                    disabled={gameListening}
                    style={{
                      padding: "16px 22px",
                      borderRadius: 16,
                      border: "none",
                      background: "#166534",
                      color: "white",
                      fontWeight: 900,
                      cursor: "pointer",
                      opacity: gameListening ? 0.7 : 1,
                    }}
                  >
                    {gameListening ? "🎤 Listening..." : "🎤 Speak Now"}
                  </button>

                  <button
                    onClick={nextGameCard}
                    style={{
                      padding: "16px 22px",
                      borderRadius: 16,
                      border: "1px solid #d1d5db",
                      background: "white",
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                  >
                    ⏭ Next
                  </button>
                </div>

                <div
                  style={{
                    marginTop: 20,
                    borderRadius: 16,
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    padding: 14,
                    textAlign: "left",
                  }}
                >
                  <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 6 }}>
                    🗣 You said
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      lineHeight: 1.5,
                      minHeight: 28,
                      color: "#111827",
                      fontWeight: 700,
                    }}
                  >
                    {gameTranscript || "—"}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 14,
                    borderRadius: 16,
                    background:
                      gameFeedback.startsWith("Excellent") || gameFeedback.startsWith("Very good")
                        ? "#ecfdf5"
                        : "#f9fafb",
                    border:
                      gameFeedback.startsWith("Excellent") || gameFeedback.startsWith("Very good")
                        ? "1px solid #86efac"
                        : "1px solid #e5e7eb",
                    padding: 14,
                  }}
                >
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 1000,
                      color:
                        gameFeedback.startsWith("Excellent") || gameFeedback.startsWith("Very good")
                          ? "#166534"
                          : "#111827",
                    }}
                  >
                    {gameFeedback || "Speak now..."}
                  </div>
                </div>
              </div>
            </>
          ) : !gameSessionDone ? (
            <div
              style={{
                marginTop: 18,
                borderRadius: 18,
                background: "white",
                border: "1px solid #dcfce7",
                padding: 24,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 34, fontWeight: 1000 }}>
                🔥 {getRoundModeText(gameRoundNumber)} Complete!
              </div>
              <div style={{ marginTop: 10, fontSize: 22, fontWeight: 800 }}>
                Nice speaking, {studentName || "Student"}!
              </div>
              <div style={{ marginTop: 14, fontSize: 30, fontWeight: 1000 }}>
                {roundBadge.emoji} {roundBadge.text}
              </div>
              <div style={{ marginTop: 10, fontSize: 18 }}>
                This round correct answers: <b>{gameRoundCorrectCount}</b> out of{" "}
                <b>{gameCards.length}</b>
              </div>
              <div style={{ marginTop: 8, fontSize: 18 }}>
                Total correct so far: <b>{gameTotalCorrectCount}</b>
              </div>

              <div
                style={{
                  marginTop: 18,
                  display: "flex",
                  gap: 12,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={() => {
                    const nextRound = gameRoundNumber + 1;
                    setGameRoundNumber(nextRound);
                    startNextRound(nextRound);
                  }}
                  style={{
                    padding: "14px 18px",
                    borderRadius: 14,
                    border: "none",
                    background: "#16a34a",
                    color: "white",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  ➡️ Next Round
                </button>

                <button
                  onClick={closeGame}
                  style={{
                    padding: "14px 18px",
                    borderRadius: 14,
                    border: "1px solid #ddd",
                    background: "white",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  ✅ Close
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                marginTop: 18,
                borderRadius: 18,
                background: "white",
                border: "1px solid #dcfce7",
                padding: 24,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 36, fontWeight: 1000 }}>🎓 Lesson Complete!</div>
              <div style={{ marginTop: 10, fontSize: 22, fontWeight: 800 }}>
                Great speaking, {studentName || "Student"}!
              </div>

              <div
                style={{
                  marginTop: 16,
                  borderRadius: 16,
                  padding: 16,
                  background: "#ecfdf5",
                  border: "1px solid #86efac",
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 1000, color: "#166534" }}>
                  {finalMotivationMessage}
                </div>
              </div>

              {isLevel5Mode && (
                <div
                  style={{
                    marginTop: 16,
                    borderRadius: 16,
                    padding: 16,
                    background: "#f5f3ff",
                    border: "1px solid #d8b4fe",
                    textAlign: "left",
                  }}
                >
                  <div style={{ fontSize: 18, fontWeight: 1000, color: "#6d28d9" }}>
                    🎯 Level-5 Phrase Detection Summary
                  </div>

                  <div style={{ marginTop: 10, fontSize: 16, fontWeight: 900, color: "#166534" }}>
                    Used Phrases
                  </div>
                  <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {usedTargetPhrases.length ? (
                      usedTargetPhrases.map((phrase, index) => (
                        <span
                          key={`summary-used-${phrase}-${index}`}
                          style={{
                            padding: "8px 12px",
                            borderRadius: 999,
                            background: "#dcfce7",
                            border: "1px solid #86efac",
                            fontWeight: 800,
                            fontSize: 14,
                            color: "#166534",
                          }}
                        >
                          ✅ {phrase}
                        </span>
                      ))
                    ) : (
                      <span style={{ opacity: 0.75 }}>No target phrase detected.</span>
                    )}
                  </div>

                  <div style={{ marginTop: 14, fontSize: 16, fontWeight: 900, color: "#9a3412" }}>
                    Missed Phrases
                  </div>
                  <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {missedTargetPhrases.length ? (
                      missedTargetPhrases.map((phrase, index) => (
                        <span
                          key={`summary-missed-${phrase}-${index}`}
                          style={{
                            padding: "8px 12px",
                            borderRadius: 999,
                            background: "#fff7ed",
                            border: "1px solid #fdba74",
                            fontWeight: 800,
                            fontSize: 14,
                            color: "#9a3412",
                          }}
                        >
                          {phrase}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: "#166534", fontWeight: 800 }}>
                        All target phrases were detected.
                      </span>
                    )}
                  </div>
                </div>
              )}

              {isTestingDifferentLesson ? (
                <div style={{ marginTop: 16, color: "#7c2d12", fontWeight: 900 }}>
                  🧪 Test mode finished. Real progress was not changed.
                </div>
              ) : savingLevelProgress ? (
                <div style={{ marginTop: 16, opacity: 0.8 }}>Saving today’s progress...</div>
              ) : dayCompleted ? (
                <div style={{ marginTop: 16, color: "#166534", fontWeight: 900 }}>
                  ✅ Today saved successfully
                </div>
              ) : null}

              <div
                style={{
                  marginTop: 20,
                  display: "flex",
                  gap: 12,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={openGame}
                  style={{
                    padding: "14px 18px",
                    borderRadius: 14,
                    border: "none",
                    background: "#16a34a",
                    color: "white",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  🔁 Play Again
                </button>

                <button
                  onClick={closeGame}
                  style={{
                    padding: "14px 18px",
                    borderRadius: 14,
                    border: "1px solid #ddd",
                    background: "white",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  ✅ Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showCelebration && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: 16,
          }}
          onClick={() => setShowCelebration(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              borderRadius: 24,
              padding: 30,
              textAlign: "center",
              width: "min(360px, 100%)",
            }}
          >
            {celebrationType === "super" ? (
              <>
                <div style={{ fontSize: 90 }}>🕺</div>
                <div style={{ fontSize: 70, marginTop: 8 }}>🏆</div>
                <div style={{ marginTop: 14, fontSize: 28, fontWeight: 1000 }}>
                  Wow! Super Star!
                </div>
              </>
            ) : celebrationType === "trophy" ? (
              <>
                <div style={{ fontSize: 90 }}>🏆</div>
                <div style={{ marginTop: 14, fontSize: 28, fontWeight: 1000 }}>
                  Great Job!
                </div>
              </>
            ) : null}

            <div style={{ marginTop: 18 }}>
              <button
                onClick={() => setShowCelebration(false)}
                style={{
                  padding: "12px 18px",
                  borderRadius: 12,
                  border: "1px solid #ddd",
                  background: "white",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {showCertificate && certificate && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "white",
              padding: 40,
              borderRadius: 20,
              textAlign: "center",
              width: "min(560px, 100%)",
              border: "3px solid #dbeafe",
            }}
          >
            <div style={{ fontSize: 60 }}>🎓</div>

            <h1 style={{ fontSize: 30, marginTop: 12, marginBottom: 0 }}>
              Certificate of Completion
            </h1>

            <p style={{ marginTop: 20, fontSize: 18 }}>This certifies that</p>

            <h2 style={{ fontSize: 30, marginTop: 8, marginBottom: 0 }}>
              {studentName || "Student"}
            </h2>

            <p style={{ marginTop: 18, fontSize: 18 }}>has successfully completed</p>

            <h3 style={{ marginTop: 10, fontSize: 24, color: "#1d4ed8" }}>
              Level {certificate.level_no} Spoken English
            </h3>

            <p style={{ marginTop: 22, fontSize: 16 }}>
              Completion Date:{" "}
              {certificate.completed_at
                ? new Date(certificate.completed_at).toLocaleDateString()
                : "—"}
            </p>

            <p style={{ marginTop: 24, fontStyle: "italic", fontSize: 18 }}>
              Amin Sir AI Tutor
            </p>

            <button
              onClick={() => setShowCertificate(false)}
              style={{
                marginTop: 26,
                padding: "12px 24px",
                borderRadius: 10,
                border: "none",
                background: "#2563eb",
                color: "white",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          marginTop: 14,
          border: "1px solid #ddd",
          borderRadius: 16,
          padding: 14,
          background: "#fff",
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 8 }}>
          Transcript (FREE): <span style={{ opacity: 0.75 }}>(your sentences live)</span>
        </div>

        <div
          style={{
            minHeight: 80,
            whiteSpace: "pre-wrap",
            fontSize: 16,
            lineHeight: 1.4,
            opacity: transcript ? 1 : 0.7,
          }}
        >
          {transcript || "Start voice and speak... your sentences will appear here."}
        </div>
      </div>

      <audio ref={remoteAudioRef} autoPlay />

      {scoreOpen && (
        <div
          onClick={() => setScoreOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(720px, 100%)",
              background: "white",
              borderRadius: 18,
              padding: 18,
              border: "1px solid #ddd",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div style={{ fontSize: 26, fontWeight: 1000 }}>
                {scoreLoading ? "Scoring..." : "⭐ Speaking Score Card"}
              </div>

              <button
                onClick={() => setScoreOpen(false)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 12,
                  border: "1px solid #ddd",
                  background: "white",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>

            {scoreLoading ? (
              <div style={{ marginTop: 14, fontSize: 16, opacity: 0.8 }}>
                Please wait... generating full report.
              </div>
            ) : (
              <>
                <div style={{ marginTop: 14, fontSize: 22, fontWeight: 900 }}>
                  {medalFromScore(scoreData?.score)} Score: {scoreData?.score ?? 0} / 100{" "}
                  <span style={{ opacity: 0.7 }}>({scoreData?.level || "Beginner"})</span>
                </div>

                <div
                  style={{
                    marginTop: 14,
                    border: "1px solid #eee",
                    borderRadius: 14,
                    padding: 12,
                    background: "#fafafa",
                  }}
                >
                  <div style={{ fontSize: 18, fontWeight: 1000, marginBottom: 10 }}>
                    Full Report
                  </div>

                  <div style={{ display: "grid", gap: 8 }}>
                    <CatRow label="Pronunciation" value={scoreData?.categories?.pronunciation} />
                    <CatRow label="Vocabulary" value={scoreData?.categories?.vocabulary} />
                    <CatRow label="Fluency" value={scoreData?.categories?.fluency} />
                    <CatRow label="Grammar" value={scoreData?.categories?.grammar} />
                    <CatRow label="Confidence" value={scoreData?.categories?.confidence} />
                  </div>
                </div>

                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 18, fontWeight: 1000 }}>Good:</div>
                  <ul>
                    {(scoreData?.good || []).map((g, i) => (
                      <li key={i}>{g}</li>
                    ))}
                  </ul>

                  <div style={{ fontSize: 18, fontWeight: 1000 }}>Fix:</div>
                  <ul>
                    {(scoreData?.fix || []).map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>

                  <div style={{ marginTop: 10, fontSize: 18, fontWeight: 1000 }}>Vocab:</div>
                  <div style={{ fontSize: 16 }}>
                    {(scoreData?.vocab || []).length ? (scoreData?.vocab || []).join(", ") : "—"}
                  </div>

                  <div style={{ marginTop: 10, fontSize: 18, fontWeight: 1000 }}>Tip:</div>
                  <div style={{ fontSize: 16 }}>{scoreData?.tip || "—"}</div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
