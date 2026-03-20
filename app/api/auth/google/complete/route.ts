import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const next = searchParams.get("next") ?? "/dashboard";

  const session = await getSession();

  if (!session.pendingOAuth) {
    return NextResponse.json({ error: "No pending OAuth session" }, { status: 400 });
  }

  const body = await request.json();
  const { role } = body;

  if (!role || !["instructor", "trainee"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const { googleId, email, displayName } = session.pendingOAuth;

  const client = await pool.connect();
  try {
    // Guard against race conditions — another request may have created this account already
    const existing = await client.query(
      "SELECT id, email, display_name, role FROM users WHERE email = $1 OR (oauth_provider = 'google' AND oauth_provider_id = $2)",
      [email, googleId]
    );

    let user;
    if (existing.rows.length > 0) {
      user = existing.rows[0];
    } else {
      const result = await client.query(
        `INSERT INTO users (email, display_name, role, oauth_provider, oauth_provider_id)
         VALUES ($1, $2, $3, 'google', $4)
         RETURNING id, email, display_name, role`,
        [email, displayName, role, googleId]
      );
      user = result.rows[0];

      // Create default email preferences row
      await client.query(
        `INSERT INTO email_preferences (user_id) VALUES ($1) ON CONFLICT DO NOTHING`,
        [user.id]
      );

      // Fire-and-forget welcome email
      sendWelcomeEmail(user.email, user.display_name).catch(() => {});
    }

    // Replace pending OAuth with full session
    session.pendingOAuth = undefined;
    session.userId = user.id;
    session.email = user.email;
    session.role = user.role;
    session.displayName = user.display_name;
    await session.save();

    return NextResponse.json({ ok: true, next });
  } finally {
    client.release();
  }
}
