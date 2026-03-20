"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const ADMIN_PASSWORD = "admin123";

export default function AdminPage() {
  const router = useRouter();

  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [adminPassword, setAdminPassword] = useState("");

  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = localStorage.getItem("adminAuthorized");
    if (saved === "true") {
      setAuthorized(true);
    }
    setChecking(false);
  }, []);

  function handleAdminLogin(e) {
    e.preventDefault();
    setMessage("");

    if (adminPassword !== ADMIN_PASSWORD) {
      setMessage("Wrong admin password");
      return;
    }

    localStorage.setItem("adminAuthorized", "true");
    setAuthorized(true);
    setMessage("");
  }

  function handleAdminLogout() {
    localStorage.removeItem("adminAuthorized");
    setAuthorized(false);
    setAdminPassword("");
    setMessage("");
    router.replace("/login");
  }

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

  if (checking) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-6 text-white">
        <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center">
          <div className="w-full rounded-3xl border border-slate-800 bg-slate-900 p-6 text-center">
            <p className="text-lg font-semibold">Checking admin access...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-6 text-white">
        <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center">
          <div className="w-full rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <div className="text-center">
              <p className="text-sm text-slate-400">AminSirAI</p>
              <h1 className="mt-2 text-2xl font-bold">Admin Login</h1>
              <p className="mt-2 text-sm text-slate-300">
                Enter admin password to continue
              </p>
            </div>

            <form onSubmit={handleAdminLogin} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Admin Password
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none"
                />
              </div>

              {message ? (
                <div className="rounded-2xl border border-red-800 bg-red-950/30 px-4 py-3 text-sm text-red-300">
                  {message}
                </div>
              ) : null}

              <button
                type="submit"
                className="w-full rounded-2xl bg-white px-4 py-3 font-semibold text-slate-950"
              >
                Login as Admin
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center">
        <div className="w-full rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="text-sm text-slate-400">AminSirAI</p>
              <h1 className="mt-2 text-2xl font-bold">Admin Panel</h1>
              <p className="mt-2 text-sm text-slate-300">
                Add a new student for speaking practice
              </p>
            </div>

            <button
              onClick={handleAdminLogout}
              className="rounded-2xl border border-red-700 bg-red-950/30 px-4 py-2 text-sm font-semibold text-white"
            >
              Logout
            </button>
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