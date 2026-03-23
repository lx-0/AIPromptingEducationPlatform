import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  const result = await pool.query(
    q
      ? "SELECT id, name FROM workshop_tags WHERE name ILIKE $1 ORDER BY name LIMIT 20"
      : "SELECT id, name FROM workshop_tags ORDER BY name LIMIT 100",
    q ? [`%${q}%`] : []
  );
  return NextResponse.json(result.rows, {
    headers: { "Cache-Control": "public, max-age=300" },
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.userId || session.role !== "instructor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  // Upsert tag (case-insensitive)
  const result = await pool.query(
    `INSERT INTO workshop_tags (name)
     VALUES ($1)
     ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
     RETURNING *`,
    [name.trim().toLowerCase()]
  );
  return NextResponse.json(result.rows[0], { status: 201 });
}
