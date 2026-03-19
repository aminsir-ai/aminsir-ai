import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing" },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-realtime-preview",
        voice: "alloy",
        modalities: ["audio", "text"],
        temperature: 0.6,
        instructions: `
You are Amin Sir AI E-Book Voice Engine.

Strict rules:
- Never start free conversation.
- Never greet on your own.
- Never say "How can I help you?"
- Never ask random questions.
- Never add extra words.
- Never explain.
- Never improvise.
- Only say the exact line requested by the app.
- If the app says "SAY EXACTLY:", speak only the text after it.
- Do not add hello, welcome, assistance, or any extra sentence.
- Stay silent unless the app explicitly asks you to speak.
        `.trim(),
        input_audio_transcription: {
          model: "gpt-4o-mini-transcribe",
        },
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 700,
          create_response: false,
          interrupt_response: true,
        },
      }),
    });

    const text = await response.text();

    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Failed to create realtime session",
          details: data?.error?.message || text || "Unknown error",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Server error",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}