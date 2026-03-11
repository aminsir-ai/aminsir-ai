"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { COURSE_DATA } from "@/lib/courseData";

function getLevels() {
  return Array.isArray(COURSE_DATA?.levels) ? COURSE_DATA.levels : [];
}

function getLevel(levelNo) {
  return getLevels().find((lvl) => Number(lvl?.level) === Number(levelNo)) || null;
}

function getWeeks(levelNo) {
  const level = getLevel(levelNo);
  return Array.isArray(level?.weeks) ? level.weeks : [];
}

function getWeek(levelNo, weekNo) {
  return getWeeks(levelNo).find((wk) => Number(wk?.week) === Number(weekNo)) || null;
}

function getDays(levelNo, weekNo) {
  const week = getWeek(levelNo, weekNo);
  return Array.isArray(week?.days) ? week.days : [];
}

function getLesson(levelNo, weekNo, dayNo) {
  const day =
    getDays(levelNo, weekNo).find((d) => Number(d?.day) === Number(dayNo)) || null;

  if (day) return day;

  return {
    day: Number(dayNo || 1),
    title: `Level ${levelNo} Week ${weekNo} Day ${dayNo}`,
    vocabulary: ["hello", "speak", "practice"],
    speakingFocus: "Practice simple English speaking.",
    practicePrompt: "Speak 3 short English sentences.",
    grammarHintHindi: "",
    lessonType: "conversation",
  };
}

function getMaxLevel() {
  const levels = getLevels();
  return levels.length || 1;
}

function getMaxWeek(levelNo) {
  const weeks = getWeeks(levelNo);
  return weeks.length || 1;
}

function getMaxDay(levelNo, weekNo) {
  const days = getDays(levelNo, weekNo);
  return days.length || 1;
}

function buildLessonInstructions({ userName, levelNo, weekNo, dayNo, lesson }) {
  const vocab = Array.isArray(lesson?.vocabulary) ? lesson.vocabulary.join(", ") : "";
  const title = String(lesson?.title || "").trim();
  const focus = String(lesson?.speakingFocus || "").trim();
  const practicePrompt = String(lesson?.practicePrompt || "").trim();
  const grammarHintHindi = String(lesson?.grammarHintHindi || "").trim();
  const lessonType = String(lesson?.lessonType || "conversation").trim();

  return `
You are Amin Sir AI Tutor and AI Speaking Coach.

Student name is ${userName}.

Current lesson:
Level: ${levelNo}
Week: ${weekNo}
Day: ${dayNo}
Lesson title: ${title}
Vocabulary: ${vocab}
Speaking focus: ${focus}
Practice prompt: ${practicePrompt}
Hindi grammar help: ${grammarHintHindi}
Lesson type: ${lessonType}

Your role:
- Speak like a warm, confident male English teacher.
- Use simple English.
- Use only small simple Hindi help when really needed.
- Keep your replies short and practical.
- Ask only one question at a time.
- Make the student speak more than you.
- Encourage the student to answer in full sentences.
- Correct gently and briefly.
- Do not speak in long paragraphs.
- Do not start random topics that are outside today's lesson.

Opening rules:
- Greet ${userName} warmly.
- Tell ${userName} to answer in English.
- Mention today's lesson in a natural way.
- Ask the first question based only on today's lesson.
- Do not ask about favorite color unless today's lesson is about that.
- Do not say "This is Amin Sir."

Correction style:
- First appreciate the effort.
- Then say the corrected sentence shortly.
- Then ask the student to repeat or answer again.

Always stay focused on today's lesson only.
  `.trim();
}

