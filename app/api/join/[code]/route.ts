import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

// GET /api/join/[code] — preview workshop by invite code (auth not required)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const result = await pool.query(
    "SELECT id, title, description, status FROM workshops WHERE invite_code = $1",
    [code]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
  }

  const workshop = result.rows[0];
  if (workshop.status !== "published") {
    return NextResponse.json({ error: "Workshop is not available" }, { status: 404 });
  }

  return NextResponse.json(workshop);
}

// POST /api/join/[code] — enroll authenticated trainee in workshop
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workshopResult = await pool.query(
    "SELECT id, status FROM workshops WHERE invite_code = $1",
    [code]
  );

  if (workshopResult.rows.length === 0) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
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
