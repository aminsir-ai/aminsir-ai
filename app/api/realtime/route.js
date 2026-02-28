import { NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/* ---------------- TOKEN ---------------- */

export async function POST() {
  try {
    const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview",
        voice: "alloy",
      }),
    });

    const data = await r.json();

    if (!r.ok) {
      return NextResponse.json(
        { error: "OpenAI session failed", details: data },
        { status: 500 }
      );
    }

    return NextResponse.json({ value: data.client_secret.value });
  } catch (e) {
    return NextResponse.json(
      { error: "Server error", details: String(e) },
      { status: 500 }
    );
  }
}

/* ---------------- SDP EXCHANGE ---------------- */

export async function PUT(req) {
  try {
    const { sdp, token } = await req.json();

    const r = await fetch("https://api.openai.com/v1/realtime", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/sdp",
      },
      body: sdp,
    });

    const answer = await r.text();

    if (!r.ok) {
      return NextResponse.json(
        { error: "SDP exchange failed", details: answer },
        { status: 500 }
      );
    }

    return NextResponse.json({ sdp: answer });
  } catch (e) {
    return NextResponse.json(
      { error: "Server error", details: String(e) },
      { status: 500 }
    );
  }
}