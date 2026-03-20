import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function toDateOnlyKey(dateValue) {
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return null;

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTodayRange() {
  const now = new Date();

  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    todayKey: toDateOnlyKey(now),
    yesterdayKey: toDateOnlyKey(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
    ),
  };
}

function calculateStreak(sessionRows) {
  if (!Array.isArray(sessionRows) || sessionRows.length === 0) return 0;

  const uniqueDays = new Set();

  for (const row of sessionRows) {
    const key = toDateOnlyKey(row?.session_date);
    if (key) uniqueDays.add(key);
  }

  if (uniqueDays.size === 0) return 0;

  const today = new Date();
  let cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let streak = 0;

  while (true) {
    const key = toDateOnlyKey(cursor);

    if (uniqueDays.has(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }

    if (streak === 0) {
      cursor.setDate(cursor.getDate() - 1);
      const yesterdayKey = toDateOnlyKey(cursor);

      if (uniqueDays.has(yesterdayKey)) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }
    }

    break;
  }

  return streak;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = String(searchParams.get("studentId") || "").trim();

    if (!studentId) {
      return NextResponse.json(
        { error: "studentId is required" },
        { status: 400 }
      );
    }

    const { data: allSessions, error: allSessionsError } = await supabase
      .from("simple_practice_sessions")
      .select(
        `
        student_id,
        student_name,
        lesson,
        duration_seconds,
        overall_score,
        session_date,
        level_no,
        week_no,
        day_no
      `
      )
      .eq("student_id", studentId)
      .order("session_date", { ascending: false });

    if (allSessionsError) {
      console.error("Fetch all sessions error:", allSessionsError);
      return NextResponse.json(
        { error: allSessionsError.message || "Failed to fetch sessions" },
        { status: 500 }
      );
    }

    const sessionRows = Array.isArray(allSessions) ? allSessions : [];

    const totalSessions = sessionRows.length;

    let bestScore = 0;
    for (const row of sessionRows) {
      const score = Number(row?.overall_score || 0);
      if (score > bestScore) {
        bestScore = score;
      }
    }

    const { startIso, endIso } = getTodayRange();

    const { data: todaySessions, error: todaySessionsError } = await supabase
      .from("simple_practice_sessions")
      .select("duration_seconds, session_date")
      .eq("student_id", studentId)
      .gte("session_date", startIso)
      .lt("session_date", endIso);

    if (todaySessionsError) {
      console.error("Fetch today sessions error:", todaySessionsError);
      return NextResponse.json(
        { error: todaySessionsError.message || "Failed to fetch today's usage" },
        { status: 500 }
      );
    }

    const todayUsageSeconds = Array.isArray(todaySessions)
      ? todaySessions.reduce((sum, row) => {
          return sum + Number(row?.duration_seconds || 0);
        }, 0)
      : 0;

    const streak = calculateStreak(sessionRows);

    const recentSessions = sessionRows.slice(0, 5).map((row) => ({
      lesson: row?.lesson || "Practice Session",
      score: Number(row?.overall_score || 0),
      durationSeconds: Number(row?.duration_seconds || 0),
      sessionDate: row?.session_date || null,
      levelNo: Number(row?.level_no || 0),
      weekNo: Number(row?.week_no || 0),
      dayNo: Number(row?.day_no || 0),
    }));

    return NextResponse.json({
      success: true,
      summary: {
        totalSessions,
        bestScore,
        todayUsageSeconds,
        streak,
      },
      recentSessions,
    });
  } catch (error) {
    console.error("Progress summary API error:", error);
    return NextResponse.json(
      { error: "Something went wrong while fetching progress summary" },
      { status: 500 }
    );
  }
}