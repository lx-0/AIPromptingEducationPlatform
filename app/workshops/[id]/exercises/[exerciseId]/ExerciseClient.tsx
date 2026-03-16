"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

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
      ? "bg-green-50 text-green-700"
      : p >= 50
      ? "bg-yellow-50 text-yellow-700"
      : "bg-red-50 text-red-700";
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${color}`}>
      {score}/{max} pts
    </span>
  );
}

export default function ExerciseClient({ exercise, workshopId }: Props) {
  const [prompt, setPrompt] = useState("");
  const [currentSubmission, setCurrentSubmission] = useState<Submission | null>(null);
  const [currentScore, setCurrentScore] = useState<Score | null>(null);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Submission[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
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

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6);
          if (!json.trim()) continue;

          const parsed = JSON.parse(json) as {
            text?: string;
            done?: boolean;
            error?: string;
            submissionId?: string;
            score?: Score;
          };

          if (parsed.text) {
            accumulated += parsed.text;
            setStreaming(accumulated);
          }
          if (parsed.done) {
            submissionId = parsed.submissionId ?? null;
            if (parsed.score) {
              finalScore = parsed.score;
              setCurrentScore(parsed.score);
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
      setError(err instanceof Error ? err.message : "Unexpected error");
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
      {/* Instructions */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Instructions</h2>
        <div className="prose prose-sm max-w-none text-gray-700">
          <ReactMarkdown>{exercise.instructions}</ReactMarkdown>
        </div>
      </section>

      {/* Rubric */}
      {exercise.rubric && exercise.rubric.length > 0 && (
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Scoring rubric</h2>
          <ul className="space-y-3">
            {exercise.rubric.map((criterion, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 shrink-0">
                  {criterion.max_points} pts
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{criterion.criterion}</p>
                  {criterion.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{criterion.description}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Best score banner (shown when history exists) */}
      {bestAttempt && bestAttempt.total_score != null && bestAttempt.max_score != null && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-0.5">Best score</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-green-800">{bestAttempt.total_score}</span>
              <span className="text-green-600 text-sm">/ {bestAttempt.max_score}</span>
              <span className="ml-1 text-sm text-green-600">
                ({pct(bestAttempt.total_score, bestAttempt.max_score)}%)
              </span>
            </div>
          </div>
          <span className="text-xs text-green-600">
            {history.length} attempt{history.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Prompt submission */}
      <section ref={formRef} className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Your prompt</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={8}
            placeholder="Write your prompt here…"
            disabled={loading}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60 resize-y font-mono"
          />
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Running…" : history.length > 0 ? "Submit attempt" : "Submit prompt"}
          </button>
        </form>
      </section>

      {/* Streaming response display */}
      {(streaming || currentSubmission) && (
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Response
            {loading && (
              <span className="ml-2 text-xs font-normal text-blue-500 animate-pulse">
                streaming…
              </span>
            )}
          </h2>
          <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-800 whitespace-pre-wrap font-mono min-h-[4rem]">
            {streaming || currentSubmission?.llm_response || ""}
            {loading && <span className="inline-block w-1.5 h-4 bg-blue-400 animate-pulse ml-0.5 align-middle" />}
          </div>
        </section>
      )}

      {/* Score / feedback display */}
      {currentSubmission && currentScore && (
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-2">Score</h2>
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-3xl font-bold text-gray-900">{currentScore.total_score}</span>
            <span className="text-gray-500 text-lg">/ {currentScore.max_score}</span>
          </div>
          {currentScore.feedback.criteria && currentScore.feedback.criteria.length > 0 && (
            <ul className="space-y-2 mb-4">
              {currentScore.feedback.criteria.map((c, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="rounded bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700 shrink-0">
                    {c.score} pts
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{c.criterion}</p>
                    {c.comment && <p className="text-gray-600 text-xs mt-0.5">{c.comment}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {currentScore.feedback.overall && (
            <p className="text-sm text-gray-700 border-t border-gray-100 pt-3">
              {currentScore.feedback.overall}
            </p>
          )}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <button
              onClick={handleTryAgain}
              className="rounded-lg border border-blue-200 bg-blue-50 px-5 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
            >
              Try again
            </button>
          </div>
        </section>
      )}

      {/* Attempt history */}
      {!historyLoading && history.length > 1 && (
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Attempt history
            <span className="ml-2 text-xs font-normal text-gray-500">({history.length} attempts)</span>
          </h2>
          <ol className="space-y-3">
            {history.map((s, i) => (
              <li key={s.id} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500">
                    Attempt #{history.length - i}
                  </span>
                  <div className="flex items-center gap-2">
                    {s.total_score != null && s.max_score != null ? (
                      <ScoreBadge score={s.total_score} max={s.max_score} />
                    ) : (
                      <span className="text-xs text-gray-400">no score</span>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(s.submitted_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-700 font-mono whitespace-pre-wrap line-clamp-3">
                  {s.prompt_text}
                </p>
                {s.feedback?.overall && (
                  <p className="mt-2 text-xs text-gray-500 italic border-t border-gray-200 pt-2">
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
