import { NextResponse } from "next/server";
import { getCertificateByCode } from "@/lib/certificates";
import { generateCertificatePdf } from "@/lib/certificate-pdf";

type Params = { params: Promise<{ code: string }> };

// GET /api/certificates/[code]/pdf — download certificate as PDF (public)
export async function GET(_req: Request, { params }: Params) {
  const { code } = await params;

  const certificate = await getCertificateByCode(code.toUpperCase());

  if (!certificate) {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }

  const pdfBytes = await generateCertificatePdf(certificate);

  const filename = `certificate-${certificate.verification_code}.pdf`;

  return new NextResponse(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
