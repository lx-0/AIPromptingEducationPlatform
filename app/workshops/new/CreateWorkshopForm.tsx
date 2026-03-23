"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const TemplateSelector = dynamic(() => import("@/components/TemplateSelector"), {
  ssr: false,
});

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

export default function CreateWorkshopForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

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

      // Set category if selected
      if (categoryId) {
        await fetch(`/api/workshops/${workshop.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category_id: categoryId }),
        });
      }

      // Set tags if provided
      const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
      if (tags.length > 0) {
        await fetch(`/api/workshops/${workshop.id}/tags`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tags }),
        });
      }

      router.push(`/workshops/${workshop.id}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Template shortcut banner */}
      <div className="mb-6 rounded-lg border border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
              New to PromptingSchool?
            </p>
            <p className="mt-0.5 text-sm text-blue-600 dark:text-blue-400">
              Jump-start your workshop with a ready-made template — complete with exercises and rubrics.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowTemplates(true)}
            className="flex-shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Browse templates
          </button>
        </div>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-200 dark:border-gray-700" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white dark:bg-gray-900 px-3 text-xs text-gray-400 dark:text-gray-500">
            or create from scratch
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Prompt Engineering Fundamentals"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-400 focus:outline-none dark:focus:border-blue-500"
            autoFocus
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description{" "}
            <span className="text-xs font-normal text-gray-400 dark:text-gray-500">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="What will trainees learn in this workshop?"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-400 focus:outline-none dark:focus:border-blue-500"
          />
        </div>

        {categories.length > 0 && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Category{" "}
              <span className="text-xs font-normal text-gray-400 dark:text-gray-500">(optional)</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-400 focus:outline-none dark:focus:border-blue-500"
            >
              <option value="">Select a category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tags{" "}
            <span className="text-xs font-normal text-gray-400 dark:text-gray-500">(optional, comma-separated)</span>
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="e.g. gpt-4, few-shot, summarization"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-400 focus:outline-none dark:focus:border-blue-500"
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
            className="rounded-lg border border-gray-200 dark:border-gray-700 px-5 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>

      {showTemplates && (
        <TemplateSelector onClose={() => setShowTemplates(false)} />
      )}
    </>
  );
}
