// POST /api/peer-review-assignments
// Instructor triggers random peer review assignment for a workshop exercise.
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "trainee") {
    return NextResponse.json({ error: "Only trainees can view their assignments" }, { status: 403 });
  }

  const url = new URL(request.url);
  const workshopId = url.searchParams.get("workshop_id");

  const result = await pool.query(
    `SELECT pra.id, pra.submission_id, pra.assigned_at, pra.completed_at,
            s.exercise_id, e.title AS exercise_title, e.workshop_id,
            p.display_name AS submitter_name
     FROM peer_review_assignments pra
     JOIN submissions s ON s.id = pra.submission_id
     JOIN exercises e ON e.id = s.exercise_id
     JOIN profiles p ON p.id = s.trainee_id
     WHERE pra.reviewer_id = $1
       ${workshopId ? "AND e.workshop_id = $2" : ""}
     ORDER BY pra.assigned_at DESC`,
    workshopId ? [session.userId, workshopId] : [session.userId]
  );

  return NextResponse.json({ assignments: result.rows });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "instructor") {
    return NextResponse.json({ error: "Only instructors can assign peer reviews" }, { status: 403 });
  }

  const { workshop_id, exercise_id } = await request.json();
  if (!workshop_id || !exercise_id) {
    return NextResponse.json({ error: "workshop_id and exercise_id are required" }, { status: 400 });
  }

  // Verify ownership and peer review enabled
  const workshopResult = await pool.query(
    "SELECT id, peer_review_enabled FROM workshops WHERE id = $1 AND instructor_id = $2",
    [workshop_id, session.userId]
  );
  if (workshopResult.rows.length === 0) {
    return NextResponse.json({ error: "Workshop not found or not owned by you" }, { status: 403 });
  }
  if (!workshopResult.rows[0].peer_review_enabled) {
    return NextResponse.json({ error: "Peer review is not enabled for this workshop" }, { status: 400 });
  }

  // Get all submissions for this exercise (one per trainee, latest)
  const submissions = await pool.query(
    `SELECT DISTINCT ON (trainee_id) id, trainee_id
     FROM submissions
     WHERE exercise_id = $1
     ORDER BY trainee_id, submitted_at DESC`,
    [exercise_id]
  );

  if (submissions.rows.length < 2) {
    return NextResponse.json(
      { error: "Need at least 2 submissions to assign peer reviews" },
      { status: 400 }
    );
  }

  // Shuffle and create assignments: each trainee reviews the next one (circular)
  const subs = submissions.rows.sort(() => Math.random() - 0.5);
  const assignments: { reviewer_id: string; submission_id: string }[] = [];

  for (let i = 0; i < subs.length; i++) {
    const reviewer = subs[i];
    const toReview = subs[(i + 1) % subs.length];
    // Trainee cannot review their own submission
    if (reviewer.trainee_id !== toReview.trainee_id) {
      assignments.push({
        reviewer_id: reviewer.trainee_id,
        submission_id: toReview.id,
      });
    }
  }

  // Bulk insert (skip conflicts)
  let created = 0;
  for (const a of assignments) {
    const result = await pool.query(
      `INSERT INTO peer_review_assignments (workshop_id, reviewer_id, submission_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (reviewer_id, submission_id) DO NOTHING
       RETURNING id`,
      [workshop_id, a.reviewer_id, a.submission_id]
    );
    if (result.rows.length > 0) {
      created++;
      // In-app notification for reviewer
      await pool.query(
        `INSERT INTO notifications (user_id, type, payload)
         VALUES ($1, 'peer_review_assigned', $2)`,
        [
          a.reviewer_id,
          JSON.stringify({ workshop_id, submission_id: a.submission_id }),
        ]
      );
    }
  }

  return NextResponse.json({ created, total: assignments.length }, { status: 201 });
}
