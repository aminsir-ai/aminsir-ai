import "./globals.css";

export const metadata = {
  title: "AminSirAI",
  description: "AminSirAI Speaking Coach",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}