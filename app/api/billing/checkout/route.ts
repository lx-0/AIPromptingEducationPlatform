import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getStripe, getOrCreateStripeCustomer } from "@/lib/billing";

export async function POST(request: Request) {
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "instructor") {
    return NextResponse.json({ error: "Only instructors can subscribe" }, { status: 403 });
  }

  const body = await request.json();
  const { plan } = body;

  if (!plan || !["pro", "team"].includes(plan)) {
    return NextResponse.json({ error: "Invalid plan. Must be 'pro' or 'team'" }, { status: 400 });
  }

  const priceId =
    plan === "team"
      ? process.env.STRIPE_PRICE_ID_TEAM
      : process.env.STRIPE_PRICE_ID_PRO;

  if (!priceId) {
    return NextResponse.json({ error: "Stripe price not configured" }, { status: 500 });
  }

  const customerId = await getOrCreateStripeCustomer(
    session.userId,
    session.email,
    session.displayName
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const checkoutSession = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/billing?success=1`,
    cancel_url: `${appUrl}/pricing`,
    metadata: { userId: session.userId },
    subscription_data: {
      metadata: { userId: session.userId },
    },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
