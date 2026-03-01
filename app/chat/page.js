"use client";

import { useEffect, useRef, useState } from "react";

export default function ChatPage() {
  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);

  const [status, setStatus] = useState("Idle");
  const [step, setStep] = useState("—");
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

  async function unlockAudio() {
    const el = remoteAudioRef.current;
    if (!el) return false;
    try {
      el.muted = false;
      el.volume = 1;
      const p = el.play?.();
      if (p && typeof p.then === "function") await p;
      setAudioUnlocked(true);
      return true;
    } catch {
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

  async function testPostRealtime() {
    setError("");
    setStep("Testing POST /api/realtime …");
    try {
      const r = await fetch("/api/realtime", { method: "POST" });
      const text = await r.text();
      setStep(`POST done (status ${r.status})`);

      // Try show JSON nicely
      try {
        const j = JSON.parse(text);
        if (!r.ok) throw new Error(JSON.stringify(j, null, 2));
        if (!j?.value) throw new Error("No value in response:\n" + JSON.stringify(j, null, 2));
        setStep("POST works ✅ (ephemeral key received)");
      } catch (e) {
        // If not JSON
        if (!r.ok) throw new Error(text);
        setStep("POST works ✅");
      }
    } catch (e) {
      setErr(e);
    }
  }

  async function getEphemeralKey() {
    setStep("Fetching ephemeral key (POST /api/realtime) …");
    const r = await fetch("/api/realtime", { method: "POST" });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data?.error?.message || JSON.stringify(data, null, 2));
    if (!data?.value) throw new Error("Ephemeral key missing from /api/realtime");
    return data.value;
  }

  async function ensureMicTrack(pc) {
    setStep("Requesting microphone permission…");

    if (!localStreamRef.current) {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      localStreamRef.current = stream;
    }

    setStep("Adding microphone track…");
    const stream = localStreamRef.current;
    const track = stream.getAudioTracks()[0];
    if (!track) throw new Error("No audio track from mic");

    const senders = pc.getSenders?.() || [];
    const already = senders.some((s) => s?.track && s.track.kind === "audio");
    if (!already) pc.addTrack(track, stream);

    // default off until PTT
    track.enabled = false;
  }

  async function connectRealtime() {
    setError("");
    setStatus("Connecting…");
    setStep("Starting…");
    setDcOpen(false);
    setGotRemoteTrack(false);

    try {
      await unlockAudio();

      const EPHEMERAL_KEY = await getEphemeralKey();

      setStep("Creating RTCPeerConnection…");
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
        setGotRemoteTrack(true);
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = e.streams[0];
          await unlockAudio();
        }
      };

      setStep("Adding audio transceiver…");
      pc.addTransceiver("audio", { direction: "sendrecv" });

      await ensureMicTrack(pc);

      setStep("Creating DataChannel…");
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.onopen = () => {
        setDcOpen(true);

        // session config
        sendJSON({
          type: "session.update",
          session: {
            turn_detection: { type: "server_vad" },
            input_audio_transcription: { model: "gpt-4o-mini-transcribe" },
            voice: "alloy",
            audio: { output: { voice: "alloy", format: "pcm16" } },
            instructions: `
You are Amin Sir, a friendly Indian English teacher for school students.
Speak slow and clear English. Short sentences. One question at a time.
Encourage after every reply. Wait for student reply. Do not speak long paragraphs.
            `.trim(),
            modalities: ["text", "audio"],
          },
        });

        // greeting
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

        sendJSON({
          type: "response.create",
          response: { modalities: ["audio"], max_output_tokens: 80 },
        });
      };

      setStep("Creating offer…");
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdp = offer?.sdp || "";
      if (!sdp.trim().startsWith("v=")) throw new Error("Offer SDP invalid/empty");

      setStep("Sending SDP to OpenAI…");
      const sdpResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp",
          Accept: "application/sdp",
        },
        body: sdp,
      });

      const answerSdp = await sdpResponse.text().catch(() => "");
      if (!sdpResponse.ok) throw new Error(answerSdp || `SDP exchange failed (${sdpResponse.status})`);
      if (!answerSdp.trim().startsWith("v=")) throw new Error("Invalid answer SDP:\n" + answerSdp.slice(0, 300));

      setStep("Applying remote description…");
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

      setStep("Done ✅");
      setConnected(true);
      setStatus("Connected ✅");
    } catch (e) {
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
      setStep("—");
    } catch {}
  }

  async function pttStart() {
    if (!connected) return;
    setPttActive(true);
    setError("");
    await unlockAudio();

    const track = localStreamRef.current?.getAudioTracks?.()?.[0];
    if (track) track.enabled = true;
  }

  function pttStop() {
    setPttActive(false);
    const track = localStreamRef.current?.getAudioTracks?.()?.[0];
    if (track) track.enabled = false;

    sendJSON({ type: "response.create", response: { max_output_tokens: 120 } });
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
      <h2 style={{ margin: "8px 0 10px" }}>Amin Sir AI Tutor</h2>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div
          style={{
            padding: "8px 12px",
            borderRadius: 12,
            border: "1px solid #eee",
            background: connected ? "#ecfdf5" : "#fff7ed",
            fontWeight: 900,
          }}
        >
          Status: {status}
        </div>

        <div style={{ fontWeight: 800 }}>Step: {step}</div>

        <div style={{ fontWeight: 800 }}>
          DC: {dcOpen ? "Open ✅" : "Not open"} | Track: {gotRemoteTrack ? "Yes ✅" : "No"} | Sound:{" "}
          {audioUnlocked ? "Enabled ✅" : "Locked"}
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
              fontWeight: 900,
            }}
          >
            Stop
          </button>
        )}

        <button
          onClick={unlockAudio}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #ddd",
            background: audioUnlocked ? "#ecfdf5" : "#fff",
            fontWeight: 900,
          }}
        >
          {audioUnlocked ? "Sound Enabled ✅" : "Enable Sound 🔊"}
        </button>

        <button
          onClick={testPostRealtime}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #ddd",
            background: "#fff",
            fontWeight: 900,
          }}
        >
          Test API (POST)
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
            whiteSpace: "pre-wrap",
          }}
        >
          {error}
        </pre>
      ) : null}

      <audio ref={remoteAudioRef} autoPlay playsInline controls style={{ width: "100%", marginTop: 12 }} />

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
          }}
        >
          {!connected ? "Connect first" : pttActive ? "Release to Stop" : "Hold to Talk 🎤"}
        </button>
      </div>
    </div>
  );
}