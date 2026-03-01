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
  const [dcOpen, setDcOpen] = useState(false);
  const [gotRemoteTrack, setGotRemoteTrack] = useState(false);

  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [pttActive, setPttActive] = useState(false);

  function setErr(e) {
    const msg = typeof e === "string" ? e : e?.message || JSON.stringify(e, null, 2);
    console.error(e);
    setError(msg);
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  // Strong audio unlock for mobile browsers
  async function unlockAudio() {
    const el = remoteAudioRef.current;
    if (!el) return false;

    try {
      el.muted = false;
      el.volume = 1;

      // Try to play immediately (must be in user gesture)
      const p = el.play?.();
      if (p && typeof p.then === "function") {
        await p;
      }

      setAudioUnlocked(true);
      return true;
    } catch (e) {
      // If blocked, we keep "Enable Sound" button visible
      console.warn("Audio unlock blocked:", e);
      setAudioUnlocked(false);
      return false;
    }
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

  async function startMicWarmup() {
    if (localStreamRef.current) return;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });

    localStreamRef.current = stream;

    if (pcRef.current) {
      pcRef.current.addTrack(stream.getTracks()[0], stream);
    }

    // Enable for a moment then disable (helps VAD + iOS)
    stream.getTracks().forEach((t) => (t.enabled = true));
    setTimeout(() => {
      try {
        stream.getTracks().forEach((t) => (t.enabled = false));
      } catch {}
    }, 900);
  }

  async function connectRealtime() {
    setError("");
    setStatus("Connecting...");
    setDcOpen(false);
    setGotRemoteTrack(false);

    try {
      // IMPORTANT: this function is called by user click -> perfect time to unlock audio
      await unlockAudio();

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
          setStatus(s === "closed" ? "Closed" : `Connection: ${s}`);
        }
      };

      pc.ontrack = async (e) => {
        try {
          setGotRemoteTrack(true);

          const el = remoteAudioRef.current;
          if (el) {
            el.srcObject = e.streams[0];
            // Try play again when track arrives
            await unlockAudio();
          }
        } catch (err) {
          console.warn("ontrack play error:", err);
        }
      };

      // Receive model audio
      pc.addTransceiver("audio", { direction: "sendrecv" });

      // Data channel
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.onopen = async () => {
        setDcOpen(true);

        // Warm up mic (helps iOS / VAD)
        try {
          await startMicWarmup();
        } catch (e) {
          console.warn("Mic warmup failed:", e);
        }

        // Give a tiny moment to stabilize
        await sleep(200);

        // Session update (teacher mode)
        sendJSON({
          type: "session.update",
          session: {
            turn_detection: { type: "server_vad" },
            input_audio_transcription: { model: "gpt-4o-mini-transcribe" },
            voice: "alloy",
            audio: { output: { voice: "alloy", format: "pcm16" } },
            instructions: `
You are Amin Sir, a friendly Indian English teacher for school students.

Rules:
• Speak slow and clear English.
• Short sentences only.
• One question at a time.
• Encourage: "Good try", "Very good", "Nice answer".
• Wait for the student reply.
Do NOT speak long paragraphs.
            `.trim(),
            modalities: ["text", "audio"],
          },
        });

        await sleep(150);

        // Force exact first sentence
        sendJSON({
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "user",
            content: [
              {
                type: "input_text",
                text:
                  'Say EXACTLY in audio: "Hello beta! I am Amin Sir, your English speaking teacher. What is your name?"',
              },
            ],
          },
        });

        // Speak now
        sendJSON({
          type: "response.create",
          response: { modalities: ["audio"], max_output_tokens: 80 },
        });

        // Try play again
        await sleep(200);
        await unlockAudio();
      };

      dc.onerror = (e) => console.warn("DataChannel error", e);

      // Offer/Answer with OpenAI
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp",
          Accept: "application/sdp",
        },
        body: offer.sdp,
      });

      const answerSdp = await sdpResponse.text().catch(() => "");
      if (!sdpResponse.ok) throw new Error(answerSdp || `SDP exchange failed (${sdpResponse.status})`);
      if (!answerSdp.trim().startsWith("v=")) throw new Error("Invalid answer SDP:\n" + answerSdp.slice(0, 400));

      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

      setConnected(true);
      setStatus("Connected ✅");
    } catch (e) {
      setConnected(false);
      setStatus("Error");
      setErr(e);
    }
  }

  function disconnectRealtime() {
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch {}
        });
        localStreamRef.current = null;
      }

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

      if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;

      setConnected(false);
      setDcOpen(false);
      setGotRemoteTrack(false);
      setStatus("Closed");
    } catch (e) {
      setErr(e);
    }
  }

  async function pttStart() {
    if (!connected) return;
    setPttActive(true);
    setError("");

    try {
      await unlockAudio();
      if (!localStreamRef.current) await startMicWarmup();
      localStreamRef.current?.getTracks()?.forEach((t) => (t.enabled = true));
    } catch (e) {
      setPttActive(false);
      setErr(e);
    }
  }

  function pttStop() {
    setPttActive(false);
    try {
      localStreamRef.current?.getTracks()?.forEach((t) => (t.enabled = false));
      sendJSON({ type: "response.create", response: { max_output_tokens: 120 } });
    } catch (e) {
      setErr(e);
    }
  }

  useEffect(() => {
    return () => {
      try {
        disconnectRealtime();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: 16, paddingBottom: 120 }}>
      <h2 style={{ margin: "8px 0 10px" }}>Welcome, Amin sir 👋</h2>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div
          style={{
            padding: "8px 12px",
            borderRadius: 12,
            border: "1px solid #eee",
            background: connected ? "#ecfdf5" : "#fff7ed",
            fontWeight: 800,
          }}
        >
          Status: {status}
        </div>

        <div style={{ fontWeight: 700, color: "#333" }}>
          DC: {dcOpen ? "Open ✅" : "Not open"} | Track: {gotRemoteTrack ? "Yes ✅" : "No"}
        </div>
      </div>

      <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
        {!connected ? (
          <button
            onClick={connectRealtime}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "none",
              background: "#111",
              color: "#fff",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Start Voice 🎤
          </button>
        ) : (
          <button
            onClick={disconnectRealtime}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid #ddd",
              background: "#fff",
              color: "#111",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Stop
          </button>
        )}

        {/* Audio unlock button (mobile fix) */}
        <button
          onClick={unlockAudio}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #ddd",
            background: audioUnlocked ? "#ecfdf5" : "#fff",
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          {audioUnlocked ? "Sound Enabled ✅" : "Enable Sound 🔊"}
        </button>
      </div>

      {error ? (
        <pre
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 12,
            background: "#fff1f2",
            border: "1px solid #fecdd3",
            color: "#7f1d1d",
            overflowX: "auto",
            whiteSpace: "pre-wrap",
          }}
        >
          {error}
        </pre>
      ) : null}

      <audio ref={remoteAudioRef} autoPlay playsInline controls style={{ width: "100%", marginTop: 12 }} />

      {/* Bottom PTT bar */}
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          padding: 12,
          background: "rgba(255,255,255,0.96)",
          borderTop: "1px solid #eee",
          display: "flex",
          gap: 10,
          zIndex: 50,
        }}
      >
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            pttStart();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            pttStop();
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            pttStart();
          }}
          onMouseUp={(e) => {
            e.preventDefault();
            pttStop();
          }}
          onMouseLeave={() => {
            if (pttActive) pttStop();
          }}
          disabled={!connected}
          style={{
            flex: 1,
            padding: "14px 16px",
            borderRadius: 16,
            border: "none",
            background: !connected ? "#bbb" : pttActive ? "#e53935" : "#16a34a",
            color: "#fff",
            fontWeight: 900,
            fontSize: 16,
            cursor: !connected ? "not-allowed" : "pointer",
          }}
        >
          {!connected ? "Connect first" : pttActive ? "Release to Stop" : "Hold to Talk 🎤"}
        </button>
      </div>
    </div>
  );
}