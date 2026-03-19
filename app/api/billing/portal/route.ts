import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getStripe } from "@/lib/billing";
import pool from "@/lib/db";

export async function POST() {
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userResult = await pool.query(
    "SELECT stripe_customer_id FROM users WHERE id = $1",
    [session.userId]
  );

  const customerId = userResult.rows[0]?.stripe_customer_id;
  if (!customerId) {
    return NextResponse.json({ error: "No billing account found" }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const portalSession = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/billing`,
  });

  return NextResponse.json({ url: portalSession.url });
}
