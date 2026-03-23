"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

type Notification = {
  id: string;
  type: string;
  payload: {
    exercise_title?: string;
    exercise_id?: string;
    workshop_id?: string;
    workshop_title?: string;
    instructor_name?: string;
    replier_name?: string;
    body_preview?: string;
    feedback_preview?: string;
    rating?: number;
    submission_id?: string;
  };
  read: boolean;
  created_at: string;
};

function notificationText(n: Notification): { text: string; href: string | null } {
  const p = n.payload;
  switch (n.type) {
    case "discussion_reply":
      return {
        text: `${p.replier_name ?? "Someone"} replied to your discussion in "${p.exercise_title ?? "an exercise"}"`,
        href: p.exercise_id && p.workshop_id
          ? `/workshops/${p.workshop_id}/exercises/${p.exercise_id}`
          : null,
      };
    case "peer_review_received":
      return {
        text: `You received a ${p.rating}-star peer review on "${p.exercise_title ?? "an exercise"}"`,
        href: p.exercise_id && p.workshop_id
          ? `/workshops/${p.workshop_id}/exercises/${p.exercise_id}`
          : null,
      };
    case "new_workshop_from_followed":
      return {
        text: `${p.instructor_name ?? "An instructor"} published "${p.workshop_title ?? "a new workshop"}"`,
        href: "/marketplace",
      };
    case "peer_review_assigned":
      return {
        text: "You have a new peer review assignment",
        href: "/dashboard",
      };
    default:
      return { text: "New notification", href: null };
  }
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const res = await fetch("/api/notifications?limit=10");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unread_count ?? 0);
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    load();
    // Poll every 60 seconds
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  async function markOneRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        className="relative p-1.5 rounded-lg text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-400 text-center">
                No notifications yet
              </p>
            ) : (
              notifications.map((n) => {
                const { text, href } = notificationText(n);
                const inner = (
                  <div
                    className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors cursor-pointer ${
                      !n.read ? "bg-blue-50/60 dark:bg-blue-950/30" : ""
                    }`}
                    onClick={() => { if (!n.read) markOneRead(n.id); setOpen(false); }}
                  >
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-snug">{text}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {new Date(n.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                );

                return href ? (
                  <Link key={n.id} href={href}>
                    {inner}
                  </Link>
                ) : (
                  <div key={n.id}>{inner}</div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
