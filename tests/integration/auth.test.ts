import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

// ── DB mock ──────────────────────────────────────────────────────────────────
const mockQuery = vi.fn();
const mockConnect = vi.fn();
const mockRelease = vi.fn();
const mockClient = { query: vi.fn(), release: mockRelease };

vi.mock("@/lib/db", () => ({
  default: {
    query: mockQuery,
    connect: mockConnect,
  },
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

// ── bcryptjs mock ─────────────────────────────────────────────────────────────
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed_password"),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

// ── next/server mock ─────────────────────────────────────────────────────────
vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
    }),
  },
}));

function makeRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/auth/sign-up", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Origin": "http://localhost:3000" },
    body: JSON.stringify(body),
  });
}

// ── Sign-up tests ─────────────────────────────────────────────────────────────
describe("POST /api/auth/sign-up", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(mockSession, { userId: "", email: "", role: "", displayName: "" });
    mockConnect.mockResolvedValue(mockClient);
    mockClient.query.mockResolvedValue({ rows: [] });
  });

  it("returns 400 when required fields are missing", async () => {
    const { POST } = await import("@/app/api/auth/sign-up/route");
    const res = await POST(makeRequest({ email: "a@b.com" }));
    expect(res.status).toBe(400);
    expect((res as any).body.error).toMatch(/invalid input|required|expected string/i);
  });

  it("returns 400 for invalid role", async () => {
    const { POST } = await import("@/app/api/auth/sign-up/route");
    const res = await POST(
      makeRequest({ email: "a@b.com", password: "password123", displayName: "Alice", role: "admin" })
    );
    expect(res.status).toBe(400);
    expect((res as any).body.error).toMatch(/invalid|role|instructor|trainee/i);
  });

  it("returns 400 when password is too short", async () => {
    const { POST } = await import("@/app/api/auth/sign-up/route");
    const res = await POST(
      makeRequest({ email: "a@b.com", password: "short", displayName: "Alice", role: "trainee" })
    );
    expect(res.status).toBe(400);
    expect((res as any).body.error).toMatch(/8 characters/i);
  });

  it("returns 409 when email is already registered", async () => {
    mockClient.query.mockResolvedValueOnce({ rows: [{ id: "existing-user" }] });
    const { POST } = await import("@/app/api/auth/sign-up/route");
    const res = await POST(
      makeRequest({ email: "exists@b.com", password: "password123", displayName: "Bob", role: "trainee" })
    );
    expect(res.status).toBe(409);
  });

  it("creates user and returns 201 on valid sign-up", async () => {
    const fakeUser = { id: "user-1", email: "new@b.com", display_name: "Alice", role: "trainee" };
    mockClient.query
      .mockResolvedValueOnce({ rows: [] })           // no existing user
      .mockResolvedValueOnce({ rows: [fakeUser] });  // INSERT result

    const { POST } = await import("@/app/api/auth/sign-up/route");
    const res = await POST(
      makeRequest({ email: "new@b.com", password: "password123", displayName: "Alice", role: "trainee" })
    );
    expect(res.status).toBe(201);
    expect((res as any).body.ok).toBe(true);
    expect(mockSession.save).toHaveBeenCalledTimes(1);
    expect(mockSession.userId).toBe("user-1");
  });
});

// ── Sign-in tests ─────────────────────────────────────────────────────────────
describe("POST /api/auth/sign-in", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(mockSession, { userId: "", email: "", role: "", displayName: "" });
  });

  it("returns 400 when credentials are missing", async () => {
    const { POST } = await import("@/app/api/auth/sign-in/route");
    const req = new Request("http://localhost/api/auth/sign-in", {
      method: "POST",
      headers: { "Origin": "http://localhost:3000" },
      body: JSON.stringify({ email: "a@b.com" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 401 for unknown email", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const { POST } = await import("@/app/api/auth/sign-in/route");
    const req = new Request("http://localhost/api/auth/sign-in", {
      method: "POST",
      headers: { "Origin": "http://localhost:3000" },
      body: JSON.stringify({ email: "no@b.com", password: "wrongpass" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 401 when password is wrong", async () => {
    const bcrypt = await import("bcryptjs");
    vi.mocked(bcrypt.default.compare).mockResolvedValueOnce(false as never);
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: "u1", email: "a@b.com", password_hash: "hash", display_name: "Alice", role: "trainee" }],
    });
    const { POST } = await import("@/app/api/auth/sign-in/route");
    const req = new Request("http://localhost/api/auth/sign-in", {
      method: "POST",
      headers: { "Origin": "http://localhost:3000" },
      body: JSON.stringify({ email: "a@b.com", password: "wrongpass" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("signs in successfully with valid credentials", async () => {
    const bcrypt = await import("bcryptjs");
    vi.mocked(bcrypt.default.compare).mockResolvedValueOnce(true as never);
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: "u1", email: "a@b.com", password_hash: "hash", display_name: "Alice", role: "trainee" }],
    });
    const { POST } = await import("@/app/api/auth/sign-in/route");
    const req = new Request("http://localhost/api/auth/sign-in", {
      method: "POST",
      headers: { "Origin": "http://localhost:3000" },
      body: JSON.stringify({ email: "a@b.com", password: "password123" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect((res as any).body.ok).toBe(true);
    expect(mockSession.save).toHaveBeenCalledTimes(1);
  });
});
