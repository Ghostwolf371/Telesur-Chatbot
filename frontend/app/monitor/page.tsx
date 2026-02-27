"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

/* ── Types ── */
type TelemetrySummary = {
  total_requests: number;
  error_requests: number;
  error_rate: number;
  avg_ttft_ms: number;
  avg_total_tokens_est: number;
};

type FeedbackSummary = {
  total_feedback: number;
  unique_testers: number;
  success_feedback: number;
  success_rate: number;
  avg_rating: number;
  by_scenario: Array<{ scenario: string; count: number }>;
};

type ConversationSummary = {
  total_messages: number;
  total_user_messages: number;
  sessions_with_user_messages: number;
};

type DashboardPayload = {
  telemetry: TelemetrySummary;
  feedback: FeedbackSummary;
  conversations: ConversationSummary;
  validation: {
    required: {
      testers: number;
      conversations: number;
      feedback_entries: number;
    };
    current: {
      testers: number;
      conversations: number;
      feedback_entries: number;
    };
    remaining: {
      testers: number;
      conversations: number;
      feedback_entries: number;
    };
    ready: boolean;
  };
};

type TelemetryItem = {
  endpoint: string;
  ttft_ms: number;
  total_tokens_est: number;
  status: "ok" | "error";
  created_at: string;
};

/* ── Helper ── */
function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "green" | "red" | "amber";
}) {
  const accentColor =
    accent === "green"
      ? "text-emerald-600"
      : accent === "red"
        ? "text-red-600"
        : accent === "amber"
          ? "text-amber-600"
          : "text-slate-800";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold ${accentColor}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

/* ── Page ── */
export default function MonitorPage() {
  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
    [],
  );

  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [telemetryItems, setTelemetryItems] = useState<TelemetryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [dRes, tRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/dashboard`),
        fetch(`${apiBaseUrl}/api/telemetry`),
      ]);
      if (!dRes.ok) throw new Error(`Dashboard API ${dRes.status}`);
      if (!tRes.ok) throw new Error(`Telemetry API ${tRes.status}`);

      const dData = (await dRes.json()) as DashboardPayload;
      const tData = (await tRes.json()) as { items: TelemetryItem[] };
      setDashboard(dData);
      setTelemetryItems(tData.items || []);
    } catch {
      setError("Could not load monitoring data. Verify backend availability.");
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    load();
    const iv = setInterval(load, 12000);
    return () => clearInterval(iv);
  }, [load]);

  const d = dashboard;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-slate-800">
            Monitoring Dashboard
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Live telemetry, feedback, and validation metrics.
          </p>
        </div>
        <button
          onClick={load}
          className="rounded-xl bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
          type="button"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading && !d && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Loading monitoring data…
        </div>
      )}

      {d && (
        <>
          {/* Rubric readiness banner */}
          <div
            className={`mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 ${
              d.validation.ready
                ? "border-emerald-200 bg-emerald-50"
                : "border-amber-200 bg-amber-50"
            }`}
          >
            <div>
              <p
                className={`text-sm font-semibold ${d.validation.ready ? "text-emerald-700" : "text-amber-700"}`}
              >
                {d.validation.ready
                  ? "✓ Rubric thresholds met"
                  : "⚠ Rubric thresholds incomplete"}
              </p>
              <p className="mt-0.5 text-xs text-slate-600">
                Testers {d.validation.current.testers}/
                {d.validation.required.testers} · Conversations{" "}
                {d.validation.current.conversations}/
                {d.validation.required.conversations} · Feedback{" "}
                {d.validation.current.feedback_entries}/
                {d.validation.required.feedback_entries}
              </p>
            </div>
            {!d.validation.ready && (
              <p className="text-xs text-amber-600">
                Need:{" "}
                {d.validation.remaining.testers > 0
                  ? `+${d.validation.remaining.testers} testers `
                  : ""}
                {d.validation.remaining.conversations > 0
                  ? `+${d.validation.remaining.conversations} conversations `
                  : ""}
                {d.validation.remaining.feedback_entries > 0
                  ? `+${d.validation.remaining.feedback_entries} feedback`
                  : ""}
              </p>
            )}
          </div>

          {/* Stat grid */}
          <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Requests"
              value={String(d.telemetry.total_requests)}
              sub={`${d.telemetry.error_requests} errors`}
            />
            <StatCard
              label="Error Rate"
              value={`${(d.telemetry.error_rate * 100).toFixed(1)}%`}
              accent={
                d.telemetry.error_rate > 0.1
                  ? "red"
                  : d.telemetry.error_rate > 0.02
                    ? "amber"
                    : "green"
              }
            />
            <StatCard
              label="Avg Latency"
              value={`${Math.round(d.telemetry.avg_ttft_ms)} ms`}
              sub="time to first token"
            />
            <StatCard
              label="Avg Tokens"
              value={String(Math.round(d.telemetry.avg_total_tokens_est))}
              sub="estimated per request"
            />
          </div>

          <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Conversations"
              value={String(d.conversations.sessions_with_user_messages)}
              sub={`${d.conversations.total_user_messages} user messages`}
            />
            <StatCard
              label="Feedback Entries"
              value={String(d.feedback.total_feedback)}
              sub={`${d.feedback.unique_testers} unique testers`}
            />
            <StatCard
              label="Success Rate"
              value={`${(d.feedback.success_rate * 100).toFixed(1)}%`}
              accent={
                d.feedback.success_rate >= 0.8
                  ? "green"
                  : d.feedback.success_rate >= 0.5
                    ? "amber"
                    : "red"
              }
            />
            <StatCard
              label="Avg Rating"
              value={`${d.feedback.avg_rating.toFixed(1)} / 5`}
              accent={
                d.feedback.avg_rating >= 4
                  ? "green"
                  : d.feedback.avg_rating >= 3
                    ? "amber"
                    : "red"
              }
            />
          </div>

          {/* Scenario breakdown */}
          {d.feedback.by_scenario.length > 0 && (
            <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-slate-700">
                Feedback by Scenario
              </h2>
              <div className="flex flex-wrap gap-2">
                {d.feedback.by_scenario.map((s) => (
                  <span
                    key={s.scenario}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600"
                  >
                    {s.scenario}: {s.count}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Telemetry log table */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">
              Recent API Calls
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400">
                    <th className="px-3 py-2 font-medium">Time</th>
                    <th className="px-3 py-2 font-medium">Endpoint</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Latency</th>
                    <th className="px-3 py-2 font-medium">Tokens</th>
                  </tr>
                </thead>
                <tbody>
                  {telemetryItems.slice(0, 25).map((item, idx) => (
                    <tr
                      key={`${item.endpoint}-${item.created_at}-${idx}`}
                      className="border-b border-slate-50 text-slate-600 last:border-0"
                    >
                      <td className="whitespace-nowrap px-3 py-2">
                        {new Date(item.created_at).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px]">
                        {item.endpoint}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                            item.status === "ok"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-3 py-2">{item.ttft_ms} ms</td>
                      <td className="px-3 py-2">{item.total_tokens_est}</td>
                    </tr>
                  ))}
                  {telemetryItems.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-6 text-center text-slate-400"
                      >
                        No telemetry data yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
