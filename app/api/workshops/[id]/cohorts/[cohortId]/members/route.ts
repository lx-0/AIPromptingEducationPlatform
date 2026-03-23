import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

async function verifyOwnership(workshopId: string, userId: string) {
  const res = await pool.query(
    "SELECT instructor_id FROM workshops WHERE id = $1",
    [workshopId]
  );
  if (res.rows.length === 0) return false;
  return res.rows[0].instructor_id === userId;
}

// GET /api/workshops/:id/cohorts/:cohortId/members
export async function GET(
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

  const result = await pool.query(
    `SELECT p.id, p.display_name, cm.added_at
     FROM cohort_members cm
     JOIN profiles p ON p.id = cm.trainee_id
     WHERE cm.cohort_id = $1
     ORDER BY cm.added_at ASC`,
    [cohortId]
  );
  return NextResponse.json(result.rows);
}

// POST /api/workshops/:id/cohorts/:cohortId/members
// Body: { trainee_ids: string[] } OR { csv: "email1\nemail2\n..." }
export async function POST(
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

  // Verify cohort belongs to this workshop
  const cohortCheck = await pool.query(
    "SELECT id FROM cohorts WHERE id = $1 AND workshop_id = $2",
    [cohortId, id]
  );
  if (cohortCheck.rows.length === 0) {
    return NextResponse.json({ error: "Cohort not found" }, { status: 404 });
  }

  const body = await request.json();
  let traineeIds: string[] = [];

  if (Array.isArray(body.trainee_ids)) {
    traineeIds = body.trainee_ids.filter((t: unknown) => typeof t === "string");
  } else if (typeof body.csv === "string") {
    // CSV of display_names or emails — look up by display_name in enrollments for this workshop
    const names = body.csv
      .split(/[\n,]/)
      .map((s: string) => s.trim())
      .filter(Boolean);

    if (names.length === 0) {
      return NextResponse.json({ error: "No names provided in CSV" }, { status: 400 });
    }

    // Find enrolled trainees whose display_name matches
    const lookupResult = await pool.query(
      `SELECT p.id FROM profiles p
       JOIN enrollments e ON e.user_id = p.id
       WHERE e.workshop_id = $1 AND p.display_name = ANY($2::text[])`,
      [id, names]
    );
    traineeIds = lookupResult.rows.map((r: { id: string }) => r.id);
  } else {
    return NextResponse.json(
      { error: "Provide trainee_ids array or csv string" },
      { status: 400 }
    );
  }

  if (traineeIds.length === 0) {
    return NextResponse.json({ added: 0 }, { status: 200 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    let added = 0;
    for (const tid of traineeIds) {
      const res = await client.query(
        `INSERT INTO cohort_members (cohort_id, trainee_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [cohortId, tid]
      );
      added += res.rowCount ?? 0;
    }
    await client.query("COMMIT");
    return NextResponse.json({ added });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Cohort member add error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    client.release();
  }
}

// DELETE /api/workshops/:id/cohorts/:cohortId/members
// Body: { trainee_id: string }
export async function DELETE(
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

  const { trainee_id } = await request.json();
  if (!trainee_id) {
    return NextResponse.json({ error: "trainee_id is required" }, { status: 400 });
  }

  await pool.query(
    "DELETE FROM cohort_members WHERE cohort_id = $1 AND trainee_id = $2",
    [cohortId, trainee_id]
  );
  return new NextResponse(null, { status: 204 });
}
