import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { COURSE_DATA } from "@/lib/courseData";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function getAllLevels() {
  return Array.isArray(COURSE_DATA?.levels) ? COURSE_DATA.levels : [];
}

function getLevelNumberFromId(levelId) {
  const match = String(levelId || "").match(/level(\d+)/i);
  return match ? Number(match[1]) : 1;
}

function getLevelStructure(levelNo) {
  const levelObj =
    getAllLevels().find((item) => getLevelNumberFromId(item.id) === Number(levelNo)) || null;

  const weeks = Array.isArray(levelObj?.weeks) ? levelObj.weeks : [];

  if (!weeks.length) {
    return {
      levelNo: Number(levelNo),
      weeks: [
        { weekNo: 1, totalDays: 7 },
        { weekNo: 2, totalDays: 7 },
        { weekNo: 3, totalDays: 7 },
        { weekNo: 4, totalDays: 7 },
      ],
    };
  }

  return {
    levelNo: Number(levelNo),
    weeks: weeks.map((week, index) => ({
      weekNo: index + 1,
      totalDays: Array.isArray(week?.days) && week.days.length ? week.days.length : 7,
    })),
  };
}

function getLastLesson(weeks) {
  const lastWeek = weeks[weeks.length - 1] || { weekNo: 4, totalDays: 7 };
  return {
    weekNo: Number(lastWeek.weekNo || 4),
    dayNo: Number(lastWeek.totalDays || 7),
  };
}

function buildProgressMaps(rows) {
  const rowMap = new Map();
  const completedSet = new Set();

  for (const row of rows) {
    const weekNo = Number(row.week_no || 0);
    const dayNo = Number(row.day_no || 0);
    const key = `${weekNo}-${dayNo}`;

    rowMap.set(key, row);

    if (row.completed) {
      completedSet.add(key);
    }
  }

  return { rowMap, completedSet };
}

function findFirstIncompleteLesson(weeks, rowMap, completedSet) {
  for (const week of weeks) {
    for (let day = 1; day <= Number(week.totalDays || 7); day += 1) {
      const key = `${week.weekNo}-${day}`;

      if (!completedSet.has(key)) {
        const currentRow = rowMap.get(key) || null;

        return {
          weekNo: week.weekNo,
          dayNo: day,
          starsEarned: currentRow?.stars_earned || 0,
          sentencesSpoken: currentRow?.sentences_spoken || 0,
          roundsCompleted: currentRow?.rounds_completed || 0,
          completed: Boolean(currentRow?.completed),
          levelCompleted: false,
        };
      }
    }
  }

  return null;
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = String(searchParams.get("studentId") || "").trim();

    if (!studentId) {
      return NextResponse.json(
        { ok: false, error: "studentId required" },
        { status: 400 }
      );
    }

    const allLevels = getAllLevels();

    if (!allLevels.length) {
      return NextResponse.json(
        { ok: false, error: "No course levels found in COURSE_DATA" },
        { status: 500 }
      );
    }

    for (const level of allLevels) {
      const levelNo = getLevelNumberFromId(level.id);
      const { weeks } = getLevelStructure(levelNo);
      const lastLesson = getLastLesson(weeks);

      const { data, error } = await supabase
        .from("level_progress")
        .select("*")
        .eq("student_id", studentId)
        .eq("level_no", levelNo)
        .order("week_no", { ascending: true })
        .order("day_no", { ascending: true });

      if (error) {
        return NextResponse.json(
          { ok: false, error: error.message },
          { status: 500 }
        );
      }

      const rows = Array.isArray(data) ? data : [];

      if (!rows.length) {
        return NextResponse.json({
          ok: true,
          levelNo,
          weekNo: 1,
          dayNo: 1,
          starsEarned: 0,
          sentencesSpoken: 0,
          roundsCompleted: 0,
          completed: false,
          levelCompleted: false,
        });
      }

      const { rowMap, completedSet } = buildProgressMaps(rows);

      const firstIncomplete = findFirstIncompleteLesson(weeks, rowMap, completedSet);

      if (firstIncomplete) {
        return NextResponse.json({
          ok: true,
          levelNo,
          weekNo: firstIncomplete.weekNo,
          dayNo: firstIncomplete.dayNo,
          starsEarned: firstIncomplete.starsEarned,
          sentencesSpoken: firstIncomplete.sentencesSpoken,
          roundsCompleted: firstIncomplete.roundsCompleted,
          completed: firstIncomplete.completed,
          levelCompleted: false,
        });
      }

      const lastKey = `${lastLesson.weekNo}-${lastLesson.dayNo}`;
      const lastRow = rowMap.get(lastKey) || null;

      const isFinalLevel = levelNo === getLevelNumberFromId(allLevels[allLevels.length - 1]?.id);

      if (isFinalLevel) {
        return NextResponse.json({
          ok: true,
          levelNo,
          weekNo: lastLesson.weekNo,
          dayNo: lastLesson.dayNo,
          starsEarned: lastRow?.stars_earned || 0,
          sentencesSpoken: lastRow?.sentences_spoken || 0,
          roundsCompleted: lastRow?.rounds_completed || 0,
          completed: true,
          levelCompleted: true,
        });
      }

      // otherwise continue loop and promote student to next level automatically
    }

    // fallback safety
    const lastCourseLevelNo = getLevelNumberFromId(allLevels[allLevels.length - 1]?.id);
    const { weeks: lastWeeks } = getLevelStructure(lastCourseLevelNo);
    const lastLesson = getLastLesson(lastWeeks);

    return NextResponse.json({
      ok: true,
      levelNo: lastCourseLevelNo,
      weekNo: lastLesson.weekNo,
      dayNo: lastLesson.dayNo,
      starsEarned: 0,
      sentencesSpoken: 0,
      roundsCompleted: 0,
      completed: true,
      levelCompleted: true,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to read progress" },
      { status: 500 }
    );
  }
}