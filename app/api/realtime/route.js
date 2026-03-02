import { NextResponse } from "next/server";

export const runtime = "nodejs"; // important for Vercel

function pickClientSecretValue(json) {
  // Different responses may nest the value differently. We handle all.
  if (typeof json?.value === "string") return json.value;
  if (typeof json?.client_secret?.value === "string") return json.client_secret.value;
  if (typeof json?.data?.value === "string") return json.data.value;
  if (typeof json?.details?.value?.value === "string") return json.details.value.value;
  if (typeof json?.details?.value === "string") return json.details.value;
  return null;
}

export async function POST() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: { message: "Missing OPENAI_API_KEY in environment variables" } },
        { status: 500 }
      );
    }

    // ✅ GA endpoint (NO OpenAI-Beta header)
    const url = "https://api.openai.com/v1/realtime/client_secrets";

    // ✅ IMPORTANT: DO NOT send session.voice here (GA rejects it)
    // Keep session minimal; configure voice later via session.update over DataChannel.
    const payload = {
      session: {
        type: "realtime",
        model: "gpt-4o-realtime-preview",
      },
    };

    const r = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const json = await r.json().catch(() => ({}));

    if (!r.ok) {
      return NextResponse.json(
        { error: { message: json?.error?.message || "Failed to create realtime client secret", details: json } },
        { status: r.status }
      );
    }

    const value = pickClientSecretValue(json);
    if (!value) {
      return NextResponse.json(
        { error: { message: "Client secret value missing in response", details: json } },
        { status: 500 }
      );
    }

    return NextResponse.json({ value });
  } catch (e) {
    return NextResponse.json(
      { error: { message: e?.message || "Server error", details: String(e) } },
      { status: 500 }
    );
  }
}