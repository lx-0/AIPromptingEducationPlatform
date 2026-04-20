import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import {
  sendWorkshopPublishedEmail,
  sendWorkshopInviteEmail,
  sendNewWorkshopFromFollowedInstructorEmail,
} from "@/lib/email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ownerCheck = await pool.query(
    "SELECT instructor_id FROM workshops WHERE id = $1",
    [id]
  );
  if (ownerCheck.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (ownerCheck.rows[0].instructor_id !== session.userId && !session.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

  // Fire-and-forget: notify followers of this instructor
  pool
    .query(
      `SELECT f.follower_id, u.email, p.display_name
       FROM follows f
       JOIN profiles p ON p.id = f.follower_id
       JOIN auth.users u ON u.id = f.follower_id
       WHERE f.instructor_id = $1`,
      [session.userId]
    )
    .then(async (followersResult) => {
      const workshopUrl = `${APP_URL}/marketplace`;
      for (const follower of followersResult.rows) {
        // In-app notification
        await pool
          .query(
            `INSERT INTO notifications (user_id, type, payload)
             VALUES ($1, 'new_workshop_from_followed', $2)`,
            [
              follower.follower_id,
              JSON.stringify({
                workshop_id: workshop.id,
                workshop_title: workshopTitle,
                instructor_name: session.displayName,
              }),
            ]
          )
          .catch(() => {});

        // Email
        sendNewWorkshopFromFollowedInstructorEmail(
          follower.email,
          follower.display_name,
          session.displayName ?? "Your instructor",
          workshopTitle,
          workshop.description ?? "",
          workshopUrl
        ).catch(() => {});
      }
    })
    .catch(() => {});

  return NextResponse.json(workshop);
}
