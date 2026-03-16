"use client";

import { useState } from "react";
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

export default function ExerciseClient({ exercise, workshopId }: Props) {
  const [prompt, setPrompt] = useState("");
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [score, setScore] = useState<Score | null>(null);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setSubmission(null);
    setScore(null);
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
              setScore(parsed.score);
            }
          }
          if (parsed.error) {
            throw new Error(parsed.error);
          }
        }
      }

      setSubmission({
        id: submissionId ?? "",
        prompt_text: prompt.trim(),
        llm_response: accumulated || null,
        submitted_at: new Date().toISOString(),
      });
      setStreaming("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
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

      {/* Prompt submission */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
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
            {loading ? "Running…" : "Submit prompt"}
          </button>
        </form>
      </section>

      {/* Streaming response display */}
      {(streaming || submission) && (
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
            {streaming || submission?.llm_response || ""}
            {loading && <span className="inline-block w-1.5 h-4 bg-blue-400 animate-pulse ml-0.5 align-middle" />}
          </div>
        </section>
      )}

      {/* Score / feedback display */}
      {submission && score && (
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-2">Score</h2>
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-3xl font-bold text-gray-900">{score.total_score}</span>
            <span className="text-gray-500 text-lg">/ {score.max_score}</span>
          </div>
          {score.feedback.criteria && score.feedback.criteria.length > 0 && (
            <ul className="space-y-2 mb-4">
              {score.feedback.criteria.map((c, i) => (
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
          {score.feedback.overall && (
            <p className="text-sm text-gray-700 border-t border-gray-100 pt-3">
              {score.feedback.overall}
            </p>
          )}
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
