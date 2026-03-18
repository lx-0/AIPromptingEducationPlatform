"use client";

import { useEffect, useState } from "react";

type BadgeMeta = {
  type: string;
  label: string;
  description: string;
  emoji: string;
};

type Props = {
  badges: BadgeMeta[];
  onDismiss: () => void;
};

/**
 * Full-screen celebration overlay shown when new badges are unlocked.
 * Auto-dismisses after 4 seconds; can also be dismissed by clicking.
 */
export default function BadgeCelebration({ badges, onDismiss }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  if (!visible || badges.length === 0) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Badge unlocked!"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={() => { setVisible(false); onDismiss(); }}
    >
      <div
        className="relative mx-4 max-w-sm w-full rounded-2xl bg-white p-8 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Confetti circles (CSS animation) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
        >
          {[...Array(12)].map((_, i) => (
            <span
              key={i}
              className="absolute block h-3 w-3 rounded-full opacity-0 animate-confetti"
              style={{
                left: `${8 + (i % 6) * 16}%`,
                top: "-12px",
                backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                animationDelay: `${i * 0.08}s`,
              }}
            />
          ))}
        </div>

        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-500 mb-2">
            Badge unlocked!
          </p>

          <div className="flex flex-wrap justify-center gap-4 my-4">
            {badges.map((badge) => (
              <div key={badge.type} className="flex flex-col items-center gap-1">
                <span
                  className="text-6xl animate-bounce-once"
                  aria-label={badge.label}
                >
                  {badge.emoji}
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {badge.label}
                </span>
                <span className="text-xs text-gray-500">{badge.description}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => { setVisible(false); onDismiss(); }}
            className="mt-4 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Awesome!
          </button>
        </div>
      </div>

      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(350px) rotate(720deg); opacity: 0; }
        }
        .animate-confetti {
          animation: confetti-fall 1.8s ease-in forwards;
        }
        @keyframes bounce-once {
          0%, 100% { transform: translateY(0); }
          40%       { transform: translateY(-20px); }
          60%       { transform: translateY(-10px); }
        }
        .animate-bounce-once {
          animation: bounce-once 0.8s ease both;
        }
      `}</style>
    </div>
  );
}

const CONFETTI_COLORS = [
  "#60a5fa", "#34d399", "#fbbf24", "#f87171",
  "#a78bfa", "#fb923c", "#38bdf8", "#4ade80",
];
