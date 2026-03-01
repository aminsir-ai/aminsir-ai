"use client";

import { useRef, useState, useEffect } from "react";

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

  function setErr(e) {
    const msg = typeof e === "string" ? e : e?.message || JSON.stringify(e, null, 2);
    console.error(e);
    setError(msg);
  }

  async function enableSound() {
    setError("");
    try {
      const el = remoteAudioRef.current;
      if (!el) return;
      el.muted = false;
      el.volume = 1;
      const p = el.play?.();
      if (p && typeof p.then === "function") await p;
      setSoundEnabled(true);
    } catch (e) {
      setSoundEnabled(false);
      setErr("Sound is blocked. Tap Enable Sound again, or increase phone volume.");
    }
  }

  function sendJSON(obj) {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open") return;
    dc.send(JSON.stringify(obj));
  }

  async function getEphemeralKey() {
    setStep("POST /api/realtime …");
    const r = await fetch("/api/realtime", { method: "POST" });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data?.error?.message || JSON.stringify(data, null, 2));
    if (!data?.value) throw new Error("Ephemeral key missing from response");
    return data.value;
  }

  async function testPost() {
    setError("");
    setStatus("Testing…");
    try {
      const r = await fetch("/api/realtime", { method: "POST" });
      const text = await r.text();
      setStatus(`POST status ${r.status}`);
      if (!r.ok) throw new Error(text);
      setStep("POST works ✅");
    } catch (e) {
      setErr(e);
    }
  }

  async function ensureMicTrack(pc) {
    setStep("Requesting microphone permission…");

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });

    localStreamRef.current = stream;
    const track = stream.getAudioTracks()[0];
    if (!track) throw new Error("No microphone track");

    // Add only once
    const already = pc.getSenders().some((s) => s.track && s.track.kind === "audio");
    if (!already) pc.addTrack(track, stream);

    // default off until Hold-to-Talk
    track.enabled = false;
  }

  async function startVoice() {
    setError("");
    setStatus("Connecting…");
    setStep("Starting…");
    setDcOpen(false);
    setGotRemoteTrack(false);

    try {
      // unlock audio if possible
      await enableSound();

      const key = await getEphemeralKey();

      setStep("Creating RTCPeerConnection…");
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      pcRef.current = pc;

      pc.onconnectionstatechange = () => {
        setStatus(`PC: ${pc.connectionState}`);
      };

      pc.ontrack = async (e) => {
        setGotRemoteTrack(true);
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = e.streams[0];
          await enableSound();
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

        // Session config
        sendJSON({
          type: "session.update",
          session: {
            modalities: ["audio", "text"],
            instructions:
              "You are Amin Sir, a friendly Indian English teacher for school students. Speak slowly, short sentences, ask one question at a time, and encourage after answers.",
          },
        });

        // Greeting
        sendJSON({
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "user",
            content: [
              {
                type: "input_text",
                text:
                  'Say exactly: "Hello beta! I am Amin Sir, your English speaking teacher. What is your name?"',
              },
            ],
          },
        });

        sendJSON({ type: "response.create", response: { modalities: ["audio"], max_output_tokens: 120 } });
      };

      setStep("Creating offer…");
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdp = offer?.sdp || "";
      if (!sdp.trim().startsWith("v=")) throw new Error("Offer SDP is empty/invalid");

      setStep("Sending offer to OpenAI…");
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
    } catch (e) {
      setStatus("Error");
      setErr(e);
    }
  }

  function holdStart() {
    const track = localStreamRef.current?.getAudioTracks?.()?.[0];
    if (track) track.enabled = true;
  }

  function holdStop() {
    const track = localStreamRef.current?.getAudioTracks?.()?.[0];
    if (track) track.enabled = false;
    sendJSON({ type: "response.create", response: { max_output_tokens: 160 } });
  }

  function stopAll() {
    try {
      dcRef.current?.close?.();
    } catch {}
    try {
      pcRef.current?.close?.();
    } catch {}
    try {
      localStreamRef.current?.getTracks?.()?.forEach((t) => t.stop());
    } catch {}
    dcRef.current = null;
    pcRef.current = null;
    localStreamRef.current = null;

    setStatus("Closed");
    setStep("—");
    setDcOpen(false);
    setGotRemoteTrack(false);
  }

  useEffect(() => {
    return () => stopAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: 16, paddingBottom: 110 }}>
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
          style={{ padding: "10px 14px", borderRadius: 12, border: "none", background: "#111", color: "#fff", fontWeight: 900 }}
        >
          Start Voice 🎤
        </button>

        <button
          onClick={enableSound}
          style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid #ddd", background: "#fff", fontWeight: 900 }}
        >
          Enable Sound 🔊
        </button>

        <button
          onClick={testPost}
          style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid #ddd", background: "#fff", fontWeight: 900 }}
        >
          Test API (POST)
        </button>

        <button
          onClick={stopAll}
          style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid #ddd", background: "#fff", fontWeight: 900 }}
        >
          Stop
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
          style={{
            flex: 1,
            padding: "14px 16px",
            borderRadius: 16,
            border: "none",
            background: "#16a34a",
            color: "#fff",
            fontWeight: 900,
            fontSize: 16,
          }}
        >
          Hold to Talk 🎤
        </button>
      </div>
    </div>
  );
}