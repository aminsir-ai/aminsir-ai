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
  const [micOn, setMicOn] = useState(false);

  function setErr(e) {
    const msg = typeof e === "string" ? e : e?.message || JSON.stringify(e, null, 2);
    console.error(e);
    setError(msg);
  }

  // Non-blocking audio unlock (never await in start)
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

    // ✅ Hands-free: mic ON
    track.enabled = true;
    setMicOn(true);
  }

  async function startVoice() {
    setError("");
    setStatus("Connecting…");
    setStep("Starting…");
    setDcOpen(false);
    setGotRemoteTrack(false);
    setConnected(false);

    try {
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

        // ✅ Hands-free tutor session + scoring feedback
        sendJSON({
          type: "session.update",
          session: {
            modalities: ["audio", "text"],
            voice: "alloy",
            audio: { output: { voice: "alloy", format: "pcm16" } },
            turn_detection: { type: "server_vad" },
            instructions: `
You are Amin Sir, a friendly spoken-English teacher for Indian school students (age 10–15).

Your job is to improve the student's speaking.

Conversation rules:
• Speak slowly and clearly.
• Use very simple English.
• One question at a time.
• Always keep the conversation going.
• Ask daily life questions (school, friends, hobbies, food, games).

Teacher behavior:
• After each student reply, respond naturally and ask the next question.
• Encourage the student: "Good!", "Nice try!", "Very good!", "Try again".

Scoring system:
Every 3–4 student replies, briefly evaluate the student and speak feedback:

You must give:
1) Speaking score out of 10
2) One grammar correction (if needed)
3) One improvement tip

Example:
"Good job! Your speaking score is 7 out of 10 today.
You forgot 'am' in one sentence.
Say: I am playing cricket.
Keep practicing!"

Important:
• Do NOT stop the conversation.
• Feedback must be short (max 2–3 sentences).
• Always continue asking the next question after feedback.

Always respond in AUDIO.
            `.trim(),
          },
        });

        // Small delay helps mobile
        await new Promise((r) => setTimeout(r, 200));

        // ✅ Auto greeting
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

        // ✅ Force audio response now
        sendJSON({
          type: "response.create",
          response: { modalities: ["audio"], max_output_tokens: 140 },
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
      // Stop mic tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch {}
        });
        localStreamRef.current = null;
      }

      // Close DC
      if (dcRef.current) {
        try {
          dcRef.current.close();
        } catch {}
        dcRef.current = null;
      }

      // Close PC
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
    setMicOn(false);

    setStatus("Closed");
    setStep("—");
    setError("");
  }

  useEffect(() => {
    return () => stopAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: 16, paddingBottom: 40 }}>
      <h2 style={{ margin: "8px 0 8px" }}>Amin Sir AI Tutor (Hands-Free)</h2>

      <div style={{ fontWeight: 800, marginBottom: 6 }}>Status: {status}</div>
      <div style={{ fontWeight: 800, marginBottom: 6 }}>Step: {step}</div>
      <div style={{ fontWeight: 800, marginBottom: 12 }}>
        DC: {dcOpen ? "Open ✅" : "Not open"} | Track: {gotRemoteTrack ? "Yes ✅" : "No"} | Sound:{" "}
        {soundEnabled ? "Enabled ✅" : "Locked"} | Mic: {micOn ? "On ✅" : "Off"}
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
    </div>
  );
}