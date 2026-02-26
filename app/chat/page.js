import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b1220] text-white">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">Amin Sir AI Tutor</h1>
        <p className="text-lg text-gray-300">
          Learn English Speaking with your AI Teacher
        </p>

        <Link
          href="/chat"
          className="inline-block rounded-lg bg-green-500 px-6 py-3 text-lg font-semibold hover:bg-green-600 transition"
        >
          Start Learning
        </Link>
      </div>
    </main>
  );
}