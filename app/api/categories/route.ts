import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  const result = await pool.query(
    "SELECT id, name, slug, icon, sort_order FROM workshop_categories ORDER BY sort_order ASC"
  );
  return NextResponse.json(result.rows, {
    headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=600" },
  });
}
