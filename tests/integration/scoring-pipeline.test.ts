import { describe, it, expect, vi, beforeEach } from "vitest";

// ── DB mock ───────────────────────────────────────────────────────────────────
const mockQuery = vi.fn();

vi.mock("@/lib/db", () => ({
  default: { query: mockQuery },
}));

// ── Session mock ──────────────────────────────────────────────────────────────
const mockSession = {
  userId: "user-1",
  email: "user@test.com",
  role: "trainee",
  displayName: "Alice",
  save: vi.fn(),
};

vi.mock("@/lib/session", () => ({
  getSession: vi.fn().mockResolvedValue(mockSession),
  sessionOptions: { cookieName: "ps_session", password: "test" },
}));

// ── Queue mock ────────────────────────────────────────────────────────────────
const mockAdd = vi.fn();
const mockGetScoringQueue = vi.fn();

vi.mock("@/lib/queue", () => ({
  getScoringQueue: mockGetScoringQueue,
}));

// ── Scorer mock ───────────────────────────────────────────────────────────────
const mockScoreSubmission = vi.fn();

vi.mock("@/lib/scorer", () => ({
  scoreSubmission: mockScoreSubmission,
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

const fakeSubmission = {
  id: "sub-1",
  trainee_id: "user-1",
  exercise_title: "Exercise 1",
  exercise_id: "ex-1",
};

const fakeScore = {
  id: "score-1",
  submission_id: "sub-1",
  total_score: 8,
  max_score: 10,
  feedback: { criteria: [], overall: "Good work." },
  scored_at: new Date().toISOString(),
};

// ── POST /api/submissions/:id/score ──────────────────────────────────────────
describe("POST /api/submissions/:id/score", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(mockSession, { userId: "user-1", role: "trainee" });
    mockGetScoringQueue.mockReturnValue(null); // inline scoring by default
  });

  it("returns 401 when unauthenticated", async () => {
    mockSession.userId = "";
    const { POST } = await import("@/app/api/submissions/[id]/score/route");
    const req = new Request("http://localhost/api/submissions/sub-1/score", { method: "POST" });
    const res = await POST(req, { params: Promise.resolve({ id: "sub-1" }) });
    expect(res.status).toBe(401);
  });

  it("returns 404 when submission not found", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const { POST } = await import("@/app/api/submissions/[id]/score/route");
    const req = new Request("http://localhost/api/submissions/missing/score", { method: "POST" });
    const res = await POST(req, { params: Promise.resolve({ id: "missing" }) });
    expect(res.status).toBe(404);
    expect((res as any).body.error).toMatch(/not found/i);
  });

  it("enqueues job when scoring queue is available", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [fakeSubmission] });
    mockAdd.mockResolvedValue({ id: "job-42" });
    mockGetScoringQueue.mockReturnValue({ add: mockAdd });

    const { POST } = await import("@/app/api/submissions/[id]/score/route");
    const req = new Request("http://localhost/api/submissions/sub-1/score", { method: "POST" });
    const res = await POST(req, { params: Promise.resolve({ id: "sub-1" }) });

    expect(res.status).toBe(200);
    expect((res as any).body.queued).toBe(true);
    expect((res as any).body.jobId).toBe("job-42");
    expect(mockAdd).toHaveBeenCalledWith("score-submission", {
      submissionId: "sub-1",
      userId: fakeSubmission.trainee_id,
      exerciseTitle: fakeSubmission.exercise_title,
      exerciseId: fakeSubmission.exercise_id,
    });
  });

  it("falls back to inline scoring when queue is unavailable", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [fakeSubmission] });
    mockScoreSubmission.mockResolvedValue(fakeScore);

    const { POST } = await import("@/app/api/submissions/[id]/score/route");
    const req = new Request("http://localhost/api/submissions/sub-1/score", { method: "POST" });
    const res = await POST(req, { params: Promise.resolve({ id: "sub-1" }) });

    expect(res.status).toBe(200);
    expect((res as any).body.total_score).toBe(8);
    expect(mockScoreSubmission).toHaveBeenCalledWith("sub-1");
  });

  it("returns 500 when inline scoring throws", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [fakeSubmission] });
    mockScoreSubmission.mockRejectedValue(new Error("LLM API unreachable"));

    const { POST } = await import("@/app/api/submissions/[id]/score/route");
    const req = new Request("http://localhost/api/submissions/sub-1/score", { method: "POST" });
    const res = await POST(req, { params: Promise.resolve({ id: "sub-1" }) });

    expect(res.status).toBe(500);
    expect((res as any).body.error).toMatch(/LLM API unreachable/);
  });
});

// ── GET /api/submissions/:id/score ───────────────────────────────────────────
describe("GET /api/submissions/:id/score", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(mockSession, { userId: "user-1" });
  });

  it("returns 401 when unauthenticated", async () => {
    mockSession.userId = "";
    const { GET } = await import("@/app/api/submissions/[id]/score/route");
    const req = new Request("http://localhost/api/submissions/sub-1/score");
    const res = await GET(req, { params: Promise.resolve({ id: "sub-1" }) });
    expect(res.status).toBe(401);
  });

  it("returns pending:true when score not yet available", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const { GET } = await import("@/app/api/submissions/[id]/score/route");
    const req = new Request("http://localhost/api/submissions/sub-1/score");
    const res = await GET(req, { params: Promise.resolve({ id: "sub-1" }) });
    expect(res.status).toBe(200);
    expect((res as any).body.pending).toBe(true);
  });

  it("returns score when available", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [fakeScore] });
    const { GET } = await import("@/app/api/submissions/[id]/score/route");
    const req = new Request("http://localhost/api/submissions/sub-1/score");
    const res = await GET(req, { params: Promise.resolve({ id: "sub-1" }) });
    expect(res.status).toBe(200);
    expect((res as any).body.total_score).toBe(8);
    expect((res as any).body.max_score).toBe(10);
  });
});
