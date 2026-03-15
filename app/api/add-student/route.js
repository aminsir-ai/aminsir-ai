import { supabase } from "@/lib/supabaseclient";

export async function POST(req) {
  try {
    const { name, pin } = await req.json();

    if (!name || !pin) {
      return new Response(JSON.stringify({ error: "Missing name or pin" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const cleanName = String(name).trim();
    const cleanPin = String(pin).trim();

    if (!cleanName || !cleanPin) {
      return new Response(JSON.stringify({ error: "Missing name or pin" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { error } = await supabase
      .from("students")
      .insert([{ name: cleanName, pin: cleanPin, active: true }]);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
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