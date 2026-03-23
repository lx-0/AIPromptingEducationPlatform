"use client";

import { useState } from "react";

interface Props {
  submissionId: string;
  currentOverride: { total_score: number; reason: string } | null;
  maxScore: number;
  onSaved?: (override: { total_score: number; reason: string } | null) => void;
}

export default function ScoreOverride({ submissionId, currentOverride, maxScore, onSaved }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [score, setScore] = useState(currentOverride?.total_score?.toString() ?? "");
  const [reason, setReason] = useState(currentOverride?.reason ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const totalScore = parseFloat(score);
    if (isNaN(totalScore) || totalScore < 0) {
      setError("Score must be a non-negative number");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/submissions/${submissionId}/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ total_score: totalScore, reason: reason.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      onSaved?.({ total_score: totalScore, reason: reason.trim() });
      setExpanded(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!confirm("Remove the score override and restore the automated score?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/submissions/${submissionId}/override`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove override");
      onSaved?.(null);
      setScore("");
      setReason("");
      setExpanded(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3">
      {currentOverride && !expanded && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-950 px-4 py-3 text-sm">
          <div className="flex-1">
            <span className="font-medium text-amber-800 dark:text-amber-200">Override: </span>
            <span className="text-amber-700 dark:text-amber-300">{currentOverride.total_score}/{maxScore}</span>
            <span className="ml-2 text-amber-600 dark:text-amber-400 text-xs">— {currentOverride.reason}</span>
          </div>
          <button onClick={() => setExpanded(true)} className="text-xs text-amber-700 dark:text-amber-300 hover:underline">Edit</button>
          <button onClick={handleRemove} disabled={saving} className="text-xs text-red-600 dark:text-red-400 hover:underline">Remove</button>
        </div>
      )}

      {!currentOverride && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          + Override score
        </button>
      )}

      {expanded && (
        <form onSubmit={handleSave} className="mt-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-4 space-y-3">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Manual Score Override</h4>
          <div className="flex gap-3">
            <div className="w-32">
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Score (max {maxScore})</label>
              <input
                type="number"
                min={0}
                max={maxScore}
                step={0.5}
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Reason (required)</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Late submission accepted, exceptional quality…"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving || !score || !reason.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving…" : "Apply override"}
            </button>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
