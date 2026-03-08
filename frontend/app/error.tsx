"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Keep error visible in dev tools for debugging.
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#dfdfe3] px-4 py-10 text-[#090c24]">
      <section className="w-full max-w-lg rounded-2xl border border-[#c6c7d3] bg-white p-8 shadow-sm">
        <h1 className="font-display text-3xl font-bold text-telesur-blue">
          Something went wrong
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          The page failed to render. You can retry or return home.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={reset}
            className="rounded-xl bg-telesur-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-telesur-blue-light"
            type="button"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-xl border border-telesur-blue px-5 py-2.5 text-sm font-semibold text-telesur-blue transition hover:bg-telesur-blue hover:text-white"
          >
            Go home
          </Link>
        </div>
      </section>
    </main>
  );
}
