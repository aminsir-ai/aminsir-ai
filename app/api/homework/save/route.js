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

  const y = parts.find((p) => p.type === "year").value;
  const m = parts.find((p) => p.type === "month").value;
  const d = parts.find((p) => p.type === "day").value;
  return `${y}-${m}-${d}`;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const studentId = String(body?.studentId || "").trim();
    const sentences = Array.isArray(body?.sentences) ? body.sentences : [];

    if (!studentId) {
      return NextResponse.json({ ok: false, error: "studentId required" }, { status: 400 });
    }

    if (sentences.length !== 10) {
      return NextResponse.json({ ok: false, error: "Need exactly 10 sentences" }, { status: 400 });
    }

    const clean = sentences.map((s) => String(s || "").trim()).filter(Boolean);
    if (clean.length !== 10) {
      return NextResponse.json(
        { ok: false, error: "All 10 sentences must be non-empty" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const day = todayDubai();

    const { data, error } = await supabase
      .from("homework")
      .upsert(
        { student_id: studentId, day, sentences: clean },
        { onConflict: "student_id,day" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      day,
      sentences: data.sentences,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "homework/save failed", details: String(err) },
      { status: 500 }
    );
  }
}