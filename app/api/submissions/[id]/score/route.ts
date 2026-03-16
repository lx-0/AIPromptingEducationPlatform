import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { scoreSubmission } from "@/lib/scorer";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const score = await scoreSubmission(id);
    return NextResponse.json(score);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scoring failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
