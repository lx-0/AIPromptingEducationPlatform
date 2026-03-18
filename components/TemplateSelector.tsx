"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface TemplateExercisePreview {
  title: string;
  instructions: string;
  rubric: Array<{ criterion: string; max_points: number; description: string }>;
}

interface TemplateSummary {
  id: string;
  name: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedMinutes: number;
  exerciseCount: number;
  exercises: TemplateExercisePreview[];
}

const DIFFICULTY_STYLES: Record<string, string> = {
  beginner:
    "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  intermediate:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  advanced:
    "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

interface TemplateSelectorProps {
  onClose: () => void;
}

export default function TemplateSelector({ onClose }: TemplateSelectorProps) {
  const router = useRouter();
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<TemplateSummary | null>(null);
  const [creating, setCreating] = useState(false);
  const [previewExercise, setPreviewExercise] = useState<TemplateExercisePreview | null>(null);

  useEffect(() => {
    fetch("/api/workshops/from-template")
      .then((r) => r.json())
      .then((data) => {
        setTemplates(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load templates.");
        setLoading(false);
      });
  }, []);

  async function handleUseTemplate() {
    if (!selected) return;
    setCreating(true);
    try {
      const res = await fetch("/api/workshops/from-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: selected.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to create workshop.");
        setCreating(false);
        return;
      }
      const workshop = await res.json();
      router.push(`/workshops/${workshop.id}`);
    } catch {
      setError("Network error. Please try again.");
      setCreating(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex w-full max-w-4xl flex-col rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Workshop Templates
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Start with a pre-built template and customize it to your needs.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Template list */}
          <div className="w-72 flex-shrink-0 overflow-y-auto border-r border-gray-200 dark:border-gray-700 p-4 space-y-3">
            {loading && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Loading templates…
              </p>
            )}
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            {templates.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => {
                  setSelected(tpl);
                  setPreviewExercise(null);
                }}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  selected?.id === tpl.id
                    ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-950"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {tpl.name}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium capitalize ${DIFFICULTY_STYLES[tpl.difficulty]}`}
                  >
                    {tpl.difficulty}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {tpl.exerciseCount} exercises · {tpl.estimatedMinutes} min
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Preview panel */}
          <div className="flex-1 overflow-y-auto p-6">
            {!selected ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-400 dark:text-gray-500">
                Select a template to preview it.
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      {selected.name}
                    </h3>
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium capitalize ${DIFFICULTY_STYLES[selected.difficulty]}`}
                    >
                      {selected.difficulty}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selected.description}
                  </p>
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    {selected.exerciseCount} exercises · ~{selected.estimatedMinutes} minutes
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Exercises
                  </h4>
                  <div className="space-y-2">
                    {selected.exercises.map((ex, i) => (
                      <div key={i}>
                        <button
                          onClick={() =>
                            setPreviewExercise(
                              previewExercise?.title === ex.title ? null : ex
                            )
                          }
                          className="w-full flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-left text-sm hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                        >
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            {i + 1}. {ex.title}
                          </span>
                          <span className="ml-2 text-gray-400 dark:text-gray-500 flex-shrink-0">
                            {previewExercise?.title === ex.title ? "▲" : "▼"}
                          </span>
                        </button>
                        {previewExercise?.title === ex.title && (
                          <div className="mt-1 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-4 space-y-3">
                            <div>
                              <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">
                                Instructions (excerpt)
                              </p>
                              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-4 whitespace-pre-wrap">
                                {ex.instructions.slice(0, 280)}
                                {ex.instructions.length > 280 ? "…" : ""}
                              </p>
                            </div>
                            {ex.rubric.length > 0 && (
                              <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">
                                  Rubric
                                </p>
                                <div className="space-y-1">
                                  {ex.rubric.map((r, ri) => (
                                    <div
                                      key={ri}
                                      className="flex items-start justify-between gap-2 text-xs text-gray-600 dark:text-gray-400"
                                    >
                                      <span>{r.criterion}</span>
                                      <span className="flex-shrink-0 font-medium text-gray-700 dark:text-gray-300">
                                        {r.max_points} pts
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            You can edit all content after creating from template.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUseTemplate}
              disabled={!selected || creating}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {creating ? "Creating…" : "Use template"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
