import { describe, it, expect, vi, beforeEach } from "vitest";

// ── DB mock ───────────────────────────────────────────────────────────────────
const mockQuery = vi.fn();

vi.mock("@/lib/db", () => ({
  default: { query: mockQuery },
}));

// ── next/server mock ──────────────────────────────────────────────────────────
vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number; headers?: Record<string, string> }) => ({
      body,
      status: init?.status ?? 200,
      headers: init?.headers ?? {},
    }),
  },
}));

const fakeWorkshop = {
  id: "ws-1",
  title: "Prompting 101",
  description: "Learn prompting",
  created_at: "2026-01-01T00:00:00Z",
  is_featured: false,
  trending_score: 0.8,
  category_id: "cat-1",
  category_name: "Beginner",
  category_slug: "beginner",
  category_icon: "🌱",
  instructor_id: "user-1",
  instructor_name: "Bob",
  instructor_avatar: null,
  avg_rating: "4.50",
  review_count: 10,
  enrollment_count: 50,
  exercise_count: 5,
  tags: ["ai", "prompting"],
  difficulty: "beginner",
};

describe("GET /api/marketplace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns workshops and pagination on basic request", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [fakeWorkshop] })
      .mockResolvedValueOnce({ rows: [{ count: "1" }] });

    const { GET } = await import("@/app/api/marketplace/route");
    const req = new Request("http://localhost/api/marketplace");
    const res = await GET(req) as any;

    expect(res.status).toBe(200);
    expect(res.body.workshops).toHaveLength(1);
    expect(res.body.workshops[0].title).toBe("Prompting 101");
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.pagination.limit).toBe(20);
  });

  it("includes Cache-Control header on successful response", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ count: "0" }] });

    const { GET } = await import("@/app/api/marketplace/route");
    const req = new Request("http://localhost/api/marketplace");
    const res = await GET(req) as any;

    expect(res.headers["Cache-Control"]).toMatch(/max-age/);
  });

  it("passes search query to db call", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ count: "0" }] });

    const { GET } = await import("@/app/api/marketplace/route");
    const req = new Request("http://localhost/api/marketplace?q=prompting");
    await GET(req);

    const sqlArg: string = mockQuery.mock.calls[0][0];
    const valuesArg: unknown[] = mockQuery.mock.calls[0][1];
    expect(sqlArg).toMatch(/ILIKE/);
    expect(valuesArg).toContain("%prompting%");
  });

  it("filters by category when category param is provided", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ count: "0" }] });

    const { GET } = await import("@/app/api/marketplace/route");
    const req = new Request("http://localhost/api/marketplace?category=beginner");
    await GET(req);

    const sqlArg: string = mockQuery.mock.calls[0][0];
    const valuesArg: unknown[] = mockQuery.mock.calls[0][1];
    expect(sqlArg).toMatch(/wc\.slug/);
    expect(valuesArg).toContain("beginner");
  });

  it("filters by difficulty when difficulty param is provided", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ count: "0" }] });

    const { GET } = await import("@/app/api/marketplace/route");
    const req = new Request("http://localhost/api/marketplace?difficulty=intermediate");
    await GET(req);

    const sqlArg: string = mockQuery.mock.calls[0][0];
    expect(sqlArg).toMatch(/e\.difficulty/);
  });

  it("sorts by newest when sort=newest", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ count: "0" }] });

    const { GET } = await import("@/app/api/marketplace/route");
    const req = new Request("http://localhost/api/marketplace?sort=newest");
    await GET(req);

    const sqlArg: string = mockQuery.mock.calls[0][0];
    expect(sqlArg).toMatch(/w\.created_at DESC/);
  });

  it("sorts by popularity when sort=popularity", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ count: "0" }] });

    const { GET } = await import("@/app/api/marketplace/route");
    const req = new Request("http://localhost/api/marketplace?sort=popularity");
    await GET(req);

    const sqlArg: string = mockQuery.mock.calls[0][0];
    expect(sqlArg).toMatch(/enrollment_count DESC/);
  });

  it("falls back to trending sort for unknown sort value", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ count: "0" }] });

    const { GET } = await import("@/app/api/marketplace/route");
    const req = new Request("http://localhost/api/marketplace?sort=unknown");
    await GET(req);

    const sqlArg: string = mockQuery.mock.calls[0][0];
    expect(sqlArg).toMatch(/trending_score DESC/);
  });

  it("calculates correct offset for page 2", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ count: "25" }] });

    const { GET } = await import("@/app/api/marketplace/route");
    const req = new Request("http://localhost/api/marketplace?page=2");
    const res = await GET(req) as any;

    const valuesArg: unknown[] = mockQuery.mock.calls[0][1];
    // offset should be 20 (page 2)
    expect(valuesArg).toContain(20);
    expect(res.body.pagination.page).toBe(2);
  });

  it("returns empty workshops array when no results", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ count: "0" }] });

    const { GET } = await import("@/app/api/marketplace/route");
    const req = new Request("http://localhost/api/marketplace");
    const res = await GET(req) as any;

    expect(res.body.workshops).toEqual([]);
    expect(res.body.pagination.total).toBe(0);
    expect(res.body.pagination.totalPages).toBe(0);
  });
});
