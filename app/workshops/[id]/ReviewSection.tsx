"use client";

import { useState, useEffect, useCallback } from "react";

interface Review {
  id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  trainee_name: string;
  trainee_avatar: string | null;
}

interface ReviewStats {
  avg_rating: number;
  total_reviews: number;
  five_star: number;
  four_star: number;
  three_star: number;
  two_star: number;
  one_star: number;
}

interface Props {
  workshopId: string;
  isTrainee: boolean;
  hasSubmissions: boolean;
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="text-2xl leading-none transition-colors"
          aria-label={`${n} star${n !== 1 ? "s" : ""}`}
        >
          <span className={n <= (hovered || value) ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}>
            ★
          </span>
        </button>
      ))}
    </div>
  );
}

function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-12 text-gray-600 dark:text-gray-400">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-yellow-400"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-right text-gray-500 dark:text-gray-400">{count}</span>
    </div>
  );
}

export default function ReviewSection({ workshopId, isTrainee, hasSubmissions }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/workshops/${workshopId}/reviews`);
      const data = await res.json();
      setReviews(data.reviews ?? []);
      setStats(data.stats ?? null);
    } finally {
      setLoading(false);
    }
  }, [workshopId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a rating.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/workshops/${workshopId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, review_text: reviewText.trim() || null }),
      });
      if (res.status === 409) {
        setError("You have already reviewed this workshop.");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setSubmitted(true);
      setRating(0);
      setReviewText("");
      await fetchReviews();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const canReview = isTrainee && hasSubmissions && !submitted;

  return (
    <section className="mt-10" aria-label="Reviews">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Reviews
      </h2>

      {/* Summary */}
      {!loading && stats && stats.total_reviews > 0 && (
        <div className="mb-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
          <div className="flex gap-6 flex-wrap">
            <div className="text-center">
              <p className="text-5xl font-bold text-gray-900 dark:text-gray-100">
                {Number(stats.avg_rating).toFixed(1)}
              </p>
              <div className="mt-1 flex justify-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span
                    key={n}
                    className={
                      n <= Math.round(Number(stats.avg_rating))
                        ? "text-yellow-400"
                        : "text-gray-300 dark:text-gray-600"
                    }
                  >
                    ★
                  </span>
                ))}
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {stats.total_reviews} review{stats.total_reviews !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex-1 min-w-40 space-y-1.5">
              <RatingBar label="5 ★" count={stats.five_star} total={stats.total_reviews} />
              <RatingBar label="4 ★" count={stats.four_star} total={stats.total_reviews} />
              <RatingBar label="3 ★" count={stats.three_star} total={stats.total_reviews} />
              <RatingBar label="2 ★" count={stats.two_star} total={stats.total_reviews} />
              <RatingBar label="1 ★" count={stats.one_star} total={stats.total_reviews} />
            </div>
          </div>
        </div>
      )}

      {/* Write review */}
      {canReview && (
        <div className="mb-6 rounded-xl border border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 p-5">
          <h3 className="mb-3 font-medium text-gray-900 dark:text-gray-100">
            Leave a review
          </h3>
          {submitted ? (
            <p className="text-sm text-green-700 dark:text-green-300">
              Thank you for your review!
            </p>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-3">
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Rating
                </label>
                <StarPicker value={rating} onChange={setRating} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Review{" "}
                  <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={3}
                  placeholder="Share your experience with this workshop…"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-blue-400 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={submitting || rating === 0}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {submitting ? "Submitting…" : "Submit review"}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Review list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No reviews yet.{isTrainee && !hasSubmissions ? " Complete an exercise to leave the first review!" : ""}
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const initials = review.trainee_name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);
            return (
              <div
                key={review.id}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4"
              >
                <div className="flex items-start gap-3">
                  {review.trainee_avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={review.trainee_avatar}
                      alt={review.trainee_name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300">
                      {initials}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {review.trainee_name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="mt-0.5 flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span
                          key={n}
                          className={n <= review.rating ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    {review.review_text && (
                      <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                        {review.review_text}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
