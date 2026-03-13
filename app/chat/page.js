"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { COURSE_DATA, getLessonWithContext } from "@/lib/courseData";

function getLevels() {
  return Array.isArray(COURSE_DATA?.levels) ? COURSE_DATA.levels : [];
}

function getLevel(levelNo) {
  return (
    getLevels().find((lvl) => Number(lvl?.level) === Number(levelNo)) || null
  );
}

function getWeeks(levelNo) {
  const level = getLevel(levelNo);
  return Array.isArray(level?.weeks) ? level.weeks : [];
}

function getWeek(levelNo, weekNo) {
  return (
    getWeeks(levelNo).find((wk) => Number(wk?.week) === Number(weekNo)) || null
  );
}

function getDays(levelNo, weekNo) {
  const week = getWeek(levelNo, weekNo);
  return Array.isArray(week?.days) ? week.days : [];
}

function getDay(levelNo, weekNo, dayNo) {
  return (
    getDays(levelNo, weekNo).find((d) => Number(d?.day) === Number(dayNo)) ||
    null
  );
}

function getInitialLessonState() {
  return {
    level: 1,
    week: 1,
    day: 1,
  };
}

function cleanWords(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
}

function round(num) {
  return Math.round(num);
}

function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num));
}

function normalizePhraseText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9\s']/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getPhraseObjects(lesson) {
  if (!Array.isArray(lesson?.phrases)) return [];
  return lesson.phrases
    .map((item, index) => {
      if (typeof item === "string") {
        return {
          id: index + 1,
          english: item.trim(),
          hindi: "",
          cue: "",
        };
      }

      return {
        id: item?.id || index + 1,
        english: String(item?.english || "").trim(),
        hindi: String(item?.hindi || "").trim(),
        cue: String(item?.cue || "").trim(),
      };
    })
    .filter((item) => item.english);
}

function getIdiomObjects(lesson) {
  if (!Array.isArray(lesson?.idioms)) return [];
  return lesson.idioms
    .map((item, index) => {
      if (typeof item === "string") {
        return {
          id: index + 1,
          idiom: item.trim(),
          meaning: "",
          example: "",
        };
      }

      return {
        id: item?.id || index + 1,
        idiom: String(item?.idiom || item?.english || "").trim(),
        meaning: String(item?.meaning || "").trim(),
        example: String(item?.example || "").trim(),
      };
    })
    .filter((item) => item.idiom);
}

function getUsedTargets(utterances, targets) {
  const transcriptText = normalizePhraseText(
    Array.isArray(utterances) ? utterances.join(" ") : ""
  );

  if (!transcriptText) return [];
  if (!Array.isArray(targets) || targets.length === 0) return [];

  const used = [];

  for (const rawTarget of targets) {
    const target = String(rawTarget || "").trim();
    const normalizedTarget = normalizePhraseText(target);
    if (!normalizedTarget) continue;

    if (transcriptText.includes(normalizedTarget)) {
      used.push(target);
    }
  }

  return [...new Set(used)];
}

function getTargetStats(utterances, targets) {
  const safeTargets = Array.isArray(targets) ? targets : [];
  const usedTargets = getUsedTargets(utterances, safeTargets);
  const total = safeTargets.length;
  const usedCount = usedTargets.length;
  const percentage = total > 0 ? round((usedCount / total) * 100) : 0;

  let label = "Keep Practicing";
  if (percentage >= 80) label = "Excellent";
  else if (percentage >= 60) label = "Very Good";
  else if (percentage >= 40) label = "Good Progress";
  else if (percentage >= 20) label = "Started Well";

  return {
    usedTargets,
    usedCount,
    total,
    percentage,
    label,
  };
}

