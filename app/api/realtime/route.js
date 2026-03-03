// app/api/realtime/route.js
import { NextResponse } from "next/server";

export const runtime = "nodejs"; // keep node runtime for reliability

export async function POST(req) {
  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY in environment variables" },
        { status: 500 }
      );
    }

    // Optional: allow client to send voice/level/instructions
    let bodyIn = {};
    try {
      bodyIn = await req.json();
    } catch {
      bodyIn = {};
    }

    const voice = bodyIn.voice || "marin"; // marin, cedar, etc.
    const instructions =
      bodyIn.instructions ||
      `You are "Amin Sir AI Voice Tutor". Speak mostly English, and use simple Hindi only when needed (80% English, 20% Hindi).
Be friendly, short, and practical. Ask the student to speak more. Correct gently and move forward quickly.`;

    // ✅ Correct Realtime API: create ephemeral client secret
    // IMPORTANT: do NOT send response.modalities (it causes your exact error)
    const sessionConfig = {
      type: "realtime",
      // model can also be set here if your project uses it; keep default stable:
      // model: bodyIn.model || "gpt-4o-realtime-preview",
      instructions,

      audio: {
        // Input settings are optional; output voice is the key part
        output: {
          voice,
          // format: "pcm16", // optional
          // speed: 1.0, // optional
        },
        // input: { format: "pcm16" }, // optional
      },

      // Optional turn detection (you can adjust later)
      turn_detection: {
        type: "server_vad",
        create_response: true,
        interrupt_response: true,
        silence_duration_ms: 600,
        prefix_padding_ms: 300,
        threshold: 0.5,
      },

      // Optional token control
      max_output_tokens: "inf",
    };

    const r = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sessionConfig),
    });

    const data = await r.json();

    if (!r.ok) {
      return NextResponse.json(
        {
          error: "OpenAI Realtime client_secrets request failed",
          status: r.status,
          details: data,
        },
        { status: r.status }
      );
    }

    // Return the full response (includes client_secret.value)
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Server error in /api/realtime",
        details: String(err?.message || err),
      },
      { status: 500 }
    );
  }
}