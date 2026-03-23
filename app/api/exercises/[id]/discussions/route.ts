import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import { sendDiscussionReplyEmail } from "@/lib/email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: exerciseId } = await params;
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify user has access to this exercise's workshop
  const access = await pool.query(
    `SELECT e.id, e.workshop_id, w.instructor_id
     FROM exercises e JOIN workshops w ON w.id = e.workshop_id
     WHERE e.id = $1`,
    [exerciseId]
  );
  if (access.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const { workshop_id, instructor_id } = access.rows[0];
  const isInstructor = session.role === "instructor" && instructor_id === session.userId;

  if (!isInstructor) {
    const enrolled = await pool.query(
      "SELECT 1 FROM enrollments WHERE workshop_id = $1 AND trainee_id = $2",
      [workshop_id, session.userId]
    );
    if (enrolled.rows.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const result = await pool.query(
    `SELECT d.id, d.body, d.parent_id, d.is_pinned, d.created_at, d.updated_at,
            p.id AS author_id, p.display_name AS author_name, p.avatar_url AS author_avatar,
            p.role AS author_role
     FROM discussions d
     JOIN profiles p ON p.id = d.author_id
     WHERE d.exercise_id = $1
     ORDER BY d.is_pinned DESC, d.created_at ASC`,
    [exerciseId]
  );

  return NextResponse.json({ discussions: result.rows });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: exerciseId } = await params;
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify access
  const access = await pool.query(
    `SELECT e.id, e.title, e.workshop_id, w.instructor_id
     FROM exercises e JOIN workshops w ON w.id = e.workshop_id
     WHERE e.id = $1`,
    [exerciseId]
  );
  if (access.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const { workshop_id, instructor_id, title: exerciseTitle } = access.rows[0];
  const isInstructor = session.role === "instructor" && instructor_id === session.userId;

  if (!isInstructor) {
    const enrolled = await pool.query(
      "SELECT 1 FROM enrollments WHERE workshop_id = $1 AND trainee_id = $2",
      [workshop_id, session.userId]
    );
    if (enrolled.rows.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { body, parent_id } = await request.json();
  if (!body || typeof body !== "string" || body.trim().length < 1) {
    return NextResponse.json({ error: "body is required" }, { status: 400 });
  }
  if (body.length > 5000) {
    return NextResponse.json({ error: "body must be ≤ 5000 characters" }, { status: 400 });
  }

  // Validate parent exists and belongs to same exercise
  if (parent_id) {
    const parentCheck = await pool.query(
      "SELECT id, author_id FROM discussions WHERE id = $1 AND exercise_id = $2",
      [parent_id, exerciseId]
    );
    if (parentCheck.rows.length === 0) {
      return NextResponse.json({ error: "Invalid parent_id" }, { status: 400 });
    }

    // Notify original poster (if different from current user)
    const parentAuthorId = parentCheck.rows[0].author_id;
    if (parentAuthorId !== session.userId) {
      // Insert in-app notification
      await pool.query(
        `INSERT INTO notifications (user_id, type, payload)
         VALUES ($1, 'discussion_reply', $2)`,
        [
          parentAuthorId,
          JSON.stringify({
            exercise_id: exerciseId,
            exercise_title: exerciseTitle,
            replier_name: session.displayName,
            body_preview: body.slice(0, 100),
          }),
        ]
      );

      // Send email notification (fire-and-forget)
      pool.query(
        "SELECT u.email FROM profiles p JOIN auth.users u ON u.id = p.id WHERE p.id = $1",
        [parentAuthorId]
      ).then(async (emailResult) => {
        if (emailResult.rows[0]?.email) {
          const workshopUrl = `${APP_URL}/workshops/${workshop_id}/exercises/${exerciseId}`;
          await sendDiscussionReplyEmail(
            emailResult.rows[0].email,
            "",
            session.displayName,
            exerciseTitle,
            body,
            workshopUrl
          );
        }
      }).catch(() => {});
    }
  }

  const result = await pool.query(
    `INSERT INTO discussions (exercise_id, author_id, body, parent_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id, body, parent_id, is_pinned, created_at, updated_at`,
    [exerciseId, session.userId, body.trim(), parent_id ?? null]
  );

  const discussion = {
    ...result.rows[0],
    author_id: session.userId,
    author_name: session.displayName,
    author_role: session.role,
  };

  return NextResponse.json(discussion, { status: 201 });
}
