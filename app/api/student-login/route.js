import { supabase } from "@/lib/supabaseClient";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { loginId, password } = await req.json();

    if (!loginId || !password) {
      return new Response(
        JSON.stringify({ error: "Missing login ID or password" }),
        { status: 400 }
      );
    }

    const { data: student, error } = await supabase
      .from("students")
      .select("id, name, login_id, password_hash, is_active")
      .eq("login_id", loginId)
      .single();

    if (error || !student) {
      return new Response(
        JSON.stringify({ error: "Invalid login ID or password" }),
        { status: 401 }
      );
    }

    if (student.is_active === false) {
      return new Response(
        JSON.stringify({ error: "Student account is inactive" }),
        { status: 403 }
      );
    }

    const ok = await bcrypt.compare(password, student.password_hash || "");

    if (!ok) {
      return new Response(
        JSON.stringify({ error: "Invalid login ID or password" }),
        { status: 401 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        student: {
          id: student.id,
          name: student.name,
          loginId: student.login_id,
        },
      }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
    });
  }
}