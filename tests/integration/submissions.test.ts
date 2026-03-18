import { describe, it, expect, vi, beforeEach } from "vitest";

// ── DB mock ──────────────────────────────────────────────────────────────────
const mockQuery = vi.fn();

vi.mock("@/lib/db", () => ({
  default: { query: mockQuery },
}));

// ── Session mock ──────────────────────────────────────────────────────────────
const mockSession = {
  userId: "",
  email: "",
  role: "",
  displayName: "",
  save: vi.fn(),
};

vi.mock("@/lib/session", () => ({
  getSession: vi.fn().mockResolvedValue(mockSession),
  sessionOptions: { cookieName: "ps_session", password: "test" },
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
    }),
  },
}));

// ── POST /api/submissions ─────────────────────────────────────────────────────
describe("POST /api/submissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(mockSession, { userId: "", role: "" });
  });

  it("returns 401 when not authenticated", async () => {
    const { POST } = await import("@/app/api/submissions/route");
    const req = new Request("http://localhost/api/submissions", {
      method: "POST",
      body: JSON.stringify({ exercise_id: "ex-1", prompt_text: "hello" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when exercise_id or prompt_text is missing", async () => {
    Object.assign(mockSession, { userId: "u1", role: "trainee" });
    const { POST } = await import("@/app/api/submissions/route");
    const req = new Request("http://localhost/api/submissions", {
      method: "POST",
      body: JSON.stringify({ exercise_id: "ex-1" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((res as any).body.error).toMatch(/required/i);
  });

  it("returns 404 when exercise does not exist", async () => {
    Object.assign(mockSession, { userId: "u1", role: "trainee" });
    mockQuery.mockResolvedValueOnce({ rows: [] }); // exercise lookup returns nothing

    const { POST } = await import("@/app/api/submissions/route");
    const req = new Request("http://localhost/api/submissions", {
      method: "POST",
      body: JSON.stringify({ exercise_id: "missing-ex", prompt_text: "my prompt" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it("creates submission and returns 201 when exercise exists", async () => {
    Object.assign(mockSession, { userId: "u1", role: "trainee" });
    const fakeSubmission = {
      id: "sub-1",
      exercise_id: "ex-1",
      trainee_id: "u1",
      prompt_text: "my prompt",
    };
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: "ex-1" }] })    // exercise lookup
      .mockResolvedValueOnce({ rows: [fakeSubmission] });   // INSERT

    const { POST } = await import("@/app/api/submissions/route");
    const req = new Request("http://localhost/api/submissions", {
      method: "POST",
      body: JSON.stringify({ exercise_id: "ex-1", prompt_text: "my prompt" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect((res as any).body.id).toBe("sub-1");
  });
});
