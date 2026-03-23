import { NextResponse } from "next/server";
import { getCertificateByCode } from "@/lib/certificates";

type Params = { params: Promise<{ code: string }> };

// GET /api/certificates/[code] — public certificate lookup (no auth required)
export async function GET(_req: Request, { params }: Params) {
  const { code } = await params;

  const certificate = await getCertificateByCode(code.toUpperCase());

  if (!certificate) {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }

  return NextResponse.json({ certificate });
}
