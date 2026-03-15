import { supabase } from "../../../lib/supabaseclient.js";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { loginId, password } = await req.json();

    if (!loginId || !password) {
      return new Response(
        JSON.stringify({ error: "Missing login ID or password" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { data: student, error } = await supabase
      .from("students")
      .select("id, name, login_id, password_hash, is_active")
      .eq("login_id", loginId)
      .maybeSingle();

    if (error || !student) {
      return new Response(
        JSON.stringify({ error: "Invalid login ID or password" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (student.is_active === false) {
      return new Response(
        JSON.stringify({ error: "Student account is inactive" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const ok = await bcrypt.compare(password, student.password_hash || "");

    if (!ok) {
      return new Response(
        JSON.stringify({ error: "Invalid login ID or password" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
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
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err?.message || String(err) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}