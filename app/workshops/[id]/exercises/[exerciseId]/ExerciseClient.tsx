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

type ExerciseStep = {
  step_number: number;
  instructions: string;
  system_prompt: string | null;
};

type ExerciseConstraints = {
  char_limit?: number;
  forbidden_words?: string[];
  required_keywords?: string[];
};

type ExerciseType = "standard" | "multi_step" | "comparison" | "constrained";

type Exercise = {
  id: string;
  title: string;
  instructions: string;
  rubric: RubricCriterion[];
  exercise_type: ExerciseType;
  difficulty: "beginner" | "intermediate" | "advanced";
  constraints: ExerciseConstraints;
  steps?: ExerciseStep[];
};

type Props = {
  exercise: Exercise;
  workshopId: string;
};

function pct(score: number, max: number) {
  return max > 0 ? Math.round((score / max) * 100) : 0;
}

const DIFFICULTY_COLORS = {
  beginner: "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300",
  intermediate: "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300",
  advanced: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300",
};

const TYPE_LABELS: Record<ExerciseType, string> = {
  standard: "Standard",
  multi_step: "Multi-step",
  comparison: "Comparison",
  constrained: "Constrained",
};

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
  const barColor = p >= 80 ? "bg-green-500" : p >= 50 ? "bg-yellow-400" : "bg-red-400";
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

