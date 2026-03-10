import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { COURSE_DATA } from "@/lib/courseData";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function getLevelStructure(levelNo = 1) {
  const levelObj =
    COURSE_DATA?.levels?.find((item) => item.id === `level${Number(levelNo)}`) || null;

  const weeks = Array.isArray(levelObj?.weeks) ? levelObj.weeks : [];

  if (!weeks.length) {
    return {
      totalWeeks: 4,
      daysPerWeek: {
        1: 7,
        2: 7,
        3: 7,
        4: 7,
      },
    };
  }

  const daysPerWeek = {};
  weeks.forEach((week, index) => {
    daysPerWeek[index + 1] =
      Array.isArray(week?.days) && week.days.length ? week.days.length : 7;
  });

  return {
    totalWeeks: weeks.length,
    daysPerWeek,
  };
}

function clampNumber(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

export async function POST(req) {
  try {
    const body = await req.json();

    const studentId = String(body?.studentId || "").trim();
    const levelNo = Number(body?.levelNo || 1);

    if (!studentId) {
      return NextResponse.json(
        { ok: false, error: "studentId required" },
        { status: 400 }
      );
    }

    const structure = getLevelStructure(levelNo);
    const safeWeekNo = clampNumber(body?.weekNo || 1, 1, structure.totalWeeks || 4);
    const maxDayForWeek = Number(structure.daysPerWeek?.[safeWeekNo] || 7);
    const safeDayNo = clampNumber(body?.dayNo || 1, 1, maxDayForWeek);

    const incomingStarsEarned = Math.max(0, Number(body?.starsEarned || 0));
    const incomingSentencesSpoken = Math.max(0, Number(body?.sentencesSpoken || 0));
    const incomingRoundsCompleted = Math.max(0, Number(body?.roundsCompleted || 0));
    const incomingCompleted = Boolean(body?.completed);

    const { data: existingRow, error: existingError } = await supabase
      .from("level_progress")
      .select("*")
      .eq("student_id", studentId)
      .eq("level_no", levelNo)
      .eq("week_no", safeWeekNo)
      .eq("day_no", safeDayNo)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        { ok: false, error: existingError.message },
        { status: 500 }
      );
    }

    const payload = {
      student_id: studentId,
      level_no: levelNo,
      week_no: safeWeekNo,
      day_no: safeDayNo,
      stars_earned: Math.max(
        Number(existingRow?.stars_earned || 0),
        incomingStarsEarned
      ),
      sentences_spoken: Math.max(
        Number(existingRow?.sentences_spoken || 0),
        incomingSentencesSpoken
      ),
      rounds_completed: Math.max(
        Number(existingRow?.rounds_completed || 0),
        incomingRoundsCompleted
      ),
      completed: Boolean(existingRow?.completed) || incomingCompleted,
      day_date: existingRow?.day_date || new Date().toISOString().slice(0, 10),
    };

    const { data, error } = await supabase
      .from("level_progress")
      .upsert(payload, {
        onConflict: "student_id,level_no,week_no,day_no",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      row: data,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to save progress" },
      { status: 500 }
    );
  }
}