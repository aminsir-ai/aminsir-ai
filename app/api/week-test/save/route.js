import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function toInt(n, def = 0) {
  const x = Number(n);
  return Number.isFinite(x) ? Math.trunc(x) : def;
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));

    const studentId = String(body?.studentId || "").trim();
    const score = toInt(body?.score, -1);

    // optional extras (from AI grading)
    const level = String(body?.level || "beginner").trim() || "beginner";
    const courseWeekFromClient = toInt(body?.courseWeek, 0);

    const fluency = body?.fluency != null ? toInt(body.fluency, null) : null;
    const grammar = body?.grammar != null ? toInt(body.grammar, null) : null;
    const vocabulary = body?.vocabulary != null ? toInt(body.vocabulary, null) : null;
    const pronunciation = body?.pronunciation != null ? toInt(body.pronunciation, null) : null;
    const confidence = body?.confidence != null ? toInt(body.confidence, null) : null;

    const feedback = body?.feedback != null ? String(body.feedback).slice(0, 1000) : null;
    const transcript = body?.transcript != null ? String(body.transcript).slice(0, 8000) : null;

    if (!studentId) {
      return NextResponse.json({ ok: false, error: "studentId required" }, { status: 400 });
    }

    if (!Number.isFinite(score) || score < 0 || score > 100) {
      return NextResponse.json({ ok: false, error: "score must be 0–100" }, { status: 400 });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { ok: false, error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1) Read student
    const { data: stu, error: readErr } = await supabase
      .from("students")
      .select("pin, course_week")
      .eq("pin", studentId)
      .maybeSingle();

    if (readErr) {
      return NextResponse.json(
        { ok: false, error: "DB read failed", details: readErr.message },
        { status: 500 }
      );
    }

    if (!stu?.pin) {
      return NextResponse.json(
        { ok: false, error: `Student not found for pin ${studentId}` },
        { status: 404 }
      );
    }

    const currentWeek = toInt(stu.course_week, 1);

    // If client sent a week, we still trust DB as source of truth:
    // Use DB week for "attempt week"
    const attemptWeek = currentWeek || courseWeekFromClient || 1;

    // 2) Decide pass/fail
    const passMark = 80;
    const passed = score >= passMark;

    // Only move forward by 1 week when passed.
    // Also cap at 12 (optional; change if you want more weeks)
    const maxWeek = 12;
    const movedToWeek = passed
      ? Math.min((currentWeek || 1) + 1, maxWeek)
      : (currentWeek || 1);

    // 3) Save attempt history
    const { error: insErr } = await supabase.from("week_test_attempts").insert({
      student_id: studentId,
      course_week: attemptWeek,
      level,
      score,
      passed,
      fluency,
      grammar,
      vocabulary,
      pronunciation,
      confidence,
      feedback,
      transcript,
    });

    if (insErr) {
      return NextResponse.json(
        { ok: false, error: "Failed to save attempt history", details: insErr.message },
        { status: 500 }
      );
    }

    // 4) Update student record (score + pass flag + week if passed)
    // NOTE: column names assumed from your earlier steps
    const { error: updErr } = await supabase
      .from("students")
      .update({
        week_test_score: score,
        week_test_passed: passed,
        course_week: movedToWeek,
      })
      .eq("pin", studentId);

    if (updErr) {
      return NextResponse.json(
        { ok: false, error: "Failed to update student week", details: updErr.message },
        { status: 500 }
      );
    }

    // 5) Return clear lock / unlock message
    if (passed) {
      return NextResponse.json({
        ok: true,
        passed: true,
        passMark,
        score,
        courseWeekBefore: currentWeek,
        movedToWeek,
        message: `Passed ✅ Unlocked Week ${movedToWeek}`,
        locked: false,
      });
    }

    return NextResponse.json({
      ok: true,
      passed: false,
      passMark,
      score,
      courseWeekBefore: currentWeek,
      movedToWeek: currentWeek,
      message: `Not passed ❌ (Need ${passMark}%) — Week ${currentWeek} is locked. Practice and try again.`,
      locked: true,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Server error in /api/week-test/save", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}