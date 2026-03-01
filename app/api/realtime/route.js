export const runtime = "nodejs";

/**
 * WebRTC SDP exchange with OpenAI (FINAL WORKING VERSION)
 */

export async function PUT(req) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response("Missing OPENAI_API_KEY", { status: 500 });
    }

    // 1) Receive SDP offer from browser (RAW TEXT)
    let offerSdp = await req.text();
    offerSdp = (offerSdp || "").trim();

    // Safety: remove accidental quotes
    if (
      (offerSdp.startsWith('"') && offerSdp.endsWith('"')) ||
      (offerSdp.startsWith("'") && offerSdp.endsWith("'"))
    ) {
      offerSdp = offerSdp.slice(1, -1);
    }

    if (!offerSdp.startsWith("v=")) {
      return new Response("Invalid SDP offer", { status: 400 });
    }

    // 2) Send to OpenAI Realtime WebRTC endpoint
    const r = await fetch("https://api.openai.com/v1/realtime?model=gpt-realtime", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/sdp",
      },
      body: offerSdp,
    });

    const answerSdp = await r.text();

    if (!r.ok) {
      return new Response(answerSdp, { status: 500 });
    }

    // 3) RETURN PURE SDP (THIS IS THE KEY FIX)
    return new Response(answerSdp, {
      status: 200,
      headers: {
        "Content-Type": "application/sdp",
      },
    });

  } catch (e) {
    return new Response(e.message || "Server error", { status: 500 });
  }
}