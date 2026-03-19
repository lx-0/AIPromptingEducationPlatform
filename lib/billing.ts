import Stripe from "stripe";
import pool from "@/lib/db";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover",
    });
  }
  return _stripe;
}

// Free tier limits for instructors
export const FREE_TIER_LIMITS = {
  maxWorkshops: 3,
  maxExercisesPerWorkshop: 5,
} as const;

export type SubscriptionPlan = "free" | "pro" | "team";

export interface SubscriptionStatus {
  plan: SubscriptionPlan;
  isActive: boolean;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
  stripeSubscriptionId: string | null;
}

/** Returns the active subscription for a user, or null if on free tier. */
export async function getSubscription(userId: string): Promise<SubscriptionStatus> {
  const result = await pool.query(
    `SELECT plan, status, cancel_at_period_end, current_period_end, stripe_subscription_id
     FROM subscriptions
     WHERE user_id = $1 AND status IN ('active', 'trialing', 'past_due')
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );

  if (result.rows.length === 0) {
    return {
      plan: "free",
      isActive: false,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
      stripeSubscriptionId: null,
    };
  }

  const row = result.rows[0];
  return {
    plan: row.plan as SubscriptionPlan,
    isActive: row.status === "active" || row.status === "trialing",
    cancelAtPeriodEnd: row.cancel_at_period_end,
    currentPeriodEnd: row.current_period_end ? new Date(row.current_period_end) : null,
    stripeSubscriptionId: row.stripe_subscription_id,
  };
}

/** Returns true if the instructor is on a paid plan. */
export async function isPaidSubscriber(userId: string): Promise<boolean> {
  const sub = await getSubscription(userId);
  return sub.isActive && sub.plan !== "free";
}

/** Get or create a Stripe customer for a user. */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  displayName: string
): Promise<string> {
  const userResult = await pool.query(
    "SELECT stripe_customer_id FROM users WHERE id = $1",
    [userId]
  );

  const existingCustomerId = userResult.rows[0]?.stripe_customer_id;
  if (existingCustomerId) return existingCustomerId;

  const customer = await getStripe().customers.create({
    email,
    name: displayName,
    metadata: { userId },
  });

  await pool.query(
    "UPDATE users SET stripe_customer_id = $1 WHERE id = $2",
    [customer.id, userId]
  );

  return customer.id;
}

/** Upsert subscription record from Stripe webhook data. */
export async function upsertSubscription(
  stripeSubscription: Stripe.Subscription
): Promise<void> {
  const customerId =
    typeof stripeSubscription.customer === "string"
      ? stripeSubscription.customer
      : stripeSubscription.customer.id;

  const userResult = await pool.query(
    "SELECT id FROM users WHERE stripe_customer_id = $1",
    [customerId]
  );

  if (userResult.rows.length === 0) return;
  const userId = userResult.rows[0].id;

  // Derive plan from price metadata or default to 'pro'
  const priceId = stripeSubscription.items.data[0]?.price?.id;
  let plan: SubscriptionPlan = "pro";
  if (priceId === process.env.STRIPE_PRICE_ID_TEAM) {
    plan = "team";
  }

  // In Stripe API 2026-02-25+, period dates are on subscription items
  const firstItem = stripeSubscription.items.data[0];
  const periodStart = firstItem?.current_period_start
    ? new Date(firstItem.current_period_start * 1000)
    : null;
  const periodEnd = firstItem?.current_period_end
    ? new Date(firstItem.current_period_end * 1000)
    : null;

  await pool.query(
    `INSERT INTO subscriptions
       (user_id, stripe_subscription_id, stripe_customer_id, plan, status,
        current_period_start, current_period_end, cancel_at_period_end, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
     ON CONFLICT (stripe_subscription_id) DO UPDATE SET
       plan = EXCLUDED.plan,
       status = EXCLUDED.status,
       current_period_start = EXCLUDED.current_period_start,
       current_period_end = EXCLUDED.current_period_end,
       cancel_at_period_end = EXCLUDED.cancel_at_period_end,
       updated_at = NOW()`,
    [
      userId,
      stripeSubscription.id,
      customerId,
      plan,
      stripeSubscription.status,
      periodStart,
      periodEnd,
      stripeSubscription.cancel_at_period_end,
    ]
  );
}
