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
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open") return;
    dc.send(JSON.stringify(obj));
  }

  async function getEphemeralKey() {
    setStep("Fetching key…");
    const r = await fetch("/api/realtime", { method: "POST" });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data?.error?.message || JSON.stringify(data, null, 2));
    if (!data?.value) throw new Error("Ephemeral key missing");
    return data.value;
  }

  async function ensureMic(pc) {
    setStep("Requesting microphone…");

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    localStreamRef.current = stream;

    const track = stream.getAudioTracks()[0];
    if (!track) throw new Error("No microphone detected");

    pc.addTrack(track, stream);
    track.enabled = false;
  }

  async function connectRealtime() {
    setError("");
    setStatus("Connecting…");

    try {
      await unlockAudio();

      const key = await getEphemeralKey();

      setStep("Creating peer…");
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      pcRef.current = pc;

      pc.ontrack = async (e) => {
        setGotRemoteTrack(true);
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = e.streams[0];
          await unlockAudio();
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          setConnected(true);
          setStatus("Connected ✅");
        }
      };

      pc.addTransceiver("audio", { direction: "sendrecv" });

      await ensureMic(pc);

      setStep("Opening channel…");
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.onopen = () => {
        setDcOpen(true);

        // Configure tutor
        sendJSON({
          type: "session.update",
          session: {
            instructions:
              "You are Amin Sir, a friendly Indian English speaking teacher for school students. Speak slowly, short sentences, ask one question at a time, and encourage after answers.",
            modalities: ["audio", "text"],
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

        sendJSON({
          type: "response.create",
          response: { modalities: ["audio"] },
        });
      };

      setStep("Creating offer…");
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      setStep("Sending to OpenAI…");
      const sdpResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/sdp",
          Accept: "application/sdp",
        },
        body: offer.sdp,
      });

      const answer = await sdpResponse.text();
      if (!answer.startsWith("v=")) throw new Error(answer);

      setStep("Finishing…");
      await pc.setRemoteDescription({ type: "answer", sdp: answer });

    } catch (e) {
      setStatus("Error");
      setErr(e);
    }
  }

  async function pttStart() {
    const track = localStreamRef.current?.getAudioTracks?.()[0];
    if (track) track.enabled = true;
  }

  function pttStop() {
    const track = localStreamRef.current?.getAudioTracks?.()[0];
    if (track) track.enabled = false;

    sendJSON({ type: "response.create" });
  }

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: 16, paddingBottom: 120 }}>
      <h2>Amin Sir AI Tutor</h2>

      <div style={{ fontWeight: 700 }}>Status: {status} | Step: {step}</div>
      <div style={{ fontWeight: 700 }}>
        DC: {dcOpen ? "Open ✅" : "Not open"} | Track: {gotRemoteTrack ? "Yes ✅" : "No"}
      </div>

      <button onClick={connectRealtime} style={{ marginTop: 10, padding: 10 }}>
        Start Voice 🎤
      </button>

      <button onClick={unlockAudio} style={{ marginTop: 10, padding: 10 }}>
        Enable Sound 🔊
      </button>

      {error && <pre style={{ color: "red" }}>{error}</pre>}

      <audio ref={remoteAudioRef} autoPlay playsInline controls style={{ width: "100%", marginTop: 12 }} />

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0 }}>
        <button
          onTouchStart={pttStart}
          onTouchEnd={pttStop}
          style={{
            width: "100%",
            padding: 18,
            background: "#16a34a",
            color: "#fff",
            fontWeight: "bold",
            fontSize: 18,
          }}
        >
          Hold to Talk 🎤
        </button>
      </div>
    </div>
  );
}