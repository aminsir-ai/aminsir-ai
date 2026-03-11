import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "Missing OPENAI_API_KEY in environment variables",
        },
        { status: 500 }
      );
    }

    const model =
      process.env.OPENAI_REALTIME_MODEL ||
      "gpt-4o-realtime-preview-2024-12-17";

    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        voice: "marin",
      }),
      cache: "no-store",
    });

    const rawText = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Failed to create realtime session",
          status: response.status,
          details: rawText,
        },
        { status: response.status }
      );
    }

    let data = {};
    try {
      data = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        {
          error: "OpenAI returned non-JSON response",
          details: rawText,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        model,
        client_secret: data?.client_secret || null,
        raw: data,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Realtime route crashed",
        details: error?.message || "Unknown server error",
      },
      { status: 500 }
    );
  }
}