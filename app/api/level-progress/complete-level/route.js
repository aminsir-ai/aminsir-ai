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
      weeks: [
        { weekNo: 1, totalDays: 7 },
        { weekNo: 2, totalDays: 7 },
        { weekNo: 3, totalDays: 7 },
        { weekNo: 4, totalDays: 7 },
      ],
    };
  }

  return {
    weeks: weeks.map((week, index) => ({
      weekNo: index + 1,
      totalDays: Array.isArray(week?.days) && week.days.length ? week.days.length : 7,
    })),
  };
}

function getLastLesson(levelNo = 1) {
  const { weeks } = getLevelStructure(levelNo);
  const lastWeek = weeks[weeks.length - 1] || { weekNo: 4, totalDays: 7 };

  return {
    weekNo: Number(lastWeek.weekNo || 4),
    dayNo: Number(lastWeek.totalDays || 7),
  };
}

export async function POST(req) {
  try {
    const body = await req.json();

    const studentId = String(body?.student_id || "").trim();
    const levelNo = Number(body?.level_no || 1);

    if (!studentId) {
      return NextResponse.json(
        { ok: false, error: "student_id required" },
        { status: 400 }
      );
    }

    const lastLesson = getLastLesson(levelNo);

    const { data: finalProgressRow, error: progressError } = await supabase
      .from("level_progress")
      .select("*")
      .eq("student_id", studentId)
      .eq("level_no", levelNo)
      .eq("week_no", lastLesson.weekNo)
      .eq("day_no", lastLesson.dayNo)
      .maybeSingle();

    if (progressError) {
      return NextResponse.json(
        { ok: false, error: progressError.message },
        { status: 500 }
      );
    }

    const finalLessonCompleted = Boolean(finalProgressRow?.completed);

    if (!finalLessonCompleted) {
      return NextResponse.json({
        ok: true,
        levelCompleted: false,
        reason: "Final lesson not completed yet",
      });
    }

    const { data: existingCertificate, error: existingError } = await supabase
      .from("level_certificates")
      .select("*")
      .eq("student_id", studentId)
      .eq("level_no", levelNo)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        { ok: false, error: existingError.message },
        { status: 500 }
      );
    }

    if (existingCertificate) {
      return NextResponse.json({
        ok: true,
        levelCompleted: true,
        certificateExists: true,
        certificate: existingCertificate,
      });
    }

    const insertPayload = {
      student_id: studentId,
      level_no: levelNo,
      certificate_title: "Certificate of Completion",
    };

    const { data: insertedCertificate, error: insertError } = await supabase
      .from("level_certificates")
      .insert(insertPayload)
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { ok: false, error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      levelCompleted: true,
      certificateCreated: true,
      certificate: insertedCertificate,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Unexpected error",
      },
      { status: 500 }
    );
  }
}