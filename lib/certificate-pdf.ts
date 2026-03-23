import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { Certificate } from "@/lib/certificates";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/**
 * Generates a certificate PDF for the given certificate record.
 * Returns the PDF as a Uint8Array.
 */
export async function generateCertificatePdf(
  cert: Certificate
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // Landscape A4: 841.89 x 595.28 pt
  const page = pdfDoc.addPage([841.89, 595.28]);
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Background fill
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(0.97, 0.97, 1.0),
  });

  // Outer border (double lines)
  const margin = 24;
  page.drawRectangle({
    x: margin,
    y: margin,
    width: width - margin * 2,
    height: height - margin * 2,
    borderColor: rgb(0.15, 0.39, 0.92),
    borderWidth: 3,
  });
  page.drawRectangle({
    x: margin + 8,
    y: margin + 8,
    width: width - (margin + 8) * 2,
    height: height - (margin + 8) * 2,
    borderColor: rgb(0.15, 0.39, 0.92),
    borderWidth: 1,
  });

  // Header accent bar
  page.drawRectangle({
    x: margin + 8,
    y: height - margin - 8 - 60,
    width: width - (margin + 8) * 2,
    height: 60,
    color: rgb(0.15, 0.39, 0.92),
  });

  // Platform name in header
  page.drawText("PROMPTING SCHOOL", {
    x: width / 2 - fontBold.widthOfTextAtSize("PROMPTING SCHOOL", 20) / 2,
    y: height - margin - 8 - 60 + 20,
    size: 20,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  // "Certificate of Completion"
  const certTitle = "Certificate of Completion";
  page.drawText(certTitle, {
    x: width / 2 - fontBold.widthOfTextAtSize(certTitle, 28) / 2,
    y: height - 155,
    size: 28,
    font: fontBold,
    color: rgb(0.15, 0.39, 0.92),
  });

  // Decorative divider
  page.drawLine({
    start: { x: width / 2 - 120, y: height - 172 },
    end: { x: width / 2 + 120, y: height - 172 },
    thickness: 1.5,
    color: rgb(0.15, 0.39, 0.92),
  });

  // "This is to certify that"
  const subtitle = "This is to certify that";
  page.drawText(subtitle, {
    x: width / 2 - fontOblique.widthOfTextAtSize(subtitle, 14) / 2,
    y: height - 205,
    size: 14,
    font: fontOblique,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Trainee name
  page.drawText(cert.trainee_name, {
    x: width / 2 - fontBold.widthOfTextAtSize(cert.trainee_name, 32) / 2,
    y: height - 250,
    size: 32,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  // Underline for name
  const nameWidth = fontBold.widthOfTextAtSize(cert.trainee_name, 32);
  page.drawLine({
    start: { x: width / 2 - nameWidth / 2, y: height - 255 },
    end: { x: width / 2 + nameWidth / 2, y: height - 255 },
    thickness: 1,
    color: rgb(0.5, 0.5, 0.5),
  });

  // "has successfully completed"
  const completed = "has successfully completed";
  page.drawText(completed, {
    x: width / 2 - fontOblique.widthOfTextAtSize(completed, 14) / 2,
    y: height - 285,
    size: 14,
    font: fontOblique,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Type label
  const typeLabel =
    cert.type === "workshop" ? "Workshop" : "Learning Path";
  page.drawText(typeLabel, {
    x: width / 2 - fontRegular.widthOfTextAtSize(typeLabel, 12) / 2,
    y: height - 315,
    size: 12,
    font: fontRegular,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Entity (workshop/path) title
  const entityTitle = cert.entity_title;
  const entityFontSize = entityTitle.length > 50 ? 18 : 22;
  page.drawText(entityTitle, {
    x: width / 2 - fontBold.widthOfTextAtSize(entityTitle, entityFontSize) / 2,
    y: height - 350,
    size: entityFontSize,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  // Score summary (workshop only)
  if (cert.type === "workshop" && cert.max_score > 0) {
    const pct = Math.round((cert.total_score / cert.max_score) * 100);
    const scoreText = `Score: ${cert.total_score} / ${cert.max_score} (${pct}%)`;
    page.drawText(scoreText, {
      x: width / 2 - fontRegular.widthOfTextAtSize(scoreText, 12) / 2,
      y: height - 378,
      size: 12,
      font: fontRegular,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  // Bottom section: instructor + date + verification
  const issuedDate = new Date(cert.issued_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Instructor column
  const instructorLabelX = width * 0.25;
  page.drawLine({
    start: { x: instructorLabelX - 80, y: height - 455 },
    end: { x: instructorLabelX + 80, y: height - 455 },
    thickness: 1,
    color: rgb(0.5, 0.5, 0.5),
  });
  page.drawText(cert.instructor_name, {
    x: instructorLabelX - fontRegular.widthOfTextAtSize(cert.instructor_name, 11) / 2,
    y: height - 472,
    size: 11,
    font: fontRegular,
    color: rgb(0.2, 0.2, 0.2),
  });
  page.drawText("Instructor", {
    x: instructorLabelX - fontOblique.widthOfTextAtSize("Instructor", 10) / 2,
    y: height - 486,
    size: 10,
    font: fontOblique,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Date column
  const dateLabelX = width * 0.75;
  page.drawLine({
    start: { x: dateLabelX - 80, y: height - 455 },
    end: { x: dateLabelX + 80, y: height - 455 },
    thickness: 1,
    color: rgb(0.5, 0.5, 0.5),
  });
  page.drawText(issuedDate, {
    x: dateLabelX - fontRegular.widthOfTextAtSize(issuedDate, 11) / 2,
    y: height - 472,
    size: 11,
    font: fontRegular,
    color: rgb(0.2, 0.2, 0.2),
  });
  page.drawText("Date Issued", {
    x: dateLabelX - fontOblique.widthOfTextAtSize("Date Issued", 10) / 2,
    y: height - 486,
    size: 10,
    font: fontOblique,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Verification code at bottom
  const verificationUrl = `${APP_URL}/certificates/${cert.verification_code}`;
  const verifyLabel = `Verify at: ${verificationUrl}`;
  page.drawText(verifyLabel, {
    x: width / 2 - fontRegular.widthOfTextAtSize(verifyLabel, 9) / 2,
    y: margin + 20,
    size: 9,
    font: fontRegular,
    color: rgb(0.5, 0.5, 0.5),
  });

  const codeLabel = `Certificate ID: ${cert.verification_code}`;
  page.drawText(codeLabel, {
    x: width / 2 - fontRegular.widthOfTextAtSize(codeLabel, 9) / 2,
    y: margin + 10,
    size: 9,
    font: fontRegular,
    color: rgb(0.6, 0.6, 0.6),
  });

  return pdfDoc.save();
}
