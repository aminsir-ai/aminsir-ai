import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabaseclient.js";

export async function POST(request) {
  try {
    const body = await request.json();
    const name = String(body?.name || "").trim();
    const pin = String(body?.pin || "").trim();

    if (!name || !pin) {
      return NextResponse.json(
        { error: "Missing name or pin" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("students")
      .select("id, name, pin")
      .eq("name", name)
      .eq("pin", pin)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: error.message || "Login failed" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Invalid login" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      student: {
        id: data.id,
        name: data.name,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Server error" },
      { status: 500 }
    );
  }
}