"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Prefs = {
  score_notify: boolean;
  workshop_invite: boolean;
};

export default function EmailPreferencesPage() {
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/user/email-preferences")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setPrefs(data as Prefs);
      })
      .catch(() => setError("Failed to load preferences"));
  }, []);

  async function save() {
    if (!prefs) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/user/email-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Save failed");
      else setSaved(true);
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  }

  function toggle(key: keyof Prefs) {
    setPrefs((p) => p && { ...p, [key]: !p[key] });
    setSaved(false);
  }

  return (
    <main id="main-content" className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <nav
        aria-label="Main navigation"
        className="bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-800"
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link
            href="/dashboard"
            className="text-lg font-semibold text-gray-900 dark:text-gray-100"
          >
            PromptingSchool
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/docs"
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            >
              Help
            </Link>
            <form action="/auth/sign-out" method="POST">
              <button
                type="submit"
                className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Email Preferences
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Choose which emails you want to receive.
        </p>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 p-4">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {!prefs && !error && (
          <p className="mt-8 text-sm text-gray-500">Loading…</p>
        )}

        {prefs && (
          <>
            <div className="mt-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
              <PreferenceRow
                label="Score notifications"
                description="Get an email when the AI judge finishes scoring your submission."
                checked={prefs.score_notify}
                onToggle={() => toggle("score_notify")}
              />
              <PreferenceRow
                label="Workshop invites"
                description="Receive workshop invite emails sent directly to you."
                checked={prefs.workshop_invite}
                onToggle={() => toggle("workshop_invite")}
              />
            </div>

            <div className="mt-6 flex items-center gap-4">
              <button
                onClick={save}
                disabled={saving}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white
                           hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving…" : "Save preferences"}
              </button>
              {saved && (
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                  Saved!
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function PreferenceRow({
  label,
  description,
  checked,
  onToggle,
}: {
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-6 py-5">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {label}
        </p>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
                    transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    ${checked ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"}`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform
                      transition duration-200 ${checked ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}
