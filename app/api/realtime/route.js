// app/api/realtime/route.js
export const runtime = "nodejs";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Keep POST if you use it elsewhere (not required for this flow)
export async function POST() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return json({ error: { message: "Missing OPENAI_API_KEY" } }, 500);

    const r = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session: {
          type: "realtime",
          model: process.env.OPENAI_REALTIME_MODEL || "gpt-realtime",
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

export async function PUT(req) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return json({ error: { message: "Missing OPENAI_API_KEY" } }, 500);

    // 1) Read SDP offer from browser (raw text)
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
            message: "Invalid SDP offer received by server (must start with v=).",
            debug: { length: offerSdp.length, first80: offerSdp.slice(0, 80) },
          },
        },
        400
      );
    }

    const model = process.env.OPENAI_REALTIME_MODEL || "gpt-realtime";

    // Session config per WebRTC guide (unified interface)
    const sessionConfig = JSON.stringify({
      type: "realtime",
      model,
      audio: { output: { voice: "alloy" } },
    });

    // ---------------------------
    // Attempt 1: Unified interface
    // POST /v1/realtime/calls with multipart FormData(sdp, session)
    // ---------------------------
    try {
      const fd = new FormData();
      fd.set("sdp", offerSdp);
      fd.set("session", sessionConfig);

      const r1 = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          // DO NOT set Content-Type for FormData
        },
        body: fd,
      });

      const answer1 = await r1.text().catch(() => "");

      if (r1.ok && answer1.trim().startsWith("v=")) {
        // Return RAW SDP
        return new Response(answer1, {
          status: 200,
          headers: { "Content-Type": "application/sdp" },
        });
      }

      // If not ok, fall through to attempt 2
      // Keep short debug for you:
      // console.log("Unified failed", r1.status, answer1.slice(0, 120));
    } catch {
      // ignore and try fallback
    }

    // ---------------------------
    // Attempt 2: Legacy SDP exchange (fallback)
    // POST /v1/realtime?model=... with Content-Type: application/sdp
    // ---------------------------
    const r2 = await fetch(`https://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/sdp",
        Accept: "application/sdp",
      },
      body: offerSdp,
    });

    const answer2 = await r2.text().catch(() => "");

    if (!r2.ok) {
      // Return JSON error so your client shows it clearly
      let parsed = null;
      try {
        parsed = JSON.parse(answer2);
      } catch {}
      return json(
        {
          error: {
            message:
              parsed?.error?.message ||
              `Realtime SDP exchange failed (${r2.status}).`,
            raw: parsed || answer2.slice(0, 400),
          },
          debug: { model, offerLen: offerSdp.length, offerFirst80: offerSdp.slice(0, 80) },
        },
        r2.status
      );
    }

    if (!answer2 || !answer2.trim().startsWith("v=")) {
      return json(
        {
          error: { message: "OpenAI returned invalid/empty SDP answer." },
          debug: { model, offerLen: offerSdp.length, answerFirst200: answer2.slice(0, 200) },
        },
        500
      );
    }

    return new Response(answer2, {
      status: 200,
      headers: { "Content-Type": "application/sdp" },
    });
  } catch (e) {
    return json({ error: { message: e?.message || "Server error" } }, 500);
  }
}