function buildScoreCard({
  utterances,
  lesson,
  practiceMode,
  phraseTargets,
  idiomTargets,
}) {
  const joinedText = utterances.join(" ").trim();
  const totalWords = cleanWords(joinedText).length;
  const turnCount = utterances.filter((u) => String(u || "").trim()).length;
  const avgWordsPerTurn = turnCount > 0 ? totalWords / turnCount : 0;

  const phraseStats = getTargetStats(utterances, phraseTargets);
  const idiomStats = getTargetStats(utterances, idiomTargets);

  let participationScore = 0;
  if (turnCount >= 10) participationScore = 92;
  else if (turnCount >= 8) participationScore = 86;
  else if (turnCount >= 6) participationScore = 78;
  else if (turnCount >= 4) participationScore = 68;
  else if (turnCount >= 2) participationScore = 54;
  else if (turnCount >= 1) participationScore = 40;
  else participationScore = 20;

  let fluencyScore = 0;
  if (avgWordsPerTurn >= 14) fluencyScore = 90;
  else if (avgWordsPerTurn >= 10) fluencyScore = 82;
  else if (avgWordsPerTurn >= 7) fluencyScore = 72;
  else if (avgWordsPerTurn >= 4) fluencyScore = 60;
  else if (avgWordsPerTurn >= 1) fluencyScore = 45;
  else fluencyScore = 20;

  let usageScore = 0;
  if (practiceMode === "phrase" && phraseStats.total > 0) {
    usageScore = clamp(round(35 + phraseStats.percentage * 0.6), 20, 98);
  } else if (practiceMode === "idiom" && idiomStats.total > 0) {
    usageScore = clamp(round(35 + idiomStats.percentage * 0.6), 20, 98);
  } else {
    usageScore = totalWords >= 40 ? 80 : totalWords >= 20 ? 64 : 42;
  }

  const overall = clamp(
    round((participationScore + fluencyScore + usageScore) / 3),
    20,
    99
  );

  let status = "Keep Practicing";
  if (overall >= 90) status = "Excellent";
  else if (overall >= 80) status = "Very Good";
  else if (overall >= 70) status = "Good Job";
  else if (overall >= 60) status = "Good Start";

  let feedback = "Try to speak more in full sentences.";
  if (overall >= 90) {
    feedback = "Excellent speaking. Keep the same confidence.";
  } else if (overall >= 80) {
    feedback = "Very good work. Try slightly longer answers.";
  } else if (overall >= 70) {
    feedback = "Good job. Keep practicing every day.";
  } else if (overall >= 60) {
    feedback = "Good start. Speak more clearly and confidently.";
  }

  return {
    overall,
    status,
    feedback,
    participationScore,
    fluencyScore,
    usageScore,
    totalWords,
    turnCount,
    avgWordsPerTurn: round(avgWordsPerTurn),
    phraseStats,
    idiomStats,
    practiceMode,
    lessonTitle: lesson?.title || "",
  };
}

