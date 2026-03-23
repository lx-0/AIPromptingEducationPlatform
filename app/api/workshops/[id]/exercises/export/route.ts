import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

// GET /api/workshops/:id/exercises/export
// Returns all exercises as a JSON array suitable for import.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "instructor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ownerCheck = await pool.query(
    "SELECT instructor_id FROM workshops WHERE id = $1",
    [id]
  );
  if (ownerCheck.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (ownerCheck.rows[0].instructor_id !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await pool.query(
    `SELECT title, instructions, system_prompt, model_config, rubric, sort_order, criterion_weights
     FROM exercises WHERE workshop_id = $1 ORDER BY sort_order ASC`,
    [id]
  );

  return new NextResponse(JSON.stringify(result.rows, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="exercises-${id}.json"`,
    },
  });
}
