"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/components/ToastProvider";
import BadgeCelebration from "@/components/BadgeCelebration";

type RubricCriterion = {
  criterion: string;
  max_points: number;
  description?: string;
};

type ScoreCriterion = {
  criterion: string;
  score: number;
  comment?: string;
};

type Score = {
  total_score: number;
  max_score: number;
  feedback: {
    criteria?: ScoreCriterion[];
    overall?: string;
  };
};

type BadgeMeta = {
  type: string;
  label: string;
  description: string;
  emoji: string;
};

type Submission = {
  id: string;
  prompt_text: string;
  llm_response: string | null;
  submitted_at: string;
  total_score?: number | null;
  max_score?: number | null;
  feedback?: Score["feedback"] | null;
};

type Exercise = {
  id: string;
  title: string;
  instructions: string;
  rubric: RubricCriterion[];
};

type Props = {
  exercise: Exercise;
  workshopId: string;
};

function pct(score: number, max: number) {
  return max > 0 ? Math.round((score / max) * 100) : 0;
}

function ScoreBadge({ score, max }: { score: number; max: number }) {
  const p = pct(score, max);
  const color =
    p >= 80
      ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300"
      : p >= 50
      ? "bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300"
      : "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300";
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${color}`}>
      {score}/{max} pts
    </span>
  );
}

function CriterionBar({
  criterion,
  score,
  maxPoints,
  comment,
}: {
  criterion: string;
  score: number;
  maxPoints: number;
  comment?: string;
}) {
  const p = pct(score, maxPoints);
  const barColor =
    p >= 80 ? "bg-green-500" : p >= 50 ? "bg-yellow-400" : "bg-red-400";
  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <div className="flex items-baseline justify-between mb-1.5 gap-3">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{criterion}</p>
        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 shrink-0">
          {score}&thinsp;/&thinsp;{maxPoints} pts
        </span>
      </div>
      <div
        className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden mb-1.5"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={maxPoints}
        aria-label={`${criterion}: ${score} of ${maxPoints} points`}
      >
        <div
          className={`h-full rounded-full ${barColor} transition-[width] duration-500`}
          style={{ width: `${p}%` }}
        />
      </div>
      {comment && (
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{comment}</p>
      )}
    </li>
  );
}

function ScoreDelta({ delta }: { delta: number }) {
  const positive = delta > 0;
  const neutral = delta === 0;
  return (
    <span
      className={`text-xs font-semibold ${
        neutral
          ? "text-gray-400 dark:text-gray-500"
          : positive
          ? "text-green-600 dark:text-green-400"
          : "text-red-500 dark:text-red-400"
      }`}
    >
      {neutral ? "±0" : positive ? `↑ +${delta}` : `↓ ${delta}`} pts
    </span>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className ?? "h-5 w-5"}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function ExerciseClient({ exercise, workshopId }: Props) {
  const { addToast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [currentSubmission, setCurrentSubmission] = useState<Submission | null>(null);
  const [currentScore, setCurrentScore] = useState<Score | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<"executing" | "scoring">("executing");
  const [streaming, setStreaming] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Submission[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [newBadges, setNewBadges] = useState<BadgeMeta[]>([]);
  const formRef = useRef<HTMLElement>(null);

  // Load attempt history on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch(`/api/exercises/${exercise.id}/submissions`);
        if (res.ok) {
          const data: Submission[] = await res.json();
          setHistory(data);
        }
      } finally {
        setHistoryLoading(false);
      }
    }
    loadHistory();
  }, [exercise.id]);

  const bestAttempt = history.length > 0
    ? history.reduce((best, s) => {
        if (s.total_score == null) return best;
        if (best == null || best.total_score == null) return s;
        return s.total_score > best.total_score ? s : best;
      }, null as Submission | null)
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setLoadingPhase("executing");
    setError(null);
    setCurrentSubmission(null);
    setCurrentScore(null);
    setStreaming("");

    try {
      const res = await fetch(`/api/exercises/${exercise.id}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt_text: prompt.trim() }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Execution failed");
      }

      // Stream SSE response
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let submissionId: string | null = null;
      let finalScore: Score | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        let thisChunkHadText = false;

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6);
          if (!json.trim()) continue;

          const parsed = JSON.parse(json) as {
            text?: string;
            scoring?: boolean;
            done?: boolean;
            error?: string;
            submissionId?: string;
            score?: Score;
            newBadges?: BadgeMeta[];
            currentStreak?: number;
          };

          if (parsed.text) {
            thisChunkHadText = true;
            accumulated += parsed.text;
            setStreaming(accumulated);
          }
          if (parsed.scoring) {
            setLoadingPhase("scoring");
          }
          if (parsed.done) {
            submissionId = parsed.submissionId ?? null;
            if (parsed.score) {
              finalScore = parsed.score;
              setCurrentScore(parsed.score);
              const { total_score, max_score } = parsed.score;
              addToast(
                "success",
                `Scored! ${total_score}/${max_score} pts (${max_score > 0 ? Math.round((total_score / max_score) * 100) : 0}%)`
              );
            }
            if (parsed.newBadges && parsed.newBadges.length > 0) {
              setNewBadges(parsed.newBadges);
            }
            if (parsed.currentStreak && parsed.currentStreak >= 3) {
              addToast("success", `🔥 ${parsed.currentStreak}-day streak!`);
            }
          }
          if (parsed.error) {
            throw new Error(parsed.error);
          }
        }
      }

      const newSubmission: Submission = {
        id: submissionId ?? "",
        prompt_text: prompt.trim(),
        llm_response: accumulated || null,
        submitted_at: new Date().toISOString(),
        total_score: finalScore?.total_score ?? null,
        max_score: finalScore?.max_score ?? null,
        feedback: finalScore?.feedback ?? null,
      };

      setCurrentSubmission(newSubmission);
      setStreaming("");

      // Prepend to history
      setHistory((prev) => [newSubmission, ...prev]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setError(message);
      addToast("error", message);
    } finally {
      setLoading(false);
    }
  }

  function handleTryAgain() {
    setCurrentSubmission(null);
    setCurrentScore(null);
    setStreaming("");
    setError(null);
    setPrompt("");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="space-y-8">
      {/* Badge celebration overlay */}
      {newBadges.length > 0 && (
        <BadgeCelebration
          badges={newBadges}
          onDismiss={() => setNewBadges([])}
        />
      )}

      {/* Instructions */}
      <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Instructions</h2>
        <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
          <ReactMarkdown>{exercise.instructions}</ReactMarkdown>
        </div>
      </section>

      {/* Rubric */}
      {exercise.rubric && exercise.rubric.length > 0 && (
        <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Scoring rubric</h2>
          <ul className="space-y-3">
            {exercise.rubric.map((criterion, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 rounded bg-blue-50 dark:bg-blue-950 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300 shrink-0">
                  {criterion.max_points} pts
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{criterion.criterion}</p>
                  {criterion.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{criterion.description}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Best score banner (shown when history exists) */}
      {bestAttempt && bestAttempt.total_score != null && bestAttempt.max_score != null && (
        <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-0.5">Best score</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-green-800 dark:text-green-300">{bestAttempt.total_score}</span>
              <span className="text-green-600 dark:text-green-400 text-sm">/ {bestAttempt.max_score}</span>
              <span className="ml-1 text-sm text-green-600 dark:text-green-400">
                ({pct(bestAttempt.total_score, bestAttempt.max_score)}%)
              </span>
            </div>
          </div>
          <span className="text-xs text-green-600 dark:text-green-400">
            {history.length} attempt{history.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Prompt submission */}
      <section ref={formRef} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
        <h2 id="prompt-label" className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Your prompt</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            aria-labelledby="prompt-label"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={8}
            placeholder="Write your prompt here…"
            disabled={loading}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60 resize-y font-mono"
          />
          {error && (
            <div role="alert" aria-live="polite" className="flex items-start gap-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-4 py-3">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => { setError(null); setStreaming(""); setCurrentSubmission(null); setCurrentScore(null); }}
                className="shrink-0 rounded border border-red-300 dark:border-red-700 bg-white dark:bg-gray-900 px-2.5 py-1 text-xs font-semibold text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
              >
                Retry
              </button>
            </div>
          )}
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            aria-busy={loading}
            className="w-full sm:w-auto rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Running…" : history.length > 0 ? "Submit attempt" : "Submit prompt"}
          </button>
        </form>
      </section>

      {/* Loading state — shown while waiting for the first streamed token */}
      {loading && streaming === "" && loadingPhase === "executing" && (
        <section className="rounded-xl border border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-950 p-6">
          <div className="flex items-center gap-3">
            <LoadingSpinner className="h-5 w-5 text-blue-500 dark:text-blue-400" />
            <div>
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Running your prompt…</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                Sending your prompt to the AI model. This may take a few seconds.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Scoring in progress — shown after LLM finishes while AI judge runs */}
      {loading && loadingPhase === "scoring" && (
        <section className="rounded-xl border border-amber-100 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 p-6">
          <div className="flex items-center gap-3">
            <LoadingSpinner className="h-5 w-5 text-amber-500 dark:text-amber-400" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Scoring your response…</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                AI judge is evaluating your response against the rubric. Results will appear automatically.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Streaming response display */}
      {(streaming || currentSubmission) && (
        <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Response</h2>
            {loading && loadingPhase === "executing" ? (
              <span className="flex items-center gap-1.5 text-xs text-blue-500 dark:text-blue-400">
                <LoadingSpinner className="h-3.5 w-3.5" />
                streaming…
              </span>
            ) : currentSubmission && !loading ? (
              <span className="flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-900 px-3 py-1 text-xs font-semibold text-green-700 dark:text-green-300">
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
                Submitted{" "}
                <time dateTime={currentSubmission.submitted_at} className="font-normal">
                  {new Date(currentSubmission.submitted_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </time>
              </span>
            ) : null}
          </div>
          <div
            aria-live="polite"
            aria-label="AI response"
            aria-busy={loading}
            className="rounded-lg bg-gray-50 dark:bg-gray-800 p-4 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono min-h-[4rem]"
          >
            {streaming || currentSubmission?.llm_response || ""}
            {loading && <span className="inline-block w-1.5 h-4 bg-blue-400 motion-safe:animate-pulse ml-0.5 align-middle" />}
          </div>
        </section>
      )}

      {/* Score / feedback display */}
      {currentSubmission && currentScore && (
        <section className="rounded-xl border border-green-200 dark:border-green-800 bg-white dark:bg-gray-900 p-6">
          {/* Success header */}
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
            <span className="flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900 p-1">
              <svg className="h-4 w-4 text-green-600 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
            </span>
            <span className="text-sm font-semibold text-green-700 dark:text-green-400">Scored successfully</span>
          </div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">Your score</h2>
          <div className="flex items-baseline gap-1 mb-5">
            <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{currentScore.total_score}</span>
            <span className="text-gray-500 dark:text-gray-400 text-lg">/ {currentScore.max_score} pts</span>
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
              ({pct(currentScore.total_score, currentScore.max_score)}%)
            </span>
            {history.length >= 2 && history[1].total_score != null && (
              <span className="ml-2">
                <ScoreDelta delta={currentScore.total_score - history[1].total_score} />
                <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">vs attempt {history.length - 1}</span>
              </span>
            )}
          </div>
          {currentScore.feedback.criteria && currentScore.feedback.criteria.length > 0 && (
            <div className="mb-5">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Breakdown by criterion
              </h3>
              <ul className="divide-y divide-gray-100 dark:divide-gray-800 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 px-4">
                {currentScore.feedback.criteria.map((c, i) => {
                  const rubricEntry = exercise.rubric.find(
                    (r) => r.criterion === c.criterion
                  );
                  const maxPoints = rubricEntry?.max_points ?? currentScore.max_score;
                  return (
                    <CriterionBar
                      key={i}
                      criterion={c.criterion}
                      score={c.score}
                      maxPoints={maxPoints}
                      comment={c.comment}
                    />
                  );
                })}
              </ul>
            </div>
          )}
          {currentScore.feedback.overall && (
            <div className="rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 px-4 py-3">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                Overall feedback
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {currentScore.feedback.overall}
              </p>
            </div>
          )}
          <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={handleTryAgain}
              className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 px-5 py-2 text-sm font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
            >
              Try again
            </button>
          </div>
        </section>
      )}

      {/* Attempt history */}
      {!historyLoading && history.length > 1 && (
        <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Attempt history
            <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">({history.length} attempts)</span>
          </h2>
          <ol className="space-y-3">
            {history.map((s, i) => (
              <li key={s.id} className="rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Attempt #{history.length - i}
                  </span>
                  <div className="flex items-center gap-2">
                    {s.total_score != null && s.max_score != null ? (
                      <>
                        <ScoreBadge score={s.total_score} max={s.max_score} />
                        {i < history.length - 1 && history[i + 1].total_score != null && (
                          <ScoreDelta delta={s.total_score - history[i + 1].total_score!} />
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500">no score</span>
                    )}
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(s.submitted_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap line-clamp-3">
                  {s.prompt_text}
                </p>
                {s.feedback?.overall && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic border-t border-gray-200 dark:border-gray-700 pt-2">
                    {s.feedback.overall}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Back link */}
      <div>
        <a href={`/workshops/${workshopId}`} className="text-sm text-blue-600 hover:underline">
          ← Back to workshop
        </a>
      </div>
    </div>
  );
}
