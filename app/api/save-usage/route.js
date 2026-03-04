import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getTodayISODate() {
  // date in YYYY-MM-DD (server timezone). Good enough for daily usage tracking.
  return new Date().toISOString().slice(0, 10);
}

export async function POST(req) {
  try {
    const body = await req.json();

    const studentId = String(body?.studentId || "").trim();
    if (!studentId) {
      return NextResponse.json({ ok: false, error: "studentId is required" }, { status: 400 });
    }

    // Accept either secondsToAdd or minutesToAdd
    const secondsToAddRaw =
      body?.secondsToAdd != null
        ? Number(body.secondsToAdd)
        : body?.minutesToAdd != null
        ? Math.round(Number(body.minutesToAdd) * 60)
        : 0;

    const secondsToAdd = Number.isFinite(secondsToAddRaw) ? Math.max(0, Math.round(secondsToAddRaw)) : 0;

    if (secondsToAdd <= 0) {
      // Still return current usage so UI can refresh
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !key) {
        return NextResponse.json({ ok: false, error: "Supabase env missing" }, { status: 500 });
      }
      const supabase = createClient(url, key);
      const day = getTodayISODate();

      const { data: row } = await supabase
        .from("usage_daily")
        .select("*")
        .eq("student_id", studentId)
        .eq("day", day)
        .maybeSingle();

      const secondsUsed = Number(row?.seconds_used ?? 0);
      const dailyLimitSeconds = Number(row?.daily_limit_seconds ?? 600);

      return NextResponse.json({
        ok: true,
        minutesUsed: secondsUsed / 60,
        dailyLimit: dailyLimitSeconds / 60,
        remainingMinutes: Math.max(0, (dailyLimitSeconds - secondsUsed) / 60),
      });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      return NextResponse.json(
        { ok: false, error: "Supabase env missing: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 }
      );
    }

    const supabase = createClient(url, key);
    const day = getTodayISODate();

    // 1) Fetch existing row
    const { data: existing, error: selErr } = await supabase
      .from("usage_daily")
      .select("*")
      .eq("student_id", studentId)
      .eq("day", day)
      .maybeSingle();

    if (selErr) {
      return NextResponse.json({ ok: false, error: selErr.message }, { status: 500 });
    }

    const currentSeconds = Number(existing?.seconds_used ?? 0);
    const dailyLimitSeconds = Number(existing?.daily_limit_seconds ?? 600);

    const newSeconds = Math.max(0, currentSeconds + secondsToAdd);

    // 2) Upsert
    const { data: up, error: upErr } = await supabase
      .from("usage_daily")
      .upsert(
        {
          student_id: studentId,
          day,
          seconds_used: newSeconds,
          daily_limit_seconds: dailyLimitSeconds,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "student_id,day" }
      )
      .select()
      .single();

    if (upErr) {
      return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });
    }

    const used = Number(up.seconds_used ?? 0);
    const limit = Number(up.daily_limit_seconds ?? 600);

    return NextResponse.json({
      ok: true,
      minutesUsed: used / 60,
      dailyLimit: limit / 60,
      remainingMinutes: Math.max(0, (limit - used) / 60),
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "save-usage failed", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}