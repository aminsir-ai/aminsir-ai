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

  async function startMicWarmup() {
    // Start mic quickly to "wake up" permissions + VAD
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

    // Add mic track immediately
    if (pcRef.current) {
      pcRef.current.addTrack(stream.getTracks()[0], stream);
    }

    // Warmup: enable for 1 second, then disable
    stream.getTracks().forEach((t) => (t.enabled = true));
    setTimeout(() => {
      try {
        stream.getTracks().forEach((t) => (t.enabled = false));
      } catch {}
    }, 1000);
  }

  function stopAll() {
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch {}
        });
        localStreamRef.current = null;
      }
    } catch {}
  }

  async function connectRealtime() {
    setError("");
    setStatus("Connecting...");

    try {
      // Unlock audio immediately (mobile needs this on click)
      ensureRemoteAudioPlays();

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

      pc.addTransceiver("audio", { direction: "sendrecv" });

      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.onopen = async () => {
        // Start mic warmup so greeting doesn't wait
        try {
          await startMicWarmup();
        } catch (e) {
          console.warn("mic warmup failed", e);
        }

        // Set teacher personality
        sendJSON({
          type: "session.update",
          session: {
            turn_detection: { type: "server_vad" },
            input_audio_transcription: { model: "gpt-4o-mini-transcribe" },
            voice: "alloy",
            audio: {
              output: { voice: "alloy", format: "pcm16" },
            },
            instructions: `
You are Amin Sir, a friendly Indian English teacher for school students.

Rules:
• Speak slow and clear English.
• Indian teacher tone.
• Short sentences.
• One question at a time.
• Encourage: "Good try", "Very good", "Nice answer".
• Wait for student reply. Do not speak continuously.
            `.trim(),
            modalities: ["text", "audio"],
          },
        });

        // Force exact first line (use USER role here—more reliable than system in some realtime flows)
        sendJSON({
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "user",
            content: [
              {
                type: "input_text",
                text:
                  'Say EXACTLY this in audio: "Hello beta! I am Amin Sir, your English speaking teacher. What is your name?"',
              },
            ],
          },
        });

        // Speak immediately
        sendJSON({
          type: "response.create",
          response: { modalities: ["audio"], max_output_tokens: 80 },
        });
      };

      // Create offer
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

      const answerSdp = await sdpResponse.text();

      if (!sdpResponse.ok) throw new Error(answerSdp);
      if (!answerSdp.trim().startsWith("v=")) throw new Error("Invalid answer SDP:\n" + answerSdp);

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
      stopAll();
      if (dcRef.current) dcRef.current.close();
      if (pcRef.current) pcRef.current.close();
      if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;

      dcRef.current = null;
      pcRef.current = null;

      setConnected(false);
      setStatus("Closed");
    } catch {}
  }

  async function pttStart() {
    if (!connected) return;
    setPttActive(true);
    setError("");
    ensureRemoteAudioPlays();

    try {
      if (!localStreamRef.current) {
        await startMicWarmup();
      }
      // Enable mic while holding
      localStreamRef.current?.getTracks()?.forEach((t) => (t.enabled = true));
    } catch (e) {
      setPttActive(false);
      setErr(e);
    }
  }

  function pttStop() {
    setPttActive(false);
    try {
      // Disable mic on release
      localStreamRef.current?.getTracks()?.forEach((t) => (t.enabled = false));

      // Ask tutor to reply
      sendJSON({
        type: "response.create",
        response: { max_output_tokens: 120 },
      });
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
      <h2>Welcome, Amin sir 👋</h2>

      <div style={{ marginBottom: 10, fontWeight: 700 }}>Status: {status}</div>

      {!connected ? (
        <button
          onClick={connectRealtime}
          style={{ padding: 12, borderRadius: 10, background: "#111", color: "#fff", fontWeight: 800 }}
        >
          Start Voice 🎤
        </button>
      ) : (
        <button
          onClick={disconnectRealtime}
          style={{ padding: 12, borderRadius: 10, border: "1px solid #ddd", background: "#fff", fontWeight: 800 }}
        >
          Stop
        </button>
      )}

      {error && (
        <pre style={{ background: "#fee", padding: 10, marginTop: 10, whiteSpace: "pre-wrap" }}>{error}</pre>
      )}

      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Mobile Hold-to-talk bar */}
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
            padding: 16,
            borderRadius: 14,
            background: !connected ? "#bbb" : pttActive ? "#e53935" : "#16a34a",
            color: "#fff",
            fontWeight: 900,
            fontSize: 16,
          }}
        >
          {!connected ? "Connect first" : pttActive ? "Release to Stop" : "Hold to Talk 🎤"}
        </button>
      </div>
    </div>
  );
}