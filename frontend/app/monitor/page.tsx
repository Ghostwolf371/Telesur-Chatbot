"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

/* ── Types ── */
type TelemetrySummary = {
  total_requests: number;
  error_requests: number;
  error_rate: number;
  avg_ttft_ms: number;
  avg_total_tokens_est: number;
  total_tokens_sum: number;
  cost_usd_est: number;
};

type FeedbackSummary = {
  total_feedback: number;
  unique_testers: number;
  success_feedback: number;
  success_rate: number;
  avg_rating: number;
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
            Live telemetry and performance metrics.
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
          {/* Stat grid */}
          <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
            <StatCard
              label="Estimated Cost"
              value={`$${d.telemetry.cost_usd_est.toFixed(4)}`}
              sub={`${d.telemetry.total_tokens_sum.toLocaleString()} total tokens · gpt-4o-mini`}
            />
            <StatCard
              label="Conversations"
              value={String(d.conversations.sessions_with_user_messages)}
              sub={`${d.conversations.total_user_messages} user messages`}
            />
          </div>

          {/* Feedback summary */}
          {d.feedback && (
            <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Feedback Entries"
                value={String(d.feedback.total_feedback)}
                sub={`${d.feedback.unique_testers} unique testers`}
              />
              <StatCard
                label="Avg Rating"
                value={d.feedback.avg_rating ? `${d.feedback.avg_rating.toFixed(1)}/5` : "—"}
                accent={
                  d.feedback.avg_rating >= 4
                    ? "green"
                    : d.feedback.avg_rating >= 3
                      ? "amber"
                      : d.feedback.avg_rating > 0
                        ? "red"
                        : undefined
                }
              />
              <StatCard
                label="Success Rate"
                value={d.feedback.total_feedback ? `${(d.feedback.success_rate * 100).toFixed(0)}%` : "—"}
                accent={
                  d.feedback.success_rate >= 0.8
                    ? "green"
                    : d.feedback.success_rate >= 0.6
                      ? "amber"
                      : d.feedback.total_feedback > 0
                        ? "red"
                        : undefined
                }
              />
              <StatCard
                label="Successful"
                value={String(d.feedback.success_feedback)}
                sub={`of ${d.feedback.total_feedback} total`}
              />
            </div>
          )}

          {/* Latency sparkline */}
          {telemetryItems.length > 0 && (() => {
            const latest = telemetryItems.slice(0, 25).reverse();
            const maxMs = Math.max(...latest.map((i) => i.ttft_ms), 1);
            return (
              <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-sm font-semibold text-slate-700">
                  Latency Trend{" "}
                  <span className="font-normal text-slate-400">(last {latest.length} requests)</span>
                </h2>
                <div className="flex items-end gap-[3px]" style={{ height: 80 }}>
                  {latest.map((item, i) => {
                    const pct = (item.ttft_ms / maxMs) * 100;
                    const color =
                      item.ttft_ms > 3000
                        ? "bg-red-500"
                        : item.ttft_ms > 1500
                          ? "bg-amber-400"
                          : "bg-emerald-500";
                    return (
                      <div
                        key={`bar-${i}`}
                        title={`${item.ttft_ms} ms — ${new Date(item.created_at).toLocaleTimeString()}`}
                        className={`flex-1 rounded-t ${color} min-w-[6px] transition-all`}
                        style={{ height: `${Math.max(pct, 4)}%` }}
                      />
                    );
                  })}
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                  <span>{new Date(latest[0]?.created_at).toLocaleTimeString()}</span>
                  <span>{new Date(latest[latest.length - 1]?.created_at).toLocaleTimeString()}</span>
                </div>
              </div>
            );
          })()}

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
                    <th className="px-3 py-2 font-medium">Cost</th>
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
                      <td className="px-3 py-2 text-[11px] text-slate-400">
                        ${((item.total_tokens_est || 0) * 0.3 / 1_000_000).toFixed(6)}
                      </td>
                    </tr>
                  ))}
                  {telemetryItems.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
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
