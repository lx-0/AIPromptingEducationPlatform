"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ToastProvider";

type Role = "instructor" | "trainee";

function CompleteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const { addToast } = useToast();

  const [role, setRole] = useState<Role>("trainee");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/auth/google/complete?next=${encodeURIComponent(next)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });

    if (!res.ok) {
      const body = await res.json();
      const message = body.error ?? "Could not complete sign-up";
      setError(message);
      addToast("error", message);
      setLoading(false);
      return;
    }

    const { next: redirectTo } = await res.json();
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-xl bg-white dark:bg-gray-900 p-8 shadow dark:shadow-gray-800"
    >
      {error && (
        <div role="alert" aria-live="polite" className="rounded-md bg-red-50 dark:bg-red-950 p-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <p className="text-sm text-gray-600 dark:text-gray-400">
        Almost there! Tell us how you&apos;ll be using Prompting School.
      </p>

      <fieldset>
        <legend className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          I am a…
        </legend>
        <div className="mt-2 flex gap-4">
          {(["trainee", "instructor"] as const).map((r) => (
            <label
              key={r}
              className={`flex flex-1 cursor-pointer items-center justify-center rounded-md border px-4 py-3 text-sm font-medium capitalize transition-colors ${
                role === r
                  ? "border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                  : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <input
                type="radio"
                name="role"
                value={r}
                checked={role === r}
                onChange={() => setRole(r)}
                className="sr-only"
              />
              {r}
            </label>
          ))}
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={loading}
        aria-busy={loading}
        className="w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
      >
        {loading ? "Setting up your account…" : "Continue"}
      </button>
    </form>
  );
}

export default function GoogleCompletePage() {
  return (
    <main
      id="main-content"
      className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4"
    >
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            One last step
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Choose your role to finish creating your account.
          </p>
        </div>

        <Suspense fallback={<div className="h-48 rounded-xl bg-white dark:bg-gray-900 shadow" />}>
          <CompleteForm />
        </Suspense>
      </div>
    </main>
  );
}
