// app/api/realtime/route.js
export const runtime = "nodejs";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * POST /api/realtime
 * Returns an ephemeral client secret for the browser (optional; you already use this).
 */
export async function POST() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return json({ error: { message: "Missing OPENAI_API_KEY on server" } }, 500);

    // Create a realtime client secret (ephemeral key)
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
      return json(
        { error: { message: data?.error?.message || "Failed to create realtime client secret", raw: data } },
        r.status
      );
    }

    // Your frontend expects { value: "..." }
    const value = data?.client_secret?.value || data?.value;
    if (!value) return json({ error: { message: "Token missing in OpenAI response", raw: data } }, 500);

    return json({ value });
  } catch (e) {
    return json({ error: { message: e?.message || "Server error" } }, 500);
  }
}

/**
 * PUT /api/realtime
 * Receives SDP offer from the browser and returns SDP answer.
 *
 * IMPORTANT FIX:
 * - We must forward SDP as RAW TEXT (no JSON quoting)
 * - We call OpenAI unified WebRTC endpoint: POST /v1/realtime/calls with multipart FormData
 */
export async function PUT(req) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return json({ error: { message: "Missing OPENAI_API_KEY on server" } }, 500);

    // Accept SDP from either:
    // A) JSON body { sdp: "v=0..." }
    // B) raw text body (application/sdp or text/plain)
    let offerSdp = "";

    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const body = await req.json().catch(() => ({}));
      offerSdp = body?.sdp || "";
    } else {
      offerSdp = (await req.text().catch(() => "")) || "";
    }

    offerSdp = String(offerSdp || "").trim();

    // ✅ Critical: strip accidental surrounding quotes
    // (this is what caused your exact error)
    if (
      (offerSdp.startsWith('"') && offerSdp.endsWith('"')) ||
      (offerSdp.startsWith("'") && offerSdp.endsWith("'"))
    ) {
      offerSdp = offerSdp.slice(1, -1);
    }

    if (!offerSdp.startsWith("v=")) {
      return json(
        {
          error: {
            message:
              "Invalid SDP offer received by server (must start with v=). First 60 chars: " +
              offerSdp.slice(0, 60),
          },
        },
        400
      );
    }

    // Session config for the call (you can extend later)
    const sessionConfig = JSON.stringify({
      type: "realtime",
      model: "gpt-realtime",
      audio: { output: { voice: "alloy" } },
    });

    // OpenAI expects multipart FormData: sdp + session
    const fd = new FormData();
    fd.set("sdp", offerSdp); // ✅ raw SDP, NOT JSON.stringify
    fd.set("session", sessionConfig);

    const r = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        // NOTE: Do NOT set Content-Type manually for FormData; fetch will set boundary.
      },
      body: fd,
    });

    const answerText = await r.text().catch(() => "");

    if (!r.ok) {
      // If OpenAI returned JSON error, show it nicely
      let parsed = null;
      try {
        parsed = JSON.parse(answerText);
      } catch {}

      const msg =
        parsed?.error?.message ||
        `OpenAI /v1/realtime/calls failed (${r.status}). Response: ${answerText.slice(0, 200)}`;

      return json({ error: { message: msg, raw: parsed || answerText } }, r.status);
    }

    // Return in the format your page.js accepts
    return json({ sdp: answerText });
  } catch (e) {
    return json({ error: { message: e?.message || "Server error" } }, 500);
  }
}