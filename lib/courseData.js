export const COURSE_DATA = {
  learningMethod: {
    speakingRule: "AI speaks less, student speaks more",
    dailyTime: "15 minutes daily practice",
    timerSeconds: 900,
    correctionMode: "Show correct sentence on screen",
    aiReplyRules: {
      correct: "Yes, correct. Next.",
      wrong: "Wrong. Look at the screen and say it correctly.",
    },
  },

  levels: [
    {
      level: 1,
      name: "Fixed Structure Speaking",
      weeks: [
        {
          week: 1,
          title: "Core Daily Structures - Week 1",
          days: [
            {
              day: 1,
              title: "I want to / I have to",
              lessonType: "dual_structure",
              introHinglish:
                "Aaj hum 2 structures seekhenge. 'I want to' tab use hota hai jab aap batate ho ki aap kya karna chahte ho. 'I have to' tab use hota hai jab koi kaam zaruri hota hai ya karna padta hai.",

              structure1: {
                name: "I want to + verb",
                meaning: "main kya karna chahta hoon / chahti hoon",
                explanation:
                  "Use this when you want to do something.",
                example: "I want to eat a banana.",
                verbs: ["go", "eat", "play", "drink", "sleep"],
                modelSentences: [
                  "I want to go home.",
                  "I want to eat rice.",
                  "I want to play cricket.",
                  "I want to drink water.",
                  "I want to sleep early.",
                ],
              },

              structure2: {
                name: "I have to + verb",
                meaning: "mujhe kya karna padta hai / zaruri hai",
                explanation:
                  "Use this when something is necessary.",
                example: "I have to work today.",
                verbs: ["work", "study", "cook", "clean", "wake up"],
                modelSentences: [
                  "I have to work today.",
                  "I have to study English.",
                  "I have to cook dinner.",
                  "I have to clean my room.",
                  "I have to wake up early.",
                ],
              },

              wordOfDay: {
                word: "hungry",
                meaning: "bhookha",
                example: "I am hungry now.",
              },

              aiOpening: [
                "Today we will learn 2 structures.",
                "First: I want to plus verb.",
                "Second: I have to plus verb.",
                "I want to shows what you want.",
                "I have to shows what is necessary.",
                "Now look at the screen and make sentences.",
              ],

              screenPractice: [
                "I want to + go",
                "I want to + eat",
                "I want to + play",
                "I want to + drink",
                "I want to + sleep",
                "I have to + work",
                "I have to + study",
                "I have to + cook",
                "I have to + clean",
                "I have to + wake up",
              ],
            },

            {
              day: 2,
              title: "I like to / I need to",
              lessonType: "dual_structure",
              introHinglish:
                "Aaj hum 2 structures seekhenge. 'I like to' tab use hota hai jab aap batate ho ki aapko kya pasand hai. 'I need to' tab use hota hai jab koi kaam zaruri hota hai.",

              structure1: {
                name: "I like to + verb",
                meaning: "mujhe kya karna pasand hai",
                explanation:
                  "Use this when you like doing something.",
                example: "I like to read books.",
                verbs: ["read", "watch", "travel", "listen", "learn"],
                modelSentences: [
                  "I like to read books.",
                  "I like to watch movies.",
                  "I like to travel with family.",
                  "I like to listen to music.",
                  "I like to learn English.",
                ],
              },

              structure2: {
                name: "I need to + verb",
                meaning: "mujhe kya karna zaruri hai",
                explanation:
                  "Use this when something is needed.",
                example: "I need to finish my work.",
                verbs: ["finish", "call", "buy", "send", "prepare"],
                modelSentences: [
                  "I need to finish my work.",
                  "I need to call my friend.",
                  "I need to buy milk.",
                  "I need to send an email.",
                  "I need to prepare dinner.",
                ],
              },

              wordOfDay: {
                word: "tired",
                meaning: "thaka hua",
                example: "I am tired today.",
              },

              aiOpening: [
                "Today we will learn 2 structures.",
                "First: I like to plus verb.",
                "Second: I need to plus verb.",
                "I like to shows what you like.",
                "I need to shows what is necessary.",
                "Now look at the screen and make sentences.",
              ],

              screenPractice: [
                "I like to + read",
                "I like to + watch",
                "I like to + travel",
                "I like to + listen",
                "I like to + learn",
                "I need to + finish",
                "I need to + call",
                "I need to + buy",
                "I need to + send",
                "I need to + prepare",
              ],
            },

            {
              day: 3,
              title: "I can / I cannot",
              lessonType: "dual_structure",
              introHinglish:
                "Aaj hum 2 structures seekhenge. 'I can' tab use hota hai jab aap batate ho ki aap kuch kar sakte ho. 'I cannot' tab use hota hai jab aap batate ho ki aap kuch nahi kar sakte.",

              structure1: {
                name: "I can + verb",
                meaning: "main kar sakta hoon / sakti hoon",
                explanation:
                  "Use this for ability.",
                example: "I can swim well.",
                verbs: ["swim", "drive", "cook", "speak", "write"],
                modelSentences: [
                  "I can swim well.",
                  "I can drive a car.",
                  "I can cook food.",
                  "I can speak English.",
                  "I can write letters.",
                ],
              },

              structure2: {
                name: "I cannot + verb",
                meaning: "main nahi kar sakta / sakti",
                explanation:
                  "Use this when you cannot do something.",
                example: "I cannot drive.",
                verbs: ["swim", "drive", "run", "cook", "sleep"],
                modelSentences: [
                  "I cannot swim.",
                  "I cannot drive.",
                  "I cannot run fast.",
                  "I cannot cook well.",
                  "I cannot sleep early.",
                ],
              },

              wordOfDay: {
                word: "busy",
                meaning: "vyast",
                example: "I am busy today.",
              },

              aiOpening: [
                "Today we will learn 2 structures.",
                "First: I can plus verb.",
                "Second: I cannot plus verb.",
                "I can shows ability.",
                "I cannot shows no ability.",
                "Now look at the screen and make sentences.",
              ],

              screenPractice: [
                "I can + swim",
                "I can + drive",
                "I can + cook",
                "I can + speak",
                "I can + write",
                "I cannot + swim",
                "I cannot + drive",
                "I cannot + run",
                "I cannot + cook",
                "I cannot + sleep",
              ],
            },

            {
              day: 4,
              title: "I will / I am trying to",
              lessonType: "dual_structure",
              introHinglish:
                "Aaj hum 2 structures seekhenge. 'I will' future ke liye use hota hai. 'I am trying to' tab use hota hai jab aap kisi kaam ki koshish kar rahe ho.",

              structure1: {
                name: "I will + verb",
                meaning: "main karunga / karungi",
                explanation:
                  "Use this for future action.",
                example: "I will call you later.",
                verbs: ["call", "visit", "start", "learn", "complete"],
                modelSentences: [
                  "I will call you later.",
                  "I will visit my friend.",
                  "I will start my work.",
                  "I will learn English.",
                  "I will complete the task.",
                ],
              },

              structure2: {
                name: "I am trying to + verb",
                meaning: "main koshish kar raha hoon / rahi hoon",
                explanation:
                  "Use this for effort or attempt.",
                example: "I am trying to improve my English.",
                verbs: ["improve", "learn", "fix", "understand", "solve"],
                modelSentences: [
                  "I am trying to improve my English.",
                  "I am trying to learn quickly.",
                  "I am trying to fix this problem.",
                  "I am trying to understand grammar.",
                  "I am trying to solve the question.",
                ],
              },

              wordOfDay: {
                word: "quickly",
                meaning: "jaldi",
                example: "He runs quickly.",
              },

              aiOpening: [
                "Today we will learn 2 structures.",
                "First: I will plus verb.",
                "Second: I am trying to plus verb.",
                "I will shows future.",
                "I am trying to shows effort.",
                "Now look at the screen and make sentences.",
              ],

              screenPractice: [
                "I will + call",
                "I will + visit",
                "I will + start",
                "I will + learn",
                "I will + complete",
                "I am trying to + improve",
                "I am trying to + learn",
                "I am trying to + fix",
                "I am trying to + understand",
                "I am trying to + solve",
              ],
            },

            {
              day: 5,
              title: "I do not want to / Do you want to?",
              lessonType: "dual_structure",
              introHinglish:
                "Aaj hum 2 structures seekhenge. 'I do not want to' tab use hota hai jab aap mana karte ho. 'Do you want to?' tab use hota hai jab aap kisi se poochte ho.",

              structure1: {
                name: "I do not want to + verb",
                meaning: "main nahi chahta / chahti",
                explanation:
                  "Use this when you do not want to do something.",
                example: "I do not want to go there.",
                verbs: ["go", "eat", "wait", "argue", "waste"],
                modelSentences: [
                  "I do not want to go there.",
                  "I do not want to eat junk food.",
                  "I do not want to wait.",
                  "I do not want to argue.",
                  "I do not want to waste time.",
                ],
              },

              structure2: {
                name: "Do you want to + verb?",
                meaning: "kya tum / aap karna chahte ho?",
                explanation:
                  "Use this to ask someone.",
                example: "Do you want to eat dinner?",
                verbs: ["eat", "play", "watch", "join", "learn"],
                modelSentences: [
                  "Do you want to eat dinner?",
                  "Do you want to play cricket?",
                  "Do you want to watch a movie?",
                  "Do you want to join me?",
                  "Do you want to learn English?",
                ],
              },

              wordOfDay: {
                word: "interesting",
                meaning: "dilchasp",
                example: "This book is interesting.",
              },

              aiOpening: [
                "Today we will learn 2 structures.",
                "First: I do not want to plus verb.",
                "Second: Do you want to plus verb.",
                "The first is negative.",
                "The second is a question.",
                "Now look at the screen and make sentences.",
              ],

              screenPractice: [
                "I do not want to + go",
                "I do not want to + eat",
                "I do not want to + wait",
                "I do not want to + argue",
                "I do not want to + waste",
                "Do you want to + eat",
                "Do you want to + play",
                "Do you want to + watch",
                "Do you want to + join",
                "Do you want to + learn",
              ],
            },
          ],
        },
      ],
    },
  ],
};