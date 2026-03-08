import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#dfdfe3] px-4 py-10 text-[#090c24]">
      <section className="w-full max-w-lg rounded-2xl border border-[#c6c7d3] bg-white p-8 shadow-sm">
        <h1 className="font-display text-4xl font-bold text-telesur-blue">404</h1>
        <p className="mt-3 text-sm text-slate-600">
          This page does not exist.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl bg-telesur-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-telesur-blue-light"
        >
          Return home
        </Link>
      </section>
    </main>
  );
}
