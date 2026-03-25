"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type PathWorkshop = {
  lpw_id: string;
  sort_order: number;
  prerequisite_workshop_id: string | null;
  prerequisite_title: string | null;
  workshop_id: string;
  workshop_title: string;
  workshop_status: string;
  exercise_count: number;
};

type AvailableWorkshop = {
  id: string;
  title: string;
  status: string;
};

type PathDetail = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  workshops: PathWorkshop[];
};

export default function EditLearningPathPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [path, setPath] = useState<PathDetail | null>(null);
  const [availableWorkshops, setAvailableWorkshops] = useState<AvailableWorkshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("draft");
  const [addWorkshopId, setAddWorkshopId] = useState("");
  const [addPrereqId, setAddPrereqId] = useState("");
  const [addingWorkshop, setAddingWorkshop] = useState(false);

  const loadPath = useCallback(async () => {
    const [pathRes, workshopsRes] = await Promise.all([
      fetch(`/api/paths/${id}`),
      fetch("/api/workshops"),
    ]);

    if (!pathRes.ok) {
      setError("Path not found");
      setLoading(false);
      return;
    }

    const pathData: PathDetail = await pathRes.json();
    const allWorkshops: AvailableWorkshop[] = workshopsRes.ok ? await workshopsRes.json() : [];

    setPath(pathData);
    setTitle(pathData.title);
    setDescription(pathData.description ?? "");
    setStatus(pathData.status);

    // Only show workshops not already in the path
    const inPathIds = new Set(pathData.workshops.map((w) => w.workshop_id));
    setAvailableWorkshops(allWorkshops.filter((w) => !inPathIds.has(w.id)));
    setLoading(false);
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPath();
  }, [loadPath]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch(`/api/paths/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, status }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Save failed");
      return;
    }

    const updated = await res.json();
    setPath((prev) => prev ? { ...prev, ...updated } : prev);
  }

  async function handleAddWorkshop() {
    if (!addWorkshopId) return;
    setAddingWorkshop(true);

    const res = await fetch(`/api/paths/${id}/workshops`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workshop_id: addWorkshopId,
        prerequisite_workshop_id: addPrereqId || null,
      }),
    });

    setAddingWorkshop(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to add workshop");
      return;
    }

    setAddWorkshopId("");
    setAddPrereqId("");
    await loadPath();
  }

  async function handleRemoveWorkshop(workshopId: string) {
    await fetch(`/api/paths/${id}/workshops/${workshopId}`, { method: "DELETE" });
    await loadPath();
  }

  async function handleMoveUp(idx: number) {
    if (!path || idx === 0) return;
    const workshops = [...path.workshops];
    const order = workshops.map((w, i) => ({
      workshop_id: w.workshop_id,
      sort_order: i === idx ? i - 1 : i === idx - 1 ? i + 1 : i,
    }));
    await fetch(`/api/paths/${id}/workshops/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    });
    await loadPath();
  }

  async function handleMoveDown(idx: number) {
    if (!path || idx === path.workshops.length - 1) return;
    const workshops = [...path.workshops];
    const order = workshops.map((w, i) => ({
      workshop_id: w.workshop_id,
      sort_order: i === idx ? i + 1 : i === idx + 1 ? i - 1 : i,
    }));
    await fetch(`/api/paths/${id}/workshops/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    });
    await loadPath();
  }

  async function handleDelete() {
    if (!confirm("Delete this learning path? This cannot be undone.")) return;
    const res = await fetch(`/api/paths/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/paths");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
      </main>
    );
  }

  if (!path) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <p className="text-sm text-red-500">{error ?? "Path not found"}</p>
      </main>
    );
  }

  return (
    <main id="main-content" className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <nav aria-label="Main navigation" className="bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-gray-700 dark:hover:text-gray-300">
            PromptingSchool
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
        <div>
          <Link href="/paths" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
            ← Learning paths
          </Link>
        </div>

        {/* Metadata form */}
        <section>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Edit learning path</h1>
          <form onSubmit={handleSave} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
              <input
                id="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

            <div className="flex items-center justify-between pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
              >
                Delete path
              </button>
            </div>
          </form>
        </section>

        {/* Workshop list */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Workshops in this path</h2>

          {path.workshops.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-6 text-center text-sm text-gray-400 dark:text-gray-500">
              No workshops yet. Add one below.
            </div>
          ) : (
            <ol className="space-y-2">
              {path.workshops.map((w, idx) => (
                <li
                  key={w.lpw_id}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3"
                >
                  <span className="shrink-0 text-sm font-semibold text-gray-400 dark:text-gray-500 w-5 text-right">
                    {idx + 1}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {w.workshop_title}
                    </p>
                    {w.prerequisite_title && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                        Requires: {w.prerequisite_title}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {w.exercise_count} exercise{w.exercise_count !== 1 ? "s" : ""} · {w.workshop_status}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleMoveUp(idx)}
                      disabled={idx === 0}
                      aria-label="Move up"
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-30 transition-colors"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => handleMoveDown(idx)}
                      disabled={idx === path.workshops.length - 1}
                      aria-label="Move down"
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-30 transition-colors"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => handleRemoveWorkshop(w.workshop_id)}
                      aria-label="Remove"
                      className="p-1 text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 transition-colors ml-1"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Add workshop */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Add workshop</h2>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 space-y-4">
            {availableWorkshops.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">
                All your workshops are already in this path, or you have no workshops yet.{" "}
                <Link href="/workshops/new" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Create a workshop
                </Link>
              </p>
            ) : (
              <>
                <div>
                  <label htmlFor="add-workshop" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Workshop to add
                  </label>
                  <select
                    id="add-workshop"
                    value={addWorkshopId}
                    onChange={(e) => setAddWorkshopId(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select a workshop…</option>
                    {availableWorkshops.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.title} ({w.status})
                      </option>
                    ))}
                  </select>
                </div>

                {path.workshops.length > 0 && (
                  <div>
                    <label htmlFor="add-prereq" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Prerequisite <span className="font-normal text-gray-400">(optional)</span>
                    </label>
                    <select
                      id="add-prereq"
                      value={addPrereqId}
                      onChange={(e) => setAddPrereqId(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">None</option>
                      {path.workshops.map((w) => (
                        <option key={w.workshop_id} value={w.workshop_id}>
                          {w.workshop_title}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                      The trainee must complete the prerequisite workshop before this one is unlocked.
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleAddWorkshop}
                  disabled={addingWorkshop || !addWorkshopId}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {addingWorkshop ? "Adding…" : "Add workshop"}
                </button>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
