import { describe, it, expect, vi, beforeEach } from "vitest";

// ── DB mock ───────────────────────────────────────────────────────────────────
const mockQuery = vi.fn();

vi.mock("@/lib/db", () => ({
  default: { query: mockQuery },
}));

// ── Session mock ──────────────────────────────────────────────────────────────
const mockSession = {
  userId: "trainee-1",
  email: "trainee@test.com",
  role: "trainee",
  displayName: "Alice",
  save: vi.fn(),
};

vi.mock("@/lib/session", () => ({
  getSession: vi.fn().mockResolvedValue(mockSession),
  sessionOptions: { cookieName: "ps_session", password: "test" },
}));

// ── Certificates lib mock (for route tests) ───────────────────────────────────
const mockGetTraineeCertificates = vi.fn();
const mockGetCertificateByCode = vi.fn();

vi.mock("@/lib/certificates", () => ({
  getTraineeCertificates: mockGetTraineeCertificates,
  getCertificateByCode: mockGetCertificateByCode,
  maybeIssueWorkshopCertificate: vi.fn(),
  maybeIssueLearningPathCertificates: vi.fn(),
}));

// ── next/server mock ──────────────────────────────────────────────────────────
vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
    }),
  },
}));

const fakeCert = {
  id: "cert-1",
  trainee_id: "trainee-1",
  workshop_id: "ws-1",
  path_id: null,
  type: "workshop",
  issued_at: "2026-03-01T00:00:00Z",
  verification_code: "ABCD1234",
  trainee_name: "Alice",
  entity_title: "Prompting 101",
  instructor_name: "Bob",
  total_score: 9,
  max_score: 10,
  exercise_count: 5,
};

// ── GET /api/certificates ─────────────────────────────────────────────────────
describe("GET /api/certificates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(mockSession, { userId: "trainee-1" });
  });

  it("returns 401 when unauthenticated", async () => {
    mockSession.userId = "";
    const { GET } = await import("@/app/api/certificates/route");
    const res = await GET() as any;
    expect(res.status).toBe(401);
  });

  it("returns certificates for the authenticated trainee", async () => {
    mockGetTraineeCertificates.mockResolvedValue([fakeCert]);

    const { GET } = await import("@/app/api/certificates/route");
    const res = await GET() as any;

    expect(res.status).toBe(200);
    expect(res.body.certificates).toHaveLength(1);
    expect(res.body.certificates[0].verification_code).toBe("ABCD1234");
    expect(mockGetTraineeCertificates).toHaveBeenCalledWith("trainee-1");
  });

  it("returns empty array when trainee has no certificates", async () => {
    mockGetTraineeCertificates.mockResolvedValue([]);

    const { GET } = await import("@/app/api/certificates/route");
    const res = await GET() as any;

    expect(res.status).toBe(200);
    expect(res.body.certificates).toEqual([]);
  });
});

// ── GET /api/certificates/[code] ─────────────────────────────────────────────
describe("GET /api/certificates/[code]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 when certificate code is not found", async () => {
    mockGetCertificateByCode.mockResolvedValue(null);

    const { GET } = await import("@/app/api/certificates/[code]/route");
    const req = new Request("http://localhost/api/certificates/DEADBEEF");
    const res = await GET(req, { params: Promise.resolve({ code: "DEADBEEF" }) }) as any;

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it("returns certificate when code is valid", async () => {
    mockGetCertificateByCode.mockResolvedValue(fakeCert);

    const { GET } = await import("@/app/api/certificates/[code]/route");
    const req = new Request("http://localhost/api/certificates/ABCD1234");
    const res = await GET(req, { params: Promise.resolve({ code: "ABCD1234" }) }) as any;

    expect(res.status).toBe(200);
    expect(res.body.certificate.trainee_name).toBe("Alice");
    expect(res.body.certificate.entity_title).toBe("Prompting 101");
  });

  it("normalizes code to uppercase before lookup", async () => {
    mockGetCertificateByCode.mockResolvedValue(fakeCert);

    const { GET } = await import("@/app/api/certificates/[code]/route");
    const req = new Request("http://localhost/api/certificates/abcd1234");
    await GET(req, { params: Promise.resolve({ code: "abcd1234" }) });

    expect(mockGetCertificateByCode).toHaveBeenCalledWith("ABCD1234");
  });
});

