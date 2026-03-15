export const COURSE_DATA = {
  levels: [
    {
      level: 1,
      name: "Beginner Speaking",
      weeks: [
        {
          week: 1,
          title: "Greetings and Basic Replies",
          days: [
            {
              day: 1,
              title: "Simple Greeting",
              word: "greeting",
              meaning: "Basic hello conversation",
              example: "Hello sir. I am fine.",
              vocabulary: ["hello", "hi", "good", "morning"],
              supportWords: ["hello", "hi", "good", "morning"],
              speakingFocus: "Basic greeting conversation",
              practicePrompt: "Say hello and tell how you are today.",
              grammarHintHindi: "Use simple present sentences like: I am fine.",
              lessonType: "conversation",
            },
            {
              day: 2,
              title: "How Are You",
              word: "feeling",
              meaning: "Answering how you feel",
              example: "I am good today.",
              vocabulary: ["fine", "good", "okay", "happy"],
              supportWords: ["fine", "good", "okay", "happy"],
              speakingFocus: "Talking about feelings",
              practicePrompt: "Say how you feel today.",
              grammarHintHindi: "Use 'I am feeling...' or 'I am...'",
              lessonType: "conversation",
            },
          ],
        },
        {
          week: 4,
          title: "Daily Routine",
          days: [
            {
              day: 1,
              title: "Morning Routine",
              word: "routine",
              meaning: "Daily morning activities",
              example: "I wake up early in the morning.",
              vocabulary: ["wake", "brush", "breakfast", "ready"],
              supportWords: ["wake", "brush", "breakfast", "ready"],
              speakingFocus: "Talking about morning routine",
              practicePrompt: "Describe your morning routine.",
              grammarHintHindi: "Use simple present like: I wake up.",
              lessonType: "conversation",
            },
          ],
        },
      ],
    },

    {
      level: 2,
      name: "Basic Sentence Building",
      weeks: [
        {
          week: 1,
          title: "Using I Am",
          days: [
            {
              day: 1,
              title: "I Am Sentences",
              word: "identity",
              meaning: "Talking about yourself",
              example: "I am a student.",
              vocabulary: ["student", "happy", "ready", "learning"],
              supportWords: ["student", "happy", "ready", "learning"],
              speakingFocus: "Using I am sentences",
              practicePrompt: "Say three I am sentences.",
              grammarHintHindi: "Structure: I am + adjective/noun",
              lessonType: "conversation",
            },
          ],
        },
      ],
    },

    {
      level: 5,
      name: "Interview English",
      weeks: [
        {
          week: 5,
          title: "Interview Introduction",
          days: [
            {
              day: 1,
              title: "Professional Introduction",
              word: "introduction",
              meaning: "Interview self introduction",
              example: "Good morning and thank you for this opportunity.",
              vocabulary: ["experience", "skills", "team", "responsibility"],
              supportWords: ["experience", "skills", "team", "responsibility"],
              speakingFocus: "Professional self introduction",
              practicePrompt: "Introduce yourself in interview style.",
              grammarHintHindi: "Use confident sentences.",
              lessonType: "interview",
            },
          ],
        },
      ],
    },

    {
      level: 6,
      name: "Verb Tense Speaking Lab",
      weeks: [
        {
          week: 1,
          title: "Daily Verb Practice - Week 1",
          days: [
            {
              day: 1,
              title: "Verb Practice: Write",
              word: "write",
              meaning: "likhna",
              example: "I write every day.",
              vocabulary: ["write", "writing", "written", "wrote"],
              supportWords: ["write", "writing", "written", "wrote"],
              speakingFocus: "Using the verb write in 12 tense patterns",
              practicePrompt: "Speak each Hinglish line in correct English.",
              grammarHintHindi:
                "Aaj ka verb hai write. Har line ko English mein bolna hai.",
              lessonType: "verb_tense",
              verb: "write",
              verbMeaning: "likhna",
              tenseLines: [
                "Main likhta hoon.",
                "Main likh raha hoon.",
                "Main likh chuka hoon.",
                "Main do ghante se likh raha hoon.",
                "Main kal likha.",
                "Main likh raha tha.",
                "Main likh chuka tha.",
                "Main do ghante se likh raha tha.",
                "Main likhunga.",
                "Main likh raha hunga.",
                "Main likh chuka hunga.",
                "Main do ghante se likh raha hunga."
              ],
              answers: [
                "I write.",
                "I am writing.",
                "I have written.",
                "I have been writing for two hours.",
                "I wrote yesterday.",
                "I was writing.",
                "I had written.",
                "I had been writing for two hours.",
                "I will write.",
                "I will be writing.",
                "I will have written.",
                "I will have been writing for two hours."
              ]
            },
          ],
        },
      ],
    },
  ],
};

