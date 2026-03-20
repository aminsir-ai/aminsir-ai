"use client";

import { useState } from "react";

export default function AdminPage() {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function addStudent(e) {
    e.preventDefault();
    setMessage("");

    const cleanName = String(name || "").trim();
    const cleanPin = String(pin || "").trim();

    if (!cleanName || !cleanPin) {
      setMessage("Please enter both name and PIN");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/add-student", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: cleanName,
          pin: cleanPin,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(`Student added successfully! Login ID: ${data.loginId}`);
        setName("");
        setPin("");
      } else {
        setMessage(data?.error || "Error adding student");
      }
    } catch (err) {
      setMessage("Something went wrong while adding student");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center">
        <div className="w-full rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
          <div className="text-center">
            <p className="text-sm text-slate-400">AminSirAI</p>
            <h1 className="mt-2 text-2xl font-bold">Admin Panel</h1>
            <p className="mt-2 text-sm text-slate-300">
              Add a new student for speaking practice
            </p>
          </div>

          <form onSubmit={addStudent} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm text-slate-300">
                Student Name
              </label>
              <input
                type="text"
                placeholder="Enter student name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">
                PIN / Password
              </label>
              <input
                type="text"
                placeholder="Enter PIN or password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none"
              />
            </div>

            {message ? (
              <div className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200">
                {message}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-white px-4 py-3 font-semibold text-slate-950 disabled:opacity-50"
            >
              {loading ? "Adding Student..." : "Add Student"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}