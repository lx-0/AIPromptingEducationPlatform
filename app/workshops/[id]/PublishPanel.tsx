"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PublishPanelProps = {
  workshopId: string;
  status: string;
  inviteCode: string | null;
};

export default function PublishPanel({ workshopId, status, inviteCode }: PublishPanelProps) {
  const router = useRouter();
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const currentInviteCode = inviteCode;

  async function handlePublish() {
    setPublishing(true);
    setError(null);
    try {
      const res = await fetch(`/api/workshops/${workshopId}/publish`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to publish.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPublishing(false);
    }
  }

  async function handleCopy(code: string) {
    const joinUrl = `${window.location.origin}/join/${code}`;
    await navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (status === "published" && currentInviteCode) {
    const joinUrl = typeof window !== "undefined"
      ? `${window.location.origin}/join/${currentInviteCode}`
      : `/join/${currentInviteCode}`;

    return (
      <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 p-5">
        <div className="flex items-center gap-2 mb-3">
          <svg className="h-4 w-4 text-green-600 dark:text-green-400" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm3.28 5.28l-4 4a.75.75 0 01-1.06 0l-2-2a.75.75 0 011.06-1.06L6.75 8.69l3.47-3.47a.75.75 0 011.06 1.06z" />
          </svg>
          <p className="text-sm font-semibold text-green-800 dark:text-green-300">Workshop published</p>
        </div>
        <p className="text-xs text-green-700 dark:text-green-400 mb-3">
          Share this invite link with your trainees:
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 min-w-0 rounded-lg border border-green-200 dark:border-green-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-mono text-gray-700 dark:text-gray-300 truncate">
            /join/{currentInviteCode}
          </code>
          <button
            onClick={() => handleCopy(currentInviteCode)}
            className="shrink-0 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
      </div>
    );
  }

  if (status === "draft") {
    return (
      <div className="rounded-xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950 p-5">
        <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-1">This workshop is a draft</p>
        <p className="text-xs text-yellow-700 dark:text-yellow-400 mb-4">
          Publish it to generate an invite code and allow trainees to join.
        </p>
        {error && (
          <p className="mb-3 text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
        <button
          onClick={handlePublish}
          disabled={publishing}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {publishing ? "Publishing..." : "Publish workshop"}
        </button>
      </div>
    );
  }

  return null;
}
