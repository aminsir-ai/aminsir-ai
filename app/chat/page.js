"use client";

import { useEffect, useRef, useState } from "react";

/* ---------------- AUTH ---------------- */
const AUTH_KEY = "aminsir_auth_v1";

function getUser() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw).user || null;
  } catch {
    return null;
  }
}

/* ---------------- CONFIG ---------------- */
const VOICE = "marin";   // GA supported voice

export default function ChatPage() {

  const [status, setStatus] = useState("Idle");
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);

  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const localStreamRef = useRef(null);

  /* ---------------- FETCH EPHEMERAL KEY ---------------- */
  async function getKey() {
    setStatus("Fetching key...");
    const r = await fetch("/api/realtime", { method: "POST" });
    const j = await r.json();
    if (!j?.value) throw new Error("No ephemeral key");
    return j.value;
  }

  /* ---------------- START VOICE ---------------- */
  async function startVoice() {
    try {
      setError("");
      setStatus("Connecting...");

      const key = await getKey();

      /* Peer Connection */
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      pcRef.current = pc;

      pc.onconnectionstatechange = () => {
        setStatus(pc.connectionState);
        if (pc.connectionState === "connected") {
          setConnected(true);
        }
      };

      /* RECEIVE AUDIO */
      pc.ontrack = (e) => {
        const audio = remoteAudioRef.current;
        audio.srcObject = e.streams[0];
        audio.play().catch(()=>{});
      };

      /* MIC */
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      /* DATA CHANNEL */
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.onopen = () => {

        /* SESSION UPDATE (GA FORMAT) */
        dc.send(JSON.stringify({
          type: "session.update",
          session: {
            modalities: ["audio","text"],
            instructions:
`You are Amin Sir, a friendly English teacher for Indian students.
Speak slowly like a teacher.
Use 80% English and 20% simple Hindi.
Ask one easy question and wait for student answer.`
          }
        }));

        /* GREETING */
        dc.send(JSON.stringify({
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "user",
            content: [{
              type: "input_text",
              text: "Start the class and greet the student."
            }]
          }
        }));

        dc.send(JSON.stringify({
          type: "response.create",
          response: {
            modalities: ["audio"]
          }
        }));
      };

      /* SDP OFFER */
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      setStatus("Sending SDP...");

      const sdpRes = await fetch(
        "https://api.openai.com/v1/realtime/calls",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/sdp",
            Accept: "application/sdp",
          },
          body: offer.sdp,
        }
      );

      const answer = await sdpRes.text();

      await pc.setRemoteDescription({
        type: "answer",
        sdp: answer,
      });

      setStatus("Connected ✅");

    } catch (e) {
      console.error(e);
      setError(e.message);
      setStatus("Error");
    }
  }

  /* ---------------- STOP ---------------- */
  function stopVoice() {
    try {
      pcRef.current?.close();
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      setConnected(false);
      setStatus("Stopped");
    } catch {}
  }

  /* ---------------- UI ---------------- */
  const user = getUser();

  if (!user) return <div style={{padding:20}}>Please login</div>;

  return (
    <div style={{maxWidth:700,margin:"auto",padding:20,fontFamily:"system-ui"}}>
      <h2>Amin Sir AI Tutor</h2>

      <b>Status:</b> {status}

      {error && (
        <pre style={{background:"#ffe5e5",padding:10,borderRadius:8,marginTop:10}}>
          {error}
        </pre>
      )}

      <div style={{marginTop:20}}>
        <button
          onClick={startVoice}
          disabled={connected}
          style={{padding:12,fontWeight:700}}
        >
          Start Voice 🎤
        </button>

        <button
          onClick={stopVoice}
          style={{padding:12,marginLeft:10}}
        >
          Stop
        </button>
      </div>

      <audio ref={remoteAudioRef} autoPlay controls style={{width:"100%",marginTop:20}}/>
    </div>
  );
}