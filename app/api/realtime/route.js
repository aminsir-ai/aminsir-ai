// app/api/realtime/route.js
export const runtime = "nodejs"; // ✅ IMPORTANT: prevents Edge-runtime crashes on Vercel

export async function POST() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: { message: "Missing OPENAI_API_KEY in environment variables." } },
        { status: 500 }
      );
    }

    // ✅ Create a GA Realtime client secret (NO beta headers)
    const r = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // ✅ Required
        session: {
          type: "realtime",

          // Good defaults
          model: "gpt-4o-realtime-preview",
          output_modalities: ["audio"],
          // voice is better controlled from chat/page.js via session.update,
          // but keeping a safe default here:
          voice: "alloy",
        },
      }),
    });

    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      return Response.json(
        {
          error: {
            message:
              data?.error?.message ||
              `Failed to create realtime client secret (status ${r.status}).`,
            details: data,
          },
        },
        { status: r.status }
      );
    }

    // ✅ Bulletproof extraction:
    // OpenAI typically returns: { value: "ek_..." , expires_at: ..., session: {...} }
    const value =
      data?.value ||
      data?.client_secret?.value ||
      data?.client_secret ||
      null;

    if (!value) {
      return Response.json(
        {
          error: {
            message: "Client secret value missing in response.",
            details: data,
          },
        },
        { status: 500 }
      );
    }

    // Your chat/page.js expects { value }
    return Response.json({ value });
  } catch (err) {
    return Response.json(
      {
        error: {
          message: err?.message || "Server error creating realtime client secret.",
        },
      },
      { status: 500 }
    );
  }
}