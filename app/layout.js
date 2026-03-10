import "./globals.css";

export const metadata = {
  title: "AminSir AI",
  description: "AI Tutor",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily: "system-ui, Arial, sans-serif",
          background: "#f5f6fa",
        }}
      >
        {children}
      </body>
    </html>
  );
}