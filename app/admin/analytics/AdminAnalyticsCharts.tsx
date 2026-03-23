"use client";

import { useState, useEffect } from "react";

type FunnelData = { signups: number; enrolled: number; submitted: number; completed: number };
type TimePoint = { date?: string; week?: string; month?: string; dau?: number; wau?: number; mau?: number };
type RevenuePoint = { month: string; new_subscriptions: number; pro: number; team: number };

type Props = {
  funnel: FunnelData;
  dau: TimePoint[];
  wau: TimePoint[];
  mau: TimePoint[];
  revenueOverTime: RevenuePoint[];
};

const CHART_H = 160;

function useDark() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const check = () => setDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return dark;
}

function LineChart({
  data,
  label,
  color = "#3b82f6",
  dark = false,
  formatLabel,
}: {
  data: { label: string; value: number }[];
  label: string;
  color?: string;
  dark?: boolean;
  formatLabel?: (l: string) => string;
}) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const pad = { l: 36, r: 10, t: 10, b: 30 };
  const w = 360;
  const innerW = w - pad.l - pad.r;
  const innerH = CHART_H - pad.t - pad.b;
  const gridColor = dark ? "#374151" : "#e5e7eb";
  const tickColor = dark ? "#6b7280" : "#9ca3af";

  const pts = data.map((d, i) => ({
    x: pad.l + (i / Math.max(data.length - 1, 1)) * innerW,
    y: pad.t + innerH - (d.value / maxVal) * innerH,
    label: d.label,
    value: d.value,
  }));

  const pathD =
    pts.length > 1
      ? `M ${pts[0].x} ${pts[0].y} ` + pts.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ")
      : "";
  const fillD =
    pts.length > 1
      ? pathD + ` L ${pts[pts.length - 1].x} ${pad.t + innerH} L ${pts[0].x} ${pad.t + innerH} Z`
      : "";

  if (data.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-8">No data yet.</p>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 400 ${CHART_H + 10}`} className="w-full" aria-label={label} role="img">
        {[0, 0.5, 1].map((tick) => {
          const y = pad.t + innerH - tick * innerH;
          return (
            <g key={tick}>
              <line x1={pad.l} x2={pad.l + innerW} y1={y} y2={y} stroke={gridColor} strokeWidth={1} />
              <text x={pad.l - 4} y={y + 4} fontSize={9} fill={tickColor} textAnchor="end">
                {Math.round(tick * maxVal)}
              </text>
            </g>
          );
        })}
        {fillD && <path d={fillD} fill={`${color}20`} />}
        {pathD && <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />}
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={3} fill={color} />
            {(i === 0 || i === pts.length - 1 || i % Math.ceil(data.length / 6) === 0) && (
              <text x={p.x} y={pad.t + innerH + 20} fontSize={8} fill={tickColor} textAnchor="middle">
                {formatLabel ? formatLabel(p.label) : p.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

function FunnelChart({ funnel, dark }: { funnel: FunnelData; dark: boolean }) {
  const steps = [
    { label: "Signed Up", value: funnel.signups, color: "#6366f1" },
    { label: "Enrolled", value: funnel.enrolled, color: "#3b82f6" },
    { label: "Submitted", value: funnel.submitted, color: "#10b981" },
    { label: "Completed", value: funnel.completed, color: "#f59e0b" },
  ];
  const maxVal = Math.max(steps[0].value, 1);
  const textColor = dark ? "#d1d5db" : "#374151";
  const subColor = dark ? "#6b7280" : "#9ca3af";

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox="0 0 400 200" className="w-full" aria-label="User funnel chart" role="img">
        {steps.map((step, i) => {
          const barW = Math.max((step.value / maxVal) * 340, 4);
          const x = (400 - barW) / 2;
          const y = i * 46 + 8;
          const pct = i === 0 ? 100 : maxVal > 0 ? Math.round((step.value / maxVal) * 100) : 0;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={32} fill={step.color} rx={4} opacity={0.85} />
              <text x={200} y={y + 19} fontSize={11} fill="white" textAnchor="middle" fontWeight="600">
                {step.label}: {step.value.toLocaleString()} ({pct}%)
              </text>
              {i < steps.length - 1 && (
                <text x={200} y={y + 44} fontSize={9} fill={subColor} textAnchor="middle">
                  ▼
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function StackedBarChart({
  data,
  label,
  keys,
  colors,
  dark = false,
  formatLabel,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  label: string;
  keys: string[];
  colors: string[];
  dark?: boolean;
  formatLabel?: (l: string) => string;
}) {
  const maxVal = Math.max(...data.map((d) => keys.reduce((sum, k) => sum + (d[k] ?? 0), 0)), 1);
  const barW = Math.max(8, (314 / Math.max(data.length, 1)) * 0.7);
  const spacing = 314 / Math.max(data.length, 1);
  const gridColor = dark ? "#374151" : "#e5e7eb";
  const tickColor = dark ? "#6b7280" : "#9ca3af";

  if (data.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">No data yet.</p>;
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 400 ${CHART_H + 40}`} className="w-full" aria-label={label} role="img">
        {[0, 0.5, 1].map((tick) => {
          const y = CHART_H - tick * CHART_H;
          return (
            <g key={tick}>
              <line x1={34} x2={390} y1={y} y2={y} stroke={gridColor} strokeWidth={1} />
              <text x={28} y={y + 4} fontSize={9} fill={tickColor} textAnchor="end">
                {Math.round(tick * maxVal)}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const x = 34 + i * spacing + spacing / 2 - barW / 2;
          let yOff = CHART_H;
          return (
            <g key={i}>
              {keys.map((k, ki) => {
                const val = d[k] ?? 0;
                const h = (val / maxVal) * CHART_H;
                yOff -= h;
                return (
                  <rect key={k} x={x} y={yOff} width={barW} height={Math.max(h, 0)} fill={colors[ki]} rx={2} />
                );
              })}
              <text x={x + barW / 2} y={CHART_H + 14} fontSize={8} fill={tickColor} textAnchor="middle">
                {formatLabel ? formatLabel(String(d.month ?? d.week ?? d.date ?? "")) : String(d.month ?? "")}
              </text>
            </g>
          );
        })}
      </svg>
      {/* Legend */}
      <div className="flex gap-4 justify-center mt-1 flex-wrap">
        {keys.map((k, ki) => (
          <span key={k} className="flex items-center gap-1 text-xs" style={{ color: dark ? "#9ca3af" : "#6b7280" }}>
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: colors[ki] }} />
            {k}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function AdminAnalyticsCharts({ funnel, dau, wau, mau, revenueOverTime }: Props) {
  const dark = useDark();
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "monthly">("daily");

  const shortMonth = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
  };
  const shortDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const activeData =
    activeTab === "daily"
      ? dau.map((d) => ({ label: d.date ?? "", value: d.dau ?? 0 }))
      : activeTab === "weekly"
      ? wau.map((d) => ({ label: d.week ?? "", value: d.wau ?? 0 }))
      : mau.map((d) => ({ label: d.month ?? "", value: d.mau ?? 0 }));

  const activeFormatLabel = activeTab === "monthly" ? shortMonth : shortDate;

  return (
    <div className="space-y-10">
      {/* Funnel */}
      <section>
        <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
          User Funnel
        </h2>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <FunnelChart funnel={funnel} dark={dark} />
        </div>
      </section>

      {/* Active Users */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300">
            Active Users
          </h2>
          <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 text-xs">
            {(["daily", "weekly", "monthly"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 capitalize transition-colors ${
                  activeTab === tab
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <LineChart
            data={activeData}
            label={`${activeTab} active users`}
            dark={dark}
            formatLabel={activeFormatLabel}
          />
        </div>
      </section>

      {/* Revenue */}
      <section>
        <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
          New Subscriptions by Month
        </h2>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <StackedBarChart
            data={revenueOverTime.map((r) => ({
              month: r.month,
              pro: r.pro,
              team: r.team,
              free: r.new_subscriptions - r.pro - r.team,
            }))}
            label="New subscriptions by month"
            keys={["pro", "team", "free"]}
            colors={["#6366f1", "#10b981", "#9ca3af"]}
            dark={dark}
            formatLabel={shortMonth}
          />
        </div>
      </section>
    </div>
  );
}
