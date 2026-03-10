"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Level5PhraseTracker from "@/components/Level5PhraseTracker";
import {
  detectLevel5Phrases,
  getLevel5PhraseProgress,
} from "@/lib/phraseTracker";

function normalizeText(text = "") {
  return String(text).toLowerCase().trim();
}

export default function ChatLevel5Page() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [newlyUnlockedPhrases, setNewlyUnlockedPhrases] = useState([]);
  const [seenPhraseSet, setSeenPhraseSet] = useState(new Set());
  const [connectionStatus, setConnectionStatus] = useState("Idle");

  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hello! Welcome to Amin Sir AI Tutor Level 5. Try using natural daily-use phrases in your answers.",
    },
  ]);

  const detectedPhrases = useMemo(() => {
    return detectLevel5Phrases(liveTranscript);
  }, [liveTranscript]);

  const phraseProgress = useMemo(() => {
    return getLevel5PhraseProgress(detectedPhrases);
  }, [detectedPhrases]);

  useEffect(() => {
    if (!detectedPhrases.length) return;

    const unlocked = [];

    detectedPhrases.forEach((item) => {
      const normalized = normalizeText(item.phrase);
      if (!seenPhraseSet.has(normalized)) {
        unlocked.push(item.phrase);
      }
    });

    if (unlocked.length > 0) {
      setNewlyUnlockedPhrases(unlocked);

      setSeenPhraseSet((prev) => {
        const updated = new Set(prev);
        unlocked.forEach((phrase) => updated.add(normalizeText(phrase)));
        return updated;
      });
    }
  }, [detectedPhrases, seenPhraseSet]);

  useEffect(() => {
    return () => {
      stopRealtimeSession();
    };
  }, []);

  function appendMessage(role, text) {
    if (!text?.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        role,
        text: text.trim(),
      },
    ]);
  }

  function appendTranscript(text) {
    if (!text?.trim()) return;
    setLiveTranscript((prev) => `${prev} ${text}`.trim());
  }

  async function startRealtimeSession() {
    if (isConnecting || isSessionActive) return;

    try {
      setIsConnecting(true);
      setConnectionStatus("Getting microphone...");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      const remoteAudio = new Audio();
      remoteAudio.autoplay = true;
      remoteAudioRef.current = remoteAudio;

      pc.ontrack = (event) => {
        remoteAudio.srcObject = event.streams[0];
      };

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.onopen = () => {
        setConnectionStatus("Connected");
        setIsSessionActive(true);
        setIsConnecting(false);

        appendMessage(
          "assistant",
          "Level 5 realtime session started. Speak naturally and use useful daily phrases."
        );
      };

      dc.onclose = () => {
        setConnectionStatus("Disconnected");
      };

      dc.onerror = () => {
        setConnectionStatus("Data channel error");
      };

      dc.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (
            data.type === "conversation.item.input_audio_transcription.completed"
          ) {
            const transcript = data.transcript || "";
            appendMessage("user", transcript);
            appendTranscript(transcript);
          }

          if (data.type === "response.audio_transcript.done") {
            const transcript = data.transcript || "";
            appendMessage("assistant", transcript);
            appendTranscript(transcript);
          }

          if (
            data.type === "response.output_text.done" ||
            data.type === "response.text.done"
          ) {
            const text = data.text || data.output_text || "";
            appendMessage("assistant", text);
            appendTranscript(text);
          }
        } catch (err) {
          console.error("Realtime event parse error:", err);
        }
      };

      setConnectionStatus("Creating SDP offer...");

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      setConnectionStatus("Sending offer to /api/realtime...");

      const response = await fetch("/api/realtime", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sdp: offer.sdp,
          model: "gpt-realtime",
          voice: "alloy",
          studentName: "Student",
          studentId: "",
          level: "level5",
          levelNo: 5,
          weekNo: 1,
          dayNo: 1,
          lessonTitle: "Level 5 Phrase Practice",
          lessonWord: "daily-use phrases",
          speakingFocus:
            "Use practical English phrases and idioms naturally in conversation.",
          practicePrompt:
            "Ask the student to speak naturally using short daily-use phrases.",
          grammarHintHindi: "",
          lessonPrompt: `
You are Amin Sir AI Tutor for Level 5 speaking practice.

MAIN GOAL:
- Help the student use daily-use English phrases and common idioms in natural conversation.
- Student should speak most of the time.
- You should speak briefly.
- Usually reply in 1 short sentence or 1 short question.
- Ask only one thing at a time.
- Wait for the student after every prompt.

IMPORTANT STYLE:
- Do not make the session feel like repeat-after-me drilling.
- Do not keep saying "repeat" unless the student makes a clear mistake.
- Prefer real conversation situations.
- Prefer natural speaking tasks.
- Encourage the student to answer freely using useful phrases.

HOW TO TEACH:
- Give a small real-life situation.
- Ask the student to respond naturally.
- Sometimes suggest using a phrase, but do not force repetition every time.
- After the student answers, continue the conversation naturally.
- Keep the student talking.

GOOD EXAMPLES:
- "You meet a friend after a long time. What will you say?"
- "Answer naturally."
- "Use one greeting phrase."
- "Now ask a follow-up question."
- "Good. Say one more sentence."
- "Nice. Try another natural phrase."

CORRECTION RULE:
- If the student makes a mistake, keep correction short.
- Say: "Good try."
- Give the correct sentence once.
- Then say: "Say it again."
- Only do this when really needed.

DO NOT:
- Do not behave like a strict repetition machine.
- Do not ask the student to repeat every answer.
- Do not give long lectures.
- Do not ask multiple questions together.

CONVERSATION BEHAVIOR:
- Start with one short greeting.
- Give one short real-life speaking situation.
- Encourage phrase use naturally.
- Continue like a real conversation coach.
          `.trim(),
          hasHomework: false,
          homeworkFirstSentence: "",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.ok || !data?.sdp) {
        throw new Error(
          data?.details || data?.error || "Failed to get SDP answer from /api/realtime"
        );
      }

      await pc.setRemoteDescription({
        type: "answer",
        sdp: data.sdp,
      });

      setConnectionStatus("Waiting for realtime channel...");
    } catch (error) {
      console.error(error);
      setConnectionStatus("Failed");
      setIsConnecting(false);
      setIsSessionActive(false);

      appendMessage(
        "assistant",
        `Realtime connection failed: ${error.message || "Unknown error"}`
      );

      stopRealtimeSession();
    }
  }

  function stopRealtimeSession() {
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
      } catch {}
      remoteAudioRef.current = null;
    }

    setIsSessionActive(false);
    setIsConnecting(false);
    setConnectionStatus("Stopped");
  }

  function handleManualSend() {
    const cleanText = userInput.trim();
    if (!cleanText) return;

    appendMessage("user", cleanText);
    appendMessage(
      "assistant",
      `Good! You said: "${cleanText}". Try using more useful phrases.`
    );

    appendTranscript(cleanText);
    setUserInput("");
  }

  function handleClearTranscript() {
    setLiveTranscript("");
    setNewlyUnlockedPhrases([]);
    setSeenPhraseSet(new Set());
    setMessages([
      {
        role: "assistant",
        text: "Transcript cleared. Start a new Level 5 phrase practice.",
      },
    ]);
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 p-5 shadow-sm">
          <h1 className="text-2xl font-bold">Amin Sir AI Tutor — Level 5 Lab</h1>
          <p className="mt-2 text-sm text-gray-600">
            Experimental page for testing Level-5 real transcript flow safely.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={startRealtimeSession}
              disabled={isConnecting || isSessionActive}
              className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-50"
            >
              {isConnecting ? "Connecting..." : "Start Real Session"}
            </button>

            <button
              onClick={stopRealtimeSession}
              className="rounded-xl border border-gray-300 px-4 py-2"
            >
              Stop Session
            </button>

            <button
              onClick={handleClearTranscript}
              className="rounded-xl border border-gray-300 px-4 py-2"
            >
              Clear Transcript
            </button>

            <div className="flex items-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm">
              Status: {isSessionActive ? "Active" : "Stopped"}
            </div>

            <div className="flex items-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm">
              Connection: {connectionStatus}
            </div>
          </div>
        </div>

        {newlyUnlockedPhrases.length > 0 && (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4 shadow-sm">
            <div className="text-lg font-semibold text-green-800">
              New Phrase Unlocked
            </div>
            <div className="mt-3 space-y-2">
              {newlyUnlockedPhrases.map((phrase, index) => (
                <div
                  key={`${phrase}-${index}`}
                  className="rounded-lg border border-green-200 bg-white px-3 py-2 text-sm text-green-700"
                >
                  ✓ {phrase}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold">
              Conversation / Realtime Transcript
            </h2>

            <div className="mb-4 h-[360px] overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="space-y-3">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`rounded-xl border p-3 text-sm ${
                      msg.role === "user"
                        ? "border-blue-200 bg-blue-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="mb-1 text-xs font-semibold uppercase text-gray-500">
                      {msg.role}
                    </div>
                    <div>{msg.text}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Manual fallback test: Long time no see. Good to see you. How’s it going?"
                className="w-full rounded-xl border border-gray-300 p-3 text-sm outline-none"
                rows={4}
              />

              <button
                onClick={handleManualSend}
                className="rounded-xl bg-black px-4 py-2 text-white"
              >
                Send Manual Test Sentence
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm">
              <div className="font-semibold">Live Transcript</div>
              <div className="mt-2 text-gray-700">
                {liveTranscript || "No transcript yet."}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold">Phrase Tracker</h2>

            <Level5PhraseTracker
              detectedPhrases={detectedPhrases}
              progress={phraseProgress}
            />
          </div>
        </div>
      </div>
    </div>
  );
}