// ── lib/certificates unit tests ───────────────────────────────────────────────
// These test the library functions directly with mocked DB
describe("lib/certificates – maybeIssueWorkshopCertificate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock to use pool directly (not the vi.mock above)
  });

  it("returns null when certificate was already issued (idempotency)", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: "cert-existing" }] });

    // Import unmocked lib (the vi.mock above only affects route imports, not direct lib imports)
    // We need to reset the certificates mock and test the real implementation
    vi.doMock("@/lib/certificates", async (importOriginal) => {
      return importOriginal();
    });

    // Direct DB query mock: existing cert found
    const { maybeIssueWorkshopCertificate } = await import("@/lib/certificates");
    const result = await maybeIssueWorkshopCertificate("trainee-1", "ws-1");
    expect(result).toBeNull();
    // Only one query should have been made (idempotency check)
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it("returns null when not all exercises are passing", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] }) // no existing cert
      .mockResolvedValueOnce({ rows: [{ total_exercises: "3", passing_exercises: "2", total_score: "16", max_score: "30" }] }); // 2/3 passing

    const { maybeIssueWorkshopCertificate } = await import("@/lib/certificates");
    const result = await maybeIssueWorkshopCertificate("trainee-1", "ws-1");
    expect(result).toBeNull();
  });

  it("issues certificate when all exercises pass threshold", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })  // no existing cert
      .mockResolvedValueOnce({ rows: [{ total_exercises: "3", passing_exercises: "3", total_score: "27", max_score: "30" }] }) // all passing
      .mockResolvedValueOnce({ rows: [{ title: "Prompting 101", instructor_name: "Bob" }] }) // workshop details
      .mockResolvedValueOnce({ rows: [{ display_name: "Alice" }] }) // trainee details
      .mockResolvedValueOnce({ rows: [fakeCert] }); // INSERT result

    const { maybeIssueWorkshopCertificate } = await import("@/lib/certificates");
    const result = await maybeIssueWorkshopCertificate("trainee-1", "ws-1");

    expect(result).not.toBeNull();
    expect(result?.trainee_name).toBe("Alice");
    expect(result?.entity_title).toBe("Prompting 101");
  });

  it("returns null when no exercises exist", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] }) // no existing cert
      .mockResolvedValueOnce({ rows: [{ total_exercises: "0", passing_exercises: "0", total_score: "0", max_score: "0" }] }); // no exercises

    const { maybeIssueWorkshopCertificate } = await import("@/lib/certificates");
    const result = await maybeIssueWorkshopCertificate("trainee-1", "ws-empty");
    expect(result).toBeNull();
  });
});

describe("lib/certificates – getCertificateByCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns certificate when found", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [fakeCert] });

    const { getCertificateByCode } = await import("@/lib/certificates");
    const result = await getCertificateByCode("ABCD1234");

    expect(result).toMatchObject({ verification_code: "ABCD1234" });
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("verification_code"),
      ["ABCD1234"]
    );
  });

  it("returns null when code does not exist", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const { getCertificateByCode } = await import("@/lib/certificates");
    const result = await getCertificateByCode("NOTFOUND");

    expect(result).toBeNull();
  });
});

describe("lib/certificates – getTraineeCertificates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all certificates for the trainee ordered by issued_at desc", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [fakeCert] });

    const { getTraineeCertificates } = await import("@/lib/certificates");
    const results = await getTraineeCertificates("trainee-1");

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("cert-1");
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("issued_at DESC"),
      ["trainee-1"]
    );
  });

  it("returns empty array when trainee has no certificates", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const { getTraineeCertificates } = await import("@/lib/certificates");
    const results = await getTraineeCertificates("trainee-no-certs");

    expect(results).toEqual([]);
  });
});