const PHRASE_LIBRARY = {
  "L1-W1-D1": [
    { id: 1, english: "Hello sir.", cue: "Say a greeting." },
    { id: 2, english: "Good morning.", cue: "Morning greeting." },
    { id: 3, english: "How are you?", cue: "Ask politely." },
    { id: 4, english: "I am fine.", cue: "Give a simple reply." },
    { id: 5, english: "Nice to meet you.", cue: "Finish greeting politely." },
  ],

  "L1-W4-D1": [
    { id: 1, english: "I wake up early.", cue: "Say when you wake up." },
    { id: 2, english: "I brush my teeth.", cue: "Next morning action." },
    { id: 3, english: "I take a shower.", cue: "Continue routine." },
    { id: 4, english: "I drink tea.", cue: "Say breakfast drink." },
    { id: 5, english: "I eat breakfast.", cue: "Morning food sentence." },
  ],
  "L5-W5-D1": [
    {
      id: 1,
      english: "Good morning and thank you for this opportunity.",
      cue: "Interview opening.",
    },
    {
      id: 2,
      english: "My name is Amin and I have strong safety experience.",
      cue: "Professional introduction.",
    },
    {
      id: 3,
      english: "I am hardworking and responsible.",
      cue: "Mention strengths.",
    },
    {
      id: 4,
      english: "I work well with a team.",
      cue: "Talk about teamwork.",
    },
    {
      id: 5,
      english: "Thank you for considering my application.",
      cue: "Close professionally.",
    },
  ],
};

export const MASTER_PHRASE_BANK = [
  "Hello, how are you?",
  "Good morning.",
  "Good afternoon.",
  "Good evening.",
  "Nice to meet you.",
  "I am fine today.",
  "I am learning English.",
  "I live in Abu Dhabi.",
  "I come from India.",
  "I wake up early.",
  "I drink tea.",
  "I eat breakfast.",
  "I go to work.",
  "I study English.",
  "I read books.",
  "I watch TV.",
  "I talk to my friends.",
  "I like this lesson.",
  "This is interesting.",
  "Thank you very much.",
];

export const MASTER_IDIOM_BANK = [
  ["Break the ice", "start conversation", "Let's break the ice."],
  ["Piece of cake", "very easy", "This task is a piece of cake."],
  ["Hit the nail on the head", "exactly right", "You hit the nail on the head."],
  ["Under the weather", "feeling sick", "I feel under the weather."],
  ["Once in a blue moon", "very rarely", "I visit there once in a blue moon."],
  ["Burn the midnight oil", "work late", "I burned the midnight oil."],
  ["Cost an arm and a leg", "very expensive", "This costs an arm and a leg."],
  ["Cut corners", "do cheaply", "Do not cut corners."],
  ["The ball is in your court", "your decision", "The ball is in your court."],
  ["Call it a day", "stop working", "Let's call it a day."],
];

function buildLessonKey(level, week, day) {
  return `L${level}-W${week}-D${day}`;
}

function buildDefaultPhrasesFromLesson(lesson) {
  return [
    {
      id: 1,
      english: lesson.example,
      cue: "Repeat this sentence.",
    },
  ];
}
export function getLessonWithContext(levelNumber, weekNumber, dayNumber) {
  const level = COURSE_DATA.levels.find(
    (l) => l.level === Number(levelNumber)
  );

  if (!level) return null;

  const week = level.weeks.find((w) => w.week === Number(weekNumber));
  if (!week) return null;

  const day = week.days.find((d) => d.day === Number(dayNumber));
  if (!day) return null;

  const lessonKey = buildLessonKey(level.level, week.week, day.day);

  const phrases =
    PHRASE_LIBRARY[lessonKey] || buildDefaultPhrasesFromLesson(day);

  return {
    ...day,
    phrases,
    level: level.level,
    week: week.week,
  };
}
