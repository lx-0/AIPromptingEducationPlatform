import { describe, it, expect, vi, beforeEach } from "vitest";

// ── DB mock ───────────────────────────────────────────────────────────────────
const mockQuery = vi.fn();

vi.mock("@/lib/db", () => ({
  default: { query: mockQuery },
}));

// ── Session mock ──────────────────────────────────────────────────────────────
const mockSession = {
  userId: "admin-1",
  email: "admin@test.com",
  role: "instructor",
  displayName: "Admin",
  isAdmin: true,
  save: vi.fn(),
};

vi.mock("@/lib/session", () => ({
  getSession: vi.fn().mockResolvedValue(mockSession),
  sessionOptions: { cookieName: "ps_session", password: "test" },
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

const fakeUser = {
  id: "user-1",
  email: "alice@test.com",
  display_name: "Alice",
  role: "trainee",
  is_admin: false,
  is_disabled: false,
  created_at: "2026-01-01T00:00:00Z",
  subscription_plan: null,
  subscription_status: null,
  workshop_count: 0,
  submission_count: 5,
};

// ── GET /api/admin/users ──────────────────────────────────────────────────────
describe("GET /api/admin/users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(mockSession, { userId: "admin-1", isAdmin: true });
  });

  it("returns 403 when not authenticated", async () => {
    mockSession.userId = "";
    const { GET } = await import("@/app/api/admin/users/route");
    const req = new Request("http://localhost/api/admin/users");
    const res = await GET(req) as any;
    expect(res.status).toBe(403);
  });

  it("returns 403 when authenticated but not admin", async () => {
    Object.assign(mockSession, { userId: "user-1", isAdmin: false });
    const { GET } = await import("@/app/api/admin/users/route");
    const req = new Request("http://localhost/api/admin/users");
    const res = await GET(req) as any;
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/forbidden/i);
  });

  it("returns users list and total on valid admin request", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [fakeUser] })
      .mockResolvedValueOnce({ rows: [{ total: 1 }] });

    const { GET } = await import("@/app/api/admin/users/route");
    const req = new Request("http://localhost/api/admin/users");
    const res = await GET(req) as any;

    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(1);
    expect(res.body.users[0].email).toBe("alice@test.com");
    expect(res.body.total).toBe(1);
  });

  it("passes search query to db when q param is provided", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ total: 0 }] });

    const { GET } = await import("@/app/api/admin/users/route");
    const req = new Request("http://localhost/api/admin/users?q=alice");
    await GET(req);

    const valuesArg: unknown[] = mockQuery.mock.calls[0][1];
    expect(valuesArg[0]).toBe("%alice%");
  });

  it("defaults to empty search when q is absent", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ total: 0 }] });

    const { GET } = await import("@/app/api/admin/users/route");
    const req = new Request("http://localhost/api/admin/users");
    await GET(req);

    const valuesArg: unknown[] = mockQuery.mock.calls[0][1];
    expect(valuesArg[0]).toBe("");
  });

  it("respects limit param up to 200 max", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ total: 0 }] });

    const { GET } = await import("@/app/api/admin/users/route");
    const req = new Request("http://localhost/api/admin/users?limit=999");
    await GET(req);

    const valuesArg: unknown[] = mockQuery.mock.calls[0][1];
    expect(valuesArg[1]).toBe(200); // capped at 200
  });

  it("uses offset param for pagination", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ total: 100 }] });

    const { GET } = await import("@/app/api/admin/users/route");
    const req = new Request("http://localhost/api/admin/users?offset=50");
    await GET(req);

    const valuesArg: unknown[] = mockQuery.mock.calls[0][1];
    expect(valuesArg[2]).toBe(50);
  });
});

// ── GET /api/admin/analytics ──────────────────────────────────────────────────
describe("GET /api/admin/analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(mockSession, { userId: "admin-1", isAdmin: true });
  });

  it("returns 403 when not admin", async () => {
    Object.assign(mockSession, { userId: "user-1", isAdmin: false });
    const { GET } = await import("@/app/api/admin/analytics/route");
    const res = await GET() as any;
    expect(res.status).toBe(403);
  });

  it("returns analytics data for admin user", async () => {
    const funnelRow = { signups: 100, enrolled: 80, submitted: 60, completed: 40 };
    const dauRows = [{ date: "2026-04-01", dau: 10 }];
    const wauRows = [{ week: "2026-03-31", wau: 50 }];
    const mauRows = [{ month: "2026-04-01", mau: 200 }];
    const revenueRows = [{ month: "2026-04-01", revenue: "1999" }];

    mockQuery
      .mockResolvedValueOnce({ rows: [funnelRow] })
      .mockResolvedValueOnce({ rows: dauRows })
      .mockResolvedValueOnce({ rows: wauRows })
      .mockResolvedValueOnce({ rows: mauRows })
      .mockResolvedValueOnce({ rows: revenueRows });

    const { GET } = await import("@/app/api/admin/analytics/route");
    const res = await GET() as any;

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("funnel");
    expect(res.body.funnel.signups).toBe(100);
    expect(res.body.funnel.enrolled).toBe(80);
  });
});
