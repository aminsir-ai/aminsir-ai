"use client";

import { useEffect, useRef, useState } from "react";

export default function ChatPage() {
  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);

  const [hydrated, setHydrated] = useState(false);
  const [tapCount, setTapCount] = useState(0);

  const [status, setStatus] = useState("Idle");
  const [step, setStep] = useState("—");
  const [error, setError] = useState("");

  const [connected, setConnected] = useState(false);
  const [dcOpen, setDcOpen] = useState(false);
  const [gotRemoteTrack, setGotRemoteTrack] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  function bump() {
    setTapCount((c) => c + 1);
  }

  function setErr(e) {
    const msg = typeof e === "string" ? e : e?.message || JSON.stringify(e, null, 2);
    console.error(e);
    setError(msg);
  }

  async function unlockAudio() {
    bump();
    const el = remoteAudioRef.current;
    if (!el) return false;
    try {
      el.muted = false;
      el.volume = 1;
      const p = el.play?.();
      if (p && typeof p.then === "function") await p;
      setAudioUnlocked(true);
      return true;
    } catch (e) {
      setAudioUnlocked(false);
      return false;
    }
  }

  async function testPostRealtime() {
    bump();
    setError("");
    setStep("Testing POST /api/realtime …");
    try {
      const r = await fetch("/api/realtime", { method: "POST" });
      const text = await r.text();
      setStep(`POST done (status ${r.status})`);
      if (!r.ok) throw new Error(text);
      setStep("POST works ✅");
    } catch (e) {
      setErr(e);
    }
  }

  async function connectRealtime() {
    bump();
    setError("");
    setStatus("Connecting…");
    setStep("Starting…");
    try {
      await unlockAudio();
      setStep("If this changes, clicks work ✅");
      // We intentionally stop here for test.
      // After we confirm hydration works, we re-enable full realtime flow.
    } catch (e) {
      setErr(e);
    }
  }

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: 16, paddingBottom: 40 }}>
      <h2 style={{ margin: "8px 0 10px" }}>Amin Sir AI Tutor</h2>

      <div style={{ fontWeight: 900, marginBottom: 8 }}>
        Hydrated: {hydrated ? "YES ✅" : "NO ❌"} | Tap Count: {tapCount}
      </div>

      <div style={{ fontWeight: 800, marginBottom: 8 }}>
        Status: {status} | Step: {step}
      </div>

      <div style={{ fontWeight: 800, marginBottom: 12 }}>
        DC: {dcOpen ? "Open ✅" : "Not open"} | Track: {gotRemoteTrack ? "Yes ✅" : "No"} | Sound:{" "}
        {audioUnlocked ? "Enabled ✅" : "Locked"}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          onClick={connectRealtime}
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
          onClick={unlockAudio}
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
          onClick={testPostRealtime}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #ddd",
            background: "#fff",
            fontWeight: 900,
          }}
        >
          Test API (POST)
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