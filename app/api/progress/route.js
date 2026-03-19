import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      studentId,
      studentName,
      levelNo = 1,
      weekNo = 1,
      dayNo = 1,
      lesson = "Day 1",
      duration = 0,
      score = {},
      starsEarned = 0,
      sentencesSpoken = 0,
      roundsCompleted = 0,
      completed = true,
    } = body || {};

    if (!studentId || !studentName) {
      return NextResponse.json(
        { error: "studentId and studentName are required" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const sessionPayload = {
      student_id: String(studentId).trim(),
      student_name: String(studentName).trim(),
      level_no: Number(levelNo || 1),
      week_no: Number(weekNo || 1),
      day_no: Number(dayNo || 1),
      lesson: String(lesson || "Day 1"),
      duration_seconds: Number(duration || 0),
      overall_score: Number(score?.overall || 0),
      score_breakdown: score?.breakdown || {},
      session_date: new Date().toISOString(),
    };

    const { error: sessionError } = await supabase
      .from("simple_practice_sessions")
      .insert([sessionPayload]);

    if (sessionError) {
      console.error("Session insert error:", sessionError);
      return NextResponse.json(
        { error: sessionError.message || "Failed to save session" },
        { status: 500 }
      );
    }

    const progressPayload = {
      student_id: String(studentId).trim(),
      level_no: Number(levelNo || 1),
      week_no: Number(weekNo || 1),
      day_no: Number(dayNo || 1),
      stars_earned: Number(starsEarned || 0),
      sentences_spoken: Number(sentencesSpoken || 0),
      rounds_completed: Number(roundsCompleted || 0),
      completed: Boolean(completed),
      day_date: new Date().toISOString().split("T")[0],
      updated_at: new Date().toISOString(),
    };

    const { error: progressError } = await supabase
      .from("level_progress")
      .upsert([progressPayload], {
        onConflict: "student_id,level_no,week_no,day_no",
      });

    if (progressError) {
      console.error("Progress upsert error:", progressError);
      return NextResponse.json(
        { error: progressError.message || "Failed to save level progress" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Progress saved successfully",
    });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: "Something went wrong while saving progress" },
      { status: 500 }
    );
  }
}