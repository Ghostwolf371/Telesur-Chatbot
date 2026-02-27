import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-16">
      <section className="mx-auto w-full max-w-xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-600 text-2xl font-bold text-white shadow-lg">
          T
        </div>

        <h1 className="font-display mt-6 text-3xl font-bold text-slate-900 sm:text-4xl">
          Telesur TeleBot
        </h1>
        <p className="mx-auto mt-3 max-w-md text-base text-slate-500">
          Your AI assistant for mobile plans, fiber internet, and entertainment
          services. Get instant, accurate answers 24/7.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/chat"
            className="inline-flex h-11 items-center rounded-xl bg-sky-600 px-7 text-sm font-semibold text-white shadow-md transition hover:bg-sky-700 active:scale-[0.98]"
          >
            Start Chat
          </Link>
          <Link
            href="/monitor"
            className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-7 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
          >
            View Dashboard
          </Link>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 font-medium text-sky-700">
            Mobile
          </span>
          <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 font-medium text-sky-700">
            Fiber
          </span>
          <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 font-medium text-sky-700">
            Entertainment
          </span>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
            OpenAI Powered
          </span>
        </div>
      </section>
    </main>
  );
}
