import Link from "next/link";

export default function Home() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#0f172a",
        color: "white",
        fontFamily: "Arial",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: 48, marginBottom: 10 }}>Amin Sir AI Tutor</h1>

      <p style={{ fontSize: 20, marginBottom: 30 }}>
        Learn English Speaking with your AI Teacher
      </p>

      <Link
        href="/chat"
        style={{
          padding: "14px 26px",
          borderRadius: 12,
          background: "#22c55e",
          color: "#0b1220",
          fontWeight: 700,
          textDecoration: "none",
          fontSize: "18px",
        }}
      >
        Start Learning
      </Link>
    </main>
  );
}