"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface Cohort {
  id: string;
  name: string;
  member_count: number;
}

interface Announcement {
  id: string;
  title: string;
  body: string;
  created_at: string;
  instructor_name: string;
}

interface Props {
  workshopId: string;
  cohorts: Cohort[];
  announcements: Announcement[];
}

export default function InstructorPowerTools({ workshopId, cohorts: initialCohorts, announcements: initialAnnouncements }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"cohorts" | "announcements" | "import">("cohorts");

  // Clone state
  const [cloning, setCloning] = useState(false);

  // Cohort state
  const [cohorts, setCohorts] = useState<Cohort[]>(initialCohorts);
  const [newCohortName, setNewCohortName] = useState("");
  const [cohortLoading, setCohortLoading] = useState(false);

  // Announcement state
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [annLoading, setAnnLoading] = useState(false);

  // Import/export state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  async function handleClone() {
    if (!confirm("Clone this workshop and all its exercises?")) return;
    setCloning(true);
    try {
      const res = await fetch(`/api/workshops/${workshopId}/clone`, { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      const cloned = await res.json();
      router.push(`/workshops/${cloned.id}`);
    } catch (e) {
      alert(`Clone failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setCloning(false);
    }
  }

  async function handleExport() {
    const res = await fetch(`/api/workshops/${workshopId}/exercises/export`);
    if (!res.ok) { alert("Export failed"); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `exercises-${workshopId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportStatus(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const res = await fetch(`/api/workshops/${workshopId}/exercises/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setImportStatus(`Imported ${json.imported} exercise${json.imported !== 1 ? "s" : ""} successfully.`);
      router.refresh();
    } catch (err) {
      setImportStatus(`Import failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleCreateCohort(e: React.FormEvent) {
    e.preventDefault();
    if (!newCohortName.trim()) return;
    setCohortLoading(true);
    try {
      const res = await fetch(`/api/workshops/${workshopId}/cohorts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCohortName.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setCohorts((prev) => [...prev, { ...json, member_count: 0 }]);
      setNewCohortName("");
    } catch (err) {
      alert(`Failed to create cohort: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setCohortLoading(false);
    }
  }

  async function handleDeleteCohort(cohortId: string, name: string) {
    if (!confirm(`Delete cohort "${name}"? This will remove all members from this cohort.`)) return;
    const res = await fetch(`/api/workshops/${workshopId}/cohorts/${cohortId}`, { method: "DELETE" });
    if (!res.ok) { alert("Failed to delete cohort"); return; }
    setCohorts((prev) => prev.filter((c) => c.id !== cohortId));
  }

  async function handlePostAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    if (!annTitle.trim() || !annBody.trim()) return;
    setAnnLoading(true);
    try {
      const res = await fetch(`/api/workshops/${workshopId}/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: annTitle.trim(), body: annBody.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setAnnouncements((prev) => [json, ...prev]);
      setAnnTitle("");
      setAnnBody("");
    } catch (err) {
      alert(`Failed to post announcement: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setAnnLoading(false);
    }
  }

  return (
    <div className="mt-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      {/* Header row with Clone + Export */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Instructor Tools</h2>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
          >
            Export exercises ↓
          </button>
          <button
            onClick={handleClone}
            disabled={cloning}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {cloning ? "Cloning…" : "Clone workshop"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
        {(["cohorts", "announcements", "import"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`mr-4 py-3 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {t === "import" ? "Import exercises" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="px-6 py-5">
        {/* Cohorts tab */}
        {tab === "cohorts" && (
          <div>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              Cohorts let you split enrolled trainees into sections with separate leaderboards.
            </p>
            {cohorts.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">No cohorts yet.</p>
            ) : (
              <ul className="mb-4 space-y-2">
                {cohorts.map((c) => (
                  <li key={c.id} className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3">
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{c.name}</span>
                      <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">{c.member_count} member{c.member_count !== 1 ? "s" : ""}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteCohort(c.id, c.name)}
                      className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={handleCreateCohort} className="flex gap-2">
              <input
                value={newCohortName}
                onChange={(e) => setNewCohortName(e.target.value)}
                placeholder="New cohort name…"
                className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={cohortLoading || !newCohortName.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {cohortLoading ? "Creating…" : "Create"}
              </button>
            </form>
          </div>
        )}

        {/* Announcements tab */}
        {tab === "announcements" && (
          <div>
            <form onSubmit={handlePostAnnouncement} className="mb-6 space-y-3">
              <input
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                placeholder="Announcement title…"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                value={annBody}
                onChange={(e) => setAnnBody(e.target.value)}
                placeholder="Announcement message…"
                rows={3}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <button
                type="submit"
                disabled={annLoading || !annTitle.trim() || !annBody.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {annLoading ? "Posting…" : "Post announcement"}
              </button>
            </form>

            {announcements.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">No announcements yet.</p>
            ) : (
              <ul className="space-y-3">
                {announcements.map((a) => (
                  <li key={a.id} className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{a.title}</p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{a.body}</p>
                    <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                      {new Date(a.created_at).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Import exercises tab */}
        {tab === "import" && (
          <div>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              Import exercises from a JSON file (use the Export button to get the correct format).
              Exercises will be appended after existing ones.
            </p>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-700 dark:hover:text-blue-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleImport}
                disabled={importing}
                className="sr-only"
              />
              {importing ? "Importing…" : "Choose JSON file…"}
            </label>
            {importStatus && (
              <p className={`mt-3 text-sm ${importStatus.startsWith("Import failed") ? "text-red-500" : "text-green-600 dark:text-green-400"}`}>
                {importStatus}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
