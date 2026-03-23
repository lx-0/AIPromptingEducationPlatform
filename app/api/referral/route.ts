import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import pool from "@/lib/db";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function GET() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await pool.query<{
    referral_code: string;
    referral_credits: number;
    total_referrals: string;
    rewarded_count: string;
  }>(
    `SELECT u.referral_code, u.referral_credits,
            COUNT(r.id)::text AS total_referrals,
            COUNT(r.id) FILTER (WHERE r.rewarded = TRUE)::text AS rewarded_count
     FROM users u
     LEFT JOIN referrals r ON r.referrer_id = u.id
     WHERE u.id = $1
     GROUP BY u.referral_code, u.referral_credits`,
    [session.userId]
  );

  const row = result.rows[0];
  if (!row) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const totalReferrals = Number(row.total_referrals);
  const nextRewardAt = Math.ceil(totalReferrals / 3) * 3;
  const referralUrl = `${APP_URL}/auth/sign-up?ref=${row.referral_code}`;

  return NextResponse.json({
    referralCode: row.referral_code,
    referralUrl,
    totalReferrals,
    credits: row.referral_credits,
    nextRewardAt: nextRewardAt > totalReferrals ? nextRewardAt : totalReferrals + (3 - (totalReferrals % 3)),
  });
}
