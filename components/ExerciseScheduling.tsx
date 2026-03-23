"use client";

import { useState } from "react";

interface Props {
  exerciseId: string;
  openAt: string | null;
  closeAt: string | null;
  onSaved?: (openAt: string | null, closeAt: string | null) => void;
}

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  // datetime-local input expects "YYYY-MM-DDTHH:mm"
  return new Date(iso).toISOString().slice(0, 16);
}

function fromLocalInput(val: string): string | null {
  if (!val) return null;
  return new Date(val).toISOString();
}

export default function ExerciseScheduling({ exerciseId, openAt, closeAt, onSaved }: Props) {
  const [open, setOpen] = useState(toLocalInput(openAt));
  const [close, setClose] = useState(toLocalInput(closeAt));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/exercises/${exerciseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          open_at: fromLocalInput(open),
          close_at: fromLocalInput(close),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSaved(true);
      onSaved?.(json.open_at, json.close_at);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleClear() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/exercises/${exerciseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ open_at: null, close_at: null }),
      });
      if (!res.ok) throw new Error("Failed to clear schedule");
      setOpen("");
      setClose("");
      onSaved?.(null, null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Submission Window</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Opens at
          </label>
          <input
            type="datetime-local"
            value={open}
            onChange={(e) => setOpen(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Closes at
          </label>
          <input
            type="datetime-local"
            value={close}
            onChange={(e) => setClose(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save schedule"}
        </button>
        {(open || close) && (
          <button
            type="button"
            onClick={handleClear}
            disabled={saving}
            className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </form>
  );
}
