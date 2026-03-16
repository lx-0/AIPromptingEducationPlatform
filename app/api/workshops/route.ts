import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await pool.query(
    "SELECT * FROM workshops ORDER BY created_at DESC"
  );

  return NextResponse.json(result.rows);
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "instructor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { title, description } = body;

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const result = await pool.query(
    "INSERT INTO workshops (title, description, instructor_id) VALUES ($1, $2, $3) RETURNING *",
    [title, description ?? null, session.userId]
  );

  return NextResponse.json(result.rows[0], { status: 201 });
}
