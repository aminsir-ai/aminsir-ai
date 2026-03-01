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

  const [dcOpen, setDcOpen] = useState(false);
  const [gotRemoteTrack, setGotRemoteTrack] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [connected, setConnected] = useState(false);

  const [pttActive, setPttActive] = useState(false);

  function setErr(e) {
    const msg = typeof e === "string" ? e : e?.message || JSON.stringify(e, null, 2);
    console.error(e);
    setError(msg);
  }

  // Non-blocking (do not await in start)
  function enableSoundNonBlocking() {
    try {
      const el = remoteAudioRef.current;
      if (!el) return;
      el.muted = false;
      el.volume = 1;
      el.playsInline = true;

      const p = el.play?.();
      if (p && typeof p.then === "function") {
        p.then(() => setSoundEnabled(true)).catch(() => setSoundEnabled(false));
      } else {
        setSoundEnabled(true);
      }
    } catch {
      setSoundEnabled(false);
    }
  }

  function sendJSON(obj) {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open") return;
    dc.send(JSON.stringify(obj));
  }

  async function getEphemeralKey() {
    setStep("Fetching key…");
    const r = await fetch("/api/realtime", { method: "POST" });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data?.error?.message || JSON.stringify(data, null, 2));
    if (!data?.value) throw new Error("Ephemeral key missing from response");
    return data.value;
  }

  async function ensureMicTrack(pc) {
    setStep("Requesting microphone…");

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      video: false,
    });

    localStreamRef.current = stream;

    const track = stream.getAudioTracks()[0];
    if (!track) throw new Error("No microphone track");

    const already = pc.getSenders().some((s) => s.track && s.track.kind === "audio");
    if (!already) pc.addTrack(track, stream);

    // default OFF (PTT controls it)
    track.enabled = false;
  }

  async function startVoice() {
    setError("");
    setStatus("Connecting…");
    setStep("Starting…");
    setDcOpen(false);
    setGotRemoteTrack(false);

    try {
      // Do NOT await play() - it can hang on mobile
      enableSoundNonBlocking();

      const key = await getEphemeralKey();

      setStep("Creating peer…");
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      pcRef.current = pc;

      pc.onconnectionstatechange = () => {
        setStatus(`PC: ${pc.connectionState}`);
        setConnected(pc.connectionState === "connected");
      };

      pc.ontrack = (e) => {
        setGotRemoteTrack(true);
        const el = remoteAudioRef.current;
        if (el) {
          el.srcObject = e.streams[0];
          enableSoundNonBlocking();
        }
      };

      setStep("Adding transceiver…");
      pc.addTransceiver("audio", { direction: "sendrecv" });

      await ensureMicTrack(pc);

      setStep("Creating DataChannel…");
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.onopen = async () => {
        setDcOpen(true);

        // Session config + voice output forced
        sendJSON({
          type: "session.update",
          session: {
            modalities: ["audio", "text"],
            voice: "alloy",
            audio: { output: { voice: "alloy", format: "pcm16" } },
            turn_detection: { type: "server_vad" },
            instructions: `
You are Amin Sir, a friendly Indian English teacher for school students.
Speak slowly. Short sentences. One question at a time.
Always reply in AUDIO. Encourage the student.
After every student reply, ask the next question.
            `.trim(),
          },
        });

        // tiny delay helps mobile
        await new Promise((r) => setTimeout(r, 200));

        // Auto greeting
        sendJSON({
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "user",
            content: [
              {
                type: "input_text",
                text:
                  'Say exactly in AUDIO: "Hello beta! I am Amin Sir, your English speaking teacher. What is your name?"',
              },
            ],
          },
        });

        sendJSON({
          type: "response.create",
          response: { modalities: ["audio"], max_output_tokens: 120 },
        });

        enableSoundNonBlocking();
      };

      setStep("Creating offer…");
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdp = offer?.sdp || "";
      if (!sdp.trim().startsWith("v=")) throw new Error("Offer SDP empty/invalid");

      setStep("Sending SDP…");
      const sdpResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/sdp",
          Accept: "application/sdp",
        },
        body: sdp,
      });

      const answer = await sdpResponse.text().catch(() => "");
      if (!sdpResponse.ok) throw new Error(answer || `SDP exchange failed (${sdpResponse.status})`);
      if (!answer.trim().startsWith("v=")) throw new Error("Invalid answer SDP:\n" + answer.slice(0, 400));

      setStep("Applying answer…");
      await pc.setRemoteDescription({ type: "answer", sdp: answer });

      setStep("Connected ✅");
      setStatus("Connected ✅");
      setConnected(true);
    } catch (e) {
      setStatus("Error");
      setErr(e);
    }
  }

  function stopAll() {
    setStep("Stopping…");
    setStatus("Closing…");

    try {
      // Stop mic
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch {}
        });
        localStreamRef.current = null;
      }

      // Close data channel
      if (dcRef.current) {
        try {
          dcRef.current.close();
        } catch {}
        dcRef.current = null;
      }

      // Close peer connection
      if (pcRef.current) {
        try {
          pcRef.current.ontrack = null;
          pcRef.current.onconnectionstatechange = null;
          pcRef.current.close();
        } catch {}
        pcRef.current = null;
      }

      // Clear audio
      if (remoteAudioRef.current) {
        remoteAudioRef.current.pause?.();
        remoteAudioRef.current.srcObject = null;
      }
    } catch {}

    setDcOpen(false);
    setGotRemoteTrack(false);
    setSoundEnabled(false);
    setConnected(false);
    setPttActive(false);

    setStatus("Closed");
    setStep("—");
    setError("");
  }

  function holdStart() {
    if (!connected) return;
    setPttActive(true);
    const track = localStreamRef.current?.getAudioTracks?.()?.[0];
    if (track) track.enabled = true;
  }

  function holdStop() {
    if (!connected) return;
    setPttActive(false);
    const track = localStreamRef.current?.getAudioTracks?.()?.[0];
    if (track) track.enabled = false;

    // Ask for audio reply after student finishes speaking
    sendJSON({ type: "response.create", response: { modalities: ["audio"], max_output_tokens: 180 } });
    enableSoundNonBlocking();
  }

  useEffect(() => {
    return () => stopAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: 16, paddingBottom: 120 }}>
      <h2 style={{ margin: "8px 0 8px" }}>Amin Sir AI Tutor</h2>

      <div style={{ fontWeight: 800, marginBottom: 6 }}>Status: {status}</div>
      <div style={{ fontWeight: 800, marginBottom: 6 }}>Step: {step}</div>
      <div style={{ fontWeight: 800, marginBottom: 12 }}>
        DC: {dcOpen ? "Open ✅" : "Not open"} | Track: {gotRemoteTrack ? "Yes ✅" : "No"} | Sound:{" "}
        {soundEnabled ? "Enabled ✅" : "Locked"}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          onClick={startVoice}
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

        <button
          onClick={enableSoundNonBlocking}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #ddd",
            background: "#fff",
            fontWeight: 900,
          }}
        >
          Enable Sound 🔊
        </button>

        <button
          onClick={stopAll}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #ddd",
            background: "#fff",
            fontWeight: 900,
          }}
        >
          Stop ⛔
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

      {/* Mobile Hold to Talk */}
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
            holdStart();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            holdStop();
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            holdStart();
          }}
          onMouseUp={(e) => {
            e.preventDefault();
            holdStop();
          }}
          onMouseLeave={() => {
            if (pttActive) holdStop();
          }}
          style={{
            flex: 1,
            padding: "14px 16px",
            borderRadius: 16,
            border: "none",
            background: pttActive ? "#e53935" : "#16a34a",
            color: "#fff",
            fontWeight: 900,
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          {connected ? (pttActive ? "Release to Stop" : "Hold to Talk 🎤") : "Connect first"}
        </button>
      </div>
    </div>
  );
}