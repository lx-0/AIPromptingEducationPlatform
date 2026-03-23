"use client";

import { useState, useEffect } from "react";

type Props = {
  instructorId: string;
  initialFollowing?: boolean;
  initialFollowerCount?: number;
};

export default function FollowButton({
  instructorId,
  initialFollowing = false,
  initialFollowerCount = 0,
}: Props) {
  const [following, setFollowing] = useState(initialFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/instructors/${instructorId}/follow`)
      .then((r) => r.json())
      .then((d) => {
        setFollowing(d.following);
        setFollowerCount(d.follower_count);
      })
      .catch(() => {});
  }, [instructorId]);

  async function toggle() {
    setLoading(true);
    try {
      const method = following ? "DELETE" : "POST";
      const res = await fetch(`/api/instructors/${instructorId}/follow`, { method });
      if (res.ok) {
        const data = await res.json();
        setFollowing(data.following);
        setFollowerCount(data.follower_count);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={toggle}
        disabled={loading}
        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
          following
            ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
            : "bg-blue-600 hover:bg-blue-700 text-white"
        }`}
      >
        {loading ? "…" : following ? "Following" : "Follow"}
      </button>
      {followerCount > 0 && (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {followerCount.toLocaleString()} follower{followerCount !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}
