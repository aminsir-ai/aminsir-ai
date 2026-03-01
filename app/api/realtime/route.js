// app/api/realtime/route.js
export const runtime = "edge";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

// GET /api/realtime  (for testing in mobile browser)
export async function GET() {
  return json({ ok: true, message: "api/realtime is alive. Use POST to get ephemeral key." }, 200);
}

// POST /api/realtime  -> returns { value: <EPHEMERAL_KEY> }
export async function POST() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return json({ error: { message: "Missing OPENAI_API_KEY in Vercel (Production)" } }, 500);

    const r = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session: {
          type: "realtime",
          model: "gpt-realtime",
          audio: { output: { voice: "alloy" } },
        },
      }),
    });

    const data = await r.json().catch(() => null);

    if (!r.ok) {
      return json(
        {
          error: {
            message: data?.error?.message || "Failed to create client secret",
            status: r.status,
            raw: data,
          },
        },
        r.status
      );
    }

    const value = data?.client_secret?.value || data?.value;
    if (!value) return json({ error: { message: "Token missing in OpenAI response", raw: data } }, 500);

    return json({ value }, 200);
  } catch (e) {
    return json({ error: { message: e?.message || "Server error" } }, 500);
  }
}