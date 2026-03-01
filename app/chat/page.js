"use client";

import { useEffect, useRef, useState } from "react";

export default function ChatPage() {
  const pcRef = useRef(null);
  const dcRef = useRef(null);

  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const remoteStreamRef = useRef(null);

  const sendersRef = useRef([]);

  const [status, setStatus] = useState("Idle");
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);

  // Mobile tutor controls
  const [tutorMode, setTutorMode] = useState(true);
  const [pttActive, setPttActive] = useState(false);

  function setErr(e) {
    const msg = typeof e === "string" ? e : e?.message || JSON.stringify(e, null, 2);
    console.error(e);
    setError(msg);
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

  function ensureRemoteAudioPlays() {
    const el = remoteAudioRef.current;
    if (!el) return;
    try {
      el.muted = false;
      const p = el.play?.();
      if (p && typeof p.catch === "function") p.catch(() => {});
    } catch {}
  }

  async function connectRealtime() {
    setError("");
    setStatus("Connecting...");

    try {
      // 1) Create PeerConnection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      pcRef.current = pc;

      remoteStreamRef.current = new MediaStream();

      pc.ontrack = (event) => {
        try {
          if (event.track?.kind === "audio") {
            remoteStreamRef.current.addTrack(event.track);
            if (remoteAudioRef.current) {
              remoteAudioRef.current.srcObject = remoteStreamRef.current;
            }
          }
        } catch (e) {
          console.error(e);
        }
      };

      pc.onconnectionstatechange = () => {
        const s = pc.connectionState;
        if (s === "connected") {
          setConnected(true);
          setStatus("Connected ✅");
          setError("");
        } else if (s === "disconnected" || s === "failed" || s === "closed") {
          setConnected(false);
          setStatus(s === "closed" ? "Closed" : `Connection: ${s}`);
        }
      };

      // 2) Data channel
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.onopen = () => {
        // Configure session (via data channel events)
        sendJSON({
          type: "session.update",
          session: {
            turn_detection: { type: "server_vad" },
            input_audio_transcription: { model: "gpt-4o-mini-transcribe" },
            voice: "alloy",
            instructions:
              "You are Amin Sir AI Voice Tutor. Speak simple, friendly Hinglish (mostly English). Ask short questions. Encourage the student. Correct gently.",
            modalities: ["text", "audio"],
          },
        });

        // Greeting
        sendJSON({
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "user",
            content: [{ type: "input_text", text: "Start with a warm greeting and ask the student's name." }],
          },
        });
        sendJSON({ type: "response.create" });
      };

      dc.onerror = (e) => console.error("DataChannel error", e);

      // Receive audio from model
      pc.addTransceiver("audio", { direction: "sendrecv" });

      // 3) Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // ✅ Send RAW SDP to server
      const sdpResponse = await fetch("/api/realtime", {
        method: "PUT",
        headers: { "Content-Type": "application/sdp" },
        body: offer.sdp,
      });

      const answerText = await sdpResponse.text().catch(() => "");

      if (!sdpResponse.ok) {
        throw new Error(
          "PUT /api/realtime failed:\n" + (answerText ? answerText.slice(0, 600) : "no response text")
        );
      }

      // ✅ DEBUG: show exact server output if not SDP
      if (!answerText || !answerText.trim().startsWith("v=")) {
        throw new Error(
          "Invalid answer SDP returned from server. Server said:\n" + answerText.slice(0, 600)
        );
      }

      await pc.setRemoteDescription({ type: "answer", sdp: answerText });

      setStatus("Connected ✅");
      setConnected(true);
      setError("");

      ensureRemoteAudioPlays();
    } catch (e) {
      setConnected(false);
      setStatus("Error");
      setErr(e);
    }
  }

  function disconnectRealtime() {
    setError("");
    setStatus("Closing...");

    try {
      stopTalking(true);

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

      remoteStreamRef.current = null;
      if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;

      setConnected(false);
      setStatus("Closed");
    } catch (e) {
      setErr(e);
    }
  }

  // ---- Mic (push-to-talk) ----
  async function startTalking() {
    if (!pcRef.current) throw new Error("Not connected. Click Start Voice first.");

    ensureRemoteAudioPlays();

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => (t.enabled = true));
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });

    localStreamRef.current = stream;

    const pc = pcRef.current;
    const senders = [];
    for (const track of stream.getTracks()) {
      const sender = pc.addTrack(track, stream);
      senders.push(sender);
    }
    sendersRef.current = senders;
  }

  function stopTalking(fullStop = false) {
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => {
          if (fullStop) {
            try {
              t.stop();
            } catch {}
          } else {
            t.enabled = false;
          }
        });
      }

      if (fullStop) {
        localStreamRef.current = null;

        if (pcRef.current && sendersRef.current.length) {
          for (const s of sendersRef.current) {
            try {
              pcRef.current.removeTrack(s);
            } catch {}
          }
        }
        sendersRef.current = [];
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function pttStart() {
    if (!connected) return;
    setPttActive(true);
    setError("");
    try {
      await startTalking();
    } catch (e) {
      setPttActive(false);
      setErr(e);
    }
  }

  function pttStop() {
    setPttActive(false);
    try {
      stopTalking(false);
      sendJSON({ type: "response.create" });
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
      <h2 style={{ margin: "8px 0 4px" }}>Welcome, Amin sir 👋</h2>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div
          style={{
            padding: "8px 12px",
            borderRadius: 12,
            border: "1px solid #eee",
            background: connected ? "#ecfdf5" : "#fff7ed",
            fontWeight: 700,
          }}
        >
          Status: {status}
        </div>

        {!connected ? (
          <button
            onClick={connectRealtime}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "none",
              background: "#111",
              color: "#fff",
              fontWeight: 800,
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
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Stop
          </button>
        )}
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

      <audio ref={remoteAudioRef} autoPlay playsInline />

      <div
        style={{
          marginTop: 16,
          padding: 14,
          borderRadius: 16,
          border: "1px solid #eee",
          background: "#fff",
        }}
      >
        <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 6 }}>
          {tutorMode ? "Tutor Mode ✅ (Mobile Optimized)" : "Tutor Mode OFF"}
        </div>
        <div style={{ color: "#444", lineHeight: 1.4 }}>
          {tutorMode ? (
            <>
              <div style={{ marginBottom: 6 }}>
                <b>Mobile steps:</b> Tap <b>Start Voice</b> once → then <b>Hold to Talk</b> → release for reply.
              </div>
              <div>
                Tip: First tap unlocks audio on mobile. If you don’t hear the tutor, press <b>Hold to Talk</b> once and
                release.
              </div>
            </>
          ) : (
            <div>You can still connect voice, but tutor controls are disabled.</div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
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
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 50,
        }}
      >
        <button
          onClick={() => setTutorMode((v) => !v)}
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid #ddd",
            background: tutorMode ? "#111" : "#fff",
            color: tutorMode ? "#fff" : "#111",
            fontWeight: 800,
            minWidth: 110,
          }}
        >
          {tutorMode ? "Tutor ON" : "Tutor OFF"}
        </button>

        <button
          onTouchStart={(e) => {
            e.preventDefault();
            if (!tutorMode) return;
            pttStart();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            if (!tutorMode) return;
            pttStop();
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            if (!tutorMode) return;
            pttStart();
          }}
          onMouseUp={(e) => {
            e.preventDefault();
            if (!tutorMode) return;
            pttStop();
          }}
          onMouseLeave={() => {
            if (!tutorMode) return;
            if (pttActive) pttStop();
          }}
          disabled={!connected || !tutorMode}
          style={{
            flex: 1,
            padding: "14px 16px",
            borderRadius: 16,
            border: "none",
            background: !connected || !tutorMode ? "#bbb" : pttActive ? "#e53935" : "#16a34a",
            color: "#fff",
            fontWeight: 900,
            fontSize: 16,
            cursor: !connected || !tutorMode ? "not-allowed" : "pointer",
          }}
        >
          {!connected ? "Connect first" : !tutorMode ? "Tutor OFF" : pttActive ? "Release to Stop" : "Hold to Talk 🎤"}
        </button>

        <button
          onClick={() => {
            try {
              if (pttActive) pttStop();
            } catch {}
          }}
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid #ddd",
            background: "#fff",
            color: "#111",
            fontWeight: 800,
            minWidth: 90,
          }}
        >
          End
        </button>
      </div>
    </div>
  );
}