import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function todayDubai() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dubai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;

  return `${y}-${m}-${d}`;
}

function isoDaysBackDubai(n) {
  const now = new Date();
  const dt = new Date(now);
  dt.setDate(dt.getDate() - n);

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dubai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(dt);

  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;

  return `${y}-${m}-${d}`;
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const limit = Number(searchParams.get("limit") || 50);

    if (!studentId) {
      return NextResponse.json({ ok: false, error: "studentId required" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from("speaking_sessions")
      .select(
        "id, student_id, student_name, duration_sec, overall_score, pronunciation, vocabulary, fluency, grammar, confidence, transcript, created_at, day, good, fix, vocab, tip"
      )
      .eq("student_id", String(studentId))
      .order("created_at", { ascending: false })
      .limit(Math.min(Math.max(limit, 1), 200));

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const sessions = Array.isArray(data) ? data : [];

    // stats
    const totalSessions = sessions.length;
    const totalSeconds = sessions.reduce((a, s) => a + Number(s.duration_sec || 0), 0);
    const bestScore = sessions.reduce((mx, s) => Math.max(mx, Number(s.overall_score || 0)), 0);
    const avgScore =
      totalSessions === 0
        ? 0
        : Math.round(
            (sessions.reduce((a, s) => a + Number(s.overall_score || 0), 0) / totalSessions) * 10
          ) / 10;

    // streak
    const daySet = new Set(sessions.map((s) => s.day).filter(Boolean));
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const key = isoDaysBackDubai(i);
      if (daySet.has(key)) streak++;
      else break;
    }

    return NextResponse.json({
      ok: true,
      today: todayDubai(),
      stats: {
        totalSessions,
        totalSeconds,
        bestScore,
        avgScore,
        streak,
      },
      sessions,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "progress/sessions failed", details: String(err) },
      { status: 500 }
    );
  }
}