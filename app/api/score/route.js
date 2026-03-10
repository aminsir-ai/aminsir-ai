import { NextResponse } from "next/server";

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function quickHeuristicScore({ transcript = "", seconds = 0 }) {
  const text = (transcript || "").trim();
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;

  // Base score from time (so 38 sec is not 0)
  // 10 sec ~ 10, 30 sec ~ 25, 60 sec ~ 45, 120 sec ~ 65 (approx)
  const timeScore = clamp(Math.round(5 + seconds * 0.5), 0, 70);

  // Boost from transcript content
  const contentBoost = clamp(Math.round(words * 0.7), 0, 30);

  const score = clamp(timeScore + contentBoost, 0, 100);

  // Categories: if no transcript, keep low-but-not-zero based on time
  const hasText = words >= 6;

  const pronunciation = clamp(hasText ? score - 5 : Math.round(timeScore * 0.6), 0, 100);
  const vocabulary = clamp(hasText ? score - 10 : Math.round(timeScore * 0.5), 0, 100);
  const fluency = clamp(hasText ? score : Math.round(timeScore * 0.7), 0, 100);
  const grammar = clamp(hasText ? score - 12 : Math.round(timeScore * 0.45), 0, 100);
  const confidence = clamp(hasText ? score - 3 : Math.round(timeScore * 0.65), 0, 100);

  let level = "Beginner";
  if (score >= 75) level = "Advanced";
  else if (score >= 50) level = "Intermediate";

  const good = [];
  const fix = [];
  const vocab = [];

  if (seconds >= 20) good.push("You spoke continuously.");
  if (seconds >= 35) good.push("Good effort and confidence.");
  if (hasText) good.push("You formed sentences.");

  if (!hasText) {
    fix.push("Transcript not captured. Click Start Voice and speak clearly near mic.");
    fix.push("Try Chrome/Edge desktop for better live transcript.");
  } else {
    if (words < 25) fix.push("Try longer answers (2–3 sentences).");
    fix.push("Add 3 new words in each answer.");
  }

  if (hasText) {
    const common = ["hello", "thank", "because", "today", "yesterday", "tomorrow", "school", "work", "family", "practice"];
    vocab.push(...common.slice(0, 6));
  } else {
    vocab.push("hello", "thank you", "please", "because", "I think", "I want");
  }

  const tip = hasText
    ? "Speak daily 2 minutes: answer with 2 sentences + 1 reason (because...)."
    : "If transcript stays empty, we can switch to a simple manual 'type your sentence' input for scoring.";

  return {
    score,
    level,
    categories: { pronunciation, vocabulary, fluency, grammar, confidence },
    good,
    fix,
    vocab,
    tip,
  };
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));

    const transcript = String(body?.transcript || "");
    const seconds = Number(body?.seconds || 0);

    // ✅ Always return something meaningful
    const result = quickHeuristicScore({ transcript, seconds });

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e?.message || String(e) },
      { status: 500 }
    );
  }
}