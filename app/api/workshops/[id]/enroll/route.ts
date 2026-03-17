import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

// POST /api/workshops/[id]/enroll — enroll authenticated trainee by workshop ID
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workshopResult = await pool.query(
    "SELECT id, status FROM workshops WHERE id = $1",
    [id]
  );

  if (workshopResult.rows.length === 0) {
    return NextResponse.json({ error: "Workshop not found" }, { status: 404 });
  }

  const workshop = workshopResult.rows[0];
  if (workshop.status !== "published") {
    return NextResponse.json({ error: "Workshop is not available" }, { status: 404 });
  }

  // Upsert enrollment (idempotent)
  await pool.query(
    `INSERT INTO enrollments (workshop_id, trainee_id)
     VALUES ($1, $2)
     ON CONFLICT (workshop_id, trainee_id) DO NOTHING`,
    [workshop.id, session.userId]
  );

  return NextResponse.json({ workshopId: workshop.id });
}
