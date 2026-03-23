"use client";

import { useState, useEffect, useCallback } from "react";

type Exercise = {
  id: string;
  title: string;
  variant_group: string | null;
  variant_key: string | null;
};

type VariantStats = {
  id: string;
  title: string;
  variant_key: string;
  submission_count: number;
  unique_trainees: number;
  avg_score_pct: number | null;
};

type VariantGroups = Record<string, VariantStats[]>;

type Props = {
  workshopId: string;
  exercises: Exercise[];
};

const SCORE_COLOR = (pct: number | null) => {
  if (pct == null) return "text-gray-400";
  if (pct >= 80) return "text-green-600 dark:text-green-400";
  if (pct >= 60) return "text-blue-600 dark:text-blue-400";
  if (pct >= 40) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
};

export default function ExerciseVariantManager({ workshopId, exercises }: Props) {
  const [groups, setGroups] = useState<VariantGroups>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editGroup, setEditGroup] = useState("");
  const [editKey, setEditKey] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    const res = await fetch(`/api/workshops/${workshopId}/exercises/variants`);
    if (res.ok) {
      const data = await res.json();
      setGroups(data.groups ?? {});
    }
    setLoading(false);
  }, [workshopId]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const openEdit = (ex: Exercise) => {
    setEditId(ex.id);
    setEditGroup(ex.variant_group ?? "");
    setEditKey(ex.variant_key ?? "");
    setError(null);
  };

  const saveVariant = async (exerciseId: string) => {
    if (!editGroup.trim() && !editKey.trim()) {
      // Clear variant assignment
      setSaving(exerciseId);
      await fetch(`/api/workshops/${workshopId}/exercises/variants`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exercise_id: exerciseId, variant_group: null, variant_key: null }),
      });
      setSaving(null);
      setEditId(null);
      await fetchGroups();
      return;
    }
    if (!editGroup.trim() || !editKey.trim()) {
      setError("Both group name and variant key are required.");
      return;
    }
    setSaving(exerciseId);
    setError(null);
    const res = await fetch(`/api/workshops/${workshopId}/exercises/variants`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exercise_id: exerciseId,
        variant_group: editGroup.trim(),
        variant_key: editKey.trim(),
      }),
    });
    setSaving(null);
    if (res.ok) {
      setEditId(null);
      await fetchGroups();
    } else {
      setError("Failed to save. Please try again.");
    }
  };

  const groupNames = Object.keys(groups);

  return (
    <div className="space-y-6">
      {/* Exercises table */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            Assign exercises to variant groups
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Exercises in the same group are randomly assigned — each trainee gets one variant.
          </p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-5 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Exercise</th>
              <th className="px-5 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Group</th>
              <th className="px-5 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Key</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {exercises.map((ex) => (
              <tr key={ex.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                <td className="px-5 py-3 text-gray-800 dark:text-gray-200 font-medium">{ex.title}</td>
                <td className="px-5 py-3">
                  {editId === ex.id ? (
                    <input
                      type="text"
                      value={editGroup}
                      onChange={(e) => setEditGroup(e.target.value)}
                      placeholder="e.g. prompt-style"
                      className="w-32 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <span className={ex.variant_group ? "text-blue-600 dark:text-blue-400 font-medium" : "text-gray-400"}>
                      {ex.variant_group ?? "—"}
                    </span>
                  )}
                </td>
                <td className="px-5 py-3">
                  {editId === ex.id ? (
                    <input
                      type="text"
                      value={editKey}
                      onChange={(e) => setEditKey(e.target.value)}
                      placeholder="e.g. A"
                      maxLength={10}
                      className="w-20 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <span className={ex.variant_key ? "font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300" : "text-gray-400"}>
                      {ex.variant_key ?? "—"}
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  {editId === ex.id ? (
                    <div className="flex items-center justify-end gap-2">
                      {error && <span className="text-xs text-red-500">{error}</span>}
                      <button
                        onClick={() => saveVariant(ex.id)}
                        disabled={saving === ex.id}
                        className="text-xs rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {saving === ex.id ? "Saving…" : "Save"}
                      </button>
                      <button
                        onClick={() => { setEditId(null); setError(null); }}
                        className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => openEdit(ex)}
                      className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {ex.variant_group ? "Edit" : "Assign"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Performance comparison */}
      {loading ? (
        <p className="text-sm text-gray-400">Loading variant stats…</p>
      ) : groupNames.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">A/B Performance Comparison</h3>
          {groupNames.map((groupName) => (
            <div key={groupName} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Group: <span className="text-blue-600 dark:text-blue-400">{groupName}</span>
                </span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="px-5 py-2.5 text-left font-medium text-gray-500 dark:text-gray-400">Variant</th>
                    <th className="px-5 py-2.5 text-left font-medium text-gray-500 dark:text-gray-400">Exercise</th>
                    <th className="px-5 py-2.5 text-right font-medium text-gray-500 dark:text-gray-400">Trainees</th>
                    <th className="px-5 py-2.5 text-right font-medium text-gray-500 dark:text-gray-400">Submissions</th>
                    <th className="px-5 py-2.5 text-right font-medium text-gray-500 dark:text-gray-400">Avg score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {groups[groupName].map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                      <td className="px-5 py-2.5">
                        <span className="font-mono text-xs bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded">
                          {v.variant_key}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-gray-700 dark:text-gray-300">{v.title}</td>
                      <td className="px-5 py-2.5 text-right tabular-nums text-gray-700 dark:text-gray-300">{v.unique_trainees}</td>
                      <td className="px-5 py-2.5 text-right tabular-nums text-gray-700 dark:text-gray-300">{v.submission_count}</td>
                      <td className={`px-5 py-2.5 text-right font-semibold tabular-nums ${SCORE_COLOR(v.avg_score_pct)}`}>
                        {v.avg_score_pct != null ? `${v.avg_score_pct}%` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
