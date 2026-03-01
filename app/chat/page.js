"use client";

import { useEffect, useRef, useState } from "react";

export default function ChatPage() {
  const pcRef = useRef(null);
  const dcRef = useRef(null);

  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);

  const [status, setStatus] = useState("Idle");
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);

  const [tutorMode, setTutorMode] = useState(true);
  const [pttActive, setPttActive] = useState(false);

  function setErr(e) {
    const msg = typeof e === "string" ? e : e?.message || JSON.stringify(e, null, 2);
    console.error(e);
    setError(msg);
  }

  function ensureRemoteAudioPlays() {
    const el = remoteAudioRef.current;
    if (!el) return;
    try {
      el.muted = false;
      const p = el.play?.();
      if (p && typeof p.catch === "function") p.catch(() => {});
    } catch {}
  }

  function sendJSON(obj) {
    try {
      const dc = dcRef.current;
      if (!dc || dc.readyState !== "open") return;
      dc.send(JSON.stringify(obj));
    } catch (e) {
      console.error("sendJSON failed", e);
    }
  }

  async function getEphemeralKey() {
    const r = await fetch("/api/realtime", { method: "POST" });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data?.error?.message || JSON.stringify(data, null, 2));
    if (!data?.value) throw new Error("Ephemeral key missing from /api/realtime");
    return data.value;
  }

  async function connectRealtime() {
    setError("");
    setStatus("Connecting...");

    try {
      const EPHEMERAL_KEY = await getEphemeralKey();

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      pcRef.current = pc;

      pc.onconnectionstatechange = () => {
        const s = pc.connectionState;
        if (s === "connected") {
          setConnected(true);
          setStatus("Connected ✅");
        } else if (s === "failed" || s === "disconnected" || s === "closed") {
          setConnected(false);
          setStatus("Disconnected");
        }
      };

      pc.ontrack = (e) => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = e.streams[0];
          ensureRemoteAudioPlays();
        }
      };

      // receive model audio
      pc.addTransceiver("audio", { direction: "sendrecv" });

      // Data channel
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.onopen = () => {

        // 1️⃣ FIRST: set teacher personality BEFORE speaking
        sendJSON({
          type: "session.update",
          session: {
            turn_detection: { type: "server_vad" },
            input_audio_transcription: { model: "gpt-4o-mini-transcribe" },
            voice: "alloy",

            audio: {
              output: {
                voice: "alloy",
                format: "pcm16",
              },
            },

            instructions: `
You are Amin Sir, a friendly English teacher for Indian school students aged 10-16.

Rules:
• Speak slow and clear English
• Indian teacher tone
• Short sentences only
• One question at a time
• Encourage after every reply
• Never speak long paragraphs
• Always wait for the student

You are a human teacher, not an AI assistant.
            `.trim(),

            modalities: ["text", "audio"],
          },
        });

        // 2️⃣ FORCE EXACT FIRST SENTENCE
        sendJSON({
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "system",
            content: [
              {
                type: "input_text",
                text:
                  "Say EXACTLY: Hello beta! I am Amin Sir, your English speaking teacher. What is your name?",
              },
            ],
          },
        });

        // 3️⃣ Speak now
        sendJSON({
          type: "response.create",
          response: {
            modalities: ["audio"],
            max_output_tokens: 80,
          },
        });
      };

      // create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // send SDP to OpenAI
      const sdpResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp",
          Accept: "application/sdp",
        },
        body: offer.sdp,
      });

      const answerSdp = await sdpResponse.text();

      if (!sdpResponse.ok) {
        throw new Error(answerSdp);
      }

      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

      setConnected(true);
      setStatus("Connected ✅");
    } catch (e) {
      setErr(e);
      setStatus("Error");
    }
  }

  function disconnectRealtime() {
    try {
      if (dcRef.current) dcRef.current.close();
      if (pcRef.current) pcRef.current.close();
      if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;

      setConnected(false);
      setStatus("Closed");
    } catch {}
  }

  // push-to-talk
  async function startTalking() {
    if (!pcRef.current) return;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => (t.enabled = true));
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });

    localStreamRef.current = stream;
    pcRef.current.addTrack(stream.getTracks()[0], stream);
  }

  function stopTalking() {
    if (!localStreamRef.current) return;

    localStreamRef.current.getTracks().forEach((t) => (t.enabled = false));

    sendJSON({
      type: "response.create",
      response: { max_output_tokens: 80 },
    });
  }

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: 16, paddingBottom: 120 }}>
      <h2>Welcome, Amin sir 👋</h2>

      <div style={{ marginBottom: 10, fontWeight: 700 }}>
        Status: {status}
      </div>

      {!connected ? (
        <button onClick={connectRealtime} style={{ padding: 10 }}>
          Start Voice 🎤
        </button>
      ) : (
        <button onClick={disconnectRealtime} style={{ padding: 10 }}>
          Stop
        </button>
      )}

      {error && (
        <pre style={{ background: "#fee", padding: 10, marginTop: 10 }}>
          {error}
        </pre>
      )}

      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* MOBILE TUTOR BAR */}
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          padding: 12,
          background: "#fff",
          borderTop: "1px solid #ddd",
          display: "flex",
          gap: 10,
        }}
      >
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            startTalking();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            stopTalking();
          }}
          style={{
            flex: 1,
            padding: 16,
            borderRadius: 14,
            background: "#16a34a",
            color: "#fff",
            fontWeight: "bold",
          }}
        >
          Hold to Talk 🎤
        </button>
      </div>
    </div>
  );
}