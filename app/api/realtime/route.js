import { NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

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
        voice: "verse",
      }),
    });

    const data = await r.json();

    if (!r.ok) {
      return NextResponse.json(data, { status: r.status });
    }

    return NextResponse.json({
      value: data.client_secret.value,
    });

  } catch (e) {
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const sdp = await req.text();

    if (!sdp || sdp.length < 10) {
      return NextResponse.json(
        { error: "Invalid SDP received" },
        { status: 400 }
      );
    }

    const r = await fetch(
      "https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/sdp",
        },
        body: sdp,
      }
    );

    const answer = await r.text();

    return new Response(answer, {
      status: 200,
      headers: {
        "Content-Type": "application/sdp",
      },
    });

  } catch (e) {
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}