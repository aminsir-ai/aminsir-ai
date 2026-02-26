export default function Home() {
  return (
    <main style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      background: "#0f172a",
      color: "white",
      fontFamily: "Arial"
    }}>
      <h1 style={{ fontSize: 48, marginBottom: 10 }}>Amin Sir AI Tutor</h1>
      <p style={{ fontSize: 20, marginBottom: 24 }}>
        Learn English Speaking with your AI Teacher
      </p>
      <a
        href="#"
        style={{
          padding: "12px 22px",
          borderRadius: 10,
          background: "#22c55e",
          color: "#0b1220",
          fontWeight: 700,
          textDecoration: "none"
        }}
      >
        Start Learning
      </a>
    </main>
  );
}