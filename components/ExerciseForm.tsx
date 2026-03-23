"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RubricBuilder, { RubricCriterion } from "./RubricBuilder";
import { PROVIDER_MODELS, DEFAULT_MODEL } from "@/lib/llm-providers/types";
import type { ProviderName } from "@/lib/llm-providers/types";

type ModelConfig = {
  provider?: ProviderName;
  model?: string;
  temperature?: number;
  max_tokens?: number;
};

type ExerciseFormProps = {
  workshopId: string;
  exerciseId?: string;
  initialValues?: {
    title: string;
    instructions: string;
    system_prompt: string;
    rubric: RubricCriterion[];
    sort_order: number;
    model_config?: ModelConfig;
  };
};

const PROVIDERS: { id: ProviderName; label: string }[] = [
  { id: "anthropic", label: "Anthropic (Claude)" },
  { id: "openai", label: "OpenAI (GPT)" },
  { id: "google", label: "Google (Gemini)" },
];

export default function ExerciseForm({
  workshopId,
  exerciseId,
  initialValues,
}: ExerciseFormProps) {
  const router = useRouter();
  const isEdit = !!exerciseId;

  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [instructions, setInstructions] = useState(
    initialValues?.instructions ?? ""
  );
  const [systemPrompt, setSystemPrompt] = useState(
    initialValues?.system_prompt ?? ""
  );
  const [rubric, setRubric] = useState<RubricCriterion[]>(
    initialValues?.rubric ?? []
  );
  const [sortOrder, setSortOrder] = useState(initialValues?.sort_order ?? 0);

  const initProvider: ProviderName =
    (initialValues?.model_config?.provider as ProviderName) ?? "anthropic";
  const [provider, setProvider] = useState<ProviderName>(initProvider);
  const [model, setModel] = useState<string>(
    initialValues?.model_config?.model ?? DEFAULT_MODEL[initProvider]
  );
  const [temperature, setTemperature] = useState<number>(
    initialValues?.model_config?.temperature ?? 0.7
  );
  const [maxTokens, setMaxTokens] = useState<number>(
    initialValues?.model_config?.max_tokens ?? 1024
  );

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleProviderChange(newProvider: ProviderName) {
    setProvider(newProvider);
    setModel(DEFAULT_MODEL[newProvider]);
  }

  function validate(): string | null {
    if (!title.trim()) return "Title is required.";
    if (!instructions.trim()) return "Instructions are required.";
    if (rubric.length === 0) return "Add at least one rubric criterion.";
    for (const c of rubric) {
      if (!c.criterion.trim()) return "All criteria must have a name.";
      if (c.max_points < 1) return "All criteria must have max_points > 0.";
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const body = {
        title: title.trim(),
        instructions: instructions.trim(),
        system_prompt: systemPrompt.trim() || null,
        rubric,
        sort_order: sortOrder,
        model_config: {
          provider,
          model,
          temperature,
          max_tokens: maxTokens,
        },
      };

      const res = isEdit
        ? await fetch(`/api/exercises/${exerciseId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch(`/api/workshops/${workshopId}/exercises`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong.");
        return;
      }

      router.push(`/workshops/${workshopId}`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
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
          placeholder="e.g. Write a customer support prompt"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Instructions <span className="text-red-500">*</span>
        </label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={5}
          placeholder="Describe what the trainee should do..."
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          System prompt{" "}
          <span className="text-xs font-normal text-gray-400 dark:text-gray-500">(optional)</span>
        </label>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={3}
          placeholder="System prompt for the AI model (if any)..."
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
        />
      </div>

      {/* Model configuration */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Model configuration
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Provider
            </label>
            <select
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value as ProviderName)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            >
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Model
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            >
              {PROVIDER_MODELS[provider].map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Temperature{" "}
              <span className="text-gray-400 dark:text-gray-500 font-normal">
                ({temperature})
              </span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
              <span>Precise</span>
              <span>Creative</span>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Max tokens
            </label>
            <input
              type="number"
              min="64"
              max="8192"
              step="64"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value) || 1024)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Sort order{" "}
          <span className="text-xs font-normal text-gray-400 dark:text-gray-500">
            (lower numbers appear first)
          </span>
        </label>
        <input
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
          className="w-28 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Rubric criteria <span className="text-red-500">*</span>
        </label>
        <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
          Define the criteria used to evaluate trainee submissions. Each
          criterion will be scored by AI.
        </p>
        <RubricBuilder value={rubric} onChange={setRubric} />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {submitting
            ? isEdit
              ? "Saving..."
              : "Creating..."
            : isEdit
              ? "Save changes"
              : "Create exercise"}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/workshops/${workshopId}`)}
          className="rounded-lg border border-gray-200 dark:border-gray-700 px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
