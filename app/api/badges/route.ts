import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import { BADGE_CATALOG, type BadgeType } from "@/lib/badges";

export async function GET() {
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const badgesResult = await pool.query<{
    badge_type: string;
    earned_at: string;
  }>(
    "SELECT badge_type, earned_at FROM user_badges WHERE trainee_id = $1 ORDER BY earned_at ASC",
    [session.userId]
  );

  const streakResult = await pool.query<{
    current_streak: number;
    longest_streak: number;
    last_sub_date: string | null;
  }>(
    "SELECT current_streak, longest_streak, last_sub_date FROM streaks WHERE trainee_id = $1",
    [session.userId]
  );

  const badges = badgesResult.rows.map((row) => ({
    ...(BADGE_CATALOG[row.badge_type as BadgeType] ?? {
      type: row.badge_type,
      label: row.badge_type,
      description: "",
      emoji: "🏅",
    }),
    earned_at: row.earned_at,
  }));

  const streak = streakResult.rows[0] ?? {
    current_streak: 0,
    longest_streak: 0,
    last_sub_date: null,
  };

  return NextResponse.json({ badges, streak });
}
