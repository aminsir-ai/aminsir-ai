// app/api/realtime/route.js
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY in Vercel environment variables" },
        { status: 500 }
      );
    }

    let body = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const voice = body.voice || "marin";
    const instructions =
      body.instructions ||
      `You are Amin Sir AI Voice Tutor. Speak mostly English and use simple Hindi only when needed (80% English, 20% Hindi).
Keep replies short and practical. Ask the student to speak more (student 70-80% talking). Correct gently and continue.`;

    // ✅ GA client_secrets expects { session: {...} }
    const payload = {
      session: {
        type: "realtime",
        model: "gpt-realtime",
        instructions,
        audio: {
          output: { voice },
        },
      },
    };

    const r = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
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

    // ✅ Normalize output so frontend ALWAYS gets client_secret.value
    const clientSecretValue = data?.client_secret?.value || data?.value;
    const expiresAt = data?.client_secret?.expires_at || data?.expires_at;

    if (!clientSecretValue) {
      return NextResponse.json(
        { error: "No client secret returned from OpenAI", raw: data },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        client_secret: { value: clientSecretValue },
        expires_at: expiresAt,
        session: data?.session || null,
      },
      { status: 200 }
    );
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