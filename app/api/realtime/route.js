// app/api/realtime/route.js
export const runtime = "nodejs";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * OPTIONAL POST (keep if you use it elsewhere)
 * Creates an ephemeral token.
 */
export async function POST() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return json({ error: { message: "Missing OPENAI_API_KEY on server" } }, 500);

    const sessionConfig = {
      session: {
        type: "realtime",
        model: "gpt-realtime",
        audio: { output: { voice: "alloy" } },
      },
    };

    const r = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sessionConfig),
    });

    const data = await r.json().catch(() => null);

    if (!r.ok) {
      return json({ error: { message: data?.error?.message || "Failed to create client secret", raw: data } }, r.status);
    }

    const value = data?.client_secret?.value || data?.value;
    if (!value) return json({ error: { message: "Token missing in OpenAI response", raw: data } }, 500);

    return json({ value });
  } catch (e) {
    return json({ error: { message: e?.message || "Server error" } }, 500);
  }
}

/**
 * PUT /api/realtime
 * Browser sends RAW SDP (application/sdp)
 * Server sends multipart FormData to OpenAI /v1/realtime/calls (Unified Interface)
 * Server returns RAW SDP answer (application/sdp)
 */
export async function PUT(req) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return json({ error: { message: "Missing OPENAI_API_KEY on server" } }, 500);

    // 1) Read raw SDP offer from browser
    let offerSdp = (await req.text().catch(() => "")) || "";
    offerSdp = String(offerSdp).trim();

    // Defensive: strip surrounding quotes
    if (
      (offerSdp.startsWith('"') && offerSdp.endsWith('"')) ||
      (offerSdp.startsWith("'") && offerSdp.endsWith("'"))
    ) {
      offerSdp = offerSdp.slice(1, -1).trim();
    }

    if (!offerSdp || !offerSdp.startsWith("v=")) {
      return json(
        { error: { message: "Invalid SDP offer received by server (must start with v=)." } },
        400
      );
    }

    // 2) Build session config (Unified Interface expects this in the "session" form part)
    const sessionConfig = JSON.stringify({
      type: "realtime",
      model: "gpt-realtime",
      audio: { output: { voice: "alloy" } },
    });

    // 3) Send to OpenAI as multipart FormData: sdp + session
    const fd = new FormData();
    fd.set("sdp", offerSdp);
    fd.set("session", sessionConfig);

    const r = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        // DO NOT set Content-Type manually (fetch will set correct boundary)
      },
      body: fd,
    });

    const answerText = await r.text().catch(() => "");

    if (!r.ok) {
      // try parse JSON error if possible
      let parsed = null;
      try {
        parsed = JSON.parse(answerText);
      } catch {}

      const msg =
        parsed?.error?.message ||
        `OpenAI /v1/realtime/calls failed (${r.status}). ${answerText.slice(0, 300)}`;

      return json({ error: { message: msg, raw: parsed || answerText } }, r.status);
    }

    // 4) Return RAW SDP answer to browser
    if (!answerText || !answerText.trim().startsWith("v=")) {
      return json(
        { error: { message: "OpenAI returned invalid/empty SDP answer.", raw: answerText.slice(0, 200) } },
        500
      );
    }

    return new Response(answerText, {
      status: 200,
      headers: { "Content-Type": "application/sdp" },
    });
  } catch (e) {
    return json({ error: { message: e?.message || "Server error" } }, 500);
  }
}