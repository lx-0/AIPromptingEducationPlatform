import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import type { PoolClient } from "pg";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import { sendWelcomeEmail } from "@/lib/email";
import { scheduleDripSeries } from "@/lib/queue";

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password, displayName, role, referralCode } = body;

  if (!email || !password || !displayName || !role) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  if (!["instructor", "trainee"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  const client = await pool.connect();
  try {
    const existing = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase()]
    );
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    // Resolve referrer from provided referral code
    let referrerId: string | null = null;
    if (referralCode && typeof referralCode === "string") {
      const refResult = await client.query<{ id: string }>(
        "SELECT id FROM users WHERE referral_code = $1 LIMIT 1",
        [referralCode.toUpperCase()]
      );
      referrerId = refResult.rows[0]?.id ?? null;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const newReferralCode = generateReferralCode();
    const result = await client.query(
      `INSERT INTO users (email, password_hash, display_name, role, referral_code, referred_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, display_name, role`,
      [email.toLowerCase(), passwordHash, displayName, role, newReferralCode, referrerId]
    );
    const user = result.rows[0];

    // Create default email preferences row
    await client.query(
      `INSERT INTO email_preferences (user_id) VALUES ($1) ON CONFLICT DO NOTHING`,
      [user.id]
    );

    // Record referral and potentially reward referrer
    if (referrerId) {
      await client.query(
        `INSERT INTO referrals (referrer_id, referred_user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [referrerId, user.id]
      );
      // Check if referrer has 3 un-rewarded referrals to grant a free month
      await checkAndRewardReferrer(client, referrerId);
    }

    const session = await getSession();
    session.userId = user.id;
    session.email = user.email;
    session.role = user.role;
    session.displayName = user.display_name;
    await session.save();

    // Fire-and-forget welcome email + drip series
    sendWelcomeEmail(user.email, user.display_name).catch(() => {});
    scheduleDripSeries(user.id).catch(() => {});

    return NextResponse.json({ ok: true }, { status: 201 });
  } finally {
    client.release();
  }
}

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function checkAndRewardReferrer(
  client: PoolClient,
  referrerId: string
) {
  // Count unrewarded referrals in batches of 3
  const countResult = await client.query<{ unrewarded: string }>(
    `SELECT COUNT(*)::text AS unrewarded FROM referrals WHERE referrer_id = $1 AND rewarded = FALSE`,
    [referrerId]
  );
  const unrewarded = Number(countResult.rows[0]?.unrewarded ?? 0);

  if (unrewarded >= 3) {
    const batches = Math.floor(unrewarded / 3);
    // Mark oldest unrewarded referrals as rewarded (batches * 3)
    await client.query(
      `UPDATE referrals SET rewarded = TRUE
       WHERE referrer_id = $1 AND rewarded = FALSE
         AND id IN (
           SELECT id FROM referrals
           WHERE referrer_id = $1 AND rewarded = FALSE
           ORDER BY created_at ASC
           LIMIT $2
         )`,
      [referrerId, batches * 3]
    );
    // Credit the referrer with free pro months
    await client.query(
      `UPDATE users SET referral_credits = referral_credits + $1 WHERE id = $2`,
      [batches, referrerId]
    );
  }
}