export default function ChatPage() {
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);

  const [selectedLevel, setSelectedLevel] = useState(1);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedDay, setSelectedDay] = useState(1);

  const [practiceMode, setPracticeMode] = useState("normal");
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

  const [soundEnabled, setSoundEnabled] = useState(false);
  const [statusText, setStatusText] = useState("Ready");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);

  const [aiTranscript, setAiTranscript] = useState([]);
  const [userTranscript, setUserTranscript] = useState([]);
  const [scoreCard, setScoreCard] = useState(null);
  const [debugMessage, setDebugMessage] = useState("");
  const [sessionSecondsLeft, setSessionSecondsLeft] = useState(15 * 60);

  const peerConnectionRef = useRef(null);
  const dataChannelRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const audioContextRef = useRef(null);
  const sessionTimeoutRef = useRef(null);
  const sessionStartedAtRef = useRef(null);

  const latestUserTranscriptRef = useRef([]);

  const levels = useMemo(() => getLevels(), []);
  const weeks = useMemo(() => getWeeks(selectedLevel), [selectedLevel]);
  const days = useMemo(
    () => getDays(selectedLevel, selectedWeek),
    [selectedLevel, selectedWeek]
  );

  const lesson = useMemo(() => {
    return getLessonWithContext(selectedLevel, selectedWeek, selectedDay);
  }, [selectedLevel, selectedWeek, selectedDay]);

  const phraseObjects = useMemo(() => getPhraseObjects(lesson), [lesson]);
  const idiomObjects = useMemo(() => getIdiomObjects(lesson), [lesson]);

  const currentPhrase = useMemo(() => {
    if (practiceMode === "phrase" && phraseObjects.length > 0) {
      return phraseObjects[currentPhraseIndex] || phraseObjects[0];
    }

    if (practiceMode === "idiom" && idiomObjects.length > 0) {
      return idiomObjects[currentPhraseIndex] || idiomObjects[0];
    }

    return null;
  }, [practiceMode, phraseObjects, idiomObjects, currentPhraseIndex]);

  const activePhraseTargets = useMemo(() => {
    if (practiceMode === "phrase" && currentPhrase?.english) {
      return [currentPhrase.english];
    }

    if (practiceMode === "normal" && phraseObjects.length > 0) {
      return phraseObjects.slice(0, 5).map((item) => item.english);
    }

    return [];
  }, [practiceMode, currentPhrase, phraseObjects]);

  const activeIdiomTargets = useMemo(() => {
    if (practiceMode === "idiom" && currentPhrase?.idiom) {
      return [currentPhrase.idiom];
    }

    return [];
  }, [practiceMode, currentPhrase]);

  const livePhraseStats = useMemo(() => {
    return getTargetStats(userTranscript, activePhraseTargets);
  }, [userTranscript, activePhraseTargets]);

  const liveIdiomStats = useMemo(() => {
    return getTargetStats(userTranscript, activeIdiomTargets);
  }, [userTranscript, activeIdiomTargets]);

  useEffect(() => {
    latestUserTranscriptRef.current = userTranscript;
  }, [userTranscript]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const raw = localStorage.getItem("aminsir_user");

    if (!raw) {
      router.replace("/login");
      return;
    }

    try {
      const session = JSON.parse(raw);

      if (!session?.id) {
        localStorage.removeItem("aminsir_user");
        router.replace("/login");
        return;
      }

      setAuthChecked(true);
    } catch {
      localStorage.removeItem("aminsir_user");
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;

    try {
      const saved = JSON.parse(
        localStorage.getItem("aminsir_mobile_lesson_selection") || "{}"
      );
      const fallback = getInitialLessonState();

      const level = Number(saved?.level || fallback.level);
      const week = Number(saved?.week || fallback.week);
      const day = Number(saved?.day || fallback.day);

      setSelectedLevel(getLevel(level) ? level : 1);
      setSelectedWeek(getWeek(level, week) ? week : 1);
      setSelectedDay(getDay(level, week, day) ? day : 1);
    } catch {
      setSelectedLevel(1);
      setSelectedWeek(1);
      setSelectedDay(1);
    }
  }, [authChecked]);

  useEffect(() => {
    if (!authChecked) return;

    localStorage.setItem(
      "aminsir_mobile_lesson_selection",
      JSON.stringify({
        level: selectedLevel,
        week: selectedWeek,
        day: selectedDay,
      })
    );
  }, [authChecked, selectedLevel, selectedWeek, selectedDay]);

  useEffect(() => {
    setCurrentPhraseIndex(0);
    setUserTranscript([]);
    setAiTranscript([]);
    setScoreCard(null);
    setDebugMessage("");
    setStatusText("Ready");
  }, [selectedLevel, selectedWeek, selectedDay, practiceMode]);

  useEffect(() => {
    if (!isSessionActive || !sessionStartedAtRef.current) {
      setSessionSecondsLeft(15 * 60);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStartedAtRef.current) / 1000);
      const remaining = Math.max(0, 15 * 60 - elapsed);
      setSessionSecondsLeft(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [isSessionActive]);

  const safeLessonTitle =
    lesson?.title ||
    `Level ${selectedLevel} Week ${selectedWeek} Day ${selectedDay}`;

  const lessonPrompt = useMemo(() => {
    const phraseText =
      practiceMode === "phrase" && currentPhrase?.english
        ? currentPhrase.english
        : "";

    const phraseCue =
      practiceMode === "phrase" && currentPhrase?.cue
        ? currentPhrase.cue
        : "";

    const idiomText =
      practiceMode === "idiom" && currentPhrase?.idiom
        ? currentPhrase.idiom
        : "";

    const idiomMeaning =
      practiceMode === "idiom" && currentPhrase?.meaning
        ? currentPhrase.meaning
        : "";

    const idiomExample =
      practiceMode === "idiom" && currentPhrase?.example
        ? currentPhrase.example
        : "";

    if (practiceMode === "phrase") {
      return `
You are Amin Sir AI Speaking Coach.

Mode: Phrase Practice

Teach only one phrase at a time.
Today's phrase is: "${phraseText}"

Phrase cue: ${phraseCue || "Help the student use this phrase naturally."}

Instructions:
- Speak in very simple English
- Speak only 1 short sentence at a time
- First say the phrase clearly
- Ask the student to repeat the phrase
- Then ask the student to make their own sentence
- After asking, stop and wait for the student
- Keep your talking to about 20 percent
- Let the student speak about 80 percent
- Encourage the student kindly
- Correct gently
- Do not switch to another phrase unless asked
- Do not give long explanations
- If the student gives a short answer, ask a short follow-up question and wait again

Start by greeting the student and introducing today's phrase practice.
      `.trim();
    }

    if (practiceMode === "idiom") {
      return `
You are Amin Sir AI Speaking Coach.

Mode: Idiom Practice

Teach only one idiom at a time.
Today's idiom is: "${idiomText}"
Meaning: "${idiomMeaning}"
Example: "${idiomExample}"

Instructions:
- Speak in very simple English
- Speak only 1 or 2 short sentences at a time
- Explain the idiom briefly
- Say only one short example
- Ask the student to repeat the idiom
- Ask the student to make their own sentence
- After asking, stop and wait for the student
- Keep your talking to about 20 percent
- Let the student speak about 80 percent
- Encourage the student kindly
- Correct gently
- Do not teach multiple idioms at once
- Do not give long explanations
- If the student gives a short answer, ask a short follow-up question and wait again

Start by greeting the student and introducing today's idiom practice.
      `.trim();
    }

    return `
You are Amin Sir AI Speaking Coach.

Mode: Normal Lesson Practice

Student lesson details:
- Level: ${selectedLevel}
- Week: ${selectedWeek}
- Day: ${selectedDay}
- Lesson title: ${lesson?.title || ""}
- Meaning: ${lesson?.meaning || ""}
- Speaking focus: ${lesson?.speakingFocus || ""}
- Practice prompt: ${lesson?.practicePrompt || ""}
- Example: ${lesson?.example || ""}

Instructions:
- Speak in very simple English
- Speak only 1 or 2 short sentences at a time
- Focus only on today's lesson
- Ask only one short question at a time
- After asking, stop and wait for the student
- The student must speak most of the time
- Keep your talking to about 20 percent
- Let the student speak about 80 percent
- Encourage the student to answer in full sentences
- Correct gently after the student speaks
- Do not give long explanations
- Do not give long examples unless the student asks
- If the student gives a short answer, ask a short follow-up question and wait again

Start by greeting the student and beginning today's lesson.
    `.trim();
  }, [
    practiceMode,
    currentPhrase,
    selectedLevel,
    selectedWeek,
    selectedDay,
    lesson,
  ]);
  const unlockAudio = async () => {
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new AudioCtx();
      }

      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }

      const oscillator = audioContextRef.current.createOscillator();
      const gain = audioContextRef.current.createGain();
      gain.gain.value = 0.0001;
      oscillator.connect(gain);
      gain.connect(audioContextRef.current.destination);
      oscillator.start();
      oscillator.stop(audioContextRef.current.currentTime + 0.05);

      setSoundEnabled(true);
      setStatusText("Sound enabled");
    } catch (error) {
      console.error("Audio unlock error:", error);
      setStatusText("Could not enable sound");
      setDebugMessage(error?.message || "Audio unlock failed");
    }
  };

  const handleRealtimeEvent = useCallback((event) => {
    if (!event || typeof event !== "object") return;

    const type = event.type || "";

    if (type === "response.audio_transcript.delta") {
      const delta = event.delta || "";
      if (!delta) return;

      setAiTranscript((prev) => {
        const copy = [...prev];
        if (copy.length === 0) {
          copy.push(delta);
        } else {
          copy[copy.length - 1] = (copy[copy.length - 1] || "") + delta;
        }
        return copy;
      });
      return;
    }

    if (type === "response.audio_transcript.done") {
      setAiTranscript((prev) => {
        const copy = [...prev];
        if (copy.length === 0) return prev;
        copy.push("");
        return copy;
      });
      return;
    }

    if (type === "conversation.item.input_audio_transcription.completed") {
      const text = event.transcript || event.text || "";
      if (text.trim()) {
        setUserTranscript((prev) => [...prev, text.trim()]);
      }
      return;
    }

    if (type === "conversation.item.created") {
      const item = event.item || {};
      const role = item.role || "";
      const content = Array.isArray(item.content) ? item.content : [];

      const textParts = content
        .map((c) => c?.transcript || c?.text || c?.value || "")
        .filter(Boolean)
        .join(" ")
        .trim();

      if (!textParts) return;

      if (role === "user") {
        setUserTranscript((prev) => [...prev, textParts]);
      } else if (role === "assistant") {
        setAiTranscript((prev) => [...prev, textParts]);
      }
    }
  }, []);

  const closeSession = useCallback(async () => {
    try {
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
        sessionTimeoutRef.current = null;
      }

      sessionStartedAtRef.current = null;
      setSessionSecondsLeft(15 * 60);

      if (dataChannelRef.current) {
        try {
          dataChannelRef.current.close();
        } catch {}
        dataChannelRef.current = null;
      }

      if (peerConnectionRef.current) {
        try {
          peerConnectionRef.current.getSenders().forEach((sender) => {
            try {
              sender.track?.stop();
            } catch {}
          });
          peerConnectionRef.current.close();
        } catch {}
        peerConnectionRef.current = null;
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch {}
        });
        localStreamRef.current = null;
      }

      if (remoteAudioRef.current) {
        try {
          remoteAudioRef.current.pause();
          remoteAudioRef.current.srcObject = null;
        } catch {}
      }
    } finally {
      setIsSessionActive(false);
      setIsConnecting(false);
    }
  }, []);

  const finalizeScore = useCallback(() => {
    const result = buildScoreCard({
      utterances: latestUserTranscriptRef.current || [],
      lesson,
      practiceMode,
      phraseTargets: activePhraseTargets,
      idiomTargets: activeIdiomTargets,
    });

    setScoreCard(result);
  }, [lesson, practiceMode, activePhraseTargets, activeIdiomTargets]);

  const startVoice = async () => {
    if (isConnecting || isSessionActive) return;

    setUserTranscript([]);
    setAiTranscript([]);
    setScoreCard(null);
    setDebugMessage("");
    setIsConnecting(true);

    if (practiceMode === "phrase") {
      setStatusText("Phrase mode active");
    } else if (practiceMode === "idiom") {
      setStatusText("Idiom mode active");
    } else {
      setStatusText("Lesson mode active");
    }

    try {
      if (!soundEnabled) {
        await unlockAudio();
      }

      const tokenResponse = await fetch("/api/realtime", {
        method: "GET",
        cache: "no-store",
      });

      const rawText = await tokenResponse.text();

      let tokenData = null;
      try {
        tokenData = rawText ? JSON.parse(rawText) : null;
      } catch {
        tokenData = null;
      }

      if (!tokenResponse.ok) {
        const errorMessage =
          tokenData?.details ||
          tokenData?.error ||
          rawText ||
          `HTTP ${tokenResponse.status}`;
        throw new Error(errorMessage);
      }

      const ephemeralKey =
        tokenData?.client_secret?.value ||
        tokenData?.client_secret ||
        tokenData?.value ||
        tokenData?.token ||
        tokenData?.ephemeralKey ||
        "";

      const model =
        tokenData?.model || "gpt-4o-realtime-preview-2024-12-17";

      if (!ephemeralKey) {
        throw new Error("Realtime client_secret.value missing from /api/realtime");
      }

      const pc = new RTCPeerConnection();
      peerConnectionRef.current = pc;

      const remoteAudio = new Audio();
      remoteAudio.autoplay = true;
      remoteAudio.playsInline = true;
      remoteAudioRef.current = remoteAudio;

      pc.ontrack = (event) => {
        const [stream] = event.streams || [];
        if (stream && remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = stream;
          remoteAudioRef.current
            .play()
            .catch((err) => console.error("Remote audio play error:", err));
        }
      };

      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      localStreamRef.current = localStream;

      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });

      const dc = pc.createDataChannel("oai-events");
      dataChannelRef.current = dc;

      dc.onopen = () => {
        dc.send(
          JSON.stringify({
            type: "session.update",
            session: {
              modalities: ["text", "audio"],
              instructions: lessonPrompt,
              input_audio_transcription: {
                model: "gpt-4o-mini-transcribe",
              },
            },
          })
        );

        dc.send(
          JSON.stringify({
            type: "response.create",
            response: {
              modalities: ["audio", "text"],
              instructions: lessonPrompt,
            },
          })
        );
      };

      dc.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleRealtimeEvent(data);
        } catch (err) {
          console.error("Data channel parse error:", err);
        }
      };

      dc.onerror = (err) => {
        console.error("Data channel error:", err);
      };

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
      });
      await pc.setLocalDescription(offer);

      const sdpResponse = await fetch(
        `https://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`,
        {
          method: "POST",
          body: offer.sdp,
          headers: {
            Authorization: `Bearer ${ephemeralKey}`,
            "Content-Type": "application/sdp",
          },
        }
      );

      const sdpText = await sdpResponse.text();

      if (!sdpResponse.ok) {
        throw new Error(sdpText || "Failed to connect realtime session");
      }

      await pc.setRemoteDescription({
        type: "answer",
        sdp: sdpText,
      });

      sessionStartedAtRef.current = Date.now();
      setSessionSecondsLeft(15 * 60);
      setIsSessionActive(true);

      sessionTimeoutRef.current = setTimeout(async () => {
        await closeSession();
        finalizeScore();
        setStatusText("15-minute limit reached");
        setDebugMessage("Session stopped automatically after 15 minutes.");
      }, 15 * 60 * 1000);
    } catch (error) {
      console.error("Start voice error:", error);
      setDebugMessage(error?.message || "Unknown start voice error");
      setStatusText("Connection failed");
      await closeSession();
    } finally {
      setIsConnecting(false);
    }
  };

  const stopVoice = async () => {
    await closeSession();
    finalizeScore();
    setStatusText("Ready");
  };

  const transcriptPreview = useMemo(() => {
    return userTranscript
      .filter(Boolean)
      .slice(-8)
      .map((item, index) => `${index + 1}. ${item}`)
      .join("\n");
  }, [userTranscript]);

  const aiPreview = useMemo(() => {
    return aiTranscript
      .filter((item) => String(item || "").trim())
      .slice(-5)
      .join("\n\n");
  }, [aiTranscript]);

  if (!authChecked) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-md px-4 pb-24 pt-4">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="rounded-xl bg-white px-3 py-2 text-sm font-medium shadow-sm ring-1 ring-slate-200"
          >
            Back
          </button>

          <div className="flex items-center gap-2">
            <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold shadow-sm ring-1 ring-slate-200">
              {statusText}
            </div>

            <button
              onClick={async () => {
                await closeSession();
                localStorage.removeItem("aminsir_user");
                router.push("/login");
              }}
              className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white shadow-sm"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-xl font-bold">Amin Sir AI Speaking Coach</h1>
          <p className="mt-1 text-sm text-slate-600">
            Live lesson, phrase and idiom speaking practice
          </p>

          <div className="mt-3 text-xs font-semibold text-slate-500">
            Session Limit: {String(Math.floor(sessionSecondsLeft / 60)).padStart(2, "0")}:
            {String(sessionSecondsLeft % 60).padStart(2, "0")}
          </div>
        </div>

        <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-3 text-base font-bold">Choose Lesson</h2>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Level</label>
              <select
                value={selectedLevel}
                onChange={(e) => {
                  const nextLevel = Number(e.target.value);
                  setSelectedLevel(nextLevel);
                  setSelectedWeek(1);
                  setSelectedDay(1);
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none"
              >
                {levels.map((lvl) => (
                  <option key={lvl.level} value={lvl.level}>
                    Level {lvl.level}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Week</label>
              <select
                value={selectedWeek}
                onChange={(e) => {
                  setSelectedWeek(Number(e.target.value));
                  setSelectedDay(1);
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none"
              >
                {weeks.map((wk) => (
                  <option key={wk.week} value={wk.week}>
                    Week {wk.week}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Day</label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none"
              >
                {days.map((d) => (
                  <option key={d.day} value={d.day}>
                    Day {d.day}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-3 text-base font-bold">Practice Mode</h2>

          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setPracticeMode("normal")}
              disabled={isConnecting || isSessionActive}
              className={`rounded-2xl px-4 py-3 text-sm font-bold shadow-sm ${
                practiceMode === "normal"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700 ring-1 ring-slate-200"
              } ${isConnecting || isSessionActive ? "opacity-60" : ""}`}
            >
              Normal
            </button>

            <button
              onClick={() => setPracticeMode("phrase")}
              disabled={isConnecting || isSessionActive}
              className={`rounded-2xl px-4 py-3 text-sm font-bold shadow-sm ${
                practiceMode === "phrase"
                  ? "bg-amber-500 text-white"
                  : "bg-slate-100 text-slate-700 ring-1 ring-slate-200"
              } ${isConnecting || isSessionActive ? "opacity-60" : ""}`}
            >
              Phrase
            </button>

            <button
              onClick={() => setPracticeMode("idiom")}
              disabled={isConnecting || isSessionActive}
              className={`rounded-2xl px-4 py-3 text-sm font-bold shadow-sm ${
                practiceMode === "idiom"
                  ? "bg-violet-600 text-white"
                  : "bg-slate-100 text-slate-700 ring-1 ring-slate-200"
              } ${isConnecting || isSessionActive ? "opacity-60" : ""}`}
            >
              Idiom
            </button>
          </div>
        </div>
        <div className="mb-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-4 text-white shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide opacity-90">
            Current Lesson
          </div>
          <div className="mt-2 text-lg font-bold">{safeLessonTitle}</div>
          <div className="mt-2 text-sm text-blue-50">
            {lesson?.meaning || lesson?.speakingFocus || "Speaking practice"}
          </div>
        </div>

        {practiceMode === "phrase" && currentPhrase?.english ? (
          <div className="mb-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-4 text-white shadow-sm">
            <div className="text-sm font-bold">Phrase Practice</div>
            <div className="mt-3 rounded-2xl bg-white/10 p-4">
              <div className="text-xs uppercase tracking-wide text-amber-100">
                English Phrase
              </div>
              <div className="mt-2 text-lg font-bold">
                {currentPhrase.english}
              </div>
              {currentPhrase.cue ? (
                <div className="mt-3 text-sm text-white/95">
                  {currentPhrase.cue}
                </div>
              ) : null}
            </div>

            <div className="mt-3 flex gap-3">
              <button
                onClick={() =>
                  setCurrentPhraseIndex((prev) => Math.max(prev - 1, 0))
                }
                disabled={isConnecting || isSessionActive}
                className="flex-1 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-amber-700 disabled:opacity-60"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPhraseIndex((prev) =>
                    Math.min(prev + 1, phraseObjects.length - 1)
                  )
                }
                disabled={isConnecting || isSessionActive}
                className="flex-1 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-amber-700 disabled:opacity-60"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}

        {practiceMode === "idiom" && currentPhrase?.idiom ? (
          <div className="mb-4 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 p-4 text-white shadow-sm">
            <div className="text-sm font-bold">Idiom Practice</div>
            <div className="mt-3 rounded-2xl bg-white/10 p-4">
              <div className="text-xs uppercase tracking-wide text-violet-100">
                Idiom
              </div>
              <div className="mt-2 text-lg font-bold">{currentPhrase.idiom}</div>

              {currentPhrase.meaning ? (
                <>
                  <div className="mt-4 text-xs uppercase tracking-wide text-violet-100">
                    Meaning
                  </div>
                  <div className="mt-2 text-sm text-white/95">
                    {currentPhrase.meaning}
                  </div>
                </>
              ) : null}

              {currentPhrase.example ? (
                <>
                  <div className="mt-4 text-xs uppercase tracking-wide text-violet-100">
                    Example
                  </div>
                  <div className="mt-2 text-sm text-white/95">
                    {currentPhrase.example}
                  </div>
                </>
              ) : null}
            </div>

            <div className="mt-3 flex gap-3">
              <button
                onClick={() =>
                  setCurrentPhraseIndex((prev) => Math.max(prev - 1, 0))
                }
                disabled={isConnecting || isSessionActive}
                className="flex-1 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-violet-700 disabled:opacity-60"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPhraseIndex((prev) =>
                    Math.min(prev + 1, idiomObjects.length - 1)
                  )
                }
                disabled={isConnecting || isSessionActive}
                className="flex-1 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-violet-700 disabled:opacity-60"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}

        <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-base font-bold">Current AI Mode Prompt</h2>
          <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs whitespace-pre-wrap text-slate-700">
            {lessonPrompt}
          </div>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3">
          <button
            onClick={unlockAudio}
            className="rounded-2xl bg-emerald-600 px-4 py-4 text-sm font-bold text-white shadow-sm"
          >
            Enable Sound
          </button>

          <button
            onClick={startVoice}
            disabled={isConnecting || isSessionActive}
            className={`rounded-2xl px-4 py-4 text-sm font-bold text-white shadow-sm ${
              isConnecting || isSessionActive ? "bg-slate-400" : "bg-blue-600"
            }`}
          >
            {isConnecting
              ? "Connecting..."
              : isSessionActive
              ? "Live"
              : "Start Voice Practice"}
          </button>

          <button
            onClick={stopVoice}
            disabled={!isConnecting && !isSessionActive}
            className={`rounded-2xl px-4 py-4 text-sm font-bold text-white shadow-sm ${
              !isConnecting && !isSessionActive
                ? "bg-slate-400"
                : "bg-rose-600"
            }`}
          >
            Stop
          </button>
        </div>

        {debugMessage ? (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <div className="text-sm font-bold text-rose-800">
              Connection Error
            </div>
            <div className="mt-2 whitespace-pre-wrap break-words text-sm text-rose-700">
              {debugMessage}
            </div>
          </div>
        ) : null}

        <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-base font-bold">AI Tutor Response</h2>
          <div className="mt-3 min-h-[100px] whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
            {aiPreview || "No AI response yet."}
          </div>
        </div>

        <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-base font-bold">Recent Student Speech</h2>
          <div className="mt-3 min-h-[120px] whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
            {transcriptPreview || "No student speech captured yet."}
          </div>
        </div>

        {practiceMode === "phrase" && activePhraseTargets.length > 0 ? (
          <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold">Live Phrase Tracking</div>
              <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                {livePhraseStats.usedCount}/{livePhraseStats.total}
              </div>
            </div>
            <div className="mt-2 text-sm text-slate-600">
              {livePhraseStats.label}
            </div>
          </div>
        ) : null}

        {practiceMode === "idiom" && activeIdiomTargets.length > 0 ? (
          <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold">Live Idiom Tracking</div>
              <div className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-800">
                {liveIdiomStats.usedCount}/{liveIdiomStats.total}
              </div>
            </div>
            <div className="mt-2 text-sm text-slate-600">
              {liveIdiomStats.label}
            </div>
          </div>
        ) : null}

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-base font-bold">Speaking Score</h2>

          {!scoreCard ? (
            <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
              Finish one voice session and press Stop to see score.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-slate-900 p-4 text-white">
                <div className="text-sm opacity-80">Overall Score</div>
                <div className="mt-1 text-4xl font-extrabold">
                  {scoreCard.overall}/100
                </div>
                <div className="mt-2 inline-flex rounded-full bg-white/10 px-3 py-1 text-sm font-semibold">
                  {scoreCard.status}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">Participation</div>
                  <div className="mt-1 text-lg font-bold">
                    {scoreCard.participationScore}
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">Fluency</div>
                  <div className="mt-1 text-lg font-bold">
                    {scoreCard.fluencyScore}
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">Usage</div>
                  <div className="mt-1 text-lg font-bold">
                    {scoreCard.usageScore}
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                <div className="font-semibold">Feedback</div>
                <div className="mt-1">{scoreCard.feedback}</div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 text-center text-xs text-slate-500">
          Sound: {soundEnabled ? "Enabled" : "Not enabled"}
        </div>
      </div>
    </div>
  );
}
