"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateWorkshopForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/workshops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: description.trim() || null }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong.");
        return;
      }

      const workshop = await res.json();
      router.push(`/workshops/${workshop.id}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Prompt Engineering Fundamentals"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          autoFocus
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Description{" "}
          <span className="text-xs font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="What will trainees learn in this workshop?"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {submitting ? "Creating..." : "Create workshop"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="rounded-lg border border-gray-200 px-5 py-3 text-sm font-medium text-gray-700 hover:border-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
