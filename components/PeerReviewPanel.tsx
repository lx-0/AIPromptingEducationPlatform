"use client";

import { useState, useEffect, useCallback } from "react";

type Assignment = {
  id: string;
  submission_id: string;
  exercise_id: string;
  exercise_title: string;
  workshop_id: string;
  submitter_name: string;
  assigned_at: string;
  completed_at: string | null;
};

type Review = {
  id: string;
  feedback_text: string;
  rating: number;
  created_at: string;
  reviewer_id: string;
  reviewer_name: string;
};

type Props = {
  workshopId: string;
  submissionId?: string;
  isInstructor?: boolean;
  exerciseId?: string;
};

export default function PeerReviewPanel({
  workshopId,
  submissionId,
  isInstructor = false,
  exerciseId,
}: Props) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(!!submissionId);

  // Review form state
  const [reviewSubmissionId, setReviewSubmissionId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Instructor: assign peer reviews
  const [assigning, setAssigning] = useState(false);
  const [assignResult, setAssignResult] = useState<string>("");

  const loadAssignments = useCallback(async () => {
    try {
      const res = await fetch(`/api/peer-review-assignments?workshop_id=${workshopId}`);
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments ?? []);
      }
    } finally {
      setLoadingAssignments(false);
    }
  }, [workshopId]);

  const loadReviews = useCallback(async () => {
    if (!submissionId) return;
    try {
      const res = await fetch(`/api/submissions/${submissionId}/peer-reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews ?? []);
      }
    } finally {
      setLoadingReviews(false);
    }
  }, [submissionId]);

  useEffect(() => { loadAssignments(); }, [loadAssignments]);
  useEffect(() => { loadReviews(); }, [loadReviews]);

  async function submitReview(sid: string) {
    if (!feedbackText.trim() || rating < 1) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch(`/api/submissions/${sid}/peer-reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback_text: feedbackText.trim(), rating }),
      });
      if (!res.ok) {
        const d = await res.json();
        setSubmitError(d.error ?? "Failed to submit review");
        return;
      }
      setFeedbackText("");
      setRating(0);
      setReviewSubmissionId(null);
      await loadAssignments();
    } finally {
      setSubmitting(false);
    }
  }

  async function assignReviews() {
    if (!exerciseId) return;
    setAssigning(true);
    setAssignResult("");
    try {
      const res = await fetch("/api/peer-review-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workshop_id: workshopId, exercise_id: exerciseId }),
      });
      const data = await res.json();
      if (res.ok) {
        setAssignResult(`Assigned ${data.created} new peer review${data.created !== 1 ? "s" : ""}.`);
      } else {
        setAssignResult(data.error ?? "Failed to assign");
      }
    } finally {
      setAssigning(false);
    }
  }

  const pending = assignments.filter((a) => !a.completed_at);
  const completed = assignments.filter((a) => a.completed_at);

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Peer Reviews
      </h2>

      {/* Instructor controls */}
      {isInstructor && exerciseId && (
        <div className="mb-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            Randomly assign peer reviews for this exercise. Each trainee will be
            assigned one peer&apos;s submission to review.
          </p>
          <button
            onClick={assignReviews}
            disabled={assigning}
            className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 text-sm font-medium text-white transition-colors"
          >
            {assigning ? "Assigning…" : "Assign Peer Reviews"}
          </button>
          {assignResult && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{assignResult}</p>
          )}
        </div>
      )}

      {/* Reviews received on this submission */}
      {submissionId && !isInstructor && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Reviews on your submission
          </h3>
          {loadingReviews ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-gray-400">No peer reviews received yet.</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div
                  key={r.id}
                  className="rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-yellow-400 text-base">
                      {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {r.feedback_text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pending assignments */}
      {!isInstructor && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Your peer review assignments
          </h3>
          {loadingAssignments ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : pending.length === 0 ? (
            <p className="text-sm text-gray-400">No pending peer review assignments.</p>
          ) : (
            <div className="space-y-3">
              {pending.map((a) => (
                <div
                  key={a.id}
                  className="rounded-lg border border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Review a submission for: {a.exercise_title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Assigned {new Date(a.assigned_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setReviewSubmissionId(a.submission_id);
                        setFeedbackText("");
                        setRating(0);
                      }}
                      className="shrink-0 rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-medium text-white transition-colors"
                    >
                      Write Review
                    </button>
                  </div>

                  {reviewSubmissionId === a.submission_id && (
                    <div className="mt-4 border-t border-blue-200 dark:border-blue-800 pt-4">
                      {/* Star rating */}
                      <div className="flex items-center gap-1 mb-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">
                          Rating:
                        </span>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoveredRating(star)}
                            onMouseLeave={() => setHoveredRating(0)}
                            className="text-xl transition-colors"
                            aria-label={`${star} star${star !== 1 ? "s" : ""}`}
                          >
                            <span
                              className={
                                star <= (hoveredRating || rating)
                                  ? "text-yellow-400"
                                  : "text-gray-300 dark:text-gray-700"
                              }
                            >
                              ★
                            </span>
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="Provide constructive feedback on the submission (min. 10 characters)…"
                        rows={4}
                        maxLength={3000}
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                      {submitError && (
                        <p className="text-xs text-red-500 mt-1">{submitError}</p>
                      )}
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-400">{feedbackText.length}/3000</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => { setReviewSubmissionId(null); setSubmitError(""); }}
                            className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => submitReview(a.submission_id)}
                            disabled={submitting || rating < 1 || feedbackText.trim().length < 10}
                            className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-1.5 text-sm font-medium text-white transition-colors"
                          >
                            {submitting ? "Submitting…" : "Submit Review"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {completed.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-gray-400 mb-2">
                Completed ({completed.length})
              </p>
              <div className="space-y-1">
                {completed.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 px-3 py-2 flex items-center gap-2"
                  >
                    <span className="text-green-500 text-xs">✓</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {a.exercise_title} — reviewed{" "}
                      {new Date(a.completed_at!).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
