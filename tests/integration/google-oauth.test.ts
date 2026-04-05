import { describe, it, expect, vi, beforeEach } from "vitest";

// ── DB mock ───────────────────────────────────────────────────────────────────
const mockRelease = vi.fn();
const mockClientQuery = vi.fn();
const mockClient = { query: mockClientQuery, release: mockRelease };
const mockConnect = vi.fn();

vi.mock("@/lib/db", () => ({
  default: { connect: mockConnect },
}));

// ── Session mock ──────────────────────────────────────────────────────────────
const mockSession = {
  userId: "",
  email: "",
  role: "",
  displayName: "",
  isAdmin: false,
  pendingOAuth: undefined as unknown,
  save: vi.fn(),
};

vi.mock("@/lib/session", () => ({
  getSession: vi.fn().mockResolvedValue(mockSession),
  sessionOptions: { cookieName: "ps_session", password: "test" },
}));

// ── Email mock ────────────────────────────────────────────────────────────────
vi.mock("@/lib/email", () => ({
  sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
}));

// ── next/server mock ──────────────────────────────────────────────────────────
const mockCookiesDelete = vi.fn();
vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
    }),
    redirect: (url: URL | string) => ({
      redirectUrl: url.toString(),
      cookies: { delete: mockCookiesDelete },
    }),
  },
}));

// ── fetch mock ────────────────────────────────────────────────────────────────
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function makeCallbackRequest(params: Record<string, string>, pkceCookie = "oauth_pkce=test-verifier"): Request {
  const url = new URL("http://localhost/api/auth/google/callback");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new Request(url.toString(), {
    headers: { cookie: pkceCookie },
  });
}

const validState = Buffer.from(JSON.stringify({ next: "/dashboard" }), "utf8").toString("base64url");

const googleTokensResponse = { access_token: "gat_test", id_token: "gid_test" };
const googleUserInfo = { sub: "google-sub-1", email: "alice@test.com", name: "Alice", email_verified: true };

describe("GET /api/auth/google/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(mockSession, { userId: "", email: "", role: "", displayName: "", isAdmin: false, pendingOAuth: undefined });
    mockConnect.mockResolvedValue(mockClient);
    mockClientQuery.mockResolvedValue({ rows: [] });
    mockRelease.mockReturnValue(undefined);

    // Default: successful token + userinfo exchange
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(googleTokensResponse) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(googleUserInfo) });
  });

  it("redirects to sign-in when OAuth error param is present", async () => {
    const { GET } = await import("@/app/api/auth/google/callback/route");
    const req = makeCallbackRequest({ error: "access_denied" });
    const res = await GET(req) as any;
    expect(res.redirectUrl).toContain("error=access_denied");
    expect(res.redirectUrl).toContain("/auth/sign-in");
  });

  it("redirects to sign-in when code or state is missing", async () => {
    const { GET } = await import("@/app/api/auth/google/callback/route");
    const req = makeCallbackRequest({ state: validState }); // no code
    const res = await GET(req) as any;
    expect(res.redirectUrl).toContain("error=invalid_callback");
  });

  it("redirects to sign-in when PKCE cookie is missing", async () => {
    const { GET } = await import("@/app/api/auth/google/callback/route");
    const req = makeCallbackRequest({ code: "auth_code", state: validState }, ""); // no pkce cookie
    const res = await GET(req) as any;
    expect(res.redirectUrl).toContain("error=session_expired");
  });

  it("redirects to sign-in when token exchange fails", async () => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValueOnce({ ok: false });

    const { GET } = await import("@/app/api/auth/google/callback/route");
    const req = makeCallbackRequest({ code: "auth_code", state: validState });
    const res = await GET(req) as any;
    expect(res.redirectUrl).toContain("error=token_exchange_failed");
  });

  it("redirects to sign-in when userinfo fetch fails", async () => {
    mockFetch.mockReset();
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(googleTokensResponse) })
      .mockResolvedValueOnce({ ok: false });

    const { GET } = await import("@/app/api/auth/google/callback/route");
    const req = makeCallbackRequest({ code: "auth_code", state: validState });
    const res = await GET(req) as any;
    expect(res.redirectUrl).toContain("error=userinfo_failed");
  });

  it("redirects to sign-in when email is not verified", async () => {
    mockFetch.mockReset();
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(googleTokensResponse) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ ...googleUserInfo, email_verified: false }) });

    const { GET } = await import("@/app/api/auth/google/callback/route");
    const req = makeCallbackRequest({ code: "auth_code", state: validState });
    const res = await GET(req) as any;
    expect(res.redirectUrl).toContain("error=email_not_verified");
  });

  it("logs in returning OAuth user and redirects to dashboard", async () => {
    const existingUser = {
      id: "user-1",
      email: "alice@test.com",
      display_name: "Alice",
      role: "trainee",
      is_admin: false,
      is_disabled: false,
    };
    // First DB query: by OAuth provider ID → found
    mockClientQuery.mockResolvedValueOnce({ rows: [existingUser] });

    const { GET } = await import("@/app/api/auth/google/callback/route");
    const req = makeCallbackRequest({ code: "auth_code", state: validState });
    const res = await GET(req) as any;

    expect(res.redirectUrl).toContain("/dashboard");
    expect(mockSession.userId).toBe("user-1");
    expect(mockSession.save).toHaveBeenCalledTimes(1);
  });

  it("redirects disabled returning OAuth user to sign-in", async () => {
    const disabledUser = { id: "user-1", email: "alice@test.com", display_name: "Alice", role: "trainee", is_admin: false, is_disabled: true };
    mockClientQuery.mockResolvedValueOnce({ rows: [disabledUser] });

    const { GET } = await import("@/app/api/auth/google/callback/route");
    const req = makeCallbackRequest({ code: "auth_code", state: validState });
    const res = await GET(req) as any;
    expect(res.redirectUrl).toContain("error=account_disabled");
  });

  it("links Google to existing email/password account and redirects", async () => {
    const existingUser = { id: "user-2", email: "alice@test.com", display_name: "Alice", role: "trainee", is_admin: false, is_disabled: false };
    // First query (by oauth id): no rows
    mockClientQuery
      .mockResolvedValueOnce({ rows: [] })
      // Second query (by email): found
      .mockResolvedValueOnce({ rows: [existingUser] })
      // Third query: UPDATE to link oauth
      .mockResolvedValueOnce({ rows: [] });

    const { GET } = await import("@/app/api/auth/google/callback/route");
    const req = makeCallbackRequest({ code: "auth_code", state: validState });
    const res = await GET(req) as any;

    expect(res.redirectUrl).toContain("/dashboard");
    expect(mockSession.userId).toBe("user-2");
    expect(mockSession.save).toHaveBeenCalledTimes(1);
  });

  it("stores pendingOAuth in session for brand-new users and redirects to complete", async () => {
    // Both queries return no rows → new user
    mockClientQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const { GET } = await import("@/app/api/auth/google/callback/route");
    const req = makeCallbackRequest({ code: "auth_code", state: validState });
    const res = await GET(req) as any;

    expect(res.redirectUrl).toContain("/auth/google/complete");
    expect(mockSession.pendingOAuth).toMatchObject({
      googleId: googleUserInfo.sub,
      email: googleUserInfo.email.toLowerCase(),
    });
    expect(mockSession.save).toHaveBeenCalledTimes(1);
  });
});
