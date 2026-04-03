"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PROVIDER_MODELS } from "@/lib/llm-providers/types";
import type { ProviderName } from "@/lib/llm-providers/types";

type DefaultProviderPanelProps = {
  workshopId: string;
  defaultProvider: ProviderName;
};

const PROVIDERS: { id: ProviderName; label: string }[] = [
  { id: "anthropic", label: "Anthropic (Claude)" },
  { id: "openai", label: "OpenAI (GPT)" },
  { id: "google", label: "Google (Gemini)" },
];

export default function DefaultProviderPanel({
  workshopId,
  defaultProvider,
}: DefaultProviderPanelProps) {
  const router = useRouter();
  const [provider, setProvider] = useState<ProviderName>(defaultProvider);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/workshops/${workshopId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ default_provider: provider }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to save.");
        return;
      }
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const models = PROVIDER_MODELS[provider];

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Default LLM provider
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Used for exercises that don&apos;t specify their own provider.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
            Provider
          </label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as ProviderName)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          >
            {PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500">
          Available models: {models.map((m) => m.label).join(", ")}
        </p>
      </div>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      <button
        onClick={handleSave}
        disabled={saving || provider === defaultProvider}
        className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {saving ? "Saving…" : saved ? "Saved!" : "Save"}
      </button>
    </div>
  );
}
