// lib/courseData.js

import { level5Data } from "./level5Data";

export const courseData = {
  levels: [
    {
      id: "level1",
      name: "Level 1",
      description: "Basic daily English words and speaking practice",
      weeks: [
        {
          id: "week1",
          name: "Week 1",
          days: [
            {
              id: "day1",
              dayNumber: 1,
              title: "Daily Routine",
              word: "wake up",
              meaning: "to stop sleeping and become active",
              example: "I wake up at 6 o’clock every morning.",
              supportWords: ["morning", "bed", "alarm", "early", "routine"],
              speakingFocus:
                "Talk about your morning routine in 3 to 5 simple sentences.",
            },
            {
              id: "day2",
              dayNumber: 2,
              title: "Personal Action",
              word: "wash",
              meaning: "to clean something with water",
              example: "I wash my hands before lunch.",
              supportWords: ["soap", "water", "clean", "hands", "face"],
              speakingFocus:
                "Describe what you wash every day and when you do it.",
            },
            {
              id: "day3",
              dayNumber: 3,
              title: "Food Time",
              word: "breakfast",
              meaning: "the first meal of the day",
              example: "My breakfast is tea and bread.",
              supportWords: ["tea", "bread", "egg", "milk", "morning"],
              speakingFocus: "Speak about your breakfast using food words.",
            },
            {
              id: "day4",
              dayNumber: 4,
              title: "Movement",
              word: "go",
              meaning: "to move from one place to another",
              example: "I go to work by bus.",
              supportWords: ["walk", "bus", "school", "office", "road"],
              speakingFocus:
                "Say where you go every day and how you travel.",
            },
            {
              id: "day5",
              dayNumber: 5,
              title: "Work and Study",
              word: "learn",
              meaning: "to get knowledge or skill",
              example: "I learn English every evening.",
              supportWords: ["study", "teacher", "lesson", "book", "practice"],
              speakingFocus:
                "Talk about what you are learning these days.",
            },
            {
              id: "day6",
              dayNumber: 6,
              title: "Home Life",
              word: "family",
              meaning: "the people in your home or close relations",
              example: "My family eats dinner together.",
              supportWords: ["father", "mother", "brother", "sister", "home"],
              speakingFocus: "Introduce your family in simple English.",
            },
            {
              id: "day7",
              dayNumber: 7,
              title: "Rest Day Review",
              word: "rest",
              meaning: "to relax and stop working",
              example: "I rest on Sunday afternoon.",
              supportWords: ["relax", "home", "sleep", "peace", "weekend"],
              speakingFocus: "Talk about how you spend your free time.",
            },
          ],
        },
        {
          id: "week2",
          name: "Week 2",
          days: [
            {
              id: "day1",
              dayNumber: 1,
              title: "People Around Us",
              word: "friend",
              meaning: "a person you like and know well",
              example: "My friend helps me with English.",
              supportWords: ["help", "school", "talk", "happy", "together"],
              speakingFocus:
                "Describe your best friend in simple sentences.",
            },
            {
              id: "day2",
              dayNumber: 2,
              title: "Places",
              word: "market",
              meaning: "a place where people buy and sell things",
              example: "I buy vegetables from the market.",
              supportWords: ["shop", "road", "vegetables", "fruit", "buy"],
              speakingFocus: "Talk about a place you visit often.",
            },
            {
              id: "day3",
              dayNumber: 3,
              title: "Time",
              word: "today",
              meaning: "this present day",
              example: "Today I am practicing English.",
              supportWords: ["yesterday", "tomorrow", "now", "day", "time"],
              speakingFocus: "Say what you are doing today.",
            },
            {
              id: "day4",
              dayNumber: 4,
              title: "Feelings",
              word: "happy",
              meaning: "feeling good and pleased",
              example: "I feel happy when I learn new words.",
              supportWords: ["smile", "good", "enjoy", "excited", "fun"],
              speakingFocus: "Talk about what makes you happy.",
            },
            {
              id: "day5",
              dayNumber: 5,
              title: "Home Objects",
              word: "chair",
              meaning: "a seat for one person",
              example: "The chair is near the table.",
              supportWords: ["table", "room", "sit", "home", "wood"],
              speakingFocus: "Describe objects in your room.",
            },
            {
              id: "day6",
              dayNumber: 6,
              title: "Simple Actions",
              word: "carry",
              meaning: "to hold and move something",
              example: "I carry my bag to school.",
              supportWords: ["bag", "hold", "move", "lift", "walk"],
              speakingFocus: "Talk about what you carry every day.",
            },
            {
              id: "day7",
              dayNumber: 7,
              title: "Weekly Review",
              word: "practice",
              meaning: "to do something again and again to improve",
              example: "Practice makes speaking easy.",
              supportWords: ["repeat", "daily", "improve", "learn", "speak"],
              speakingFocus:
                "Speak about why daily practice is important.",
            },
          ],
        },
        {
          id: "week3",
          name: "Week 3",
          days: [
            {
              id: "day1",
              dayNumber: 1,
              title: "Food and Drink",
              word: "tea",
              meaning: "a hot drink made from tea leaves",
              example: "I drink tea in the morning.",
              supportWords: ["cup", "milk", "sugar", "morning", "drink"],
              speakingFocus:
                "Talk about what you like to drink every day.",
            },
            {
              id: "day2",
              dayNumber: 2,
              title: "Study Place",
              word: "school",
              meaning: "a place where students learn",
              example: "My school is near my home.",
              supportWords: [
                "teacher",
                "classroom",
                "student",
                "book",
                "learn",
              ],
              speakingFocus:
                "Describe your school or a place where you study.",
            },
            {
              id: "day3",
              dayNumber: 3,
              title: "Travel Object",
              word: "bus",
              meaning: "a large road vehicle for many passengers",
              example: "I go to work by bus.",
              supportWords: ["road", "ticket", "travel", "seat", "driver"],
              speakingFocus:
                "Speak about how you travel from one place to another.",
            },
            {
              id: "day4",
              dayNumber: 4,
              title: "People at Home",
              word: "mother",
              meaning: "a female parent",
              example: "My mother cooks tasty food.",
              supportWords: ["father", "family", "home", "care", "love"],
              speakingFocus:
                "Talk about your mother or a family member in simple English.",
            },
            {
              id: "day5",
              dayNumber: 5,
              title: "Simple Hobby",
              word: "play",
              meaning: "to take part in a game or enjoyable activity",
              example: "I play football in the evening.",
              supportWords: ["football", "friends", "park", "evening", "fun"],
              speakingFocus:
                "Talk about games or activities you enjoy.",
            },
            {
              id: "day6",
              dayNumber: 6,
              title: "Daily Place",
              word: "home",
              meaning: "the place where you live",
              example: "I go home after work.",
              supportWords: ["family", "room", "rest", "sleep", "house"],
              speakingFocus:
                "Describe your home using simple words.",
            },
            {
              id: "day7",
              dayNumber: 7,
              title: "Week 3 Review",
              word: "speak",
              meaning: "to say words with your voice",
              example: "I speak English every day.",
              supportWords: [
                "voice",
                "practice",
                "teacher",
                "sentence",
                "daily",
              ],
              speakingFocus:
                "Say why speaking practice is important for you.",
            },
          ],
        },
        {
          id: "week4",
          name: "Week 4",
          days: [
            {
              id: "day1",
              dayNumber: 1,
              title: "Nature",
              word: "sun",
              meaning:
                "the star that gives light and heat to the earth",
              example: "The sun rises in the morning.",
              supportWords: ["morning", "light", "sky", "day", "hot"],
              speakingFocus:
                "Talk about the weather or morning time.",
            },
            {
              id: "day2",
              dayNumber: 2,
              title: "Animal",
              word: "cat",
              meaning: "a small animal often kept as a pet",
              example: "The cat is sleeping near the door.",
              supportWords: ["dog", "pet", "sleep", "home", "animal"],
              speakingFocus:
                "Describe an animal you like or see often.",
            },
            {
              id: "day3",
              dayNumber: 3,
              title: "Health Habit",
              word: "water",
              meaning: "a clear liquid we drink",
              example: "I drink water many times a day.",
              supportWords: ["drink", "glass", "healthy", "body", "daily"],
              speakingFocus:
                "Talk about healthy daily habits.",
            },
            {
              id: "day4",
              dayNumber: 4,
              title: "Useful Object",
              word: "book",
              meaning: "a set of pages with writing or pictures",
              example: "This book helps me learn English.",
              supportWords: ["read", "pages", "lesson", "teacher", "study"],
              speakingFocus:
                "Describe a useful thing you use for learning.",
            },
            {
              id: "day5",
              dayNumber: 5,
              title: "Work Place",
              word: "office",
              meaning: "a place where people work",
              example: "My office is near the market.",
              supportWords: ["desk", "chair", "manager", "staff", "building"],
              speakingFocus:
                "Speak about your workplace or a place where people work.",
            },
            {
              id: "day6",
              dayNumber: 6,
              title: "Confidence Building",
              word: "confidence",
              meaning: "a feeling of trust in yourself",
              example: "Daily practice gives me confidence.",
              supportWords: ["speak", "strong", "practice", "improve", "clear"],
              speakingFocus:
                "Talk about how you are becoming a better English speaker.",
            },
            {
              id: "day7",
              dayNumber: 7,
              title: "Final Review",
              word: "progress",
              meaning: "improvement over time",
              example: "My English progress makes me happy.",
              supportWords: ["improve", "daily", "practice", "goal", "better"],
              speakingFocus:
                "Speak about your Level-1 journey and what you learned.",
            },
          ],
        },
      ],
    },

    {
      id: "level2",
      name: "Level 2",
      description:
        "Spoken English grammar with simple Hindi support through examples and speaking practice",
      weeks: [
        {
          id: "week1",
          name: "Week 1",
          days: [
            {
              id: "day1",
              dayNumber: 1,
              title: "I am",
              word: "am",
              meaning: "used with I to describe yourself",
              example: "I am a driver.",
              grammarHintHindi: "‘I am’ matlab ‘main hoon’.",
              grammarCoachVoice:
                "I am means main hoon. Use I am when you talk about yourself.",
              practicePrompt:
                "Say 3 sentences about yourself using I am. Example: I am a driver. I am happy. I am ready.",
              supportWords: [
                "teacher",
                "driver",
                "worker",
                "student",
                "farmer",
              ],
              speakingFocus:
                "Practice ‘I am’ sentences about yourself in clear spoken English.",
            },
            {
              id: "day2",
              dayNumber: 2,
              title: "You are",
              word: "are",
              meaning:
                "used with you to talk to one person or many people",
              example: "You are my friend.",
              grammarHintHindi: "‘You are’ matlab ‘tum ho’ ya ‘aap ho’.",
              grammarCoachVoice:
                "You are means tum ho or aap ho. Use You are when you talk to someone.",
              practicePrompt:
                "Make 3 simple sentences using You are. Example: You are my friend.",
              supportWords: [
                "friend",
                "strong",
                "good",
                "student",
                "helpful",
              ],
              speakingFocus:
                "Practice simple ‘You are’ sentences naturally and clearly.",
            },
            {
              id: "day3",
              dayNumber: 3,
              title: "We are",
              word: "we",
              meaning:
                "used when talking about yourself and other people together",
              example: "We are students.",
              grammarHintHindi: "‘We are’ matlab ‘hum hain’.",
              grammarCoachVoice:
                "We are means hum hain. Use We are when you talk about yourself and others together.",
              practicePrompt:
                "Speak 3 to 5 sentences using We are. Example: We are friends. We are ready.",
              supportWords: [
                "students",
                "friends",
                "workers",
                "family",
                "ready",
              ],
              speakingFocus:
                "Practice group sentences using ‘We are’.",
            },
            {
              id: "day4",
              dayNumber: 4,
              title: "They are",
              word: "they",
              meaning: "used for other people or things",
              example: "They are workers.",
              grammarHintHindi: "‘They are’ matlab ‘wo log hain’.",
              grammarCoachVoice:
                "They are means wo log hain. Use They are for other people or groups.",
              practicePrompt:
                "Describe a group of people using They are.",
              supportWords: [
                "workers",
                "teachers",
                "children",
                "happy",
                "busy",
              ],
              speakingFocus:
                "Practice simple spoken descriptions using ‘They are’.",
            },
            {
              id: "day5",
              dayNumber: 5,
              title: "I am + feeling",
              word: "happy",
              meaning: "feeling good or pleased",
              example: "I am happy today.",
              grammarHintHindi:
                "Feeling batane ke liye ‘I am’ use karte hain.",
              grammarCoachVoice:
                "Use I am for feelings. Example, I am happy. I am tired. I am fine.",
              practicePrompt:
                "Use I am with feelings. Example: I am happy. I am tired.",
              supportWords: ["sad", "tired", "fine", "good", "excited"],
              speakingFocus:
                "Speak about how you feel today using ‘I am’.",
            },
            {
              id: "day6",
              dayNumber: 6,
              title: "I am + place/status",
              word: "here",
              meaning: "in this place",
              example: "I am here now.",
              grammarHintHindi:
                "Jagah ya haal batane ke liye bhi ‘I am’ use hota hai.",
              grammarCoachVoice:
                "Use I am for place or status too. Example, I am here. I am at home. I am ready.",
              practicePrompt:
                "Use I am to describe your place or condition. Example: I am at home. I am ready.",
              supportWords: ["home", "ready", "late", "early", "inside"],
              speakingFocus:
                "Practice location and status sentences using ‘I am’.",
            },
            {
              id: "day7",
              dayNumber: 7,
              title: "Week 1 Review",
              word: "be verb",
              meaning:
                "am, is, are are helping verbs used to make basic spoken English sentences",
              example: "I am ready. You are kind. We are learning.",
              grammarHintHindi:
                "Am, is, are basic spoken English ke important helping verbs hain.",
              grammarCoachVoice:
                "This week review is am and are. I am, You are, We are, They are. These are basic spoken English patterns.",
              practicePrompt:
                "Review: I am, You are, We are, They are. Speak short grammar sentences with confidence.",
              supportWords: ["am", "is", "are", "ready", "learning"],
              speakingFocus:
                "Review all Week-1 be-verb speaking patterns.",
            },
          ],
        },

        {
          id: "week2",
          name: "Week 2",
          days: [
            {
              id: "day1",
              dayNumber: 1,
              title: "He is",
              word: "he",
              meaning: "used for a male person",
              example: "He is a doctor.",
              grammarHintHindi: "‘He is’ matlab ‘wo aadmi hai’.",
              grammarCoachVoice:
                "He is means wo aadmi hai. Use He is when talking about one man or boy.",
              practicePrompt:
                "Make simple sentences about a man. Example: He is a doctor.",
              supportWords: [
                "doctor",
                "driver",
                "teacher",
                "worker",
                "kind",
              ],
              speakingFocus: "Practice simple ‘He is’ sentences.",
            },
            {
              id: "day2",
              dayNumber: 2,
              title: "She is",
              word: "she",
              meaning: "used for a female person",
              example: "She is a teacher.",
              grammarHintHindi: "‘She is’ matlab ‘wo aurat hai’.",
              grammarCoachVoice:
                "She is means wo aurat hai. Use She is when talking about one woman or girl.",
              practicePrompt:
                "Make simple sentences about a woman. Example: She is kind.",
              supportWords: ["teacher", "doctor", "nurse", "happy", "strong"],
              speakingFocus: "Practice simple ‘She is’ sentences.",
            },
            {
              id: "day3",
              dayNumber: 3,
              title: "It is",
              word: "it",
              meaning: "used for a thing, place, or animal",
              example: "It is a car.",
              grammarHintHindi: "‘It is’ cheezon ke liye use hota hai.",
              grammarCoachVoice:
                "It is is used for things, places, or animals. Example, it is a car. It is big.",
              practicePrompt:
                "Speak about objects. Example: It is a book. It is big.",
              supportWords: ["car", "book", "cat", "big", "new"],
              speakingFocus:
                "Practice simple ‘It is’ sentences for things and animals.",
            },
            {
              id: "day4",
              dayNumber: 4,
              title: "He is / She is + feeling",
              word: "tired",
              meaning: "needing rest",
              example: "He is tired after work.",
              grammarHintHindi:
                "Feeling batane ke liye ‘He is’ aur ‘She is’ use karte hain.",
              grammarCoachVoice:
                "Use He is and She is for feelings too. Example, He is tired. She is happy.",
              practicePrompt:
                "Use He is and She is with feelings. Example: She is happy. He is tired.",
              supportWords: ["happy", "sad", "fine", "busy", "strong"],
              speakingFocus:
                "Practice feeling sentences with he/she.",
            },
            {
              id: "day5",
              dayNumber: 5,
              title: "He is / She is + profession",
              word: "doctor",
              meaning: "a person who treats sick people",
              example: "She is a doctor.",
              grammarHintHindi:
                "Job batane ke liye ‘He is’ ya ‘She is’ use hota hai.",
              grammarCoachVoice:
                "Use He is or She is to talk about jobs. Example, He is a driver. She is a teacher.",
              practicePrompt:
                "Speak about jobs using He is and She is. Example: He is a driver. She is a teacher.",
              supportWords: ["teacher", "driver", "worker", "nurse", "farmer"],
              speakingFocus:
                "Practice job sentences with he/she.",
            },
            {
              id: "day6",
              dayNumber: 6,
              title: "It is + description",
              word: "big",
              meaning: "large in size",
              example: "It is a big house.",
              grammarHintHindi:
                "Cheezon ka size ya quality batane ke liye ‘It is’ use hota hai.",
              grammarCoachVoice:
                "Use It is to describe things. Example, It is big. It is new. It is clean.",
              practicePrompt:
                "Describe things using It is. Example: It is big. It is new. It is clean.",
              supportWords: ["small", "new", "old", "clean", "beautiful"],
              speakingFocus:
                "Practice describing objects using ‘It is’.",
            },
            {
              id: "day7",
              dayNumber: 7,
              title: "Week 2 Review",
              word: "is",
              meaning: "used with he, she, and it",
              example: "He is ready. She is happy. It is useful.",
              grammarHintHindi:
                "He, She, It ke saath ‘is’ use hota hai.",
              grammarCoachVoice:
                "This week review is He is, She is, and It is. Use is with he, she, and it.",
              practicePrompt:
                "Review this week: He is, She is, It is. Speak short grammar sentences clearly and confidently.",
              supportWords: ["he", "she", "it", "ready", "happy"],
              speakingFocus: "Review all Week-2 ‘is’ patterns.",
            },
          ],
        },

        {
          id: "week3",
          name: "Week 3",
          days: [
            {
              id: "day1",
              dayNumber: 1,
              title: "I have",
              word: "have",
              meaning: "to own or possess something",
              example: "I have a bike.",
              grammarHintHindi: "‘I have’ matlab ‘mere paas hai’.",
              grammarCoachVoice:
                "I have means mere paas hai. Use I have to say what you have.",
              practicePrompt:
                "Speak about what you have. Example: I have a phone.",
              supportWords: ["bike", "phone", "bag", "book", "job"],
              speakingFocus:
                "Practice ‘I have’ sentences about possession.",
            },
            {
              id: "day2",
              dayNumber: 2,
              title: "You have",
              word: "have",
              meaning:
                "used with you to show possession",
              example: "You have a good job.",
              grammarHintHindi:
                "‘You have’ bhi possession dikhata hai.",
              grammarCoachVoice:
                "Use You have to show possession too. Example, You have a car. You have a nice bag.",
              practicePrompt:
                "Use You have in simple spoken English. Example: You have a car. You have a nice bag.",
              supportWords: ["job", "car", "book", "family", "house"],
              speakingFocus: "Practice ‘You have’ sentences.",
            },
            {
              id: "day3",
              dayNumber: 3,
              title: "We have / They have",
              word: "have",
              meaning:
                "used with we and they to show possession",
              example: "We have a plan.",
              grammarHintHindi:
                "We aur They ke saath bhi ‘have’ use hota hai.",
              grammarCoachVoice:
                "Use We have and They have for plural subjects. Example, We have work. They have a car.",
              practicePrompt:
                "Use We have and They have. Example: We have work. They have a car.",
              supportWords: ["plan", "house", "friends", "ideas", "work"],
              speakingFocus:
                "Practice plural possession sentences.",
            },
            {
              id: "day4",
              dayNumber: 4,
              title: "He has",
              word: "has",
              meaning: "used with he to show possession",
              example: "He has a car.",
              grammarHintHindi:
                "‘Has’ he/she/it ke saath use hota hai.",
              grammarCoachVoice:
                "Has is used with he, she, and it. Example, He has a car.",
              practicePrompt:
                "Make simple sentences with He has. Example: He has a car.",
              supportWords: ["car", "bike", "phone", "job", "family"],
              speakingFocus: "Practice ‘He has’ sentences.",
            },
            {
              id: "day5",
              dayNumber: 5,
              title: "She has",
              word: "has",
              meaning: "used with she to show possession",
              example: "She has a new phone.",
              grammarHintHindi:
                "‘She’ ke saath ‘has’ use hota hai.",
              grammarCoachVoice:
                "Use has with she. Example, She has a bag. She has a book.",
              practicePrompt:
                "Use She has in simple examples. Example: She has a bag. She has a book.",
              supportWords: ["phone", "bag", "car", "house", "book"],
              speakingFocus: "Practice ‘She has’ sentences.",
            },
            {
              id: "day6",
              dayNumber: 6,
              title: "It has",
              word: "has",
              meaning:
                "used with it to describe parts or features",
              example: "It has four wheels.",
              grammarHintHindi:
                "Object ya animal ke features batane ke liye ‘It has’ use hota hai.",
              grammarCoachVoice:
                "Use It has for features or parts. Example, It has four wheels. It has a red color.",
              practicePrompt:
                "Use It has for objects or animals. Example: It has four legs. It has a red color.",
              supportWords: ["wheels", "door", "screen", "legs", "color"],
              speakingFocus:
                "Practice object-feature sentences using ‘It has’.",
            },
            {
              id: "day7",
              dayNumber: 7,
              title: "Week 3 Review",
              word: "have / has",
              meaning: "used to show possession",
              example: "I have a pen. She has a bag.",
              grammarHintHindi:
                "Have aur has dono possession dikhate hain.",
              grammarCoachVoice:
                "This week review is have and has. Use have with I, you, we, they. Use has with he, she, it.",
              practicePrompt:
                "Review this week: I have, You have, We have, They have, He has, She has, It has.",
              supportWords: ["have", "has", "pen", "bag", "car"],
              speakingFocus:
                "Review all Week-3 have/has patterns.",
            },
          ],
        },

        {
          id: "week4",
          name: "Week 4",
          days: [
            {
              id: "day1",
              dayNumber: 1,
              title: "I + action",
              word: "work",
              meaning: "to do a job",
              example: "I work in a shop.",
              grammarHintHindi:
                "Simple present daily kaam batata hai.",
              grammarCoachVoice:
                "Simple present is used for daily actions. Example, I work. I read. I learn.",
              practicePrompt:
                "Speak about your daily actions. Example: I work. I read. I learn.",
              supportWords: ["work", "drive", "teach", "learn", "read"],
              speakingFocus:
                "Practice daily action sentences with ‘I’.",
            },
            {
              id: "day2",
              dayNumber: 2,
              title: "You + action",
              word: "speak",
              meaning: "to say words with your voice",
              example: "You speak clearly.",
              grammarHintHindi:
                "‘You’ ke saath base verb use hota hai.",
              grammarCoachVoice:
                "Use the base verb with you. Example, You speak English. You study every day.",
              practicePrompt:
                "Use You with action verbs. Example: You speak English. You study every day.",
              supportWords: ["speak", "walk", "study", "help", "listen"],
              speakingFocus:
                "Practice daily action sentences with ‘You’.",
            },
            {
              id: "day3",
              dayNumber: 3,
              title: "We / They + action",
              word: "play",
              meaning:
                "to take part in a game or activity",
              example: "We play in the evening.",
              grammarHintHindi:
                "We aur They ke saath base verb use hota hai.",
              grammarCoachVoice:
                "Use the base verb with we and they. Example, We work. They study.",
              practicePrompt:
                "Speak about group actions using We and They. Example: We work. They study.",
              supportWords: ["play", "work", "study", "go", "eat"],
              speakingFocus:
                "Practice daily action sentences with plural subjects.",
            },
            {
              id: "day4",
              dayNumber: 4,
              title: "He + action",
              word: "drives",
              meaning: "controls a vehicle",
              example: "He drives a taxi.",
              grammarHintHindi:
                "He/She ke saath verb mein usually ‘s’ lagta hai.",
              grammarCoachVoice:
                "With he, the verb usually takes s. Example, He works. He drives.",
              practicePrompt:
                "Example: He works. He drives. Make simple sentences.",
              supportWords: ["drives", "works", "reads", "plays", "helps"],
              speakingFocus:
                "Practice simple present sentences with ‘He’.",
            },
            {
              id: "day5",
              dayNumber: 5,
              title: "She + action",
              word: "reads",
              meaning:
                "looks at written words and understands them",
              example: "She reads a book.",
              grammarHintHindi:
                "‘She’ ke saath bhi verb mein usually ‘s’ lagta hai.",
              grammarCoachVoice:
                "With she, the verb usually takes s. Example, She cooks. She reads.",
              practicePrompt:
                "Use action verbs with She. Example: She cooks food. She reads a book.",
              supportWords: ["reads", "writes", "cooks", "teaches", "drinks"],
              speakingFocus:
                "Practice simple present sentences with ‘She’.",
            },
            {
              id: "day6",
              dayNumber: 6,
              title: "It + action",
              word: "runs",
              meaning: "moves quickly",
              example: "It runs fast.",
              grammarHintHindi:
                "‘It’ ke saath bhi often verb mein ‘s’ lagta hai.",
              grammarCoachVoice:
                "With it, the verb usually takes s. Example, It moves. It runs fast.",
              practicePrompt:
                "Use It with simple actions for things or animals. Example: It moves. It runs fast.",
              supportWords: ["runs", "moves", "works", "opens", "sounds"],
              speakingFocus:
                "Practice simple present sentences with ‘It’.",
            },
            {
              id: "day7",
              dayNumber: 7,
              title: "Week 4 Review",
              word: "simple present",
              meaning:
                "a tense used for daily habits and routine actions",
              example: "I work. He works. She reads.",
              grammarHintHindi:
                "Simple present roz ke actions aur habits ke liye use hota hai.",
              grammarCoachVoice:
                "Simple present is used for daily habits and routine actions. Example, I work. He works. She reads.",
              practicePrompt:
                "Review this week: daily action sentences in simple present. Speak clearly with correct subject and verb.",
              supportWords: ["work", "works", "read", "reads", "daily"],
              speakingFocus:
                "Review all Week-4 simple present patterns.",
            },
          ],
        },

        {
          id: "week5",
          name: "Week 5",
          days: [
            {
              id: "day1",
              dayNumber: 1,
              title: "What is your name?",
              word: "name",
              meaning:
                "the word people use to identify a person",
              example: "My name is Ali.",
              grammarHintHindi:
                "‘What is your name?’ matlab ‘aapka naam kya hai’.",
              grammarCoachVoice:
                "What is your name means aapka naam kya hai. A simple answer is, My name is Ali.",
              practicePrompt:
                "Practice asking and answering this question.",
              supportWords: ["Ali", "Ahmed", "Amin", "student", "friend"],
              speakingFocus:
                "Practice basic name-question speaking.",
            },
            {
              id: "day2",
              dayNumber: 2,
              title: "Where do you live?",
              word: "live",
              meaning:
                "to stay in a place as your home",
              example: "I live in Abu Dhabi.",
              grammarHintHindi: "‘Where’ matlab ‘kahan’.",
              grammarCoachVoice:
                "Where do you live means tum kahan rehte ho or aap kahan rehte hain. A simple answer is, I live in Abu Dhabi.",
              practicePrompt:
                "Practice answering: Where do you live? I live in ___.",
              supportWords: ["Dubai", "Abu Dhabi", "village", "city", "home"],
              speakingFocus:
                "Practice location-question speaking.",
            },
            {
              id: "day3",
              dayNumber: 3,
              title: "What do you do?",
              word: "job",
              meaning: "the work a person does",
              example: "I work in a company.",
              grammarHintHindi:
                "Ye sawaal kaam ya profession ke liye use hota hai.",
              grammarCoachVoice:
                "What do you do is used for job or profession. A simple answer is, I am a driver, or I work in a company.",
              practicePrompt:
                "Practice this question and answer: What do you do? I am a driver. / I work in a shop.",
              supportWords: [
                "driver",
                "teacher",
                "worker",
                "business",
                "company",
              ],
              speakingFocus:
                "Practice job-question speaking.",
            },
            {
              id: "day4",
              dayNumber: 4,
              title: "How are you?",
              word: "fine",
              meaning: "feeling well or okay",
              example: "I am fine, thank you.",
              grammarHintHindi:
                "Ye greeting question hai. Jawaab short aur simple hota hai.",
              grammarCoachVoice:
                "How are you is a greeting question. A simple answer is, I am fine, thank you.",
              practicePrompt:
                "Practice greeting questions. Example: How are you? I am fine. I am good today.",
              supportWords: ["fine", "good", "happy", "okay", "tired"],
              speakingFocus:
                "Practice greeting-question speaking.",
            },
            {
              id: "day5",
              dayNumber: 5,
              title: "Basic self-introduction",
              word: "introduce",
              meaning:
                "to tell people who you are",
              example:
                "My name is Ali. I am a driver. I live in Dubai.",
              grammarHintHindi:
                "Introduction mein naam, kaam, aur jagah batate hain.",
              grammarCoachVoice:
                "In self introduction, say your name, job, and place. Example, My name is Ali. I am a driver. I live in Dubai.",
              practicePrompt:
                "Give a 4 to 6 sentence self-introduction using Level-2 grammar.",
              supportWords: ["name", "job", "live", "family", "English"],
              speakingFocus:
                "Practice full self-introduction speaking.",
            },
            {
              id: "day6",
              dayNumber: 6,
              title: "Mini conversation practice",
              word: "conversation",
              meaning:
                "a talk between two or more people",
              example:
                "Hello. My name is Ali. What is your name?",
              grammarHintHindi:
                "Chhoti conversation mein greeting, naam, jagah aur kaam use hote hain.",
              grammarCoachVoice:
                "In a mini conversation, use greeting, name, place, and job. Example, Hello. My name is Ali. What is your name?",
              practicePrompt:
                "Practice a short spoken conversation with simple grammar and short answers.",
              supportWords: ["hello", "name", "live", "job", "fine"],
              speakingFocus:
                "Practice mini conversation speaking.",
            },
            {
              id: "day7",
              dayNumber: 7,
              title: "Final Grammar Review",
              word: "grammar",
              meaning:
                "the rules that help us make correct sentences",
              example:
                "I am a student. She has a book. He works every day.",
              grammarHintHindi:
                "Level-2 grammar ka review: am/is/are, have/has, simple present, questions.",
              grammarCoachVoice:
                "This is the final grammar review. We learned am, is, are, have, has, simple present, and basic questions.",
              practicePrompt:
                "Review all Level-2 grammar: am/is/are, have/has, simple present, and basic question-answer speaking.",
              supportWords: ["am", "is", "are", "have", "has", "works"],
              speakingFocus:
                "Practice a full Level-2 grammar recap.",
            },
          ],
        },
      ],
    },

    {
      id: "level3",
      name: "Level 3",
      description:
        "Real conversation English for daily life, questions, descriptions, opinions, situations, and storytelling",
      weeks: [
        {
          id: "week1",
          name: "Week 1",
          days: [
            {
              id: "day1",
              dayNumber: 1,
              title: "My Daily Routine",
              word: "routine",
              meaning:
                "the things you do every day in order",
              example: "I wake up early and go to work.",
              supportWords: ["morning", "breakfast", "work", "evening", "sleep"],
              speakingFocus:
                "Talk about your full daily routine in 4 to 6 simple sentences.",
            },
            {
              id: "day2",
              dayNumber: 2,
              title: "At Home",
              word: "home",
              meaning: "the place where you live",
              example: "At home, I help my family and rest.",
              supportWords: ["family", "room", "kitchen", "rest", "help"],
              speakingFocus:
                "Describe what you do at home in simple spoken English.",
            },
            {
              id: "day3",
              dayNumber: 3,
              title: "At Work",
              word: "workplace",
              meaning: "the place where you work",
              example: "My workplace is busy in the morning.",
              supportWords: ["office", "shop", "manager", "staff", "customer"],
              speakingFocus:
                "Talk about your workplace and your work in 4 to 5 sentences.",
            },
            {
              id: "day4",
              dayNumber: 4,
              title: "At the Market",
              word: "market",
              meaning: "a place where people buy things",
              example: "I go to the market to buy vegetables.",
              supportWords: ["buy", "shop", "vegetables", "fruit", "money"],
              speakingFocus:
                "Speak about a visit to the market in short sentences.",
            },
            {
              id: "day5",
              dayNumber: 5,
              title: "My Hobbies",
              word: "hobby",
              meaning:
                "something you enjoy doing in your free time",
              example: "My hobby is playing cricket.",
              supportWords: ["play", "read", "walk", "music", "friends"],
              speakingFocus:
                "Talk about your hobbies and free-time activities.",
            },
            {
              id: "day6",
              dayNumber: 6,
              title: "My Day in Simple Conversation",
              word: "conversation",
              meaning:
                "a talk between two or more people",
              example:
                "In the morning I go to work, and in the evening I rest.",
              supportWords: ["morning", "work", "evening", "home", "daily"],
              speakingFocus:
                "Have a simple conversation about your day.",
            },
            {
              id: "day7",
              dayNumber: 7,
              title: "Week 1 Review",
              word: "daily life",
              meaning:
                "the normal activities of everyday life",
              example: "My daily life is busy but good.",
              supportWords: ["routine", "home", "work", "market", "hobby"],
              speakingFocus:
                "Review Week 1 by talking about your daily life confidently.",
            },
          ],
        },

        {
          id: "week2",
          name: "Week 2",
          days: [
            {
              id: "day1",
              dayNumber: 1,
              title: "What Questions",
              word: "what",
              meaning:
                "used to ask about things or information",
              example: "What do you do in the evening?",
              supportWords: ["do", "eat", "like", "work", "study"],
              speakingFocus:
                "Ask and answer 3 simple questions starting with What.",
            },
            {
              id: "day2",
              dayNumber: 2,
              title: "Where Questions",
              word: "where",
              meaning: "used to ask about place",
              example: "Where do you live?",
              supportWords: ["live", "work", "go", "stay", "travel"],
              speakingFocus:
                "Practice asking and answering questions using Where.",
            },
            {
              id: "day3",
              dayNumber: 3,
              title: "When Questions",
              word: "when",
              meaning: "used to ask about time",
              example: "When do you wake up?",
              supportWords: ["morning", "night", "today", "evening", "time"],
              speakingFocus:
                "Ask and answer time-based questions in short sentences.",
            },
            {
              id: "day4",
              dayNumber: 4,
              title: "Why Questions",
              word: "why",
              meaning: "used to ask for reason",
              example: "Why do you want to learn English?",
              supportWords: ["because", "learn", "job", "future", "important"],
              speakingFocus:
                "Practice answering Why questions with simple reasons.",
            },
            {
              id: "day5",
              dayNumber: 5,
              title: "How Questions",
              word: "how",
              meaning:
                "used to ask about method, condition, or feeling",
              example: "How do you travel to work?",
              supportWords: ["travel", "feel", "study", "learn", "practice"],
              speakingFocus:
                "Ask and answer 3 simple questions using How.",
            },
            {
              id: "day6",
              dayNumber: 6,
              title: "Question Practice",
              word: "question",
              meaning:
                "something you ask to get information",
              example: "Can I ask you a question?",
              supportWords: ["ask", "answer", "talk", "listen", "reply"],
              speakingFocus:
                "Practice short question-answer conversation.",
            },
            {
              id: "day7",
              dayNumber: 7,
              title: "Week 2 Review",
              word: "ask",
              meaning: "to say something to get information",
              example: "I ask simple questions in English.",
              supportWords: ["what", "where", "when", "why", "how"],
              speakingFocus:
                "Review all question forms from Week 2 in spoken English.",
            },
          ],
        },

        {
          id: "week3",
          name: "Week 3",
          days: [
            {
              id: "day1",
              dayNumber: 1,
              title: "Describe a Person",
              word: "person",
              meaning: "a human being",
              example: "My friend is kind and helpful.",
              supportWords: ["kind", "helpful", "strong", "friendly", "good"],
              speakingFocus:
                "Describe one person you know in 4 to 5 simple sentences.",
            },
            {
              id: "day2",
              dayNumber: 2,
              title: "Describe a Friend",
              word: "friend",
              meaning:
                "a person you like and know well",
              example: "My friend is very honest and cheerful.",
              supportWords: ["honest", "happy", "helpful", "school", "close"],
              speakingFocus:
                "Talk about your friend’s nature and habits.",
            },
            {
              id: "day3",
              dayNumber: 3,
              title: "Describe Your Village or City",
              word: "place",
              meaning:
                "an area, town, city, or village",
              example: "My village is peaceful and clean.",
              supportWords: ["peaceful", "busy", "small", "beautiful", "people"],
              speakingFocus:
                "Describe your village or city in simple English.",
            },
            {
              id: "day4",
              dayNumber: 4,
              title: "Describe Your Home",
              word: "house",
              meaning:
                "the building where you live",
              example: "My house has three rooms and a kitchen.",
              supportWords: ["room", "kitchen", "clean", "big", "family"],
              speakingFocus:
                "Describe your house clearly in 4 to 6 sentences.",
            },
            {
              id: "day5",
              dayNumber: 5,
              title: "Describe Your Workplace",
              word: "office",
              meaning: "a place where people work",
              example: "My office is neat and busy.",
              supportWords: ["desk", "staff", "manager", "busy", "work"],
              speakingFocus:
                "Talk about your workplace in clear spoken English.",
            },
            {
              id: "day6",
              dayNumber: 6,
              title: "Describe Things Around You",
              word: "object",
              meaning:
                "a thing that you can see or use",
              example: "This chair is wooden and comfortable.",
              supportWords: ["chair", "table", "book", "phone", "bag"],
              speakingFocus:
                "Describe 2 or 3 objects around you using simple adjectives.",
            },
            {
              id: "day7",
              dayNumber: 7,
              title: "Week 3 Review",
              word: "describe",
              meaning:
                "to say what something or someone is like",
              example: "I can describe people and places in English.",
              supportWords: ["person", "place", "friend", "house", "office"],
              speakingFocus:
                "Review Week 3 by describing people, places, and things confidently.",
            },
          ],
        },

        {
          id: "week4",
          name: "Week 4",
          days: [
            {
              id: "day1",
              dayNumber: 1,
              title: "Likes",
              word: "like",
              meaning:
                "to enjoy or prefer something",
              example: "I like tea and simple food.",
              supportWords: ["tea", "food", "music", "English", "travel"],
              speakingFocus:
                "Talk about 3 things you like and why.",
            },
            {
              id: "day2",
              dayNumber: 2,
              title: "Dislikes",
              word: "dislike",
              meaning: "to not like something",
              example: "I do not like very spicy food.",
              supportWords: ["food", "noise", "rain", "delay", "crowd"],
              speakingFocus:
                "Speak about things you do not like in simple polite English.",
            },
            {
              id: "day3",
              dayNumber: 3,
              title: "Preferences",
              word: "prefer",
              meaning:
                "to like one thing more than another",
              example: "I prefer tea to coffee.",
              supportWords: ["tea", "coffee", "morning", "bus", "car"],
              speakingFocus:
                "Use prefer in 3 short speaking sentences.",
            },
            {
              id: "day4",
              dayNumber: 4,
              title: "Opinions About Learning English",
              word: "opinion",
              meaning:
                "what you think about something",
              example:
                "I think English is very important for my future.",
              supportWords: [
                "important",
                "future",
                "job",
                "confidence",
                "speaking",
              ],
              speakingFocus:
                "Give your opinion about learning English in 4 to 5 sentences.",
            },
            {
              id: "day5",
              dayNumber: 5,
              title: "Opinions About Work and Life",
              word: "think",
              meaning:
                "to have an idea or opinion in your mind",
              example: "I think hard work is important.",
              supportWords: [
                "hard work",
                "family",
                "health",
                "success",
                "discipline",
              ],
              speakingFocus:
                "Speak about your opinion on life or work.",
            },
            {
              id: "day6",
              dayNumber: 6,
              title: "Agree and Disagree Politely",
              word: "agree",
              meaning: "to have the same opinion",
              example: "I agree with you.",
              supportWords: ["agree", "disagree", "maybe", "good", "idea"],
              speakingFocus:
                "Practice polite speaking using I agree, I don’t agree, maybe.",
            },
            {
              id: "day7",
              dayNumber: 7,
              title: "Week 4 Review",
              word: "preference",
              meaning:
                "something you choose because you like it more",
              example:
                "My preference is simple and healthy food.",
              supportWords: ["like", "dislike", "prefer", "think", "agree"],
              speakingFocus:
                "Review Week 4 by talking about likes, dislikes, and opinions.",
            },
          ],
        },

        {
          id: "week5",
          name: "Week 5",
          days: [
            {
              id: "day1",
              dayNumber: 1,
              title: "At the Shop",
              word: "shop",
              meaning:
                "a place where things are sold",
              example: "I want to buy a shirt.",
              supportWords: ["buy", "price", "shirt", "money", "shopkeeper"],
              speakingFocus:
                "Practice a simple buying conversation at the shop.",
            },
            {
              id: "day2",
              dayNumber: 2,
              title: "At the Bus Stop",
              word: "bus stop",
              meaning:
                "a place where people wait for a bus",
              example: "When will the bus arrive?",
              supportWords: ["bus", "ticket", "wait", "late", "time"],
              speakingFocus:
                "Speak in a short real-life travel situation.",
            },
            {
              id: "day3",
              dayNumber: 3,
              title: "At the Doctor",
              word: "doctor",
              meaning:
                "a person who treats sick people",
              example: "I have a headache.",
              supportWords: ["pain", "medicine", "fever", "rest", "health"],
              speakingFocus:
                "Practice a short conversation with a doctor.",
            },
            {
              id: "day4",
              dayNumber: 4,
              title: "Asking for Help",
              word: "help",
              meaning: "support or assistance",
              example: "Excuse me, can you help me?",
              supportWords: ["excuse me", "please", "help", "problem", "thank you"],
              speakingFocus:
                "Practice polite English for asking help.",
            },
            {
              id: "day5",
              dayNumber: 5,
              title: "Phone Conversation",
              word: "phone",
              meaning:
                "a device used to talk from a distance",
              example: "Hello, can I speak to Ali?",
              supportWords: ["hello", "speak", "call", "later", "message"],
              speakingFocus:
                "Practice a short and simple phone conversation.",
            },
            {
              id: "day6",
              dayNumber: 6,
              title: "Meeting Someone New",
              word: "meet",
              meaning:
                "to see and speak to someone for the first time or again",
              example: "Nice to meet you.",
              supportWords: ["hello", "name", "from", "job", "nice"],
              speakingFocus:
                "Practice meeting someone and talking for 3 to 4 short turns.",
            },
            {
              id: "day7",
              dayNumber: 7,
              title: "Week 5 Review",
              word: "situation",
              meaning:
                "a set of conditions or a real-life event",
              example: "I can speak in daily life situations.",
              supportWords: ["shop", "doctor", "bus", "help", "phone"],
              speakingFocus:
                "Review Week 5 with daily real-life speaking situations.",
            },
          ],
        },

        {
          id: "week6",
          name: "Week 6",
          days: [
            {
              id: "day1",
              dayNumber: 1,
              title: "Talk About Yesterday",
              word: "yesterday",
              meaning: "the day before today",
              example: "Yesterday I went to the market.",
              supportWords: ["went", "saw", "ate", "worked", "rested"],
              speakingFocus:
                "Talk about what you did yesterday in 4 short sentences.",
            },
            {
              id: "day2",
              dayNumber: 2,
              title: "A Happy Day",
              word: "memory",
              meaning:
                "something you remember from the past",
              example: "One happy day, I visited my friend.",
              supportWords: ["happy", "visited", "family", "friend", "enjoyed"],
              speakingFocus:
                "Tell about one happy day in simple English.",
            },
            {
              id: "day3",
              dayNumber: 3,
              title: "A Busy Day",
              word: "busy",
              meaning:
                "having a lot to do",
              example: "Yesterday was a busy day for me.",
              supportWords: ["morning", "work", "travel", "late", "tired"],
              speakingFocus:
                "Describe a busy day in simple story form.",
            },
            {
              id: "day4",
              dayNumber: 4,
              title: "My Childhood Memory",
              word: "childhood",
              meaning:
                "the time when you were a child",
              example: "In my childhood, I played in the village.",
              supportWords: ["school", "village", "friends", "games", "family"],
              speakingFocus:
                "Tell a short memory from your childhood.",
            },
            {
              id: "day5",
              dayNumber: 5,
              title: "A Short Story About My Day",
              word: "story",
              meaning: "a description of events",
              example:
                "In the morning I woke up early, then I went to work.",
              supportWords: ["morning", "then", "after that", "finally", "night"],
              speakingFocus:
                "Tell a short story about your day using sequence words.",
            },
            {
              id: "day6",
              dayNumber: 6,
              title: "Speak with Confidence",
              word: "confidence",
              meaning:
                "belief in your ability",
              example: "I can speak English with confidence now.",
              supportWords: ["confident", "clear", "practice", "improve", "strong"],
              speakingFocus:
                "Talk confidently for 20 to 30 seconds on any simple topic.",
            },
            {
              id: "day7",
              dayNumber: 7,
              title: "Final Level 3 Review",
              word: "conversation",
              meaning:
                "spoken communication between people",
              example:
                "Now I can ask, answer, describe, and tell short stories.",
              supportWords: ["question", "answer", "describe", "opinion", "story"],
              speakingFocus:
                "Review all Level-3 speaking skills in one confident speaking session.",
            },
          ],
        },
      ],
    },

    {
      id: "level4",
      name: "Level 4",
      description:
        "Past and future English speaking for real life, plans, experiences, timelines, and confident communication",
      weeks: [
        {
          id: "week1",
          name: "Week 1",
          days: [
            {
              id: "day1",
              dayNumber: 1,
              title: "Yesterday I...",
              word: "yesterday",
              meaning: "the day before today",
              example: "Yesterday I visited the market.",
              supportWords: ["went", "visited", "ate", "worked", "rested"],
              speakingFocus:
                "Talk about what you did yesterday in 4 to 5 simple past sentences.",
            },
            {
              id: "day2",
              dayNumber: 2,
              title: "Last Night",
              word: "last night",
              meaning: "the night before today",
              example: "Last night I watched TV and slept early.",
              supportWords: ["watched", "cooked", "talked", "slept", "studied"],
              speakingFocus:
                "Speak about last night using 4 short past sentences.",
            },
            {
              id: "day3",
              dayNumber: 3,
              title: "Past Daily Actions",
              word: "past action",
              meaning: "an action that already happened",
              example: "I worked in the office yesterday.",
              supportWords: ["worked", "cleaned", "helped", "walked", "played"],
              speakingFocus:
                "Practice short sentences about completed actions in the past.",
            },
            {
              id: "day4",
              dayNumber: 4,
              title: "Where Did You Go?",
              word: "went",
              meaning: "past form of go",
              example: "I went to the shop in the evening.",
              supportWords: ["shop", "market", "mosque", "office", "home"],
              speakingFocus:
                "Talk about places you went yesterday or last week.",
            },
            {
              id: "day5",
              dayNumber: 5,
              title: "What Did You Eat?",
              word: "ate",
              meaning: "past form of eat",
              example: "I ate rice and chicken for dinner.",
              supportWords: ["rice", "tea", "bread", "fruit", "dinner"],
              speakingFocus:
                "Describe what you ate or drank using simple past sentences.",
            },
            {
              id: "day6",
              dayNumber: 6,
              title: "Who Did You Meet?",
              word: "met",
              meaning: "past form of meet",
              example: "I met my friend after work.",
              supportWords: ["friend", "teacher", "manager", "family", "doctor"],
              speakingFocus:
                "Speak about people you met recently.",
            },
            {
              id: "day7",
              dayNumber: 7,
              title: "Week 1 Review",
              word: "past",
              meaning: "time before now",
              example:
                "Yesterday I worked, rested, and talked with my family.",
              supportWords: ["yesterday", "went", "ate", "met", "worked"],
              speakingFocus:
                "Review Week 1 by speaking about yesterday clearly and confidently.",
            },
          ],
        },

        {
          id: "week2",
          name: "Week 2",
          days: [
            {
              id: "day1",
              dayNumber: 1,
              title: "Last Week",
              word: "last week",
              meaning: "the week before this week",
              example: "Last week I was very busy.",
              supportWords: ["busy", "work", "travel", "family", "rest"],
              speakingFocus:
                "Talk about your last week in 4 to 6 past sentences.",
            },
            {
              id: "day2",
              dayNumber: 2,
              title: "A Good Day in the Past",
              word: "good day",
              meaning:
                "a pleasant day you remember",
              example:
                "It was a good day because I met my friend.",
              supportWords: ["happy", "friend", "family", "enjoyed", "smiled"],
              speakingFocus:
                "Describe one good day from the past in simple English.",
            },
            {
              id: "day3",
              dayNumber: 3,
              title: "A Busy Day in the Past",
              word: "busy day",
              meaning:
                "a day with a lot of work or activity",
              example: "Yesterday was a busy day for me.",
              supportWords: ["morning", "late", "office", "travel", "tired"],
              speakingFocus:
                "Describe a busy day using sequence and past verbs.",
            },
            {
              id: "day4",
              dayNumber: 4,
              title: "Past Routine",
              word: "used to",
              meaning:
                "something you did regularly before",
              example: "I used to play cricket in the evening.",
              supportWords: ["childhood", "school", "village", "friends", "games"],
              speakingFocus:
                "Talk about things you used to do before.",
            },
            {
              id: "day5",
              dayNumber: 5,
              title: "Then and Now",
              word: "before",
              meaning: "earlier than now",
              example: "Before, I was shy. Now, I speak more.",
              supportWords: ["before", "now", "shy", "confident", "improve"],
              speakingFocus:
                "Compare your past and present in 4 short sentences.",
            },
            {
              id: "day6",
              dayNumber: 6,
              title: "A Childhood Memory",
              word: "memory",
              meaning:
                "something you remember from the past",
              example: "In my childhood, I played near my home.",
              supportWords: ["village", "school", "friends", "games", "family"],
              speakingFocus:
                "Tell a simple childhood memory clearly.",
            },
            {
              id: "day7",
              dayNumber: 7,
              title: "Week 2 Review",
              word: "remember",
              meaning:
                "to keep something in your mind from the past",
              example:
                "I remember my school days and village life.",
              supportWords: [
                "last week",
                "before",
                "memory",
                "childhood",
                "past",
              ],
              speakingFocus:
                "Review Week 2 with one short story from the past.",
            },
          ],
        },

        {
          id: "week3",
          name: "Week 3",
          days: [
            {
              id: "day1",
              dayNumber: 1,
              title: "Tomorrow I Will...",
              word: "tomorrow",
              meaning: "the day after today",
              example: "Tomorrow I will go to work early.",
              supportWords: ["will", "go", "study", "call", "visit"],
              speakingFocus:
                "Talk about tomorrow using 4 to 5 future sentences with will.",
            },
            {
              id: "day2",
              dayNumber: 2,
              title: "My Future Plan",
              word: "plan",
              meaning:
                "something you intend to do",
              example: "I will study English tomorrow evening.",
              supportWords: ["study", "work", "practice", "improve", "future"],
              speakingFocus:
                "Speak about your short future plan clearly.",
            },
            {
              id: "day3",
              dayNumber: 3,
              title: "Next Week",
              word: "next week",
              meaning: "the week after this week",
              example: "Next week I will be busy at work.",
              supportWords: ["office", "travel", "meeting", "family", "practice"],
              speakingFocus:
                "Talk about what you will do next week.",
            },
            {
              id: "day4",
              dayNumber: 4,
              title: "Future Goal",
              word: "goal",
              meaning:
                "something you want to achieve",
              example: "I will improve my English speaking.",
              supportWords: ["English", "job", "confidence", "practice", "success"],
              speakingFocus:
                "Talk about one important future goal in simple English.",
            },
            {
              id: "day5",
              dayNumber: 5,
              title: "Promises and Decisions",
              word: "promise",
              meaning:
                "a strong statement that you will do something",
              example: "I will practice English every day.",
              supportWords: ["practice", "daily", "learn", "speak", "improve"],
              speakingFocus:
                "Make 3 to 5 simple future promises using will.",
            },
            {
              id: "day6",
              dayNumber: 6,
              title: "Helping in the Future",
              word: "help",
              meaning: "to support someone",
              example: "I will help my family tomorrow.",
              supportWords: ["family", "friend", "work", "home", "tomorrow"],
              speakingFocus:
                "Talk about how you will help someone in the future.",
            },
            {
              id: "day7",
              dayNumber: 7,
              title: "Week 3 Review",
              word: "future",
              meaning: "time after now",
              example: "Tomorrow I will work, study, and rest.",
              supportWords: ["tomorrow", "will", "plan", "goal", "next week"],
              speakingFocus:
                "Review Week 3 by speaking about your future plans.",
            },
          ],
        },

        {
          id: "week4",
          name: "Week 4",
          days: [
            {
              id: "day1",
              dayNumber: 1,
              title: "Going To Plans",
              word: "going to",
              meaning:
                "used for planned future actions",
              example: "I am going to visit my friend tomorrow.",
              supportWords: ["visit", "travel", "buy", "call", "study"],
              speakingFocus:
                "Practice future plans using going to in 4 short sentences.",
            },
            {
              id: "day2",
              dayNumber: 2,
              title: "This Evening / Tonight",
              word: "tonight",
              meaning: "this night",
              example: "Tonight I am going to study English.",
              supportWords: ["study", "rest", "watch", "call", "prepare"],
              speakingFocus:
                "Talk about what you are going to do tonight.",
            },
            {
              id: "day3",
              dayNumber: 3,
              title: "Weekend Plans",
              word: "weekend",
              meaning:
                "the end part of the week",
              example:
                "This weekend I am going to visit my family.",
              supportWords: ["family", "travel", "rest", "shopping", "friends"],
              speakingFocus:
                "Describe your weekend plans in simple future English.",
            },
            {
              id: "day4",
              dayNumber: 4,
              title: "Work Plans",
              word: "schedule",
              meaning:
                "a plan of activities or work",
              example:
                "Tomorrow I am going to finish my office work early.",
              supportWords: ["office", "meeting", "manager", "task", "finish"],
              speakingFocus:
                "Speak about your upcoming work plan.",
            },
            {
              id: "day5",
              dayNumber: 5,
              title: "Study Plans",
              word: "prepare",
              meaning:
                "to get ready for something",
              example:
                "I am going to prepare for my English practice.",
              supportWords: [
                "lesson",
                "practice",
                "homework",
                "English",
                "tomorrow",
              ],
              speakingFocus:
                "Talk about your study plan using going to.",
            },
            {
              id: "day6",
              dayNumber: 6,
              title: "Personal Plans",
              word: "decide",
              meaning:
                "to choose something in your mind",
              example:
                "I have decided that I am going to practice daily.",
              supportWords: ["daily", "health", "English", "family", "future"],
              speakingFocus:
                "Describe your personal plans for self-improvement.",
            },
            {
              id: "day7",
              dayNumber: 7,
              title: "Week 4 Review",
              word: "plan ahead",
              meaning:
                "to think and decide before something happens",
              example:
                "I am going to use my time well this week.",
              supportWords: [
                "going to",
                "tonight",
                "weekend",
                "prepare",
                "future",
              ],
              speakingFocus:
                "Review Week 4 with planned future speaking.",
            },
          ],
        },

        {
          id: "week5",
          name: "Week 5",
          days: [
            {
              id: "day1",
              dayNumber: 1,
              title: "Past vs Future",
              word: "compare",
              meaning:
                "to see the difference between two things",
              example:
                "Yesterday I worked. Tomorrow I will rest.",
              supportWords: [
                "yesterday",
                "tomorrow",
                "worked",
                "will",
                "compare",
              ],
              speakingFocus:
                "Compare past and future using simple clear sentences.",
            },
            {
              id: "day2",
              dayNumber: 2,
              title: "What Happened and What Will Happen",
              word: "timeline",
              meaning:
                "the order of events in time",
              example:
                "Last week I traveled. Next week I will stay home.",
              supportWords: [
                "last week",
                "next week",
                "before",
                "after",
                "future",
              ],
              speakingFocus:
                "Speak about one past event and one future event together.",
            },
            {
              id: "day3",
              dayNumber: 3,
              title: "Past Experience and Future Goal",
              word: "experience",
              meaning:
                "something that happened to you",
              example:
                "I worked hard before, and I will improve more in future.",
              supportWords: [
                "experience",
                "goal",
                "improve",
                "work",
                "future",
              ],
              speakingFocus:
                "Connect your past experience with your future goal.",
            },
            {
              id: "day4",
              dayNumber: 4,
              title: "Then, Now, and Next",
              word: "next",
              meaning:
                "coming after the present time",
              example:
                "Before I was shy, now I speak more, and next I will improve further.",
              supportWords: ["before", "now", "next", "shy", "confident"],
              speakingFocus:
                "Use then, now, and next in one short spoken response.",
            },
            {
              id: "day5",
              dayNumber: 5,
              title: "Learning Journey",
              word: "journey",
              meaning:
                "the process of moving from one stage to another",
              example:
                "Before, my English was weak. Now it is better.",
              supportWords: ["before", "now", "better", "practice", "goal"],
              speakingFocus:
                "Describe your English learning journey from past to future.",
            },
            {
              id: "day6",
              dayNumber: 6,
              title: "Mini Story: Yesterday and Tomorrow",
              word: "story",
              meaning: "a description of events",
              example: "Yesterday I was busy, but tomorrow I will rest.",
              supportWords: ["busy", "rest", "work", "family", "tomorrow"],
              speakingFocus:
                "Tell a short mini-story using both past and future.",
            },
            {
              id: "day7",
              dayNumber: 7,
              title: "Week 5 Review",
              word: "timeline speaking",
              meaning:
                "speaking about past, present, and future in order",
              example:
                "Before I was shy. Now I practice. Tomorrow I will speak more.",
              supportWords: ["before", "now", "tomorrow", "goal", "journey"],
              speakingFocus:
                "Review Week 5 by mixing past and future confidently.",
            },
          ],
        },

        {
          id: "week6",
          name: "Week 6",
          days: [
            {
              id: "day1",
              dayNumber: 1,
              title: "My Past Story",
              word: "storytelling",
              meaning:
                "telling a story clearly",
              example:
                "Last year I worked in a different place.",
              supportWords: [
                "last year",
                "before",
                "worked",
                "lived",
                "learned",
              ],
              speakingFocus:
                "Tell one short story from your past in 5 to 6 simple sentences.",
            },
            {
              id: "day2",
              dayNumber: 2,
              title: "My Future Story",
              word: "future dream",
              meaning:
                "something you want in the future",
              example:
                "In future, I will speak English with confidence.",
              supportWords: ["dream", "goal", "future", "job", "confidence"],
              speakingFocus:
                "Describe your future dream in simple English.",
            },
            {
              id: "day3",
              dayNumber: 3,
              title: "My English Progress",
              word: "progress",
              meaning:
                "improvement over time",
              example:
                "Before I was nervous, but now I speak better.",
              supportWords: [
                "before",
                "now",
                "practice",
                "better",
                "confidence",
              ],
              speakingFocus:
                "Talk about how your English has changed.",
            },
            {
              id: "day4",
              dayNumber: 4,
              title: "My Plan for Next Month",
              word: "next month",
              meaning:
                "the month after this month",
              example:
                "Next month I will practice speaking every day.",
              supportWords: ["month", "daily", "study", "practice", "goal"],
              speakingFocus:
                "Talk about your plan for next month.",
            },
            {
              id: "day5",
              dayNumber: 5,
              title: "Past, Present, Future Full Speaking",
              word: "three times",
              meaning:
                "past, present, and future together",
              example:
                "Before I was shy, now I practice, and tomorrow I will improve more.",
              supportWords: [
                "before",
                "now",
                "tomorrow",
                "practice",
                "improve",
              ],
              speakingFocus:
                "Speak using past, present, and future in one response.",
            },
            {
              id: "day6",
              dayNumber: 6,
              title: "Confidence Speaking Challenge",
              word: "challenge",
              meaning:
                "a task that tests your ability",
              example:
                "I can speak about my past and future with confidence.",
              supportWords: ["confidence", "clear", "strong", "practice", "speak"],
              speakingFocus:
                "Speak for 30 to 45 seconds about any past or future topic.",
            },
            {
              id: "day7",
              dayNumber: 7,
              title: "Final Level 4 Review",
              word: "past and future",
              meaning:
                "speaking about what happened and what will happen",
              example:
                "Yesterday I worked, and tomorrow I will study.",
              supportWords: [
                "yesterday",
                "last week",
                "tomorrow",
                "next week",
                "goal",
              ],
              speakingFocus:
                "Review all Level-4 speaking by combining past experience and future plans confidently.",
            },
          ],
        },
      ],
    },

    level5Data,
  ],
};

export const COURSE_DATA = courseData;

export function getLevelById(levelId) {
  return courseData.levels.find((level) => level.id === levelId) || null;
}

export function getWeekById(levelId, weekId) {
  const level = getLevelById(levelId);
  if (!level) return null;
  return level.weeks.find((week) => week.id === weekId) || null;
}

export function getDayById(levelId, weekId, dayId) {
  const week = getWeekById(levelId, weekId);
  if (!week) return null;
  return week.days.find((day) => day.id === dayId) || null;
}

export function getDefaultCourseSelection() {
  const firstLevel = courseData.levels[0];
  const firstWeek = firstLevel?.weeks?.[0];
  const firstDay = firstWeek?.days?.[0];

  return {
    selectedLevel: firstLevel?.id || "",
    selectedWeek: firstWeek?.id || "",
    selectedDay: firstDay?.id || "",
  };
}