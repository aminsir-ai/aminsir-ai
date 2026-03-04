import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const DAILY_LIMIT_MINUTES = 10;

function todayISO() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

export async function GET() {
  return Response.json({
    ok: true,
    message: 'API is running. Use POST with JSON: { "studentId": 5 }',
  });
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const studentId = Number(body.studentId);

    if (!studentId) {
      return Response.json({ ok: false, error: "studentId is required" }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url) return Response.json({ ok: false, error: "Missing env: NEXT_PUBLIC_SUPABASE_URL" }, { status: 500 });
    if (!serviceKey) return Response.json({ ok: false, error: "Missing env: SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });

    const supabase = createClient(url, serviceKey);

    const usage_date = todayISO();

    const { data, error } = await supabase
      .from("student_usage")
      .select("minutes_used")
      .eq("student_id", studentId)
      .eq("usage_date", usage_date)
      .maybeSingle();

    if (error) {
      return Response.json({ ok: false, error: error.message }, { status: 500 });
    }

    const minutesUsed = Number(data?.minutes_used ?? 0);
    const remaining = Math.max(0, DAILY_LIMIT_MINUTES - minutesUsed);
    const allowed = minutesUsed < DAILY_LIMIT_MINUTES;

    return Response.json({
      ok: true,
      studentId,
      usage_date,
      minutesUsed,
      dailyLimit: DAILY_LIMIT_MINUTES,
      remaining,
      allowed,
    });
  } catch (e) {
    return Response.json({ ok: false, error: e?.message || "Unknown error" }, { status: 500 });
  }
}