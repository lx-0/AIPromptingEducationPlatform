import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSave = vi.fn();
const mockSession = {
  userId: "",
  email: "",
  role: "",
  displayName: "",
  save: mockSave,
};

vi.mock("iron-session", () => ({
  getIronSession: vi.fn().mockResolvedValue(mockSession),
}));

describe("lib/session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(mockSession, { userId: "", email: "", role: "", displayName: "" });
  });

  it("exports sessionOptions with correct cookie name", async () => {
    const { sessionOptions } = await import("@/lib/session");
    expect(sessionOptions.cookieName).toBe("ps_session");
  });

  it("sessionOptions password comes from SESSION_SECRET env var", async () => {
    const { sessionOptions } = await import("@/lib/session");
    expect(sessionOptions.password).toBe(process.env.SESSION_SECRET);
  });

  it("getSession returns iron session", async () => {
    const { getSession } = await import("@/lib/session");
    const session = await getSession();
    expect(session).toBeDefined();
    expect(typeof session.save).toBe("function");
  });

  it("getSession session can be populated and saved", async () => {
    const { getSession } = await import("@/lib/session");
    const session = await getSession();
    session.userId = "user-123";
    session.email = "test@example.com";
    session.role = "trainee";
    session.displayName = "Test User";
    await session.save();
    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockSession.userId).toBe("user-123");
    expect(mockSession.email).toBe("test@example.com");
  });
});
