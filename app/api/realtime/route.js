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

export async function GET() {
  return json({ ok: true, message: "alive" });
}

export async function POST() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return json({ error: { message: "OPENAI_API_KEY missing in Vercel" } }, 500);
    }

    // MINIMAL session request (FAST)
    const r = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session: {
          model: "gpt-realtime"
        }
      }),
    });

    const data = await r.json();

    if (!r.ok) {
      return json({ error: data }, 500);
    }

    return json({ value: data.client_secret.value });

  } catch (e) {
    return json({ error: { message: e.message } }, 500);
  }
}