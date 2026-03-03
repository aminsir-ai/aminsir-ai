"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function ChatPage() {
  const router = useRouter();

  const [userName, setUserName] = useState("User");
  const [connected, setConnected] = useState(false);
  const [dcOpen, setDcOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [errorBox, setErrorBox] = useState(null);
  const [timer, setTimer] = useState(0);

  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const audioRef = useRef(null);
  const timerRef = useRef(null);

  // -------------------------
  // AUTH CHECK
  // -------------------------
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        router.push("/login");
      } else {
        setUserName(data.user.email.split("@")[0]);
      }
    };
    checkUser();
  }, [router]);

  // -------------------------
  // TIMER
  // -------------------------
  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimer((t) => t + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimer(0);
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  // -------------------------
  // START VOICE
  // -------------------------
  const startVoice = async () => {
    try {
      setErrorBox(null);

      const tokenRes = await fetch("/api/realtime", { method: "POST" });
      const tokenData = await tokenRes.json();

      if (!tokenRes.ok) {
        setErrorBox(tokenData);
        return;
      }

      const EPHEMERAL_KEY = tokenData.client_secret.value;

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const remoteStream = new MediaStream();
      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) =>
          remoteStream.addTrack(track)
        );
        if (audioRef.current) {
          audioRef.current.srcObject = remoteStream;
        }
      };

      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.onopen = () => {
        setDcOpen(true);
        startTimer();

        // IMPORTANT: No response.modalities here
        dc.send(
          JSON.stringify({
            type: "response.create",
            response: {
              instructions:
                "Greet the student and start English speaking practice.",
            },
          })
        );
      };

      dc.onmessage = (msg) => {
        const parsed = JSON.parse(msg.data);
        if (parsed.type === "error") {
          setErrorBox(parsed);
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const baseUrl = "https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview";

      const sdpResponse = await fetch(baseUrl, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp",
        },
      });

      const answer = {
        type: "answer",
        sdp: await sdpResponse.text(),
      };

      await pc.setRemoteDescription(answer);
      setConnected(true);
    } catch (err) {
      setErrorBox({ error: err.message });
    }
  };

  // -------------------------
  // STOP
  // -------------------------
  const stopVoice = () => {
    if (pcRef.current) pcRef.current.close();
    stopTimer();
    setConnected(false);
    setDcOpen(false);
  };

  const enableSound = async () => {
    try {
      await audioRef.current.play();
      setSoundEnabled(true);
    } catch {}
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h2>Amin Sir AI Tutor</h2>

      <div style={{ marginBottom: 10 }}>
        <strong>User:</strong> {userName}{" "}
        <button onClick={logout}>Logout</button>
      </div>

      <div style={{ marginBottom: 10 }}>
        Status: {connected ? "Connected ✅" : "Disconnected"}
      </div>

      <div style={{ marginBottom: 10 }}>
        DC: {dcOpen ? "Open ✅" : "Closed"} | Sound:{" "}
        {soundEnabled ? "Enabled ✅" : "Locked"}
      </div>

      <button onClick={startVoice}>Start Voice 🎤</button>
      <button onClick={enableSound} style={{ marginLeft: 10 }}>
        Enable Sound 🔊
      </button>
      <button onClick={stopVoice} style={{ marginLeft: 10 }}>
        Stop
      </button>

      <div style={{ marginTop: 15 }}>
        <audio ref={audioRef} controls />
      </div>

      <div style={{ marginTop: 10, fontWeight: "bold" }}>
        {formatTime(timer)}
      </div>

      {errorBox && (
        <pre
          style={{
            marginTop: 20,
            background: "#ffe6e6",
            padding: 15,
            borderRadius: 10,
            whiteSpace: "pre-wrap",
          }}
        >
          {JSON.stringify(errorBox, null, 2)}
        </pre>
      )}
    </div>
  );
}