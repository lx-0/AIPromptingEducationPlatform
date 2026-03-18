"use client";

import { useState, useEffect } from "react";

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

export type SubmissionTrendPoint = {
  date: string;
  count: number;
};

export type ScoreBucket = {
  bucket: string;
  count: number;
};

export type ExerciseStat = {
  exercise_id: string;
  exercise_title: string;
  sort_order: number;
  submission_count: number;
  unique_submitters: number;
  avg_score_pct: number | null;
};

export type RubricWeakness = {
  exercise_id: string;
  exercise_title: string;
  criterion: string;
  max_points: number;
  avg_score: number;
  avg_pct: number;
};

export type LeaderboardEntry = {
  trainee_id: string;
  display_name: string;
  avg_score_pct: number;
  exercises_completed: number;
};

type Props = {
  workshopId: string;
  submissionTrend: SubmissionTrendPoint[];
  scoreDistribution: ScoreBucket[];
  exerciseStats: ExerciseStat[];
  rubricWeaknesses: RubricWeakness[];
  leaderboard: LeaderboardEntry[];
};

const BUCKET_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6"];
const CHART_H = 180;
const BAR_GAP = 6;

// Simple SVG bar chart
function BarChart({
  data,
  label,
  getColor,
  formatValue = (v) => String(v),
  formatLabel = (l) => l,
  dark = false,
}: {
  data: { label: string; value: number }[];
  label: string;
  getColor?: (index: number, value: number) => string;
  formatValue?: (v: number) => string;
  formatLabel?: (l: string) => string;
  dark?: boolean;
}) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const width = 100; // percent-based
  const barWidth = Math.max(
    8,
    (width / data.length) * 0.65
  );
  const spacing = width / data.length;
  const gridColor = dark ? "#374151" : "#e5e7eb";
  const tickColor = dark ? "#6b7280" : "#9ca3af";
  const labelColor = dark ? "#9ca3af" : "#6b7280";

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 400 ${CHART_H + 40}`}
        className="w-full"
        aria-label={label}
        role="img"
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
          const y = CHART_H - tick * CHART_H;
          return (
            <g key={tick}>
              <line
                x1={30}
                x2={390}
                y1={y}
                y2={y}
                stroke={gridColor}
                strokeWidth={1}
              />
              <text x={24} y={y + 4} fontSize={9} fill={tickColor} textAnchor="end">
                {formatValue(Math.round(tick * maxVal))}
              </text>
            </g>
          );
        })}
        {/* Bars */}
        {data.map((d, i) => {
          const barH = (d.value / maxVal) * CHART_H;
          const x = 34 + i * ((360 / data.length)) + (360 / data.length) / 2 - 18;
          const color = getColor ? getColor(i, d.value) : "#3b82f6";
          return (
            <g key={i}>
              <rect
                x={x}
                y={CHART_H - barH}
                width={36}
                height={Math.max(barH, 1)}
                fill={color}
                rx={3}
                ry={3}
              />
              {barH > 14 && (
                <text
                  x={x + 18}
                  y={CHART_H - barH + 12}
                  fontSize={9}
                  fill="white"
                  textAnchor="middle"
                >
                  {formatValue(d.value)}
                </text>
              )}
              <text
                x={x + 18}
                y={CHART_H + 14}
                fontSize={9}
                fill={labelColor}
                textAnchor="middle"
              >
                {formatLabel(d.label)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// Horizontal bar chart
function HBarChart({
  data,
  label,
  maxValue = 100,
  formatValue = (v) => String(v),
  getColor,
  dark = false,
}: {
  data: { label: string; value: number }[];
  label: string;
  maxValue?: number;
  formatValue?: (v: number) => string;
  getColor?: (value: number) => string;
  dark?: boolean;
}) {
  const rowH = 32;
  const labelW = 150;
  const barAreaW = 210;
  const totalH = data.length * rowH + 10;
  const textColor = dark ? "#d1d5db" : "#374151";
  const valueColor = dark ? "#9ca3af" : "#6b7280";

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 400 ${totalH}`}
        className="w-full"
        style={{ height: totalH }}
        aria-label={label}
        role="img"
      >
        {data.map((d, i) => {
          const barW = (d.value / maxValue) * barAreaW;
          const y = i * rowH + rowH / 2;
          const color = getColor
            ? getColor(d.value)
            : d.value < 50
            ? "#ef4444"
            : d.value < 75
            ? "#f97316"
            : "#22c55e";
          const truncLabel =
            d.label.length > 22 ? d.label.slice(0, 22) + "…" : d.label;
          return (
            <g key={i}>
              <text
                x={labelW - 6}
                y={y + 4}
                fontSize={10}
                fill={textColor}
                textAnchor="end"
              >
                {truncLabel}
              </text>
              <rect
                x={labelW}
                y={y - 10}
                width={Math.max(barW, 2)}
                height={20}
                fill={color}
                rx={3}
                ry={3}
              />
              <text
                x={labelW + barW + 6}
                y={y + 4}
                fontSize={10}
                fill={valueColor}
              >
                {formatValue(d.value)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// Line chart
function LineChart({
  data,
  label,
  dark = false,
}: {
  data: { label: string; value: number }[];
  label: string;
  dark?: boolean;
}) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const w = 360;
  const h = CHART_H;
  const pad = { l: 34, r: 10, t: 10, b: 30 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const gridColor = dark ? "#374151" : "#e5e7eb";
  const tickColor = dark ? "#6b7280" : "#9ca3af";

  const pts = data.map((d, i) => ({
    x: pad.l + (i / Math.max(data.length - 1, 1)) * innerW,
    y: pad.t + innerH - (d.value / maxVal) * innerH,
    label: d.label,
    value: d.value,
  }));

  const pathD =
    pts.length > 0
      ? `M ${pts[0].x} ${pts[0].y} ` +
        pts
          .slice(1)
          .map((p) => `L ${p.x} ${p.y}`)
          .join(" ")
      : "";

  // Fill path
  const fillD =
    pts.length > 0
      ? pathD +
        ` L ${pts[pts.length - 1].x} ${pad.t + innerH} L ${pts[0].x} ${pad.t + innerH} Z`
      : "";

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 400 ${h + 10}`}
        className="w-full"
        aria-label={label}
        role="img"
      >
        {/* Grid */}
        {[0, 0.5, 1].map((tick) => {
          const y = pad.t + innerH - tick * innerH;
          return (
            <g key={tick}>
              <line
                x1={pad.l}
                x2={pad.l + innerW}
                y1={y}
                y2={y}
                stroke={gridColor}
                strokeWidth={1}
              />
              <text x={pad.l - 4} y={y + 4} fontSize={9} fill={tickColor} textAnchor="end">
                {Math.round(tick * maxVal)}
              </text>
            </g>
          );
        })}
        {/* Fill */}
        {fillD && (
          <path d={fillD} fill="#3b82f620" />
        )}
        {/* Line */}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={2}
            strokeLinejoin="round"
          />
        )}
        {/* Points + labels */}
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={3} fill="#3b82f6" />
            {(i === 0 ||
              i === pts.length - 1 ||
              (data.length <= 10 && i % 1 === 0) ||
              (data.length > 10 &&
                i % Math.ceil(data.length / 8) === 0)) && (
              <text
                x={p.x}
                y={pad.t + innerH + 20}
                fontSize={8}
                fill={tickColor}
                textAnchor="middle"
              >
                {new Date(p.label).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function AnalyticsCharts({
  workshopId,
  submissionTrend,
  scoreDistribution,
  exerciseStats,
  rubricWeaknesses,
  leaderboard,
}: Props) {
  const [anonymized, setAnonymized] = useState(false);
  const dark = useDark();

  // Group rubric weaknesses by exercise
  const rubricByExercise = rubricWeaknesses.reduce<
    Record<string, { title: string; criteria: RubricWeakness[] }>
  >((acc, w) => {
    if (!acc[w.exercise_id]) {
      acc[w.exercise_id] = { title: w.exercise_title, criteria: [] };
    }
    acc[w.exercise_id].criteria.push(w);
    return acc;
  }, {});

  const hasScores = exerciseStats.some((e) => e.avg_score_pct != null);

  return (
    <div className="space-y-8">
      {/* Submissions over time */}
      {submissionTrend.length > 1 && (
        <section>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Submissions over time
          </h2>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
            <LineChart
              data={submissionTrend.map((d) => ({ label: d.date, value: d.count }))}
              label="Submissions over time line chart"
              dark={dark}
            />
          </div>
        </section>
      )}

      {/* Score distribution */}
      {scoreDistribution.some((d) => d.count > 0) && (
        <section>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Score distribution
          </h2>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
            <BarChart
              data={scoreDistribution.map((d) => ({
                label: d.bucket,
                value: d.count,
              }))}
              label="Score distribution bar chart"
              getColor={(i) => BUCKET_COLORS[i % BUCKET_COLORS.length]}
              dark={dark}
            />
          </div>
        </section>
      )}

      {/* Per-exercise avg scores */}
      {hasScores && (
        <section>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Avg score by exercise
          </h2>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
            <HBarChart
              data={exerciseStats.map((e) => ({
                label: e.exercise_title,
                value: e.avg_score_pct ?? 0,
              }))}
              label="Average score by exercise bar chart"
              maxValue={100}
              formatValue={(v) => `${v}%`}
              getColor={(v) =>
                v < 50 ? "#ef4444" : v < 75 ? "#f97316" : "#22c55e"
              }
              dark={dark}
            />
          </div>
        </section>
      )}

      {/* Rubric weaknesses per exercise */}
      {Object.keys(rubricByExercise).length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Rubric criterion breakdown
          </h2>
          <div className="space-y-4">
            {Object.entries(rubricByExercise).map(
              ([exId, { title, criteria }]) => (
                <div
                  key={exId}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4"
                >
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    {title}
                  </p>
                  <HBarChart
                    data={criteria.map((c) => ({
                      label: c.criterion,
                      value: c.avg_pct,
                    }))}
                    label={`Rubric breakdown for ${title}`}
                    maxValue={100}
                    formatValue={(v) => `${v}%`}
                    getColor={(v) =>
                      v < 50 ? "#ef4444" : v < 75 ? "#f97316" : "#22c55e"
                    }
                    dark={dark}
                  />
                </div>
              )
            )}
          </div>
        </section>
      )}

      {/* Trainee leaderboard */}
      {leaderboard.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Trainee leaderboard
            </h2>
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={anonymized}
                onChange={(e) => setAnonymized(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600"
              />
              Anonymize names
            </label>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <table className="w-full text-sm min-w-[400px]">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Rank
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Trainee
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">
                    Exercises scored
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">
                    Avg score
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {leaderboard.map((entry, index) => (
                  <tr key={entry.trainee_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-gray-400 dark:text-gray-500 font-medium">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                      {anonymized
                        ? `Trainee ${index + 1}`
                        : entry.display_name}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                      {entry.exercises_completed}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          entry.avg_score_pct >= 80
                            ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300"
                            : entry.avg_score_pct >= 60
                            ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                            : entry.avg_score_pct >= 40
                            ? "bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300"
                            : "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300"
                        }`}
                      >
                        {entry.avg_score_pct}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Export */}
      <div className="pt-2">
        <a
          href={`/api/workshops/${workshopId}/analytics`}
          download
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
        >
          Export analytics CSV
        </a>
      </div>
    </div>
  );
}
