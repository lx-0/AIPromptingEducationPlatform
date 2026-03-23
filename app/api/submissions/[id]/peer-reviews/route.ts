import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import { sendPeerReviewReceivedEmail } from "@/lib/email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: submissionId } = await params;
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify caller is the submission owner or the workshop instructor
  const subResult = await pool.query(
    `SELECT s.id, s.trainee_id, w.instructor_id
     FROM submissions s
     JOIN exercises e ON e.id = s.exercise_id
     JOIN workshops w ON w.id = e.workshop_id
     WHERE s.id = $1`,
    [submissionId]
  );
  if (subResult.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const sub = subResult.rows[0];
  const canView =
    sub.trainee_id === session.userId ||
    (session.role === "instructor" && sub.instructor_id === session.userId);
  if (!canView) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const reviews = await pool.query(
    `SELECT pr.id, pr.feedback_text, pr.rating, pr.created_at,
            p.id AS reviewer_id, p.display_name AS reviewer_name, p.avatar_url AS reviewer_avatar
     FROM peer_reviews pr
     JOIN profiles p ON p.id = pr.reviewer_id
     WHERE pr.submission_id = $1
     ORDER BY pr.created_at DESC`,
    [submissionId]
  );

  return NextResponse.json({ reviews: reviews.rows });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: submissionId } = await params;
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "trainee") {
    return NextResponse.json({ error: "Only trainees can submit peer reviews" }, { status: 403 });
  }

  // Verify assignment exists and is not yet completed
  const assignmentResult = await pool.query(
    `SELECT pra.id, s.trainee_id, s.exercise_id, e.title AS exercise_title,
            e.workshop_id, w.instructor_id
     FROM peer_review_assignments pra
     JOIN submissions s ON s.id = pra.submission_id
     JOIN exercises e ON e.id = s.exercise_id
     JOIN workshops w ON w.id = e.workshop_id
     WHERE pra.submission_id = $1 AND pra.reviewer_id = $2`,
    [submissionId, session.userId]
  );

  if (assignmentResult.rows.length === 0) {
    return NextResponse.json(
      { error: "No peer review assignment found for this submission" },
      { status: 403 }
    );
  }

  const assignment = assignmentResult.rows[0];
  if (assignment.trainee_id === session.userId) {
    return NextResponse.json({ error: "Cannot review your own submission" }, { status: 403 });
  }

  const { feedback_text, rating } = await request.json();
  if (!feedback_text || feedback_text.trim().length < 10) {
    return NextResponse.json({ error: "feedback_text must be at least 10 characters" }, { status: 400 });
  }
  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "rating must be between 1 and 5" }, { status: 400 });
  }

  const result = await pool.query(
    `INSERT INTO peer_reviews (submission_id, reviewer_id, feedback_text, rating)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (submission_id, reviewer_id) DO NOTHING
     RETURNING *`,
    [submissionId, session.userId, feedback_text.trim(), rating]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "You have already reviewed this submission" }, { status: 409 });
  }

  // Mark assignment completed
  await pool.query(
    "UPDATE peer_review_assignments SET completed_at = NOW() WHERE submission_id = $1 AND reviewer_id = $2",
    [submissionId, session.userId]
  );

  // Notify submission owner
  const ownerId = assignment.trainee_id;
  await pool.query(
    `INSERT INTO notifications (user_id, type, payload)
     VALUES ($1, 'peer_review_received', $2)`,
    [
      ownerId,
      JSON.stringify({
        submission_id: submissionId,
        exercise_title: assignment.exercise_title,
        rating,
        feedback_preview: feedback_text.slice(0, 100),
      }),
    ]
  );

  // Email notification (fire-and-forget)
  pool.query(
    "SELECT u.email, p.display_name FROM profiles p JOIN auth.users u ON u.id = p.id WHERE p.id = $1",
    [ownerId]
  ).then(async (ownerResult) => {
    if (ownerResult.rows[0]?.email) {
      const submissionUrl = `${APP_URL}/workshops/${assignment.workshop_id}/exercises/${assignment.exercise_id}`;
      await sendPeerReviewReceivedEmail(
        ownerResult.rows[0].email,
        ownerResult.rows[0].display_name,
        assignment.exercise_title,
        rating,
        feedback_text,
        submissionUrl
      );
    }
  }).catch(() => {});

  return NextResponse.json(result.rows[0], { status: 201 });
}
