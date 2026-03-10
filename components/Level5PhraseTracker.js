"use client";

import { getLevel5WeeklyProgress } from "@/lib/phraseTracker";

function getMasteryLabel(percentage = 0) {
  if (percentage >= 80) return "Fluent";
  if (percentage >= 50) return "Intermediate";
  if (percentage >= 20) return "Beginner+";
  return "Beginner";
}

function PhraseList({ items = [], prefix = "○", color = "gray" }) {
  if (!items.length) return null;

  const itemClass =
    color === "green"
      ? "rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700"
      : "rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700";

  return (
    <div className="mt-3 space-y-2">
      {items.map((item, index) => (
        <div key={`${item}-${index}`} className={itemClass}>
          {prefix} {item}
        </div>
      ))}
    </div>
  );
}

export default function Level5PhraseTracker({
  detectedPhrases = [],
  progress = {},
}) {
  const weeklyProgress = getLevel5WeeklyProgress(detectedPhrases);
  const overallPercentage = progress.percentage || 0;
  const masteryLabel = getMasteryLabel(overallPercentage);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-lg font-semibold text-gray-900">
              Overall Progress
            </div>
            <div className="mt-1 text-sm text-gray-600">
              {progress.foundCount || 0} / {progress.totalCount || 0} phrases mastered
            </div>
          </div>

          <div className="inline-flex w-fit items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-sm font-medium text-gray-700">
            Mastery: {masteryLabel}
          </div>
        </div>

        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-black transition-all"
            style={{ width: `${overallPercentage}%` }}
          />
        </div>

        <div className="mt-2 text-sm text-gray-600">
          Completion: {overallPercentage}%
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="text-lg font-semibold text-gray-900">
          Detected Phrases
        </div>

        {detectedPhrases.length === 0 ? (
          <div className="mt-3 text-sm text-gray-500">
            No phrases detected yet.
          </div>
        ) : (
          <PhraseList
            items={detectedPhrases.map((item) => item.phrase)}
            prefix="✓"
            color="green"
          />
        )}
      </div>

      <div className="space-y-4">
        <div className="text-lg font-semibold text-gray-900">
          Weekly Phrase Dashboard
        </div>

        {weeklyProgress.map((week) => (
          <div
            key={week.weekId}
            className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-base font-semibold text-gray-900">
                  {week.weekName}
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  Progress: {week.foundCount} / {week.totalCount} ({week.percentage}%)
                </div>
              </div>

              <div className="inline-flex w-fit items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700">
                {getMasteryLabel(week.percentage)}
              </div>
            </div>

            <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-black transition-all"
                style={{ width: `${week.percentage}%` }}
              />
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <div>
                <div className="text-sm font-semibold text-gray-800">
                  Mastered
                </div>

                {week.mastered.length === 0 ? (
                  <div className="mt-2 text-sm text-gray-500">None yet</div>
                ) : (
                  <PhraseList items={week.mastered} prefix="✓" color="green" />
                )}
              </div>

              <div>
                <div className="text-sm font-semibold text-gray-800">
                  Remaining
                </div>

                {week.remaining.length === 0 ? (
                  <div className="mt-2 text-sm text-gray-500">
                    All phrases completed
                  </div>
                ) : (
                  <PhraseList items={week.remaining} prefix="○" color="gray" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}