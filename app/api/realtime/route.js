// app/api/realtime/route.js
import { NextResponse } from "next/server";

export const runtime = "nodejs"; // important for WebRTC relay calls

// ---------- POST: create ephemeral token ----------
export async function POST() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    // Create ephemeral key for browser Realtime session
    const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview",
        // You can add defaults here if you want:
        // voice: "alloy",
      }),
    });

    const data = await r.json().catch(() => null);

    if (!r.ok) {
      return NextResponse.json(
        { error: "Failed to create realtime session", details: data },
        { status: r.status }
      );
    }

    // Most examples return ephemeral client_secret.value
    const value = data?.client_secret?.value;
    if (!value) {
      return NextResponse.json(
        { error: "Token missing in OpenAI response", details: data },
        { status: 500 }
      );
    }

    return NextResponse.json({ value });
  } catch (e) {
    return NextResponse.json(
      { error: "POST /api/realtime crashed", details: String(e?.message || e) },
      { status: 500 }
    );
  }
}

// ---------- PUT: exchange SDP offer -> answer ----------
export async function PUT(req) {
  try {
    const { sdp, token } = await req.json().catch(() => ({}));

    if (!sdp) {
      return NextResponse.json({ error: "Missing sdp" }, { status: 400 });
    }
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    // Exchange SDP with OpenAI Realtime
    const r = await fetch("https://api.openai.com/v1/realtime", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/sdp",
      },
      body: sdp,
    });

    const answerSdp = await r.text();

    if (!r.ok) {
      return NextResponse.json(
        { error: "SDP exchange failed", details: answerSdp },
        { status: r.status }
      );
    }

    return NextResponse.json({ sdp: answerSdp });
  } catch (e) {
    return NextResponse.json(
      { error: "PUT /api/realtime crashed", details: String(e?.message || e) },
      { status: 500 }
    );
  }
}