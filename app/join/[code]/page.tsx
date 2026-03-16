"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Workshop = {
  id: string;
  title: string;
  description: string | null;
};

export default function JoinPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();

  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/join/${code}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json();
          setError(body.error ?? "Invalid invite link");
        } else {
          setWorkshop(await res.json());
        }
      })
      .catch(() => setError("Failed to load workshop"))
      .finally(() => setLoading(false));
  }, [code]);

  async function handleJoin() {
    setJoining(true);
    const res = await fetch(`/api/join/${code}`, { method: "POST" });

    if (res.status === 401) {
      router.push(`/auth/sign-in?next=/join/${code}`);
      return;
    }

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Failed to join workshop");
      setJoining(false);
      return;
    }

    const { workshopId } = await res.json();
    router.push(`/workshops/${workshopId}`);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Loading…</p>
      </main>
    );
  }

  if (error || !workshop) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-8 text-center shadow">
          <p className="text-lg font-semibold text-red-600">Invalid invite link</p>
          <p className="mt-2 text-sm text-gray-500">
            {error ?? "This invite link is not valid or has expired."}
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-block text-sm font-medium text-blue-600 hover:underline"
          >
            Go to dashboard →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            You&apos;re invited
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Join this workshop to start practising prompts.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow">
          <h2 className="text-xl font-semibold text-gray-900">{workshop.title}</h2>
          {workshop.description && (
            <p className="mt-2 text-sm text-gray-600">{workshop.description}</p>
          )}

          <button
            onClick={handleJoin}
            disabled={joining}
            className="mt-6 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
          >
            {joining ? "Joining…" : "Join workshop"}
          </button>
        </div>
      </div>
    </main>
  );
}
