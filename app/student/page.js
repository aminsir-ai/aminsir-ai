"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function getStoredStudent() {
  if (typeof window === "undefined") return null;

  try {
    const rawStudent = localStorage.getItem("student");
    const storedName = localStorage.getItem("studentName");
    const storedId = localStorage.getItem("studentId");

    if (rawStudent) {
      const parsed = JSON.parse(rawStudent);
      return {
        id: parsed?.id || parsed?.studentId || storedId || "",
        name: parsed?.name || storedName || "",
      };
    }

    if (storedName || storedId) {
      return {
        id: storedId || "",
        name: storedName || "",
      };
    }
  } catch {}

  return null;
}

export default function StudentHomePage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [student, setStudent] = useState(null);

  useEffect(() => {
    const storedStudent = getStoredStudent();

    if (!storedStudent?.name) {
      router.replace("/login");
      return;
    }

    setStudent(storedStudent);
    setCheckingAuth(false);
  }, [router]);

  const studentName = useMemo(() => {
    return student?.name || "Student";
  }, [student]);

  function handleLogout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("student");
      localStorage.removeItem("studentName");
      localStorage.removeItem("studentId");
      localStorage.removeItem("studentLoginId");
    }
    router.replace("/login");
  }

  function openDay1() {
    router.push("/day1");
  }

  function openPractice() {
    router.push("/ebook");
  }

  function openProgress() {
    router.push("/student/progress");
  }

  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-6 text-white">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 px-6 py-5 text-center">
            <p className="text-lg font-semibold">Checking student login...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-xl sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm text-slate-400">AminSirAI Student Portal</p>
              <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
                Welcome, {studentName}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Choose your learning mode and continue your English speaking journey.
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-2xl border border-red-700 bg-red-950/30 px-4 py-3 text-sm font-semibold text-white"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <button
            onClick={openDay1}
            className="rounded-3xl border border-slate-800 bg-slate-900 p-5 text-left shadow-lg transition hover:border-sky-600 hover:bg-slate-800"
          >
            <div className="text-3xl">📘</div>
            <h2 className="mt-3 text-xl font-bold">Start E-Book</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Open Day 1 lesson, listen to explanation, and prepare before practice.
            </p>
          </button>

          <button
            onClick={openPractice}
            className="rounded-3xl border border-slate-800 bg-slate-900 p-5 text-left shadow-lg transition hover:border-emerald-600 hover:bg-slate-800"
          >
            <div className="text-3xl">🎤</div>
            <h2 className="mt-3 text-xl font-bold">Practice</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Go directly to AminSirAI speaking practice.
            </p>
          </button>

          <button
            onClick={openProgress}
            className="rounded-3xl border border-slate-800 bg-slate-900 p-5 text-left shadow-lg transition hover:border-violet-600 hover:bg-slate-800"
          >
            <div className="text-3xl">📊</div>
            <h2 className="mt-3 text-xl font-bold">View Progress</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              See total sessions, best score, today’s usage, streak, and recent sessions.
            </p>
          </button>
        </div>
      </div>
    </main>
  );
}