"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const AUTH_KEY = "aminsir_auth_v1";

function getAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function ChatPage() {
  const router = useRouter();
  const [user, setUser] = useState("");

  useEffect(() => {
    const auth = getAuth();
    if (!auth?.user) {
      router.replace("/login");
      return;
    }
    setUser(auth.user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function logout() {
    try {
      localStorage.removeItem(AUTH_KEY);
    } catch {}
    router.replace("/login");
  }

  if (!user) return <div style={{ padding: 18 }}>Loading...</div>;

  return (
    <div style={{ padding: 18, fontFamily: "system-ui, Arial" }}>
      <h2>Chat Protected ✅</h2>
      <div style={{ fontWeight: 800, marginTop: 10 }}>Logged in as: {user}</div>

      <button
        onClick={logout}
        style={{ marginTop: 16, padding: 12, borderRadius: 12, border: "1px solid #ddd", fontWeight: 900 }}
      >
        Logout
      </button>

      <div style={{ marginTop: 14, color: "#666" }}>
        If this page opens after login, then Supabase DB login is working correctly.
      </div>
    </div>
  );
}