function ScoreSection({
  score,
  exercise,
  history,
  onTryAgain,
}: {
  score: Score;
  exercise: Exercise;
  history: Submission[];
  onTryAgain: () => void;
}) {
  return (
    <section className="rounded-xl border border-green-200 dark:border-green-800 bg-white dark:bg-gray-900 p-6">
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
        <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{score.total_score}</span>
        <span className="text-gray-500 dark:text-gray-400 text-lg">/ {score.max_score} pts</span>
        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
          ({pct(score.total_score, score.max_score)}%)
        </span>
        {history.length >= 2 && history[1].total_score != null && (
          <span className="ml-2">
            <ScoreDelta delta={score.total_score - history[1].total_score} />
            <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">vs attempt {history.length - 1}</span>
          </span>
        )}
      </div>
      {score.feedback.criteria && score.feedback.criteria.length > 0 && (
        <div className="mb-5">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Breakdown by criterion
          </h3>
          <ul className="divide-y divide-gray-100 dark:divide-gray-800 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 px-4">
            {score.feedback.criteria.map((c, i) => {
              const rubricEntry = exercise.rubric.find((r) => r.criterion === c.criterion);
              const maxPoints = rubricEntry?.max_points ?? score.max_score;
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
      {score.feedback.overall && (
        <div className="rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 px-4 py-3">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
            Overall feedback
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {score.feedback.overall}
          </p>
        </div>
      )}
      <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={onTryAgain}
          className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 px-5 py-2 text-sm font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
        >
          Try again
        </button>
      </div>
    </section>
  );
}

// ─── Hint Button ─────────────────────────────────────────────────────────────

function HintButton({
  exerciseId,
  currentPrompt,
}: {
  exerciseId: string;
  currentPrompt: string;
}) {
  const [hint, setHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shown, setShown] = useState(false);

  async function fetchHint() {
    setLoading(true);
    try {
      const res = await fetch(`/api/exercises/${exerciseId}/hint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_prompt: currentPrompt }),
      });
      const data = await res.json();
      if (data.hint) {
        setHint(data.hint);
        setShown(true);
      }
    } finally {
      setLoading(false);
    }
  }

  if (shown && hint) {
    return (
      <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 px-4 py-3">
        <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Hint</p>
        <p className="text-sm text-amber-800 dark:text-amber-300">{hint}</p>
        <button
          type="button"
          onClick={() => { setShown(false); setHint(null); }}
          className="mt-2 text-xs text-amber-600 dark:text-amber-400 hover:underline"
        >
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={fetchHint}
      disabled={loading}
      className="text-sm text-amber-600 dark:text-amber-400 hover:underline disabled:opacity-50"
    >
      {loading ? "Getting hint…" : "Get a hint"}
    </button>
  );
}

// ─── Constraint checker (client-side preview) ────────────────────────────────

function ConstraintChecker({
  constraints,
  prompt,
}: {
  constraints: ExerciseConstraints;
  prompt: string;
}) {
  const items: { label: string; ok: boolean }[] = [];

  if (constraints.char_limit) {
    items.push({
      label: `Character limit: ${prompt.length}/${constraints.char_limit}`,
      ok: prompt.length <= constraints.char_limit,
    });
  }

  if (constraints.forbidden_words && constraints.forbidden_words.length > 0) {
    const lower = prompt.toLowerCase();
    for (const word of constraints.forbidden_words) {
      const re = new RegExp(`\\b${word.toLowerCase()}\\b`);
      items.push({
        label: `No "${word}"`,
        ok: !re.test(lower),
      });
    }
  }

  if (constraints.required_keywords && constraints.required_keywords.length > 0) {
    const lower = prompt.toLowerCase();
    for (const kw of constraints.required_keywords) {
      items.push({
        label: `Must include "${kw}"`,
        ok: lower.includes(kw.toLowerCase()),
      });
    }
  }

  if (items.length === 0) return null;

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
        Constraints
      </p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2 text-xs">
            <span className={item.ok ? "text-green-500" : "text-red-400"}>
              {item.ok ? "✓" : "✗"}
            </span>
            <span className={item.ok ? "text-gray-700 dark:text-gray-300" : "text-red-600 dark:text-red-400"}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ExerciseClient({ exercise, workshopId }: Props) {
  const { addToast } = useToast();
  const [newBadges, setNewBadges] = useState<BadgeMeta[]>([]);
  const [history, setHistory] = useState<Submission[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const formRef = useRef<HTMLElement>(null);

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

  function handleNewBadges(badges: BadgeMeta[], streak?: number) {
    if (badges.length > 0) setNewBadges(badges);
    if (streak && streak >= 3) addToast("success", `🔥 ${streak}-day streak!`);
  }

  function handleScored(score: Score, newSubmission: Submission) {
    setHistory((prev) => [newSubmission, ...prev]);
    addToast(
      "success",
      `Scored! ${score.total_score}/${score.max_score} pts (${score.max_score > 0 ? Math.round((score.total_score / score.max_score) * 100) : 0}%)`
    );
  }

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="space-y-8">
      {newBadges.length > 0 && (
        <BadgeCelebration badges={newBadges} onDismiss={() => setNewBadges([])} />
      )}

      {/* Header badges: difficulty + type */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${DIFFICULTY_COLORS[exercise.difficulty]}`}>
          {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
        </span>
        {exercise.exercise_type !== "standard" && (
          <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
            {TYPE_LABELS[exercise.exercise_type]}
          </span>
        )}
      </div>

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

      {/* Best score banner */}
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

      {/* Exercise-type-specific submission UIs */}
      {exercise.exercise_type === "multi_step" ? (
        <MultiStepClient
          exercise={exercise}
          history={history}
          formRef={formRef}
          onScored={handleScored}
          onBadges={handleNewBadges}
          onTryAgain={() => { setHistory([]); scrollToForm(); }}
        />
      ) : exercise.exercise_type === "comparison" ? (
        <ComparisonClient
          exercise={exercise}
          history={history}
          formRef={formRef}
          onScored={handleScored}
          onBadges={handleNewBadges}
          onTryAgain={scrollToForm}
        />
      ) : (
        <StandardClient
          exercise={exercise}
          history={history}
          formRef={formRef}
          onScored={handleScored}
          onBadges={handleNewBadges}
          onTryAgain={scrollToForm}
        />
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

      <div>
        <a href={`/workshops/${workshopId}`} className="text-sm text-blue-600 hover:underline">
          ← Back to workshop
        </a>
      </div>
    </div>
  );
}

// ─── Standard + Constrained client ───────────────────────────────────────────

function StandardClient({
  exercise,
  history,
  formRef,
  onScored,
  onBadges,
  onTryAgain,
}: {
  exercise: Exercise;
  history: Submission[];
  formRef: React.RefObject<HTMLElement | null>;
  onScored: (score: Score, submission: Submission) => void;
  onBadges: (badges: BadgeMeta[], streak?: number) => void;
  onTryAgain: () => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [currentSubmission, setCurrentSubmission] = useState<Submission | null>(null);
  const [currentScore, setCurrentScore] = useState<Score | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<"executing" | "scoring">("executing");
  const [streaming, setStreaming] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [violations, setViolations] = useState<string[]>([]);
  const [pendingScoreId, setPendingScoreId] = useState<string | null>(null);

  const onScoredRef = useRef(onScored);
  const currentSubmissionRef = useRef(currentSubmission);
  useEffect(() => { onScoredRef.current = onScored; });
  useEffect(() => { currentSubmissionRef.current = currentSubmission; }, [currentSubmission]);

  // Poll for async score when BullMQ is processing the job
  useEffect(() => {
    if (!pendingScoreId) return;
    let cancelled = false;
    const deadline = Date.now() + 30000;

    const intervalId = setInterval(async () => {
      if (cancelled || Date.now() > deadline) {
        clearInterval(intervalId);
        if (!cancelled) setPendingScoreId(null);
        return;
      }
      try {
        const res = await fetch(`/api/submissions/${pendingScoreId}/score`);
        if (res.ok) {
          const data = await res.json() as { pending?: boolean } & Score;
          if (!data.pending) {
            clearInterval(intervalId);
            setCurrentScore(data);
            setCurrentSubmission((prev) =>
              prev
                ? { ...prev, total_score: data.total_score, max_score: data.max_score, feedback: data.feedback }
                : prev
            );
            const sub = currentSubmissionRef.current;
            if (sub) {
              onScoredRef.current(data, {
                ...sub,
                total_score: data.total_score,
                max_score: data.max_score,
                feedback: data.feedback,
              });
            }
            setPendingScoreId(null);
          }
        }
      } catch { /* retry next interval */ }
    }, 2000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [pendingScoreId]);

  const isConstrained = exercise.exercise_type === "constrained";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setLoadingPhase("executing");
    setError(null);
    setViolations([]);
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
        if (body.code === "CONSTRAINT_VIOLATION" && body.violations) {
          setViolations(body.violations);
          return;
        }
        throw new Error(body.error ?? "Execution failed");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let submissionId: string | null = null;
      let finalScore: Score | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value, { stream: true }).split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (!json) continue;

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

          if (parsed.text) { accumulated += parsed.text; setStreaming(accumulated); }
          if (parsed.scoring) setLoadingPhase("scoring");
          if (parsed.done) {
            submissionId = parsed.submissionId ?? null;
            if (parsed.score) {
              finalScore = parsed.score;
              setCurrentScore(parsed.score);
            }
            if (parsed.newBadges) onBadges(parsed.newBadges, parsed.currentStreak);
          }
          if (parsed.error) throw new Error(parsed.error);
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
      if (finalScore) {
        onScored(finalScore, newSubmission);
      } else if (submissionId) {
        // Async scoring via BullMQ — poll for result
        setPendingScoreId(submissionId);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleTryAgain() {
    setCurrentSubmission(null);
    setCurrentScore(null);
    setStreaming("");
    setError(null);
    setViolations([]);
    setPrompt("");
    setPendingScoreId(null);
    onTryAgain();
  }

  return (
    <>
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

          {isConstrained && prompt && (
            <ConstraintChecker constraints={exercise.constraints} prompt={prompt} />
          )}

          {violations.length > 0 && (
            <div role="alert" className="rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950 px-4 py-3">
              <p className="text-sm font-semibold text-orange-700 dark:text-orange-300 mb-1">Constraint violations</p>
              <ul className="list-disc list-inside space-y-0.5">
                {violations.map((v, i) => (
                  <li key={i} className="text-sm text-orange-700 dark:text-orange-300">{v}</li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <div role="alert" aria-live="polite" className="flex items-start gap-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-4 py-3">
              <p className="flex-1 text-sm text-red-700 dark:text-red-300">{error}</p>
              <button
                type="button"
                onClick={() => { setError(null); setStreaming(""); setCurrentSubmission(null); setCurrentScore(null); }}
                className="shrink-0 rounded border border-red-300 dark:border-red-700 bg-white dark:bg-gray-900 px-2.5 py-1 text-xs font-semibold text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              aria-busy={loading}
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Running…" : history.length > 0 ? "Submit attempt" : "Submit prompt"}
            </button>
            <HintButton exerciseId={exercise.id} currentPrompt={prompt} />
          </div>
        </form>
      </section>

      {loading && streaming === "" && loadingPhase === "executing" && (
        <section className="rounded-xl border border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-950 p-6">
          <div className="flex items-center gap-3">
            <LoadingSpinner className="h-5 w-5 text-blue-500 dark:text-blue-400" />
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Running your prompt…</p>
          </div>
        </section>
      )}

      {(loading && loadingPhase === "scoring" || pendingScoreId) && (
        <section className="rounded-xl border border-amber-100 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 p-6">
          <div className="flex items-center gap-3">
            <LoadingSpinner className="h-5 w-5 text-amber-500 dark:text-amber-400" />
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Scoring your response…</p>
          </div>
        </section>
      )}

      {(streaming || currentSubmission) && (
        <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Response</h2>
            {loading && loadingPhase === "executing" && (
              <span className="flex items-center gap-1.5 text-xs text-blue-500 dark:text-blue-400">
                <LoadingSpinner className="h-3.5 w-3.5" />
                streaming…
              </span>
            )}
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

      {currentSubmission && currentScore && (
        <ScoreSection
          score={currentScore}
          exercise={exercise}
          history={history}
          onTryAgain={handleTryAgain}
        />
      )}
    </>
  );
}

// ─── Multi-step client ────────────────────────────────────────────────────────

function MultiStepClient({
  exercise,
  history,
  formRef,
  onScored,
  onBadges,
  onTryAgain,
}: {
  exercise: Exercise;
  history: Submission[];
  formRef: React.RefObject<HTMLElement | null>;
  onScored: (score: Score, submission: Submission) => void;
  onBadges: (badges: BadgeMeta[], streak?: number) => void;
  onTryAgain: () => void;
}) {
  const steps = exercise.steps ?? [];
  const totalSteps = steps.length;

  const [currentStep, setCurrentStep] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [stepOutputs, setStepOutputs] = useState<string[]>([]);
  const [streaming, setStreaming] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<"executing" | "scoring">("executing");
  const [error, setError] = useState<string | null>(null);
  const [finalScore, setFinalScore] = useState<Score | null>(null);
  const [done, setDone] = useState(false);
  const [pendingScoreId, setPendingScoreId] = useState<string | null>(null);

  const onScoredMsRef = useRef(onScored);
  const stepOutputsRef = useRef(stepOutputs);
  useEffect(() => { onScoredMsRef.current = onScored; });
  useEffect(() => { stepOutputsRef.current = stepOutputs; }, [stepOutputs]);

  // Poll for async score on last step
  useEffect(() => {
    if (!pendingScoreId) return;
    let cancelled = false;
    const deadline = Date.now() + 30000;

    const intervalId = setInterval(async () => {
      if (cancelled || Date.now() > deadline) {
        clearInterval(intervalId);
        if (!cancelled) setPendingScoreId(null);
        return;
      }
      try {
        const res = await fetch(`/api/submissions/${pendingScoreId}/score`);
        if (res.ok) {
          const data = await res.json() as { pending?: boolean } & Score;
          if (!data.pending) {
            clearInterval(intervalId);
            setFinalScore(data);
            const outputs = stepOutputsRef.current;
            const submission: Submission = {
              id: pendingScoreId,
              prompt_text: `[Multi-step: ${totalSteps} steps]`,
              llm_response: outputs[outputs.length - 1] ?? null,
              submitted_at: new Date().toISOString(),
              total_score: data.total_score,
              max_score: data.max_score,
              feedback: data.feedback,
            };
            onScoredMsRef.current(data, submission);
            setPendingScoreId(null);
          }
        }
      } catch { /* retry next interval */ }
    }, 2000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [pendingScoreId, totalSteps]);

  const stepData = steps[currentStep];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setLoadingPhase("executing");
    setError(null);
    setStreaming("");

    try {
      const res = await fetch(`/api/exercises/${exercise.id}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt_text: prompt.trim(),
          step_number: currentStep,
          previous_outputs: stepOutputs,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Execution failed");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;

        const lines = decoder.decode(value, { stream: true }).split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (!json) continue;

          const parsed = JSON.parse(json) as {
            text?: string;
            scoring?: boolean;
            done?: boolean;
            error?: string;
            stepResponse?: string;
            isLastStep?: boolean;
            submissionId?: string;
            score?: Score;
            newBadges?: BadgeMeta[];
            currentStreak?: number;
          };

          if (parsed.text) { accumulated += parsed.text; setStreaming(accumulated); }
          if (parsed.scoring) setLoadingPhase("scoring");
          if (parsed.done) {
            const output = parsed.stepResponse ?? accumulated;
            const newOutputs = [...stepOutputs, output];
            setStepOutputs(newOutputs);
            setStreaming("");

            if (parsed.isLastStep) {
              setDone(true);
              if (parsed.score) {
                setFinalScore(parsed.score);
                const submission: Submission = {
                  id: parsed.submissionId ?? "",
                  prompt_text: `[Multi-step: ${totalSteps} steps]`,
                  llm_response: output,
                  submitted_at: new Date().toISOString(),
                  total_score: parsed.score.total_score,
                  max_score: parsed.score.max_score,
                  feedback: parsed.score.feedback,
                };
                onScored(parsed.score, submission);
              } else if (parsed.submissionId) {
                // Async scoring via BullMQ — poll for result
                setPendingScoreId(parsed.submissionId);
              }
              if (parsed.newBadges) onBadges(parsed.newBadges, parsed.currentStreak);
            } else {
              setCurrentStep((prev) => prev + 1);
              setPrompt("");
            }
          }
          if (parsed.error) throw new Error(parsed.error);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  function handleRestart() {
    setCurrentStep(0);
    setPrompt("");
    setStepOutputs([]);
    setStreaming("");
    setFinalScore(null);
    setDone(false);
    setError(null);
    setPendingScoreId(null);
    onTryAgain();
  }

  if (totalSteps === 0) {
    return (
      <div className="rounded-xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950 p-6 text-sm text-yellow-700 dark:text-yellow-300">
        This multi-step exercise has no steps configured yet.
      </div>
    );
  }

  return (
    <>
      {/* Step progress indicator */}
      <div className="flex items-center gap-2">
        {steps.map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                i < currentStep || done
                  ? "bg-green-500 text-white"
                  : i === currentStep && !done
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
              }`}
            >
              {i < currentStep || done ? "✓" : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-0.5 w-8 ${
                  i < currentStep ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"
                }`}
              />
            )}
          </div>
        ))}
        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
          {done ? "All steps complete" : `Step ${currentStep + 1} of ${totalSteps}`}
        </span>
      </div>

      {/* Previous step outputs */}
      {stepOutputs.length > 0 && (
        <div className="space-y-3">
          {stepOutputs.map((output, i) => (
            <section key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                Step {i + 1} output
              </p>
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono">
                {output}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Current step instructions */}
      {!done && stepData && (
        <section ref={formRef} className="rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Step {currentStep + 1}: {stepData.instructions.split("\n")[0].slice(0, 60)}
          </h2>
          <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 mb-4">
            <ReactMarkdown>{stepData.instructions}</ReactMarkdown>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              placeholder={`Write your prompt for step ${currentStep + 1}…`}
              disabled={loading}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60 resize-y font-mono"
            />
            {error && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (loadingPhase === "scoring" ? "Scoring…" : "Running…") : `Submit step ${currentStep + 1}`}
              </button>
              <HintButton exerciseId={exercise.id} currentPrompt={prompt} />
            </div>
          </form>
          {streaming && (
            <div className="mt-4 rounded-lg bg-gray-50 dark:bg-gray-800 p-4 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono">
              {streaming}
              <span className="inline-block w-1.5 h-4 bg-blue-400 motion-safe:animate-pulse ml-0.5 align-middle" />
            </div>
          )}
        </section>
      )}

      {pendingScoreId && !finalScore && (
        <section className="rounded-xl border border-amber-100 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 p-6">
          <div className="flex items-center gap-3">
            <LoadingSpinner className="h-5 w-5 text-amber-500 dark:text-amber-400" />
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Scoring your response…</p>
          </div>
        </section>
      )}

      {done && finalScore && (
        <>
          <ScoreSection
            score={finalScore}
            exercise={exercise}
            history={history}
            onTryAgain={handleRestart}
          />
        </>
      )}
    </>
  );
}

// ─── Comparison client ────────────────────────────────────────────────────────

type JudgeVerdict = {
  winner: "a" | "b" | "tie";
  reasoning: string;
  score_a: number;
  score_b: number;
};

function ComparisonClient({
  exercise,
  history,
  formRef,
  onScored,
  onBadges,
  onTryAgain,
}: {
  exercise: Exercise;
  history: Submission[];
  formRef: React.RefObject<HTMLElement | null>;
  onScored: (score: Score, submission: Submission) => void;
  onBadges: (badges: BadgeMeta[], streak?: number) => void;
  onTryAgain: () => void;
}) {
  const [promptA, setPromptA] = useState("");
  const [promptB, setPromptB] = useState("");
  const [responseA, setResponseA] = useState("");
  const [responseB, setResponseB] = useState("");
  const [phase, setPhase] = useState<"idle" | "running_a" | "running_b" | "scoring" | "done">("idle");
  const [verdict, setVerdict] = useState<JudgeVerdict | null>(null);
  const [currentScore, setCurrentScore] = useState<Score | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loading = phase !== "idle" && phase !== "done";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!promptA.trim() || !promptB.trim()) return;

    setPhase("running_a");
    setError(null);
    setResponseA("");
    setResponseB("");
    setVerdict(null);
    setCurrentScore(null);

    try {
      const res = await fetch(`/api/exercises/${exercise.id}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt_text_a: promptA.trim(),
          prompt_text_b: promptB.trim(),
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Execution failed");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accA = "";
      let accB = "";

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;

        const lines = decoder.decode(value, { stream: true }).split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (!json) continue;

          const parsed = JSON.parse(json) as {
            phase?: string;
            text_a?: string;
            text_b?: string;
            scoring?: boolean;
            done?: boolean;
            error?: string;
            score?: Score;
            comparison?: JudgeVerdict;
            newBadges?: BadgeMeta[];
            currentStreak?: number;
          };

          if (parsed.phase === "running_b") setPhase("running_b");
          if (parsed.text_a) { accA += parsed.text_a; setResponseA(accA); }
          if (parsed.text_b) { accB += parsed.text_b; setResponseB(accB); }
          if (parsed.scoring) setPhase("scoring");
          if (parsed.done) {
            setPhase("done");
            if (parsed.comparison) setVerdict(parsed.comparison);
            if (parsed.score) {
              setCurrentScore(parsed.score);
              const submission: Submission = {
                id: "",
                prompt_text: `[Comparison] A: ${promptA.trim().slice(0, 50)} | B: ${promptB.trim().slice(0, 50)}`,
                llm_response: null,
                submitted_at: new Date().toISOString(),
                total_score: parsed.score.total_score,
                max_score: parsed.score.max_score,
                feedback: parsed.score.feedback,
              };
              onScored(parsed.score, submission);
            }
            if (parsed.newBadges) onBadges(parsed.newBadges, parsed.currentStreak);
          }
          if (parsed.error) throw new Error(parsed.error);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
      setPhase("idle");
    }
  }

  function handleTryAgain() {
    setPhase("idle");
    setPromptA("");
    setPromptB("");
    setResponseA("");
    setResponseB("");
    setVerdict(null);
    setCurrentScore(null);
    setError(null);
    onTryAgain();
  }

  return (
    <>
      <section ref={formRef} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Your two prompts
          <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
            Submit two different approaches — AI will judge which is better
          </span>
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Prompt A
              </label>
              <textarea
                value={promptA}
                onChange={(e) => setPromptA(e.target.value)}
                rows={7}
                placeholder="Write prompt A here…"
                disabled={loading}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60 resize-y font-mono"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Prompt B
              </label>
              <textarea
                value={promptB}
                onChange={(e) => setPromptB(e.target.value)}
                rows={7}
                placeholder="Write prompt B here…"
                disabled={loading}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60 resize-y font-mono"
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !promptA.trim() || !promptB.trim()}
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading
              ? phase === "running_a"
                ? "Running prompt A…"
                : phase === "running_b"
                ? "Running prompt B…"
                : "Judging…"
              : "Compare prompts"}
          </button>
        </form>
      </section>

      {/* Side-by-side responses */}
      {(responseA || responseB) && (
        <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Responses</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                Response A
                {phase === "running_a" && <span className="ml-2 text-blue-500">streaming…</span>}
              </p>
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono min-h-[6rem]">
                {responseA}
                {phase === "running_a" && <span className="inline-block w-1.5 h-4 bg-blue-400 motion-safe:animate-pulse ml-0.5 align-middle" />}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                Response B
                {phase === "running_b" && <span className="ml-2 text-blue-500">streaming…</span>}
              </p>
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono min-h-[6rem]">
                {responseB}
                {phase === "running_b" && <span className="inline-block w-1.5 h-4 bg-blue-400 motion-safe:animate-pulse ml-0.5 align-middle" />}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Judge verdict */}
      {verdict && phase === "done" && (
        <section className="rounded-xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-900 p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Judge verdict</h2>
          <div className="flex items-center gap-3 mb-4">
            <span
              className={`text-2xl font-bold ${
                verdict.winner === "a"
                  ? "text-blue-600 dark:text-blue-400"
                  : verdict.winner === "b"
                  ? "text-purple-600 dark:text-purple-400"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              {verdict.winner === "tie" ? "Tie" : `Prompt ${verdict.winner.toUpperCase()} wins`}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950 px-4 py-3 text-center">
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-0.5">Prompt A</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{verdict.score_a}</p>
              <p className="text-xs text-blue-500 dark:text-blue-400">/ 100</p>
            </div>
            <div className="rounded-lg bg-purple-50 dark:bg-purple-950 px-4 py-3 text-center">
              <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-0.5">Prompt B</p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{verdict.score_b}</p>
              <p className="text-xs text-purple-500 dark:text-purple-400">/ 100</p>
            </div>
          </div>
          <div className="rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 px-4 py-3 mb-4">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Reasoning</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">{verdict.reasoning}</p>
          </div>
          <button
            onClick={handleTryAgain}
            className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 px-5 py-2 text-sm font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
          >
            Try again
          </button>
        </section>
      )}
    </>
  );
}