export default function ChatPage() {
  const router = useRouter();

  const [userName, setUserName] = useState("");
  const [studentId, setStudentId] = useState("");

  const [selectedLevel, setSelectedLevel] = useState(1);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedDay, setSelectedDay] = useState(1);

  const [pcStatus, setPcStatus] = useState("idle");
  const [dcStatus, setDcStatus] = useState("closed");
  const [trackYes, setTrackYes] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [sessionMsg, setSessionMsg] = useState("");

  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  useEffect(() => {
    const raw = localStorage.getItem("aminsir_user");
    if (!raw) {
      router.push("/login");
      return;
    }

    try {
      const u = JSON.parse(raw);
      setUserName(u?.name || "User");
      setStudentId(String(u?.id || u?.studentId || ""));

      const safeLevel = Number(u?.selectedLevel || 1);
      const safeWeek = Number(u?.selectedWeek || 1);
      const safeDay = Number(u?.selectedDay || 1);

      setSelectedLevel(safeLevel);
      setSelectedWeek(safeWeek);
      setSelectedDay(safeDay);
    } catch {
      router.push("/login");
    }
  }, [router]);

  const maxLevel = getMaxLevel();
  const maxWeek = getMaxWeek(selectedLevel);
  const maxDay = getMaxDay(selectedLevel, selectedWeek);

  const lesson = getLesson(selectedLevel, selectedWeek, selectedDay);
  const vocabulary = Array.isArray(lesson?.vocabulary) ? lesson.vocabulary : [];

  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setElapsed((t) => t + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = null;
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const safeClose = useCallback(async () => {
    try {
      stopTimer();
      setElapsed(0);
      setSoundEnabled(false);
      setTrackYes(false);
      setDcStatus("closed");
      setPcStatus("closed");

      if (dcRef.current) {
        try {
          dcRef.current.close();
        } catch {}
        dcRef.current = null;
      }

      if (pcRef.current) {
        try {
          pcRef.current.close();
        } catch {}
        pcRef.current = null;
      }

      if (localStreamRef.current) {
        try {
          localStreamRef.current.getTracks().forEach((t) => t.stop());
        } catch {}
        localStreamRef.current = null;
      }

      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.srcObject = null;
        } catch {}
      }

      remoteStreamRef.current = null;
    } catch {}
  }, []);

  useEffect(() => {
    return () => {
      safeClose();
    };
  }, [safeClose]);

  const dcSend = (obj) => {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open") return;
    dc.send(JSON.stringify(obj));
  };

  const enableSound = async () => {
    try {
      if (!audioRef.current) return;

      if (remoteStreamRef.current) {
        audioRef.current.srcObject = remoteStreamRef.current;
      }

      await audioRef.current.play();
      setSoundEnabled(true);
    } catch {
      setSoundEnabled(false);
    }
  };

  const startVoice = async () => {
    try {
      await safeClose();

      setPcStatus("connecting");
      setElapsed(0);
      setSoundEnabled(false);
      setTrackYes(false);
      setDcStatus("closed");
      setSessionMsg("");

      const instructions = buildLessonInstructions({
        userName: userName || "Student",
        levelNo: selectedLevel,
        weekNo: selectedWeek,
        dayNo: selectedDay,
        lesson,
      });

      const r = await fetch("/api/realtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voice: "marin",
          instructions,
        }),
      });

      const data = await r.json();

      if (!r.ok) {
        setPcStatus("error");
        setSessionMsg(`Voice start failed: ${data?.error || "Unknown error"}`);
        return;
      }

      const ephemeralKey = data?.client_secret?.value;
      if (!ephemeralKey) {
        setPcStatus("error");
        setSessionMsg("Voice start failed: missing client secret.");
        return;
      }

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      pcRef.current = pc;

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          setPcStatus("connected");
          setSessionMsg(
            `Connected — Amin Sir is ready for Level ${selectedLevel}, Week ${selectedWeek}, Day ${selectedDay}. Start speaking.`
          );
        }
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "disconnected"
        ) {
          setPcStatus("error");
        }
        if (pc.connectionState === "closed") {
          setPcStatus("closed");
        }
      };

      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      localStreamRef.current = localStream;
      localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));

      const remoteStream = new MediaStream();
      remoteStreamRef.current = remoteStream;

      pc.ontrack = async (event) => {
        setTrackYes(true);

        event.streams[0].getTracks().forEach((t) => {
          remoteStream.addTrack(t);
        });

        if (audioRef.current) {
          audioRef.current.srcObject = remoteStream;
          try {
            await audioRef.current.play();
            setSoundEnabled(true);
          } catch {
            setSoundEnabled(false);
          }
        }
      };

      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.onopen = () => {
        setDcStatus("open");
        startTimer();

        dcSend({
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Start as Amin Sir in a natural teacher style. Greet ${userName} warmly. Tell ${userName} to answer in English. Today's lesson title is "${lesson?.title}". Today's vocabulary is "${vocabulary.join(", ")}". Speaking focus is "${lesson?.speakingFocus}". Ask only the first lesson-based question. Keep it short and natural.`,
              },
            ],
          },
        });

        dcSend({
          type: "response.create",
          response: {
            output_modalities: ["audio"],
          },
        });
      };

      dc.onclose = () => {
        setDcStatus("closed");
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpResp = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          "Content-Type": "application/sdp",
        },
        body: offer.sdp,
      });

      const answerSdp = await sdpResp.text();

      if (!sdpResp.ok) {
        setPcStatus("error");
        setSessionMsg("Realtime connection failed.");
        return;
      }

      await pc.setRemoteDescription({
        type: "answer",
        sdp: answerSdp,
      });
    } catch (err) {
      setPcStatus("error");
      setSessionMsg(`Voice start failed: ${err?.message || "Unknown error"}`);
    }
  };

  const logout = async () => {
    await safeClose();
    localStorage.removeItem("aminsir_user");
    router.push("/login");
  };
  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <h2 style={{ margin: 0 }}>Amin Sir AI Tutor</h2>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <b>User: {userName || "..."}</b>

          <button
            onClick={logout}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid #ddd",
              cursor: "pointer",
              fontWeight: 800,
              background: "white",
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div
        style={{
          marginTop: 18,
          padding: 16,
          borderRadius: 16,
          background: "#ffffff",
          border: "1px solid #e5e7eb",
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 1000, marginBottom: 10 }}>
          🪜 Level Selector
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {Array.from({ length: maxLevel }, (_, i) => i + 1).map((level) => (
            <button
              key={level}
              onClick={() => {
                setSelectedLevel(level);
                setSelectedWeek(1);
                setSelectedDay(1);
              }}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: selectedLevel === level ? "2px solid #111827" : "1px solid #ddd",
                background: selectedLevel === level ? "#dcfce7" : "white",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Level {level}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 16, fontSize: 20, fontWeight: 1000, marginBottom: 10 }}>
          📅 Week Selector
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {Array.from({ length: maxWeek }, (_, i) => i + 1).map((week) => (
            <button
              key={week}
              onClick={() => {
                setSelectedWeek(week);
                setSelectedDay(1);
              }}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: selectedWeek === week ? "2px solid #111827" : "1px solid #ddd",
                background: selectedWeek === week ? "#dbeafe" : "white",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Week {week}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 16, fontSize: 20, fontWeight: 1000, marginBottom: 10 }}>
          📘 Day Selector
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {Array.from({ length: maxDay }, (_, i) => i + 1).map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: selectedDay === day ? "2px solid #111827" : "1px solid #ddd",
                background: selectedDay === day ? "#fef3c7" : "white",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Day {day}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          marginTop: 18,
          padding: 16,
          borderRadius: 16,
          background: "#ffffff",
          border: "1px solid #e5e7eb",
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 1000 }}>
          🟢 Level {selectedLevel} – Week {selectedWeek}
        </div>
        <div style={{ marginTop: 6, fontSize: 18, fontWeight: 800 }}>
          Day {selectedDay}
        </div>

        <div style={{ marginTop: 12, fontSize: 20, fontWeight: 1000 }}>
          📘 Lesson of the Day
        </div>
        <div style={{ marginTop: 8, fontSize: 26, fontWeight: 1000 }}>
          {lesson?.title || "Current Lesson"}
        </div>

        <div style={{ marginTop: 6, fontSize: 16 }}>
          <b>Vocabulary:</b> {vocabulary.length ? vocabulary.join(", ") : "—"}
        </div>

        <div style={{ marginTop: 6, fontSize: 16 }}>
          <b>Speaking Focus:</b> {lesson?.speakingFocus || "—"}
        </div>

        <div style={{ marginTop: 6, fontSize: 16 }}>
          <b>Practice Prompt:</b> {lesson?.practicePrompt || "—"}
        </div>

        {lesson?.grammarHintHindi ? (
          <div style={{ marginTop: 6, fontSize: 16 }}>
            <b>Hindi Help:</b> {lesson.grammarHintHindi}
          </div>
        ) : null}
      </div>

      <div style={{ marginTop: 14, fontSize: 18, fontWeight: 800 }}>
        Status: PC: {pcStatus === "connected" ? "connected ✅" : pcStatus}
      </div>

      <div style={{ marginTop: 14, fontSize: 20, fontWeight: 900 }}>
        Step: Tap Enable Sound 🔊 first, then Start Voice 🎤
      </div>

      <div style={{ marginTop: 10, fontSize: 18, fontWeight: 800 }}>
        DC: {dcStatus === "open" ? "Open ✅" : "Closed"} | Track:{" "}
        {trackYes ? "Yes ✅" : "No"} | Sound:{" "}
        {soundEnabled ? "Enabled ✅" : "Locked"}
      </div>

      <div
        style={{
          marginTop: 18,
          display: "flex",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={enableSound}
          style={{
            padding: "14px 22px",
            borderRadius: 16,
            border: "1px solid #b7e4b7",
            cursor: "pointer",
            fontWeight: 900,
            fontSize: 18,
            background: "#eaf7ea",
          }}
        >
          Enable Sound 🔊 {soundEnabled ? "✅" : ""}
        </button>

        <button
          onClick={startVoice}
          style={{
            padding: "14px 22px",
            borderRadius: 16,
            border: "none",
            cursor: "pointer",
            fontWeight: 900,
            fontSize: 18,
            background: "black",
            color: "white",
          }}
        >
          Start Voice 🎤
        </button>

        <button
          onClick={() => {
            safeClose();
            setSessionMsg("Session finished. Tap Start Voice to practice again.");
          }}
          style={{
            padding: "14px 22px",
            borderRadius: 16,
            border: "1px solid #ddd",
            cursor: "pointer",
            fontWeight: 900,
            fontSize: 18,
            background: "white",
          }}
        >
          Stop
        </button>
      </div>

      <audio ref={audioRef} autoPlay playsInline />

      <div style={{ marginTop: 16, fontWeight: 900, fontSize: 18 }}>
        Session Time: {formatTime(elapsed)}
      </div>

      {sessionMsg && (
        <div style={{ marginTop: 12, fontWeight: 700 }}>
          {sessionMsg}
        </div>
      )}
    </div>
  );
}
