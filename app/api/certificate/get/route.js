import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  try {
    const body = await req.json();
    const { student_id, level_no } = body;

    if (!student_id || !level_no) {
      return NextResponse.json({ ok: false, error: "Missing parameters" });
    }

    const { data, error } = await supabase
      .from("level_certificates")
      .select("*")
      .eq("student_id", student_id)
      .eq("level_no", level_no)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message });
    }

    if (!data) {
      return NextResponse.json({ ok: true, certificate: null });
    }

    return NextResponse.json({
      ok: true,
      certificate: data
    });

  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message });
  }
}