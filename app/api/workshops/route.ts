import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import { isPaidSubscriber, FREE_TIER_LIMITS } from "@/lib/billing";
import { z } from "zod";

const createWorkshopSchema = z.object({
  title: z.string().min(1, "title is required").max(255),
  description: z.string().max(5000).optional(),
});

export async function GET() {
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await pool.query(
    "SELECT * FROM workshops ORDER BY created_at DESC"
  );

  return NextResponse.json(result.rows, {
    headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=30" },
  });
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "instructor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Enforce free-tier workshop limit
  const paid = await isPaidSubscriber(session.userId);
  if (!paid) {
    const countResult = await pool.query(
      "SELECT COUNT(*) FROM workshops WHERE instructor_id = $1",
      [session.userId]
    );
    const count = parseInt(countResult.rows[0].count, 10);
    if (count >= FREE_TIER_LIMITS.maxWorkshops) {
      return NextResponse.json(
        {
          error: `Free tier is limited to ${FREE_TIER_LIMITS.maxWorkshops} workshops. Upgrade to Pro to create more.`,
          code: "FREE_TIER_LIMIT",
        },
        { status: 402 }
      );
    }
  }

  const raw = await request.json();
  const parsed = createWorkshopSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { title, description } = parsed.data;

  const result = await pool.query(
    "INSERT INTO workshops (title, description, instructor_id) VALUES ($1, $2, $3) RETURNING *",
    [title, description ?? null, session.userId]
  );

  return NextResponse.json(result.rows[0], { status: 201 });
}
