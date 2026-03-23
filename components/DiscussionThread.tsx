"use client";

import { useState, useEffect, useCallback } from "react";

type DiscussionPost = {
  id: string;
  body: string;
  parent_id: string | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  author_role: string;
};

type Props = {
  exerciseId: string;
  currentUserId: string;
  currentUserRole: string;
  isInstructor: boolean;
};

export default function DiscussionThread({
  exerciseId,
  currentUserId,
  currentUserRole,
  isInstructor,
}: Props) {
  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<DiscussionPost | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/exercises/${exerciseId}/discussions`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.discussions);
      }
    } finally {
      setLoading(false);
    }
  }, [exerciseId]);

  useEffect(() => { load(); }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/exercises/${exerciseId}/discussions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim(), parent_id: replyTo?.id ?? null }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to post");
        return;
      }
      setBody("");
      setReplyTo(null);
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  async function deletePost(id: string) {
    if (!confirm("Delete this message?")) return;
    await fetch(`/api/discussions/${id}`, { method: "DELETE" });
    await load();
  }

  async function togglePin(post: DiscussionPost) {
    await fetch(`/api/discussions/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_pinned: !post.is_pinned }),
    });
    await load();
  }

  const topLevel = posts.filter((p) => !p.parent_id);
  const replies = (parentId: string) => posts.filter((p) => p.parent_id === parentId);

  function PostCard({ post, depth = 0 }: { post: DiscussionPost; depth?: number }) {
    const children = replies(post.id);
    const canDelete =
      post.author_id === currentUserId || isInstructor;

    return (
      <div
        className={`${depth > 0 ? "ml-8 border-l-2 border-gray-100 dark:border-gray-800 pl-4" : ""}`}
      >
        <div
          className={`rounded-lg p-4 mb-3 ${
            post.is_pinned
              ? "bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800"
              : "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="shrink-0 h-7 w-7 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-bold text-blue-700 dark:text-blue-300">
                {post.author_name[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="min-w-0">
                <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                  {post.author_name}
                </span>
                {post.author_role === "instructor" && (
                  <span className="ml-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded px-1.5 py-0.5">
                    Instructor
                  </span>
                )}
                {post.is_pinned && (
                  <span className="ml-1 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded px-1.5 py-0.5">
                    Pinned
                  </span>
                )}
                <span className="ml-2 text-xs text-gray-400">
                  {new Date(post.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {isInstructor && (
                <button
                  onClick={() => togglePin(post)}
                  className="text-xs text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors px-1"
                  title={post.is_pinned ? "Unpin" : "Pin to top"}
                >
                  {post.is_pinned ? "📌 Unpin" : "📌 Pin"}
                </button>
              )}
              <button
                onClick={() => setReplyTo(post)}
                className="text-xs text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-1"
              >
                Reply
              </button>
              {canDelete && (
                <button
                  onClick={() => deletePost(post.id)}
                  className="text-xs text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors px-1"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
            {post.body}
          </p>
        </div>
        {children.map((child) => (
          <PostCard key={child.id} post={child} depth={depth + 1} />
        ))}
      </div>
    );
  }

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Discussion
      </h2>

      {loading ? (
        <p className="text-sm text-gray-400">Loading discussions…</p>
      ) : posts.length === 0 ? (
        <p className="text-sm text-gray-400 mb-4">
          No discussions yet. Be the first to ask a question!
        </p>
      ) : (
        <div className="mb-6">
          {topLevel.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      <form onSubmit={submit} className="mt-4">
        {replyTo && (
          <div className="flex items-center gap-2 mb-2 text-sm text-gray-500 dark:text-gray-400">
            <span>
              Replying to <strong>{replyTo.author_name}</strong>:&nbsp;
              <span className="italic text-gray-400">
                {replyTo.body.slice(0, 60)}{replyTo.body.length > 60 ? "…" : ""}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="text-xs text-gray-400 hover:text-red-500"
            >
              ✕ Cancel
            </button>
          </div>
        )}
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={replyTo ? "Write a reply…" : "Ask a question or share a tip…"}
          rows={3}
          maxLength={5000}
          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-gray-400">{body.length}/5000</span>
          <button
            type="submit"
            disabled={submitting || !body.trim()}
            className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 text-sm font-medium text-white transition-colors"
          >
            {submitting ? "Posting…" : replyTo ? "Reply" : "Post"}
          </button>
        </div>
      </form>
    </section>
  );
}
