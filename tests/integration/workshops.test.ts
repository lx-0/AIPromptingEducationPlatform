import { describe, it, expect, vi, beforeEach } from "vitest";

// ── DB mock ──────────────────────────────────────────────────────────────────
const mockQuery = vi.fn();

vi.mock("@/lib/db", () => ({
  default: { query: mockQuery },
}));

// ── Billing mock ──────────────────────────────────────────────────────────────
const mockIsPaidSubscriber = vi.fn().mockResolvedValue(true);

vi.mock("@/lib/billing", () => ({
  isPaidSubscriber: (...args: unknown[]) => mockIsPaidSubscriber(...args),
  FREE_TIER_LIMITS: { maxWorkshops: 3, maxExercisesPerWorkshop: 5 },
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

// ── GET /api/workshops ────────────────────────────────────────────────────────
describe("GET /api/workshops", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(mockSession, { userId: "", role: "" });
  });

  it("returns 401 when not authenticated", async () => {
    const { GET } = await import("@/app/api/workshops/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns workshop list when authenticated", async () => {
    Object.assign(mockSession, { userId: "u1", role: "trainee" });
    const fakeWorkshops = [
      { id: "w1", title: "Intro to Prompting", published: true },
    ];
    mockQuery.mockResolvedValueOnce({ rows: fakeWorkshops });

    const { GET } = await import("@/app/api/workshops/route");
    const res = await GET();
    expect(res.status).toBe(200);
    expect((res as any).body).toEqual(fakeWorkshops);
  });
});

// ── POST /api/workshops ───────────────────────────────────────────────────────
describe("POST /api/workshops", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPaidSubscriber.mockResolvedValue(true);
    Object.assign(mockSession, { userId: "", role: "" });
  });

  it("returns 401 when not authenticated", async () => {
    const { POST } = await import("@/app/api/workshops/route");
    const req = new Request("http://localhost/api/workshops", {
      method: "POST",
      body: JSON.stringify({ title: "New Workshop" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 403 when authenticated as trainee", async () => {
    Object.assign(mockSession, { userId: "u1", role: "trainee" });
    const { POST } = await import("@/app/api/workshops/route");
    const req = new Request("http://localhost/api/workshops", {
      method: "POST",
      body: JSON.stringify({ title: "New Workshop" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("returns 400 when title is missing", async () => {
    Object.assign(mockSession, { userId: "u1", role: "instructor" });
    const { POST } = await import("@/app/api/workshops/route");
    const req = new Request("http://localhost/api/workshops", {
      method: "POST",
      body: JSON.stringify({ description: "No title here" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((res as any).body.error).toMatch(/title/i);
  });

  it("creates workshop and returns 201 for instructor", async () => {
    Object.assign(mockSession, { userId: "u1", role: "instructor" });
    const fakeWorkshop = { id: "w1", title: "New Workshop", instructor_id: "u1" };
    mockQuery.mockResolvedValueOnce({ rows: [fakeWorkshop] });

    const { POST } = await import("@/app/api/workshops/route");
    const req = new Request("http://localhost/api/workshops", {
      method: "POST",
      body: JSON.stringify({ title: "New Workshop", description: "A workshop" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect((res as any).body.id).toBe("w1");
  });
});
