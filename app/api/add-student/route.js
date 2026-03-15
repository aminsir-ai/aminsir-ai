import { supabase } from "../../../lib/supabaseclient.js";

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
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const { error } = await supabase
      .from("students")
      .insert([
        {
          name,
          pin,
          active: true
        }
      ]);

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err?.message || "Server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}