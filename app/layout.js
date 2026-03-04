import "./globals.css";

export const metadata = {
  title: "AminSir AI",
  description: "AI Tutor",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}