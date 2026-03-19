import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const body = await req.json();
    const text = String(body?.text || "").trim();

    if (!text) {
      return new Response("Missing text", { status: 400 });
    }

    const mp3 = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "cedar",
      input: text,
      format: "mp3",
      instructions:
        "Speak in a warm, natural, friendly teacher voice. Keep the tone calm, clear, and conversational. Avoid sounding robotic. Pronounce simple Indian names naturally when possible.",
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
    console.error("tts route error:", error);
    return new Response("TTS failed", { status: 500 });
  }
}