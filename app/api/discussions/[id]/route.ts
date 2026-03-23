import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await pool.query(
    `SELECT d.id, d.author_id, w.instructor_id
     FROM discussions d
     JOIN exercises e ON e.id = d.exercise_id
     JOIN workshops w ON w.id = e.workshop_id
     WHERE d.id = $1`,
    [id]
  );
  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { author_id, instructor_id } = result.rows[0];
  const canDelete =
    author_id === session.userId ||
    (session.role === "instructor" && instructor_id === session.userId) ||
    session.isAdmin;

  if (!canDelete) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await pool.query("DELETE FROM discussions WHERE id = $1", [id]);
  return new NextResponse(null, { status: 204 });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await pool.query(
    `SELECT d.id, d.author_id, d.body, d.is_pinned, w.instructor_id
     FROM discussions d
     JOIN exercises e ON e.id = d.exercise_id
     JOIN workshops w ON w.id = e.workshop_id
     WHERE d.id = $1`,
    [id]
  );
  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const disc = result.rows[0];
  const body = await request.json();

  // Pin/unpin: instructor only
  if ("is_pinned" in body) {
    if (session.role !== "instructor" || disc.instructor_id !== session.userId) {
      return NextResponse.json({ error: "Only the workshop instructor can pin discussions" }, { status: 403 });
    }
    const updated = await pool.query(
      "UPDATE discussions SET is_pinned = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [Boolean(body.is_pinned), id]
    );
    return NextResponse.json(updated.rows[0]);
  }

  // Edit body: author only
  if ("body" in body) {
    if (disc.author_id !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!body.body || body.body.trim().length < 1 || body.body.length > 5000) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    const updated = await pool.query(
      "UPDATE discussions SET body = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [body.body.trim(), id]
    );
    return NextResponse.json(updated.rows[0]);
  }

  return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
}
