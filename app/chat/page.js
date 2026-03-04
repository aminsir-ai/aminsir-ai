"use client";

import { useRef, useState } from "react";

export default function ChatPage() {
  // Text chat
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");

  // Voice
  const [voiceStatus, setVoiceStatus] = useState("Idle");
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);

  async function sendMessage() {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      setResponse(data.reply || "No response");
    } catch (err) {
      console.error(err);
      setResponse("Error calling /api/chat");
    }
  }

  async function startVoice() {
    try {
      setVoiceStatus("Requesting microphone permission...");

      // 1) mic stream
      const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = localStream;

      setVoiceStatus("Creating WebRTC connection...");

      // 2) create PeerConnection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Send mic track to peer connection
      for (const track of localStream.getTracks()) {
        pc.addTrack(track, localStream);
      }

      // Receive AI audio
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
          // try to play (browser may require user gesture — but you clicked button, so ok)
          remoteAudioRef.current.play().catch(() => {});
        }
      };

      // 3) Create SDP offer
      setVoiceStatus("Creating SDP offer...");
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      });
      await pc.setLocalDescription(offer);

      // 4) Send offer SDP to your server route (/api/realtime) to get answer SDP
      setVoiceStatus("Contacting Amin Sir voice server...");

      const res = await fetch("/api/realtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sdp: offer.sdp,
          model: "gpt-realtime",
          voice: "alloy",

          // Optional fields your route supports
          studentName: "Student",
          level: "beginner",
          courseWeek: 1,
          syllabusTopic: "",
          hasHomework: false,
          homeworkFirstSentence: "",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        console.error("realtime error:", data);
        setVoiceStatus(`Voice start failed: ${data?.error || res.status}`);
        return;
      }

      // 5) Set remote description (answer SDP from server)
      setVoiceStatus("Applying SDP answer...");
      const answerSdp = data.sdp;

      await pc.setRemoteDescription({
        type: "answer",
        sdp: answerSdp,
      });

      setVoiceStatus("✅ Voice session connected. Say: Hello");
    } catch (err) {
      console.error(err);
      setVoiceStatus(`Voice start failed: ${err?.message || String(err)}`);
    }
  }

  async function stopVoice() {
    try {
      setVoiceStatus("Stopping...");

      if (pcRef.current) {
        pcRef.current.ontrack = null;
        pcRef.current.close();
        pcRef.current = null;
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }

      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = null;
      }

      setVoiceStatus("Idle");
    } catch (e) {
      console.error(e);
      setVoiceStatus("Stopped (with warnings)");
    }
  }

  return (
    <div style={{ padding: 40, fontFamily: "Arial" }}>
      <h1>Amin Sir AI Tutor</h1>

      <div style={{ marginBottom: 20 }}>
        <input
          style={{ padding: 10, width: 360 }}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type something..."
        />
        <button style={{ marginLeft: 10, padding: 10 }} onClick={sendMessage}>
          Send
        </button>
      </div>

      <div style={{ marginBottom: 30 }}>
        <b>AI:</b> {response}
      </div>

      <hr />

      <h2>Voice Tutor</h2>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button style={{ padding: 12, fontSize: 16 }} onClick={startVoice}>
          🎤 Start Voice Session
        </button>
        <button style={{ padding: 12, fontSize: 16 }} onClick={stopVoice}>
          ⛔ Stop
        </button>
      </div>

      <div style={{ marginTop: 10 }}>
        Status: <b>{voiceStatus}</b>
      </div>

      {/* Audio output from AI */}
      <audio ref={remoteAudioRef} autoPlay />
    </div>
  );
}