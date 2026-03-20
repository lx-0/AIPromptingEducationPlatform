import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await pool.query(
    `SELECT score_notify, workshop_invite
     FROM email_preferences
     WHERE user_id = $1`,
    [session.userId]
  );

  if (result.rows.length === 0) {
    // Return defaults if row not yet created
    return NextResponse.json({ score_notify: true, workshop_invite: true });
  }

  return NextResponse.json(result.rows[0]);
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { score_notify, workshop_invite } = body;

  if (
    (score_notify !== undefined && typeof score_notify !== "boolean") ||
    (workshop_invite !== undefined && typeof workshop_invite !== "boolean")
  ) {
    return NextResponse.json({ error: "Invalid values" }, { status: 400 });
  }

  await pool.query(
    `INSERT INTO email_preferences (user_id, score_notify, workshop_invite)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO UPDATE
       SET score_notify    = COALESCE($2, email_preferences.score_notify),
           workshop_invite = COALESCE($3, email_preferences.workshop_invite),
           updated_at      = NOW()`,
    [
      session.userId,
      score_notify ?? null,
      workshop_invite ?? null,
    ]
  );

  return NextResponse.json({ ok: true });
}
