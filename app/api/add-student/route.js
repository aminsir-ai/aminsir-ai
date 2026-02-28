import { supabase } from "@/lib/supabase";

export async function POST(req) {
  try {
    const { name, pin } = await req.json();

    if (!name || !pin) {
      return new Response(JSON.stringify({ error: "Missing name or pin" }), {
        status: 400,
      });
    }

    const { error } = await supabase
      .from("students")
      .insert([{ name, pin, active: true }]);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}