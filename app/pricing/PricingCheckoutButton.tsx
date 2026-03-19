"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  plan: "pro" | "team";
  isCurrent: boolean;
  isHighlight: boolean;
  isSignedIn: boolean;
}

export default function PricingCheckoutButton({ plan, isCurrent, isHighlight, isSignedIn }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    if (!isSignedIn) {
      router.push("/auth/sign-up");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error ?? "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  }

  if (isCurrent) {
    return (
      <span
        className={`block text-center rounded-lg px-6 py-3 text-sm font-semibold ${
          isHighlight
            ? "bg-white/20 text-white"
            : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
        }`}
      >
        Current plan
      </span>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`w-full rounded-lg px-6 py-3 text-sm font-semibold transition-colors disabled:opacity-60 ${
        isHighlight
          ? "bg-white text-blue-600 hover:bg-blue-50"
          : "bg-blue-600 text-white hover:bg-blue-700"
      }`}
    >
      {loading ? "Redirecting…" : "Upgrade now"}
    </button>
  );
}
