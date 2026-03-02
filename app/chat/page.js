"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/** ---------------- Auth ---------------- */
const AUTH_KEY = "aminsir_auth_v1";
function getAuthUser() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const u = (parsed?.user || "").trim();
    return u || null;
  } catch {
    return null;
  }
}

/** ---------------- Voice ---------------- */
// IMPORTANT: use a supported voice (from your list)
const VOICE = "marin"; // or "cedar"

export default function ChatPage() {
  const router = useRouter();

  /** user */
  const [user, setUser] = useState(null);

  useEffect(() => {
    const u = getAuthUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    setUser(u);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function logout() {
    try {
      localStorage.removeItem(AUTH_KEY);
    } catch {}
    router.replace("/login");
  }

  /** ---------------- Realtime refs ---------------- */
  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const remoteStreamRef = useRef(null);

  // mobile unlock fallback
  const audioCtxRef = useRef(null);
  const audioSrcRef = useRef(null);

  /** ---------------- UI ---------------- */
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

  async function getEphemeralKey() {
    setStep("Fetching key…");
    const r = await fetch("/api/realtime", { method: "POST" });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data?.error?.message || JSON.stringify(data, null, 2));
    if (!data?.value) throw new Error("Ephemeral key missing from response");
    return data.value;
  }

  function sendJSON(obj) {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open") return;
    dc.send(JSON.stringify(obj));
  }

  /** ---------------- Enable Sound (mobile unlock) ---------------- */
  async function enableSoundStrong() {
    setError("");
    try {
      // 1) unlock <audio> play
      const el = remoteAudioRef.current;
      if (el) {
        el.muted = false;
        el.volume = 1;
        el.playsInline = true;
        const p = el.play?.();
        if (p && typeof p.then === "function") await p;
      }

      // 2) unlock AudioContext (best for mobile)
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        if (!audioCtxRef.current) audioCtxRef.current = new AC();
        if (audioCtxRef.current.state === "suspended") await audioCtxRef.current.resume();

        if (remoteStreamRef.current) {
          try {
            if (audioSrcRef.current) audioSrcRef.current.disconnect();
          } catch {}
          try {
            audioSrcRef.current = audioCtxRef.current.createMediaStreamSource(remoteStreamRef.current);
            audioSrcRef.current.connect(audioCtxRef.current.destination);
          } catch {}
        }
      }

      setSoundEnabled(true);
      setStep("Sound enabled ✅");
    } catch (e) {
      setSoundEnabled(false);
      setErr(e);
    }
  }

  /** ---------------- Start Voice ---------------- */
  async function startVoice() {
    if (!user) return;

    setError("");
    setStatus("Connecting…");
    setStep("Starting…");
    setDcOpen(false);
    setGotRemoteTrack(false);
    setSoundEnabled(false);

    try {
      const key = await getEphemeralKey();

      setStep("Creating peer…");
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      pcRef.current = pc;

      pc.onconnectionstatechange = () => {
        setStatus(`PC: ${pc.connectionState}`);
      };

      pc.ontrack = async (e) => {
        setGotRemoteTrack(true);
        const stream = e.streams?.[0];
        if (stream) remoteStreamRef.current = stream;

        const el = remoteAudioRef.current;
        if (el && stream) {
          el.srcObject = stream;
          el.muted = false;
          el.volume = 1;
          try {
            await el.play();
          } catch {}
        }

        // If user already enabled sound, also connect AudioContext
        if (soundEnabled) {
          try {
            await enableSoundStrong();
          } catch {}
        }
      };

      // Ensure we can receive audio
      pc.addTransceiver("audio", { direction: "sendrecv" });

      setStep("Requesting microphone…");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      setStep("Creating DataChannel…");
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.onopen = () => {
        setDcOpen(true);

        // Keep session.update minimal & safe (no session.voice!)
        sendJSON({
          type: "session.update",
          session: {
            modalities: ["audio", "text"],
            instructions: `You are Amin Sir, a friendly spoken-English teacher.
Speak at normal teacher speed (not fast).
Use 80% English + 20% simple Hindi.
Ask 1 question then WAIT for student answer.`,
          },
        });

        // Force first audio output immediately
        sendJSON({
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "user",
            content: [
              {
                type: "input_text",
                text: `In AUDIO: Say "Hello ${user}! I am Amin Sir." then ask: "Tell me one sentence about your day."`,
              },
            ],
          },
        });

        // Some builds accept voice here; if it errors, remove voice line later
        sendJSON({
          type: "response.create",
          response: { modalities: ["audio"], voice: VOICE },
        });

        setStep("Connected. Now tap Enable Sound 🔊 (important on mobile)");
      };

      dc.onmessage = (ev) => {
        // show server errors if any
        try {
          const msg = JSON.parse(ev.data);
          if (msg?.type?.includes("error") || msg?.error) {
            setError(JSON.stringify(msg, null, 2));
          }
        } catch {}
      };

      setStep("Creating offer…");
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      setStep("Sending SDP…");
      const sdpResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/sdp",
          Accept: "application/sdp",
        },
        body: offer.sdp,
      });

      const answer = await sdpResponse.text().catch(() => "");
      if (!sdpResponse.ok) throw new Error(answer || `SDP exchange failed (${sdpResponse.status})`);

      setStep("Applying answer…");
      await pc.setRemoteDescription({ type: "answer", sdp: answer });

      setStatus("Connected ✅");
    } catch (e) {
      setStatus("Error");
      setErr(e);
    }
  }

  /** ---------------- Stop ---------------- */
  function stopAll() {
    setStep("Closing…");
    setStatus("Closing…");

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
      if (remoteAudioRef.current) {
        remoteAudioRef.current.pause?.();
        remoteAudioRef.current.srcObject = null;
      }
    } catch {}

    setDcOpen(false);
    setGotRemoteTrack(false);
    setSoundEnabled(false);
    setStatus("Stopped");
    setStep("—");
  }

  useEffect(() => {
    return () => stopAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) return <div style={{ padding: 18, fontFamily: "system-ui, Arial" }}>Loading…</div>;

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: 16, paddingBottom: 50, fontFamily: "system-ui, Arial" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <h2 style={{ margin: "8px 0 8px" }}>Amin Sir AI Tutor</h2>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ fontWeight: 900 }}>User: {user}</div>
          <button onClick={logout} style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #ddd", fontWeight: 900 }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ fontWeight: 800, marginBottom: 6 }}>Status: {status}</div>
      <div style={{ fontWeight: 800, marginBottom: 6 }}>Step: {step}</div>
      <div style={{ fontWeight: 800, marginBottom: 12 }}>
        DC: {dcOpen ? "Open ✅" : "Not open"} | Track: {gotRemoteTrack ? "Yes ✅" : "No"} | Sound:{" "}
        {soundEnabled ? "Enabled ✅" : "Locked"} | Voice: {VOICE}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          onClick={startVoice}
          style={{ padding: "10px 14px", borderRadius: 12, border: "none", background: "#111", color: "#fff", fontWeight: 900 }}
        >
          Start Voice 🎤
        </button>

        <button
          onClick={enableSoundStrong}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #ddd",
            background: soundEnabled ? "#eaffea" : "#fff",
            fontWeight: 900,
          }}
        >
          Enable Sound 🔊 {soundEnabled ? "✅" : ""}
        </button>

        <button
          onClick={stopAll}
          style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid #ddd", background: "#fff", fontWeight: 900 }}
        >
          Stop
        </button>
      </div>

      {error ? (
        <pre style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "#fff1f2", border: "1px solid #fecdd3", color: "#7f1d1d", whiteSpace: "pre-wrap" }}>
          {error}
        </pre>
      ) : null}

      <audio ref={remoteAudioRef} autoPlay playsInline controls style={{ width: "100%", marginTop: 12 }} />
    </div>
  );
}