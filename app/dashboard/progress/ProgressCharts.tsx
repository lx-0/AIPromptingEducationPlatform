"use client";

import { useState, useEffect } from "react";

export type ScoreTrendPoint = {
  date: string;
  avg_score_pct: number;
};

export type CriterionStrength = {
  criterion: string;
  avg_pct: number;
  submission_count: number;
};

export type WorkshopProgress = {
  workshop_id: string;
  workshop_title: string;
  completed: number;
  total: number;
  avg_score_pct: number | null;
};

type Props = {
  scoreTrend: ScoreTrendPoint[];
  strengths: CriterionStrength[];
  weaknesses: CriterionStrength[];
  workshopProgress: WorkshopProgress[];
};

const CHART_H = 140;

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

function ScoreTrendChart({ data, dark }: { data: ScoreTrendPoint[]; dark: boolean }) {
  if (data.length < 2) {
    return <p className="text-sm text-gray-400 text-center py-6">Not enough data yet. Keep submitting!</p>;
  }

  const maxVal = 100;
  const pad = { l: 30, r: 10, t: 10, b: 28 };
  const w = 360;
  const innerW = w - pad.l - pad.r;
  const innerH = CHART_H - pad.t - pad.b;
  const gridColor = dark ? "#374151" : "#e5e7eb";
  const tickColor = dark ? "#6b7280" : "#9ca3af";

  const pts = data.map((d, i) => ({
    x: pad.l + (i / Math.max(data.length - 1, 1)) * innerW,
    y: pad.t + innerH - (d.avg_score_pct / maxVal) * innerH,
    date: d.date,
    value: d.avg_score_pct,
  }));

  const pathD = `M ${pts[0].x} ${pts[0].y} ` + pts.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ");
  const fillD = pathD + ` L ${pts[pts.length - 1].x} ${pad.t + innerH} L ${pts[0].x} ${pad.t + innerH} Z`;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 400 ${CHART_H + 10}`} className="w-full" aria-label="Score trend" role="img">
        {[0, 50, 100].map((tick) => {
          const y = pad.t + innerH - (tick / maxVal) * innerH;
          return (
            <g key={tick}>
              <line x1={pad.l} x2={pad.l + innerW} y1={y} y2={y} stroke={gridColor} strokeWidth={1} />
              <text x={pad.l - 4} y={y + 4} fontSize={9} fill={tickColor} textAnchor="end">{tick}%</text>
            </g>
          );
        })}
        <path d={fillD} fill="#22c55e20" />
        <path d={pathD} fill="none" stroke="#22c55e" strokeWidth={2} strokeLinejoin="round" />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={3} fill="#22c55e" />
            {(i === 0 || i === pts.length - 1 || i % Math.ceil(pts.length / 5) === 0) && (
              <text x={p.x} y={pad.t + innerH + 18} fontSize={8} fill={tickColor} textAnchor="middle">
                {new Date(p.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

function CriterionBar({ item, dark, color }: { item: CriterionStrength; dark: boolean; color: string }) {
  const textColor = dark ? "#d1d5db" : "#374151";
  const subColor = dark ? "#6b7280" : "#9ca3af";
  const bgColor = dark ? "#1f2937" : "#f3f4f6";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className={textColor} style={{ color: textColor }}>{item.criterion}</span>
        <span className="font-semibold tabular-nums" style={{ color }}>{item.avg_pct}%</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: bgColor }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${item.avg_pct}%`, background: color }}
        />
      </div>
      <p className="text-xs" style={{ color: subColor }}>{item.submission_count} scored submission{item.submission_count !== 1 ? "s" : ""}</p>
    </div>
  );
}

export default function ProgressCharts({ scoreTrend, strengths, weaknesses, workshopProgress }: Props) {
  const dark = useDark();

  return (
    <div className="space-y-8">
      {/* Score trend */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Score trend (last 90 days)
        </h2>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          <ScoreTrendChart data={scoreTrend} dark={dark} />
        </div>
      </section>

      {/* Strengths & areas to improve */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <section>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <span className="text-green-500">↑</span> Strengths
          </h2>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-4">
            {strengths.length === 0 ? (
              <p className="text-sm text-gray-400">No scored submissions yet.</p>
            ) : (
              strengths.map((s) => (
                <CriterionBar key={s.criterion} item={s} dark={dark} color="#22c55e" />
              ))
            )}
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <span className="text-orange-500">↓</span> Areas to improve
          </h2>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-4">
            {weaknesses.length === 0 ? (
              <p className="text-sm text-gray-400">No scored submissions yet.</p>
            ) : (
              weaknesses.map((w) => (
                <CriterionBar key={w.criterion} item={w} dark={dark} color="#f97316" />
              ))
            )}
          </div>
        </section>
      </div>

      {/* Workshop progress */}
      {workshopProgress.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Workshop progress
          </h2>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
            {workshopProgress.map((w) => {
              const pct = w.total > 0 ? Math.round((w.completed / w.total) * 100) : 0;
              return (
                <div key={w.workshop_id} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate mr-4">
                      {w.workshop_title}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                      {w.completed}/{w.total} exercises
                      {w.avg_score_pct != null && ` · ${w.avg_score_pct}% avg`}
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: pct === 100 ? "#22c55e" : pct >= 50 ? "#3b82f6" : "#6366f1",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
