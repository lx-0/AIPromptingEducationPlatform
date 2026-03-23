"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PathEnrollButton({ pathId }: { pathId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleEnroll() {
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/paths/${pathId}/enroll`, { method: "POST" });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Enrollment failed");
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <button
        onClick={handleEnroll}
        disabled={loading}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Enrolling…" : "Enroll"}
      </button>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
