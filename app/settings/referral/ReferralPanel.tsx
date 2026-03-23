"use client";

import { useState } from "react";

interface ReferralPanelProps {
  referralCode: string;
  referralUrl: string;
}

export default function ReferralPanel({ referralCode, referralUrl }: ReferralPanelProps) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  const twitterText = `I've been learning AI prompting on Prompting School — highly recommend! Sign up with my link:`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}&url=${encodeURIComponent(referralUrl)}`;

  return (
    <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 p-6">
      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Your referral link</h2>

      {/* Code display */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Referral code</p>
        <div className="inline-flex items-center gap-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-4 py-2">
          <span className="font-mono text-lg font-bold text-blue-700 dark:text-blue-300 tracking-widest">
            {referralCode}
          </span>
        </div>
      </div>

      {/* URL input + copy button */}
      <div className="flex gap-2 mb-4">
        <input
          readOnly
          value={referralUrl}
          className="flex-1 min-w-0 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 font-mono"
          aria-label="Referral URL"
        />
        <button
          type="button"
          onClick={copyLink}
          className="shrink-0 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-medium text-white transition-colors"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* Share on X */}
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
        </svg>
        Share on X
      </a>
    </div>
  );
}
