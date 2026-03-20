import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      studentId,
      studentName,
      lessonName = "Amin Sir AI E-Book Practice",
      score = 0,
      totalTopics = 10,
      timeSpentSeconds = 0,
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

    const payload = {
      student_id: String(studentId).trim(),
      student_name: String(studentName).trim(),
      lesson_name: String(lessonName || "Amin Sir AI E-Book Practice"),
      score: Number(score || 0),
      total_topics: Number(totalTopics || 10),
      time_spent_seconds: Number(timeSpentSeconds || 0),
    };

    const { error } = await supabase
      .from("chat_practice_progress")
      .insert([payload]);

    if (error) {
      console.error("Chat progress insert error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to save chat progress" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Chat progress saved successfully",
    });
  } catch (error) {
    console.error("Save chat progress API error:", error);
    return NextResponse.json(
      { error: "Something went wrong while saving chat progress" },
      { status: 500 }
    );
  }
}