// lib/phraseTracker.js

import { LEVEL5_MASTER_PHRASES } from "./level5MasterPhrases";

function normalizeText(text = "") {
  return String(text).toLowerCase().trim();
}

function getMasterPhraseItems() {
  if (!Array.isArray(LEVEL5_MASTER_PHRASES)) return [];

  return LEVEL5_MASTER_PHRASES
    .map((item) => ({
      module: Number(item?.module || 0),
      phrase: String(item?.phrase || "").trim(),
      normalized: normalizeText(item?.phrase || ""),
    }))
    .filter((item) => item.module > 0 && item.phrase && item.normalized);
}

function getGroupedModules() {
  const items = getMasterPhraseItems();
  const moduleMap = new Map();

  items.forEach((item) => {
    if (!moduleMap.has(item.module)) {
      moduleMap.set(item.module, []);
    }

    const currentList = moduleMap.get(item.module);

    if (!currentList.some((p) => p.normalized === item.normalized)) {
      currentList.push(item);
    }
  });

  return Array.from(moduleMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([moduleNumber, phrases]) => ({
      weekId: `module-${moduleNumber}`,
      weekName: `Module ${moduleNumber}`,
      moduleNumber,
      phrases,
    }));
}

function getAllLevel5Phrases() {
  const grouped = getGroupedModules();
  const allMap = new Map();

  grouped.forEach((group) => {
    group.phrases.forEach((item) => {
      if (!allMap.has(item.normalized)) {
        allMap.set(item.normalized, item);
      }
    });
  });

  return Array.from(allMap.values());
}

export function detectLevel5Phrases(text = "") {
  const cleanText = normalizeText(text);
  if (!cleanText) return [];

  const allPhrases = getAllLevel5Phrases();
  const detectedMap = new Map();

  allPhrases.forEach((item) => {
    if (cleanText.includes(item.normalized)) {
      detectedMap.set(item.normalized, {
        phrase: item.phrase,
        found: true,
        module: item.module,
      });
    }
  });

  return Array.from(detectedMap.values());
}

export function getLevel5PhraseProgress(detectedPhrases = []) {
  const allPhrases = getAllLevel5Phrases();
  const totalCount = allPhrases.length;

  const uniqueDetected = new Map();

  detectedPhrases.forEach((item) => {
    const normalized = normalizeText(item?.phrase || "");
    if (normalized) {
      uniqueDetected.set(normalized, true);
    }
  });

  const foundCount = uniqueDetected.size;
  const percentage =
    totalCount === 0 ? 0 : Math.round((foundCount / totalCount) * 100);

  return {
    foundCount,
    totalCount,
    percentage,
  };
}

export function getLevel5WeeklyProgress(detectedPhrases = []) {
  const grouped = getGroupedModules();

  const detectedSet = new Set(
    detectedPhrases
      .map((item) => normalizeText(item?.phrase || ""))
      .filter(Boolean)
  );

  return grouped.map((group) => {
    const mastered = [];
    const remaining = [];

    group.phrases.forEach((item) => {
      if (detectedSet.has(item.normalized)) {
        mastered.push(item.phrase);
      } else {
        remaining.push(item.phrase);
      }
    });

    const totalCount = group.phrases.length;
    const foundCount = mastered.length;
    const percentage =
      totalCount === 0 ? 0 : Math.round((foundCount / totalCount) * 100);

    return {
      weekId: group.weekId,
      weekName: group.weekName,
      totalCount,
      foundCount,
      percentage,
      mastered,
      remaining,
    };
  });
}