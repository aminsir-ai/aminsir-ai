import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const body = await request.json();
    const text = String(body?.text || "").trim();

    if (!text) {
      return new Response("Text is required", { status: 400 });
    }

    const mp3 = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: text,
      speed: 1.05,   // 🔥 faster + energetic
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("TTS route error:", error);
    return new Response("Failed to generate speech", { status: 500 });
  }
}