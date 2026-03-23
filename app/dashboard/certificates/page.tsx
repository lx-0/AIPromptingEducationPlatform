import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { getTraineeCertificates } from "@/lib/certificates";
import type { Certificate } from "@/lib/certificates";

export default async function CertificatesPage() {
  const session = await getSession();

  if (!session.userId) redirect("/auth/sign-in");

  const certificates = await getTraineeCertificates(session.userId);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/dashboard"
              className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block"
            >
              ← Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              My Certificates
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Certificates are awarded when you complete all exercises in a
              workshop or learning path with a passing score.
            </p>
          </div>
        </div>

        {certificates.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4">
            {certificates.map((cert) => (
              <CertificateCard key={cert.id} cert={cert} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CertificateCard({ cert }: { cert: Certificate }) {
  const issuedDate = new Date(cert.issued_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const scorePct =
    cert.max_score > 0
      ? Math.round((cert.total_score / cert.max_score) * 100)
      : null;

  const typeLabel = cert.type === "workshop" ? "Workshop" : "Learning Path";
  const typeColor =
    cert.type === "workshop"
      ? "bg-blue-100 text-blue-700"
      : "bg-purple-100 text-purple-700";

  const verificationUrl = `/certificates/${cert.verification_code}`;
  const downloadUrl = `/api/certificates/${cert.verification_code}/pdf`;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col sm:flex-row sm:items-center gap-4">
      {/* Icon */}
      <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
          />
        </svg>
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${typeColor}`}
          >
            {typeLabel}
          </span>
        </div>
        <p className="text-base font-semibold text-gray-900 truncate">
          {cert.entity_title}
        </p>
        <p className="text-sm text-gray-500 mt-0.5">
          Issued {issuedDate}
          {scorePct !== null && (
            <span className="ml-2 text-green-600 font-medium">
              · {scorePct}% score
            </span>
          )}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href={verificationUrl}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors"
        >
          View
        </Link>
        <a
          href={downloadUrl}
          className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-3 py-1.5 transition-colors"
        >
          Download PDF
        </a>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-8 h-8 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
          />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">
        No certificates yet
      </h2>
      <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
        Complete all exercises in a workshop with a passing score (≥60%) to earn
        your first certificate.
      </p>
      <Link
        href="/workshops"
        className="inline-block bg-blue-600 text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Browse Workshops
      </Link>
    </div>
  );
}
