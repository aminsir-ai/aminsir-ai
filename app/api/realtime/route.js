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
 * Keeps your existing flow (token), but your current page.js no longer depends on it.
 * We keep it anyway so you don't break other pages.
 */
export async function POST() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return json({ error: { message: "Missing OPENAI_API_KEY on server" } }, 500);

    // If you don't need token anymore, you can return a dummy value.
    // But keeping a real token is ok.
    const r = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session: {
          type: "realtime",
          model: process.env.OPENAI_REALTIME_MODEL || "gpt-4o-realtime-preview",
          audio: { output: { voice: "alloy" } },
        },
      }),
    });

    const data = await r.json().catch(() => null);

    if (!r.ok) {
      return json(
        { error: { message: data?.error?.message || "Failed to create client secret", raw: data } },
        r.status
      );
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
 * Receives SDP offer (RAW) from browser and returns SDP answer (RAW).
 *
 * CRITICAL: forward SDP as raw text with Content-Type: application/sdp
 */
export async function PUT(req) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return json({ error: { message: "Missing OPENAI_API_KEY on server" } }, 500);

    // Read offer SDP (raw)
    const offerSdpRaw = await req.text().catch(() => "");
    let offerSdp = String(offerSdpRaw || "").trim();

    // Strip accidental quotes (defensive)
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
            message:
              "Invalid SDP offer received (must start with v=). First 80 chars: " + offerSdp.slice(0, 80),
          },
        },
        400
      );
    }

    const model = process.env.OPENAI_REALTIME_MODEL || "gpt-4o-realtime-preview";

    // ✅ The stable WebRTC SDP exchange endpoint pattern:
    // Send offer SDP as raw application/sdp, receive answer SDP as raw text
    const r = await fetch(`https://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/sdp",
      },
      body: offerSdp,
    });

    const answerSdp = await r.text().catch(() => "");

    if (!r.ok) {
      // Try parse JSON error if any
      let parsed = null;
      try {
        parsed = JSON.parse(answerSdp);
      } catch {}
      const msg =
        parsed?.error?.message ||
        `OpenAI realtime SDP exchange failed (${r.status}). Response: ${answerSdp.slice(0, 200)}`;
      return json({ error: { message: msg, raw: parsed || answerSdp } }, r.status);
    }

    if (!answerSdp || !answerSdp.trim().startsWith("v=")) {
      return json(
        { error: { message: "OpenAI returned invalid/empty answer SDP.", raw: answerSdp.slice(0, 200) } },
        500
      );
    }

    // Return raw SDP (NOT JSON)
    return new Response(answerSdp, {
      status: 200,
      headers: { "Content-Type": "application/sdp" },
    });
  } catch (e) {
    return json({ error: { message: e?.message || "Server error" } }, 500);
  }
}