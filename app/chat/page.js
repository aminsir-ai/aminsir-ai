"use client";

import { useEffect, useRef, useState } from "react";

/* ---------------- AUTH ---------------- */
const AUTH_KEY = "aminsir_auth_v1";
function getUser() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw)?.user || null;
  } catch {
    return null;
  }
}

/* ---------------- CONFIG ---------------- */
const VOICE = "marin"; // supported voice name you saw in error list

export default function ChatPage() {
  const user = getUser();

  const [status, setStatus] = useState("Idle");
  const [step, setStep] = useState("—");
  const [error, setError] = useState("");

  const [dcOpen, setDcOpen] = useState(false);
  const [gotTrack, setGotTrack] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);

  const remoteAudioRef = useRef(null);

  // mobile fallback
  const audioCtxRef = useRef(null);
  const audioSrcRef = useRef(null);

  async function getKey() {
    setStep("Fetching key…");
    const r = await fetch("/api/realtime", { method: "POST" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j?.error?.message || "Failed to fetch key");
    if (!j?.value) throw new Error("Ephemeral key missing");
    return j.value;
  }

  function sendJSON(obj) {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open") return;
    dc.send(JSON.stringify(obj));
  }

  async function enableSound() {
    setError("");
    try {
      // 1) unlock <audio>
      const el = remoteAudioRef.current;
      if (el) {
        el.muted = false;
        el.volume = 1;
        el.playsInline = true;
        const p = el.play?.();
        if (p && typeof p.then === "function") await p;
      }

      // 2) unlock AudioContext (mobile)
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        if (!audioCtxRef.current) audioCtxRef.current = new AC();
        if (audioCtxRef.current.state === "suspended") await audioCtxRef.current.resume();

        // connect remote stream if we already have it
        if (remoteStreamRef.current) {
          try {
            if (audioSrcRef.current) audioSrcRef.current.disconnect();
          } catch {}
          try {
            audioSrcRef.current = audioCtxRef.current.createMediaStreamSource(remoteStreamRef.current);
            audioSrcRef.current.connect(audioCtxRef.current.destination);
          } catch {}
        }
      }

      setSoundEnabled(true);
      setStep("Sound enabled ✅");
    } catch (e) {
      setSoundEnabled(false);
      setError(e?.message || String(e));
    }
  }

  async function startVoice() {
    setError("");
    setGotTrack(false);
    setDcOpen(false);
    setSoundEnabled(false);
    setStatus("Connecting…");
    setStep("Starting…");

    try {
      const key = await getKey();

      setStep("Creating peer…");
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      pcRef.current = pc;

      pc.onconnectionstatechange = () => {
        setStatus(`PC: ${pc.connectionState}`);
      };

      pc.ontrack = (e) => {
        setGotTrack(true);

        const stream = e.streams?.[0];
        if (stream) {
          remoteStreamRef.current = stream;

          // attach to <audio>
          const el = remoteAudioRef.current;
          if (el) el.srcObject = stream;

          // if sound already enabled, try play again
          if (soundEnabled) {
            el?.play?.().catch(() => {});
          }

          // if AudioContext already created, connect it
          if (audioCtxRef.current && stream) {
            try {
              if (audioSrcRef.current) audioSrcRef.current.disconnect();
            } catch {}
            try {
              audioSrcRef.current = audioCtxRef.current.createMediaStreamSource(stream);
              audioSrcRef.current.connect(audioCtxRef.current.destination);
            } catch {}
          }
        }
      };

      // make sure we can receive audio
      pc.addTransceiver("audio", { direction: "sendrecv" });

      setStep("Requesting microphone…");
      const local = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = local;
      local.getTracks().forEach((t) => pc.addTrack(t, local));

      setStep("Creating DataChannel…");
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.onopen = () => {
        setDcOpen(true);
        setStep("DC open ✅ (Tap Enable Sound)");

        // IMPORTANT: GA format (do NOT send session.voice)
        sendJSON({
          type: "session.update",
          session: {
            modalities: ["audio", "text"],
            instructions: `You are Amin Sir, a friendly spoken-English teacher.
Speak at normal teacher speed.
Use 80% English + 20% very simple Hindi.
Ask one question then WAIT.`,
          },
        });

        // Force the assistant to speak right away
        sendJSON({
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "user",
            content: [
              {
                type: "input_text",
                text: `In AUDIO: Say "Hello ${user}! I am Amin Sir." then ask: "Tell me one sentence about your day."`,
              },
            ],
          },
        });

        // Some builds accept voice here; if it errors, remove "voice"
        sendJSON({
          type: "response.create",
          response: {
            modalities: ["audio"],
            // If your account supports voice selection here, it will use it.
            // If it throws error, delete this line.
            voice: VOICE,
          },
        });
      };

      dc.onmessage = (ev) => {
        // helps debugging: if server complains, you will see message in UI
        try {
          const msg = JSON.parse(ev.data);
          if (msg?.type?.includes("error") || msg?.error) {
            setError(JSON.stringify(msg, null, 2));
          }
        } catch {}
      };

      setStep("Creating offer…");
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      setStep("Sending SDP…");
      const res = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/sdp",
          Accept: "application/sdp",
        },
        body: offer.sdp,
      });

      const answer = await res.text().catch(() => "");
      if (!res.ok) throw new Error(answer || `SDP failed (${res.status})`);

      setStep("Applying answer…");
      await pc.setRemoteDescription({ type: "answer", sdp: answer });

      setStatus("Connected ✅");
      setStep("Now tap Enable Sound 🔊 (important on mobile)");
    } catch (e) {
      setStatus("Error");
      setError(e?.message || String(e));
    }
  }

  function stop() {
    try {
      dcRef.current?.close?.();
    } catch {}
    try {
      pcRef.current?.close?.();
    } catch {}
    try {
      localStreamRef.current?.getTracks?.().forEach((t) => t.stop());
    } catch {}
    try {
      remoteAudioRef.current?.pause?.();
      if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    } catch {}

    setStatus("Stopped");
    setStep("—");
    setDcOpen(false);
    setGotTrack(false);
    setSoundEnabled(false);
  }

  useEffect(() => () => stop(), []);

  if (!user) return <div style={{ padding: 20 }}>Please login</div>;

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: 18, fontFamily: "system-ui, Arial" }}>
      <h2 style={{ margin: "8px 0" }}>Amin Sir AI Tutor</h2>

      <div style={{ fontWeight: 800, marginBottom: 6 }}>Status: {status}</div>
      <div style={{ fontWeight: 800, marginBottom: 12 }}>Step: {step}</div>

      <div style={{ fontWeight: 800, marginBottom: 12 }}>
        DC: {dcOpen ? "Open ✅" : "Not open"} | Track: {gotTrack ? "Yes ✅" : "No"} | Sound:{" "}
        {soundEnabled ? "Enabled ✅" : "Locked"}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          onClick={startVoice}
          style={{ padding: "10px 14px", borderRadius: 12, border: "none", background: "#111", color: "#fff", fontWeight: 900 }}
        >
          Start Voice 🎤
        </button>

        <button
          onClick={enableSound}
          style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid #ddd", background: soundEnabled ? "#eaffea" : "#fff", fontWeight: 900 }}
        >
          Enable Sound 🔊 {soundEnabled ? "✅" : ""}
        </button>

        <button
          onClick={stop}
          style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid #ddd", background: "#fff", fontWeight: 900 }}
        >
          Stop
        </button>
      </div>

      {error ? (
        <pre style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "#fff1f2", border: "1px solid #fecdd3", color: "#7f1d1d", whiteSpace: "pre-wrap" }}>
          {error}
        </pre>
      ) : null}

      <audio ref={remoteAudioRef} autoPlay playsInline controls style={{ width: "100%", marginTop: 12 }} />
    </div>
  );
}