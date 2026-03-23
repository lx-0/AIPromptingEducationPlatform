import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getTraineeCertificates } from "@/lib/certificates";

// GET /api/certificates — list certificates for the authenticated trainee
export async function GET() {
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const certificates = await getTraineeCertificates(session.userId);
  return NextResponse.json({ certificates });
}
