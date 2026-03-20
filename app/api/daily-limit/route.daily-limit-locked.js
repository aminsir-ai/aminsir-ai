import { supabase } from "../../../lib/supabaseclient.js";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const body = await req.json();
    const studentId = String(body?.studentId || "").trim();

    if (!studentId) {
      return new Response(
        JSON.stringify({ error: "Missing studentId" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("simple_practice_sessions")
      .select("duration_seconds, session_date")
      .eq("student_id", studentId);

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const usedSecondsToday = (data || [])
      .filter((row) => {
        const rowDate = new Date(row.session_date).toISOString().split("T")[0];
        return rowDate === today;
      })
      .reduce((sum, row) => sum + Number(row.duration_seconds || 0), 0);

    const dailyLimitSeconds = 15 * 60;
    const remainingSeconds = Math.max(dailyLimitSeconds - usedSecondsToday, 0);
    const blocked = remainingSeconds <= 0;

    return new Response(
      JSON.stringify({
        success: true,
        dailyLimitSeconds,
        usedSecondsToday,
        remainingSeconds,
        blocked,
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