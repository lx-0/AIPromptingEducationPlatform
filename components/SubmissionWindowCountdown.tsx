"use client";

import { useEffect, useState } from "react";

interface Props {
  openAt: string | null;
  closeAt: string | null;
}

function formatDuration(ms: number): string {
  if (ms <= 0) return "0s";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

export default function SubmissionWindowCountdown({ openAt, closeAt }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const openTs = openAt ? new Date(openAt).getTime() : null;
  const closeTs = closeAt ? new Date(closeAt).getTime() : null;

  if (openTs !== null && now < openTs) {
    return (
      <div className="rounded-lg border border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-950 px-4 py-3 text-sm">
        <span className="font-medium text-yellow-800 dark:text-yellow-200">Submissions open in </span>
        <span className="font-mono text-yellow-700 dark:text-yellow-300">{formatDuration(openTs - now)}</span>
      </div>
    );
  }

  if (closeTs !== null && now < closeTs) {
    const remaining = closeTs - now;
    const urgent = remaining < 10 * 60 * 1000; // under 10 minutes
    return (
      <div className={`rounded-lg border px-4 py-3 text-sm ${
        urgent
          ? "border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-950"
          : "border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-950"
      }`}>
        <span className={`font-medium ${urgent ? "text-red-700 dark:text-red-300" : "text-blue-700 dark:text-blue-300"}`}>
          Submission window closes in{" "}
        </span>
        <span className={`font-mono ${urgent ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"}`}>
          {formatDuration(remaining)}
        </span>
      </div>
    );
  }

  if (closeTs !== null && now >= closeTs) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm">
        <span className="font-medium text-gray-600 dark:text-gray-400">Submission window has closed.</span>
      </div>
    );
  }

  return null;
}
