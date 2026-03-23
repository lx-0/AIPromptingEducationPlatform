import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

async function verifyOwnership(workshopId: string, userId: string) {
  const res = await pool.query(
    "SELECT instructor_id FROM workshops WHERE id = $1",
    [workshopId]
  );
  if (res.rows.length === 0) return null;
  if (res.rows[0].instructor_id !== userId) return null;
  return res.rows[0];
}

// PATCH /api/workshops/:id/cohorts/:cohortId — rename cohort
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; cohortId: string }> }
) {
  const { id, cohortId } = await params;
  const session = await getSession();

  if (!session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "instructor") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!(await verifyOwnership(id, session.userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name } = await request.json();
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const result = await pool.query(
    "UPDATE cohorts SET name = $1 WHERE id = $2 AND workshop_id = $3 RETURNING *",
    [name.trim(), cohortId, id]
  );
  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(result.rows[0]);
}

// DELETE /api/workshops/:id/cohorts/:cohortId
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; cohortId: string }> }
) {
  const { id, cohortId } = await params;
  const session = await getSession();

  if (!session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "instructor") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!(await verifyOwnership(id, session.userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await pool.query(
    "DELETE FROM cohorts WHERE id = $1 AND workshop_id = $2",
    [cohortId, id]
  );
  return new NextResponse(null, { status: 204 });
}
