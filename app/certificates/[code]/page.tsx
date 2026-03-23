import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getCertificateByCode } from "@/lib/certificates";
import CertificateActions from "./CertificateActions";
import SocialShareButtons from "@/components/SocialShareButtons";

type Props = { params: Promise<{ code: string }> };

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const certificate = await getCertificateByCode(code.toUpperCase());
  if (!certificate) return {};

  const title = `${certificate.trainee_name} completed "${certificate.entity_title}"`;
  const description = `Verified certificate of completion from Prompting School.`;
  const stat = certificate.max_score > 0
    ? `${Math.round((certificate.total_score / certificate.max_score) * 100)}% score`
    : "Completed";
  const ogImageUrl = `${APP_URL}/api/og?title=${encodeURIComponent(certificate.entity_title)}&subtitle=${encodeURIComponent(`Completed by ${certificate.trainee_name}`)}&type=certificate&stat=${encodeURIComponent(stat)}`;

  return {
    title: `Certificate: ${certificate.entity_title} — Prompting School`,
    description,
    openGraph: {
      title,
      description,
      url: `${APP_URL}/certificates/${code}`,
      siteName: "Prompting School",
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function CertificateVerificationPage({ params }: Props) {
  const { code } = await params;
  const certificate = await getCertificateByCode(code.toUpperCase());

  if (!certificate) notFound();

  const issuedDate = new Date(certificate.issued_at).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  const scorePct =
    certificate.max_score > 0
      ? Math.round((certificate.total_score / certificate.max_score) * 100)
      : null;

  const typeLabel =
    certificate.type === "workshop" ? "Workshop" : "Learning Path";

  const downloadUrl = `/api/certificates/${certificate.verification_code}/pdf`;
  const linkedinUrl = buildLinkedinShareUrl(certificate);
  const certUrl = `${APP_URL}/certificates/${certificate.verification_code}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOccupationalCredential",
    name: `Certificate of Completion: ${certificate.entity_title}`,
    description: `${certificate.trainee_name} successfully completed ${certificate.entity_title} on Prompting School.`,
    url: certUrl,
    recognizedBy: {
      "@type": "Organization",
      name: "Prompting School",
      url: APP_URL,
    },
    dateCreated: certificate.issued_at,
    credentialCategory: "Certificate of Completion",
    about: {
      "@type": "Course",
      name: certificate.entity_title,
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Verification badge */}
      <div className="mb-8 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-full px-4 py-2 text-sm font-medium">
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        Verified Certificate
      </div>

      {/* Certificate card */}
      <div
        className="bg-white border-2 border-blue-600 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden"
        id="certificate-card"
      >
        {/* Header */}
        <div className="bg-blue-600 px-8 py-5 text-center">
          <p className="text-white font-bold text-xl tracking-wide">
            PROMPTING SCHOOL
          </p>
        </div>

        {/* Body */}
        <div className="px-8 py-10 text-center">
          <h1 className="text-2xl font-bold text-blue-600 mb-1">
            Certificate of Completion
          </h1>
          <div className="w-24 h-0.5 bg-blue-600 mx-auto mb-6" />

          <p className="text-gray-500 italic mb-3">This is to certify that</p>

          <p className="text-4xl font-bold text-gray-900 mb-1">
            {certificate.trainee_name}
          </p>
          <div className="w-64 h-px bg-gray-300 mx-auto mb-4" />

          <p className="text-gray-500 italic mb-2">
            has successfully completed
          </p>
          <p className="text-sm text-gray-400 uppercase tracking-widest mb-2">
            {typeLabel}
          </p>
          <p className="text-2xl font-bold text-gray-800 mb-4">
            {certificate.entity_title}
          </p>

          {scorePct !== null && (
            <div className="inline-block bg-blue-50 border border-blue-100 rounded-lg px-5 py-3 mb-6">
              <p className="text-3xl font-extrabold text-blue-600">
                {scorePct}%
              </p>
              <p className="text-xs text-gray-500">
                {certificate.total_score} / {certificate.max_score} points
                across {certificate.exercise_count} exercises
              </p>
            </div>
          )}

          {/* Signatures */}
          <div className="flex justify-around mt-8 pt-6 border-t border-gray-100">
            <div className="text-center">
              <p className="font-semibold text-gray-800 text-sm">
                {certificate.instructor_name}
              </p>
              <p className="text-xs text-gray-400 italic">Instructor</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-800 text-sm">{issuedDate}</p>
              <p className="text-xs text-gray-400 italic">Date Issued</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-100 px-8 py-3 text-center">
          <p className="text-xs text-gray-400">
            Certificate ID:{" "}
            <span className="font-mono">{certificate.verification_code}</span>
          </p>
        </div>
      </div>

      {/* Action buttons (client component for print/share) */}
      <CertificateActions
        downloadUrl={downloadUrl}
        linkedinUrl={linkedinUrl}
      />

      {/* Social sharing */}
      <div className="mt-6">
        <SocialShareButtons
          url={certUrl}
          title={`I completed "${certificate.entity_title}" on Prompting School!`}
        />
      </div>

      {/* Back to platform */}
      <Link
        href="/"
        className="mt-8 text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        ← Back to Prompting School
      </Link>
    </div>
  );
}

function buildLinkedinShareUrl(cert: {
  entity_title: string;
  verification_code: string;
  issued_at: string;
}): string {
  const certUrl = `${APP_URL}/certificates/${cert.verification_code}`;
  const issuedAt = new Date(cert.issued_at);

  const params = new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: cert.entity_title,
    organizationName: "Prompting School",
    issueYear: String(issuedAt.getFullYear()),
    issueMonth: String(issuedAt.getMonth() + 1),
    certUrl,
    certId: cert.verification_code,
  });

  return `https://www.linkedin.com/profile/add?${params.toString()}`;
}
