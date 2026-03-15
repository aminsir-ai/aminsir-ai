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

    const model = "gpt-4o-realtime-preview-2024-12-17";

    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        voice: "alloy",
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

    return NextResponse.json({
      ...data,
      model,
    });
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