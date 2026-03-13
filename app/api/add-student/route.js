import { supabase } from "@/lib/supabaseClient";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { name, loginId, password } = await req.json();

    if (!name || !loginId || !password) {
      return new Response(
        JSON.stringify({ error: "Missing name, login ID or password" }),
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { error } = await supabase.from("students").insert([
      {
        name,
        login_id: loginId,
        password_hash: passwordHash,
        is_active: true,
      },
    ]);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
    });
  }
}