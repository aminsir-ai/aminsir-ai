// app/api/realtime/route.js
export const runtime = "nodejs";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function PUT(req) {
  try {
    const ct = req.headers.get("content-type") || "";
    const raw = await req.text().catch(() => "");

    // Return what server RECEIVED (first 200 chars) — so we can see if SDP is empty
    return json({
      ok: true,
      contentType: ct,
      length: raw.length,
      startsWith: raw.slice(0, 5),
      first200: raw.slice(0, 200),
    });
  } catch (e) {
    return json({ ok: false, error: e?.message || "error" }, 500);
  }
}