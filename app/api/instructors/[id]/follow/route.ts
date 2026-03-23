import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

// GET /api/instructors/[id]/follow — check follow status
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: instructorId } = await params;
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ following: false });
  }

  const result = await pool.query(
    "SELECT 1 FROM follows WHERE follower_id = $1 AND instructor_id = $2",
    [session.userId, instructorId]
  );

  const followerCount = await pool.query(
    "SELECT COUNT(*)::int AS count FROM follows WHERE instructor_id = $1",
    [instructorId]
  );

  return NextResponse.json({
    following: result.rows.length > 0,
    follower_count: followerCount.rows[0].count,
  });
}

// POST /api/instructors/[id]/follow — follow instructor
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: instructorId } = await params;
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "trainee") {
    return NextResponse.json({ error: "Only trainees can follow instructors" }, { status: 403 });
  }
  if (instructorId === session.userId) {
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
  }

  // Verify target is an instructor
  const instructorCheck = await pool.query(
    "SELECT id FROM profiles WHERE id = $1 AND role = 'instructor'",
    [instructorId]
  );
  if (instructorCheck.rows.length === 0) {
    return NextResponse.json({ error: "Instructor not found" }, { status: 404 });
  }

  await pool.query(
    `INSERT INTO follows (follower_id, instructor_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [session.userId, instructorId]
  );

  const followerCount = await pool.query(
    "SELECT COUNT(*)::int AS count FROM follows WHERE instructor_id = $1",
    [instructorId]
  );

  return NextResponse.json({ following: true, follower_count: followerCount.rows[0].count });
}

// DELETE /api/instructors/[id]/follow — unfollow instructor
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: instructorId } = await params;
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await pool.query(
    "DELETE FROM follows WHERE follower_id = $1 AND instructor_id = $2",
    [session.userId, instructorId]
  );

  const followerCount = await pool.query(
    "SELECT COUNT(*)::int AS count FROM follows WHERE instructor_id = $1",
    [instructorId]
  );

  return NextResponse.json({ following: false, follower_count: followerCount.rows[0].count });
}
