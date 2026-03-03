"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase"; // make sure you already have this

export default function ChatPage() {
  const router = useRouter();

  // ---- UI / Auth ----
  const [userName, setUserName] = useState("User");
  const [authChecked, setAuthChecked] = useState(false);

  // ---- Realtime states ----
  const [voice, setVoice] = useState("marin");

  const [pcStatus, setPcStatus] = useState("idle"); // idle | connecting | connected | closed | error
  const [dcStatus, setDcStatus] = useState("closed"); // closed | open
  const [trackYes, setTrackYes] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const [lastEvent, setLastEvent] = useState(null); // show errors/events

  // Timer
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  // ---- Refs ----
  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);

  const audioRef = useRef(null);

  // ---------------------------
  // Auth: get current user
  // ---------------------------
  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;

        const u = data?.user;
        if (!u) {
          // Not logged in -> go login
          router.push("/login");
          return;
        }

        // Try best name
        const name =
          u?.user_metadata?.name ||
          u?.user_metadata?.full_name ||
          u?.email?.split("@")?.[0] ||
          "User";

        if (mounted) {
          setUserName(name);
          setAuthChecked(true);
        }
      } catch (e) {
        // If auth check fails, still push to login
        router.push("/login");
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [router]);

  // ---------------------------
  // Helpers
  // ---------------------------
  const resetTimer = () => setElapsed(0);

  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setElapsed((t) => t + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
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
        try {
          dcRef.current.close();
        } catch {}
        dcRef.current = null;
      }

      if (pcRef.current) {
        try {
          pcRef.current.ontrack = null;
          pcRef.current.onconnectionstatechange = null;
          pcRef.current.oniceconnectionstatechange = null;
          pcRef.current.onicecandidate = null;
          pcRef.current.close();
        } catch {}
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

  // Stop on unmount
  useEffect(() => {
    return () => {
      safeClose();
    };
  }, [safeClose]);

  // ---------------------------
  // Enable Sound (mobile unlock)
  // ---------------------------
  const handleEnableSound = async () => {
    try {
      if (!audioRef.current) return;

      // If remote stream already exists, attach and play
      if (remoteStreamRef.current) {
        audioRef.current.srcObject = remoteStreamRef.current;
      }

      // Must be in user gesture
      await audioRef.current.play();
      setSoundEnabled(true);
    } catch (e) {
      // If play fails, keep it false; user can tap again
      setSoundEnabled(false);
    }
  };

  // ---------------------------
  // Start Voice (connect)
  // ---------------------------
  const handleStart = async () => {
    try {
      setLastEvent(null);
      resetTimer();

      setPcStatus("connecting");

      // 1) Get ephemeral client secret from your API
      const r = await fetch("/api/realtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voice,
          instructions:
            `You are Amin Sir AI Voice Tutor. Speak mostly English and use simple Hindi only when needed (80% English, 20% Hindi).
Keep replies short. Ask the student to speak 70-80% of the time. Correct gently and continue.`
        }),
      });

      const data = await r.json();
      if (!r.ok) {
        setPcStatus("error");
        setLastEvent(data);
        return;
      }

      const clientSecret =
        data?.client_secret?.value || data?.client_secret || null;

      if (!clientSecret) {
        setPcStatus("error");
        setLastEvent({
          type: "error",
          message: "No client_secret received from /api/realtime",
          data,
        });
        return;
      }

      // 2) Create PeerConnection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      pcRef.current = pc;

      pc.onconnectionstatechange = () => {
        const st = pc.connectionState;
        if (st === "connected") setPcStatus("connected");
        if (st === "failed" || st === "disconnected") setPcStatus("error");
        if (st === "closed") setPcStatus("closed");
      };

      // 3) Local microphone
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      localStreamRef.current = localStream;

      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });

      // 4) Remote audio track
      const remoteStream = new MediaStream();
      remoteStreamRef.current = remoteStream;

      pc.ontrack = (event) => {
        setTrackYes(true);
        event.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
        // Attach for playback
        if (audioRef.current) {
          audioRef.current.srcObject = remoteStream;
        }
      };

      // 5) Data channel
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.onopen = () => {
        setDcStatus("open");
        startTimer();

        // ✅ IMPORTANT: DO NOT send response.modalities anywhere
        // First, set session instructions (optional but recommended)
        const sessionUpdate = {
          type: "session.update",
          session: {
            // Keep these minimal; server already has instructions/voice
            // You can add things later like temperature, etc.
          },
        };
        dc.send(JSON.stringify(sessionUpdate));

        // Trigger assistant response (audio)
        const kick = {
          type: "response.create",
          response: {
            // ✅ no modalities here
            instructions:
              `Greet the student by name if available. Ask a simple question to start speaking practice.`,
          },
        };
        dc.send(JSON.stringify(kick));
      };

      dc.onclose = () => setDcStatus("closed");

      dc.onmessage = (msg) => {
        try {
          const obj = JSON.parse(msg.data);
          // show errors and important events
          if (obj?.type === "error" || obj?.error) {
            setLastEvent(obj);
          }
          // You can also inspect events here if you want
          // setLastEvent(obj);
        } catch {
          // ignore
        }
      };

      // 6) Create offer/answer with OpenAI Realtime (WebRTC)
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send SDP offer to OpenAI Realtime endpoint
      // NOTE: This endpoint expects SDP as raw text with content-type application/sdp
      const sdpResp = await fetch(
        "https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${clientSecret}`,
            "Content-Type": "application/sdp",
          },
          body: offer.sdp,
        }
      );

      const answerSdp = await sdpResp.text();
      if (!sdpResp.ok) {
        setPcStatus("error");
        setLastEvent({
          type: "error",
          message: "Failed to exchange SDP with OpenAI",
          status: sdpResp.status,
          details: answerSdp,
        });
        return;
      }

      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

      // If user already tapped enable sound, try to play now
      if (soundEnabled && audioRef.current) {
        try {
          await audioRef.current.play();
        } catch {}
      }
    } catch (e) {
      setPcStatus("error");
      setLastEvent({
        type: "error",
        message: String(e?.message || e),
      });
    }
  };

  // ---------------------------
  // Stop button
  // ---------------------------
  const handleStop = async () => {
    await safeClose();
  };

  // ---------------------------
  // Logout
  // ---------------------------
  const handleLogout = async () => {
    await safeClose();
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (!authChecked) {
    return (
      <div style={{ padding: 24, fontFamily: "system-ui" }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Amin Sir AI Tutor</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <b>User: {userName}</b>
          <button
            onClick={handleLogout}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid #ddd",
              cursor: "pointer",
              fontWeight: 700,
              background: "white",
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ marginTop: 14, fontSize: 18, fontWeight: 800 }}>
        Status: PC:{" "}
        <span style={{ fontWeight: 900 }}>
          {pcStatus === "connected" ? "connected" : pcStatus}
        </span>
      </div>

      <div style={{ marginTop: 14, fontSize: 20, fontWeight: 900 }}>
        Step: Connected. Now tap Enable Sound 🔊 (important on mobile)
      </div>

      <div style={{ marginTop: 10, fontSize: 18, fontWeight: 800 }}>
        DC: {dcStatus === "open" ? "Open ✅" : "Closed"}{" "}
        {" | "} Track: {trackYes ? "Yes ✅" : "No"}{" "}
        {" | "} Sound: {soundEnabled ? "Enabled ✅" : "Locked"}{" "}
        {" | "} Voice: {voice}
      </div>

      <div style={{ marginTop: 18, display: "flex", gap: 14, flexWrap: "wrap" }}>
        <button
          onClick={handleStart}
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
          onClick={handleEnableSound}
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
          onClick={handleStop}
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

      {/* Error / Event box */}
      <div
        style={{
          marginTop: 20,
          padding: 18,
          borderRadius: 16,
          border: "1px solid #f3c4c4",
          background: "#fdecec",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          whiteSpace: "pre-wrap",
          minHeight: 160,
        }}
      >
        {lastEvent ? JSON.stringify(lastEvent, null, 2) : "No error."}
      </div>

      {/* Audio + timer */}
      <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 14 }}>
        <audio ref={audioRef} controls />
        <div style={{ fontWeight: 900, fontSize: 18 }}>{formatTime(elapsed)}</div>
      </div>
    </div>
  );
}