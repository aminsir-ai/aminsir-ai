import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET /api/speaking-sessions?studentId=5&limit=30
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const limit = Number(searchParams.get("limit") || 30);

    if (!studentId) {
      return NextResponse.json(
        { ok: false, error: "studentId is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("speaking_sessions")
      .select(
        "id, student_id, student_name, duration_sec, overall_score, pronunciation, vocabulary, fluency, grammar, confidence, transcript, created_at, day"
      )
      .eq("student_id", String(studentId))
      .order("created_at", { ascending: false })
      .limit(Math.min(Math.max(limit, 1), 200));

    if (error) {
      console.error("Fetch speaking sessions error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, sessions: data || [] });
  } catch (e) {
    console.error("API /speaking-sessions error:", e);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}