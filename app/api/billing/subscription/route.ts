import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSubscription } from "@/lib/billing";

export async function GET() {
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await getSubscription(session.userId);

  return NextResponse.json(subscription);
}
