// app/api/realtime/route.js
export const runtime = "nodejs";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Optional: keep POST if you use it elsewhere (token minting)
export async function POST() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return json({ error: { message: "Missing OPENAI_API_KEY on server" } }, 500);

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
 * Browser sends RAW SDP (Content-Type: application/sdp)
 * Server forwards it to OpenAI using the unified interface:
 * POST /v1/realtime/calls with multipart FormData (sdp + session)
 * Returns RAW answer SDP text back to browser.
 */
export async function PUT(req) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return json({ error: { message: "Missing OPENAI_API_KEY on server" } }, 500);

    // Read raw SDP from browser
    let offerSdp = (await req.text().catch(() => "")) || "";
    offerSdp = String(offerSdp).trim();

    // Defensive: strip accidental surrounding quotes
    if (
      (offerSdp.startsWith('"') && offerSdp.endsWith('"')) ||
      (offerSdp.startsWith("'") && offerSdp.endsWith("'"))
    ) {
      offerSdp = offerSdp.slice(1, -1).trim();
    }

    if (!offerSdp || !offerSdp.startsWith("v=")) {
      return json(
        {
          error: {
            message: "Invalid SDP offer received (must start with v=). First 120 chars: " + offerSdp.slice(0, 120),
          },
        },
        400
      );
    }

    // Session config per OpenAI unified WebRTC docs :contentReference[oaicite:1]{index=1}
    const sessionConfig = JSON.stringify({
      type: "realtime",
      model: "gpt-realtime",
      audio: { output: { voice: "alloy" } },
    });

    const fd = new FormData();
    fd.set("sdp", offerSdp);
    fd.set("session", sessionConfig);

    const r = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        // DO NOT set Content-Type manually for FormData
      },
      body: fd,
    });

    const answerSdp = await r.text().catch(() => "");

    if (!r.ok) {
      // Try parse JSON error (sometimes OpenAI returns JSON)
      let parsed = null;
      try {
        parsed = JSON.parse(answerSdp);
      } catch {}

      const msg =
        parsed?.error?.message ||
        `OpenAI /v1/realtime/calls failed (${r.status}). Response: ${answerSdp.slice(0, 220)}`;

      return json({ error: { message: msg, raw: parsed || answerSdp } }, r.status);
    }

    if (!answerSdp || !answerSdp.trim().startsWith("v=")) {
      return json(
        { error: { message: "OpenAI returned invalid/empty answer SDP.", raw: answerSdp.slice(0, 220) } },
        500
      );
    }

    // Return RAW SDP to browser
    return new Response(answerSdp, {
      status: 200,
      headers: { "Content-Type": "application/sdp" },
    });
  } catch (e) {
    return json({ error: { message: e?.message || "Server error" } }, 500);
  }
}