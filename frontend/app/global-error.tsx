"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="m-0 bg-[#dfdfe3] text-[#090c24]">
        <main className="flex min-h-screen items-center justify-center px-4 py-10">
          <section className="w-full max-w-lg rounded-2xl border border-[#c6c7d3] bg-white p-8 shadow-sm">
            <h1 className="font-display text-3xl font-bold text-telesur-blue">
              Critical application error
            </h1>
            <p className="mt-3 text-sm text-slate-600">
              A global error boundary was triggered. Retry first, then return home.
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {error?.message || "Unexpected error"}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={reset}
                className="rounded-xl bg-telesur-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-telesur-blue-light"
                type="button"
              >
                Retry
              </button>
              <Link
                href="/"
                className="rounded-xl border border-telesur-blue px-5 py-2.5 text-sm font-semibold text-telesur-blue transition hover:bg-telesur-blue hover:text-white"
              >
                Home
              </Link>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
