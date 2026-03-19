import { supabase } from "../../../lib/supabaseclient.js";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const body = await req.json();

    const name = String(body?.name || "").trim();
    const pin = String(body?.pin || "").trim();

    if (!name || !pin) {
      return new Response(
        JSON.stringify({ error: "Missing name or pin" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const loginId = name.toLowerCase().replace(/\s+/g, "");
    const passwordHash = await bcrypt.hash(pin, 10);

    const { data: existingStudent, error: existingError } = await supabase
      .from("students")
      .select("id, login_id")
      .eq("login_id", loginId)
      .maybeSingle();

    if (existingError) {
      return new Response(
        JSON.stringify({ error: existingError.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (existingStudent) {
      return new Response(
        JSON.stringify({
          error: `Login ID already exists: ${loginId}`,
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { error } = await supabase.from("students").insert([
      {
        name,
        login_id: loginId,
        password_hash: passwordHash,
        is_active: true,
      },
    ]);

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Student added successfully",
        loginId,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err?.message || "Server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}