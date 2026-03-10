import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function getDubaiDay() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dubai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const studentId =
      searchParams.get("studentId") ||
      searchParams.get("student_id") ||
      "";

    if (!studentId) {
      return NextResponse.json(
        { ok: false, error: "studentId is required", sentences: [] },
        { status: 400 }
      );
    }

    const today = getDubaiDay();

    const { data, error } = await supabase
      .from("homework")
      .select("student_id, day, sentences")
      .eq("student_id", studentId)
      .eq("day", today)
      .maybeSingle();

    if (error) {
      console.error("HOMEWORK TODAY READ ERROR:", error);
      return NextResponse.json(
        { ok: false, error: error.message, sentences: [] },
        { status: 500 }
      );
    }

    let sentences = [];

    if (data?.sentences) {
      if (Array.isArray(data.sentences)) {
        sentences = data.sentences;
      } else if (Array.isArray(data.sentences.sentences)) {
        sentences = data.sentences.sentences;
      }
    }

    return NextResponse.json({
      ok: true,
      day: today,
      studentId,
      sentences,
    });
  } catch (err) {
    console.error("HOMEWORK TODAY API ERROR:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err.message || "Unknown server error",
        sentences: [],
      },
      { status: 500 }
    );
  }
}