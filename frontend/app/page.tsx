import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-16">
      <section className="mx-auto w-full max-w-xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-telesur-yellow shadow-lg">
          <Image
            src="/telesur-logo.png"
            alt="Telesur logo"
            width={128}
            height={128}
            className="h-full w-full object-cover"
            priority
            quality={100}
          />
        </div>

        <h1 className="font-display mt-6 text-3xl font-bold text-telesur-blue sm:text-4xl">
          Telesur TeleBot
        </h1>
        <p className="mx-auto mt-3 max-w-md text-base text-slate-500">
          Your AI assistant for mobile plans, fiber internet, and entertainment
          services. Get instant, accurate answers 24/7.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/chat"
            className="inline-flex h-11 items-center rounded-xl bg-telesur-blue px-7 text-sm font-semibold text-white shadow-md transition hover:bg-telesur-blue-light active:scale-[0.98]"
          >
            Start Chat
          </Link>
          <Link
            href="/monitor"
            className="inline-flex h-11 items-center rounded-xl border-2 border-telesur-blue bg-white px-7 text-sm font-semibold text-telesur-blue shadow-sm transition hover:bg-telesur-blue hover:text-white active:scale-[0.98]"
          >
            View Dashboard
          </Link>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="rounded-full border border-telesur-blue/20 bg-telesur-blue/5 px-3 py-1 font-medium text-telesur-blue">
            Mobile
          </span>
          <span className="rounded-full border border-telesur-blue/20 bg-telesur-blue/5 px-3 py-1 font-medium text-telesur-blue">
            Fiber
          </span>
          <span className="rounded-full border border-telesur-blue/20 bg-telesur-blue/5 px-3 py-1 font-medium text-telesur-blue">
            Entertainment
          </span>
          <span className="rounded-full border border-telesur-yellow-dark/30 bg-telesur-yellow/10 px-3 py-1 font-medium text-telesur-blue">
            OpenAI Powered
          </span>
        </div>
      </section>
    </main>
  );
}
