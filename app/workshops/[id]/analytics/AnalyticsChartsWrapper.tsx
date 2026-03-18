"use client";

import dynamic from "next/dynamic";
import type {
  SubmissionTrendPoint,
  ScoreBucket,
  ExerciseStat,
  RubricWeakness,
  LeaderboardEntry,
} from "./AnalyticsCharts";

const AnalyticsCharts = dynamic(() => import("./AnalyticsCharts"), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500 text-sm">
      Loading charts…
    </div>
  ),
});

type Props = {
  workshopId: string;
  submissionTrend: SubmissionTrendPoint[];
  scoreDistribution: ScoreBucket[];
  exerciseStats: ExerciseStat[];
  rubricWeaknesses: RubricWeakness[];
  leaderboard: LeaderboardEntry[];
};

export default function AnalyticsChartsWrapper(props: Props) {
  return <AnalyticsCharts {...props} />;
}
