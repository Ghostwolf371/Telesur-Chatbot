"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type FeedbackItem = {
  session_id: string;
  tester_id?: string;
  rating: number;
  success: boolean;
  scenario: string;
  user_question?: string;
  assistant_answer?: string;
  created_at: string;
};

type FeedbackSummary = {
  total_feedback: number;
  unique_testers: number;
  success_feedback: number;
  success_rate: number;
  avg_rating: number;
};

export default function FeedbackPage() {
  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
    [],
  );

  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [summary, setSummary] = useState<FeedbackSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await fetch(`${apiBaseUrl}/api/feedback`);
      if (!res.ok) throw new Error(`Feedback API ${res.status}`);
      const data = await res.json();
      setItems(data.items || []);
      setSummary(data.summary || null);
    } catch {
      setError("Could not load feedback data. Verify backend availability.");
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-slate-800">
            Feedback Log
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            All user feedback entries with question &amp; answer context.
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/monitor"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            ← Monitor
          </a>
          <button
            onClick={load}
            className="rounded-xl bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
            type="button"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Loading feedback data…
        </div>
      )}

      {/* Summary cards */}
      {summary && (
        <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Entries</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">{summary.total_feedback}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Positive Rate</p>
            <p className={`mt-1 text-2xl font-bold ${summary.success_rate >= 0.7 ? "text-emerald-600" : "text-red-600"}`}>
              {summary.total_feedback ? `${(summary.success_rate * 100).toFixed(0)}%` : "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">👍 Positive</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{summary.success_feedback}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">👎 Negative</p>
            <p className="mt-1 text-2xl font-bold text-red-600">{summary.total_feedback - summary.success_feedback}</p>
          </div>
        </div>
      )}

      {/* Feedback entries */}
      {!isLoading && (
        <div className="space-y-3">
          {items.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
              No feedback entries yet. Feedback is collected when users click 👍 or 👎 on chat responses.
            </div>
          )}

          {items.map((fb, idx) => (
            <div
              key={`fb-${fb.session_id}-${idx}`}
              className="rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Compact header row */}
              <button
                type="button"
                onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                className="flex w-full items-center gap-3 px-5 py-3 text-left"
              >
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${
                    fb.rating >= 4
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {fb.rating >= 4 ? "👍" : "👎"}
                </span>
                <span className="flex-1 truncate text-sm text-slate-700">
                  {fb.user_question || "No question recorded"}
                </span>
                <span className="whitespace-nowrap text-xs text-slate-400">
                  {new Date(fb.created_at).toLocaleString()}
                </span>
                <span className="text-slate-300">{expandedRow === idx ? "▲" : "▼"}</span>
              </button>

              {/* Expanded detail */}
              {expandedRow === idx && (
                <div className="border-t border-slate-100 px-5 py-4 space-y-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      User Question
                    </p>
                    <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      {fb.user_question || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Bot Answer
                    </p>
                    <p className="rounded-lg bg-blue-50/50 px-3 py-2 text-sm text-slate-600 whitespace-pre-wrap">
                      {fb.assistant_answer || "—"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-slate-400 pt-1">
                    <span>Session: <code className="text-slate-500">{fb.session_id.slice(0, 16)}…</code></span>
                    <span>Scenario: <code className="text-slate-500">{fb.scenario}</code></span>
                    {fb.tester_id && <span>Tester: <code className="text-slate-500">{fb.tester_id}</code></span>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
