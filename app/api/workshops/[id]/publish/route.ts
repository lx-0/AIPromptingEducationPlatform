import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import { sendWorkshopPublishedEmail, sendWorkshopInviteEmail } from "@/lib/email";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Optional: list of additional email addresses to send invite to
  let inviteEmails: string[] = [];
  try {
    const body = await request.json();
    if (Array.isArray(body?.inviteEmails)) {
      inviteEmails = body.inviteEmails.filter(
        (e: unknown) => typeof e === "string" && e.includes("@")
      );
    }
  } catch {
    // Body is optional; ignore parse errors
  }

  // Generate a unique invite code (8 hex chars) if not already set
  const inviteCode = randomBytes(4).toString("hex");

  const result = await pool.query(
    `UPDATE workshops
     SET status = 'published',
         invite_code = COALESCE(invite_code, $1)
     WHERE id = $2
     RETURNING *`,
    [inviteCode, id]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const workshop = result.rows[0];
  const finalCode: string = workshop.invite_code;
  const workshopTitle: string = workshop.title;

  // Fire-and-forget: notify instructor (check preference)
  pool
    .query<{ email: string; display_name: string; workshop_invite: boolean }>(
      `SELECT u.email, u.display_name,
              COALESCE(ep.workshop_invite, TRUE) AS workshop_invite
       FROM users u
       LEFT JOIN email_preferences ep ON ep.user_id = u.id
       WHERE u.id = $1`,
      [session.userId]
    )
    .then((r) => {
      const row = r.rows[0];
      if (row?.workshop_invite) {
        sendWorkshopPublishedEmail(
          row.email,
          row.display_name,
          workshopTitle,
          finalCode
        ).catch(() => {});
      }
    })
    .catch(() => {});

  // Fire-and-forget: send invite emails to additional addresses
  for (const email of inviteEmails) {
    sendWorkshopInviteEmail(
      email,
      workshopTitle,
      session.displayName ?? "Your instructor",
      finalCode
    ).catch(() => {});
  }

  return NextResponse.json(workshop);
}
