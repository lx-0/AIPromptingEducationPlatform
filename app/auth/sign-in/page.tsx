"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ToastProvider";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const { addToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const body = await res.json();
      const message = body.error ?? "Sign in failed";
      setError(message);
      addToast("error", message);
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl bg-white p-8 shadow"
    >
      {error && (
        <div role="alert" aria-live="polite" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        aria-busy={loading}
        className="w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export default function SignInPage() {
  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/sign-up"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign up
            </Link>
          </p>
        </div>

        <Suspense fallback={<div className="h-64 rounded-xl bg-white shadow" />}>
          <SignInForm />
        </Suspense>
      </div>
    </main>
  );
}
