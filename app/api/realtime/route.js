export const runtime = "nodejs";

/*
FINAL WORKING WebRTC SDP EXCHANGE FOR VERCEL
(no FormData, no multipart)
*/

export async function PUT(req) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return new Response("Missing OPENAI_API_KEY", { status: 500 });
    }

    // 1. Read raw SDP from browser
    let offerSdp = await req.text();
    offerSdp = (offerSdp || "").trim();

    // Safety cleanup
    if (
      (offerSdp.startsWith('"') && offerSdp.endsWith('"')) ||
      (offerSdp.startsWith("'") && offerSdp.endsWith("'"))
    ) {
      offerSdp = offerSdp.slice(1, -1);
    }

    if (!offerSdp.startsWith("v=")) {
      return new Response("Invalid SDP offer", { status: 400 });
    }

    // 2. Send raw SDP to OpenAI (IMPORTANT PART)
    const openaiRes = await fetch(
      "https://api.openai.com/v1/realtime?model=gpt-realtime",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/sdp",
          "Accept": "application/sdp",
        },
        body: offerSdp,
      }
    );

    const answerSdp = await openaiRes.text();

    if (!openaiRes.ok) {
      return new Response(answerSdp, { status: 500 });
    }

    // 3. Return PURE SDP to browser
    return new Response(answerSdp, {
      status: 200,
      headers: {
        "Content-Type": "application/sdp",
      },
    });

  } catch (err) {
    return new Response(err.message || "Server error", { status: 500 });
  }
}