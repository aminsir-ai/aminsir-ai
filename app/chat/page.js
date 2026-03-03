"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function ChatPage() {
  const router = useRouter();

  const [userName, setUserName] = useState("");
  const [pcStatus, setPcStatus] = useState("idle"); // idle | connecting | connected | error | closed
  const [dcStatus, setDcStatus] = useState("closed"); // open | closed
  const [trackYes, setTrackYes] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const audioRef = useRef(null);
  const timerRef = useRef(null);

  // ✅ Check PIN-login session (localStorage)
  useEffect(() => {
    const raw = localStorage.getItem("aminsir_user");
    if (!raw) {
      router.push("/login");
      return;
    }
    try {
      const u = JSON.parse(raw);
      setUserName(u?.name || "User");
    } catch {
      router.push("/login");
    }
  }, [router]);

  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => setElapsed((t) => t + 1), 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const safeClose = useCallback(async () => {
    try {
      stopTimer();
      setElapsed(0);
      setSoundEnabled(false);
      setTrackYes(false);
      setDcStatus("closed");
      setPcStatus("closed");

      if (dcRef.current) {
        try { dcRef.current.close(); } catch {}
        dcRef.current = null;
      }

      if (pcRef.current) {
        try { pcRef.current.close(); } catch {}
        pcRef.current = null;
      }

      if (localStreamRef.current) {
        try {
          localStreamRef.current.getTracks().forEach((t) => t.stop());
        } catch {}
        localStreamRef.current = null;
      }

      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.srcObject = null;
        } catch {}
      }

      remoteStreamRef.current = null;
    } catch {}
  }, []);

  useEffect(() => {
    return () => safeClose();
  }, [safeClose]);

  const enableSound = async () => {
    try {
      if (audioRef.current) {
        if (remoteStreamRef.current) audioRef.current.srcObject = remoteStreamRef.current;
        await audioRef.current.play();
        setSoundEnabled(true);
      }
    } catch {
      setSoundEnabled(false);
    }
  };

  const startVoice = async () => {
    try {
      setLastEvent(null);
      setPcStatus("connecting");
      setElapsed(0);

      // Get ephemeral key from your server
      const r = await fetch("/api/realtime", { method: "POST" });
      const data = await r.json();

      if (!r.ok) {
        setPcStatus("error");
        setLastEvent(data);
        return;
      }

      const key = data?.client_secret?.value;
      if (!key) {
        setPcStatus("error");
        setLastEvent({ type: "error", message: "No client_secret.value returned", data });
        return;
      }

      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      pcRef.current = pc;

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") setPcStatus("connected");
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") setPcStatus("error");
      };

      // mic
      const localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = localStream;
      localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));

      // remote audio
      const remoteStream = new MediaStream();
      remoteStreamRef.current = remoteStream;

      pc.ontrack = (event) => {
        setTrackYes(true);
        event.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
        if (audioRef.current) audioRef.current.srcObject = remoteStream;
      };

      // data channel
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.onopen = () => {
        setDcStatus("open");
        startTimer();

        // ✅ IMPORTANT: no response.modalities anywhere
        dc.send(JSON.stringify({ type: "session.update", session: {} }));

        dc.send(
          JSON.stringify({
            type: "response.create",
            response: {
              instructions: `Student name is ${userName}. Greet the student and ask a simple English speaking question.`,
            },
          })
        );
      };

      dc.onmessage = (msg) => {
        try {
          const obj = JSON.parse(msg.data);
          if (obj?.type === "error" || obj?.error) setLastEvent(obj);
        } catch {}
      };

      // offer/answer exchange
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpResp = await fetch(
        "https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/sdp",
          },
          body: offer.sdp,
        }
      );

      const answerSdp = await sdpResp.text();
      if (!sdpResp.ok) {
        setPcStatus("error");
        setLastEvent({ type: "error", status: sdpResp.status, details: answerSdp });
        return;
      }

      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

      // If user already enabled sound, try play
      if (soundEnabled && audioRef.current) {
        try { await audioRef.current.play(); } catch {}
      }
    } catch (e) {
      setPcStatus("error");
      setLastEvent({ type: "error", message: String(e?.message || e) });
    }
  };

  const logout = async () => {
    await safeClose();
    localStorage.removeItem("aminsir_user");
    router.push("/login");
  };

  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Amin Sir AI Tutor</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <b>User: {userName || "..."}</b>
          <button
            onClick={logout}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid #ddd",
              cursor: "pointer",
              fontWeight: 800,
              background: "white",
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ marginTop: 14, fontSize: 18, fontWeight: 800 }}>
        Status: PC: {pcStatus === "connected" ? "connected ✅" : pcStatus}
      </div>

      <div style={{ marginTop: 14, fontSize: 20, fontWeight: 900 }}>
        Step: Connected. Now tap Enable Sound 🔊 (important on mobile)
      </div>

      <div style={{ marginTop: 10, fontSize: 18, fontWeight: 800 }}>
        DC: {dcStatus === "open" ? "Open ✅" : "Closed"} | Track: {trackYes ? "Yes ✅" : "No"} | Sound:{" "}
        {soundEnabled ? "Enabled ✅" : "Locked"}
      </div>

      <div style={{ marginTop: 18, display: "flex", gap: 14, flexWrap: "wrap" }}>
        <button
          onClick={startVoice}
          style={{
            padding: "14px 22px",
            borderRadius: 16,
            border: "none",
            cursor: "pointer",
            fontWeight: 900,
            fontSize: 18,
            background: "black",
            color: "white",
          }}
        >
          Start Voice 🎤
        </button>

        <button
          onClick={enableSound}
          style={{
            padding: "14px 22px",
            borderRadius: 16,
            border: "1px solid #b7e4b7",
            cursor: "pointer",
            fontWeight: 900,
            fontSize: 18,
            background: "#eaf7ea",
          }}
        >
          Enable Sound 🔊 {soundEnabled ? "✅" : ""}
        </button>

        <button
          onClick={safeClose}
          style={{
            padding: "14px 22px",
            borderRadius: 16,
            border: "1px solid #ddd",
            cursor: "pointer",
            fontWeight: 900,
            fontSize: 18,
            background: "white",
          }}
        >
          Stop
        </button>
      </div>

      <div
        style={{
          marginTop: 20,
          padding: 18,
          borderRadius: 16,
          border: "1px solid #f3c4c4",
          background: "#fdecec",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          whiteSpace: "pre-wrap",
          minHeight: 140,
        }}
      >
        {lastEvent ? JSON.stringify(lastEvent, null, 2) : "No error."}
      </div>

      <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 14 }}>
        <audio ref={audioRef} controls />
        <div style={{ fontWeight: 900, fontSize: 18 }}>{formatTime(elapsed)}</div>
      </div>
    </div>
  );
}