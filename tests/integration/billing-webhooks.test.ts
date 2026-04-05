import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Billing mock ──────────────────────────────────────────────────────────────
const mockConstructEvent = vi.fn();
const mockUpsertSubscription = vi.fn();

vi.mock("@/lib/billing", () => ({
  getStripe: vi.fn(() => ({
    webhooks: { constructEvent: mockConstructEvent },
  })),
  upsertSubscription: mockUpsertSubscription,
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

function makeWebhookRequest(body: string, signature?: string): Request {
  return new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(signature ? { "stripe-signature": signature } : {}),
    },
    body,
  });
}

function fakeEvent(type: string, objectOverride: object = {}) {
  return {
    type,
    data: {
      object: {
        id: "sub_123",
        customer: "cus_123",
        status: "active",
        items: { data: [{ price: { metadata: { plan: "pro" } } }] },
        cancel_at_period_end: false,
        current_period_end: 1900000000,
        metadata: { userId: "user-1" },
        ...objectOverride,
      },
    },
  };
}

describe("POST /api/webhooks/stripe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  });

  it("returns 400 when stripe-signature header is missing", async () => {
    const { POST } = await import("@/app/api/webhooks/stripe/route");
    const res = await POST(makeWebhookRequest('{"type":"test"}'));
    expect(res.status).toBe(400);
    expect((res as any).body.error).toMatch(/stripe-signature/i);
  });

  it("returns 400 when signature verification fails", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("Signature verification failed");
    });
    const { POST } = await import("@/app/api/webhooks/stripe/route");
    const res = await POST(makeWebhookRequest('{"type":"test"}', "bad-sig"));
    expect(res.status).toBe(400);
    expect((res as any).body.error).toMatch(/signature/i);
  });

  it("calls upsertSubscription on customer.subscription.created", async () => {
    const event = fakeEvent("customer.subscription.created");
    mockConstructEvent.mockReturnValue(event);
    mockUpsertSubscription.mockResolvedValue(undefined);

    const { POST } = await import("@/app/api/webhooks/stripe/route");
    const res = await POST(makeWebhookRequest("{}", "valid-sig"));

    expect(res.status).toBe(200);
    expect((res as any).body.received).toBe(true);
    expect(mockUpsertSubscription).toHaveBeenCalledOnce();
    expect(mockUpsertSubscription).toHaveBeenCalledWith(event.data.object);
  });

  it("calls upsertSubscription on customer.subscription.updated", async () => {
    const event = fakeEvent("customer.subscription.updated", { status: "past_due" });
    mockConstructEvent.mockReturnValue(event);
    mockUpsertSubscription.mockResolvedValue(undefined);

    const { POST } = await import("@/app/api/webhooks/stripe/route");
    const res = await POST(makeWebhookRequest("{}", "valid-sig"));

    expect(res.status).toBe(200);
    expect(mockUpsertSubscription).toHaveBeenCalledOnce();
  });

  it("calls upsertSubscription on customer.subscription.deleted", async () => {
    const event = fakeEvent("customer.subscription.deleted", { status: "canceled" });
    mockConstructEvent.mockReturnValue(event);
    mockUpsertSubscription.mockResolvedValue(undefined);

    const { POST } = await import("@/app/api/webhooks/stripe/route");
    const res = await POST(makeWebhookRequest("{}", "valid-sig"));

    expect(res.status).toBe(200);
    expect(mockUpsertSubscription).toHaveBeenCalledOnce();
  });

  it("acknowledges but does not call upsertSubscription for unrecognized events", async () => {
    const event = fakeEvent("invoice.paid");
    mockConstructEvent.mockReturnValue(event);

    const { POST } = await import("@/app/api/webhooks/stripe/route");
    const res = await POST(makeWebhookRequest("{}", "valid-sig"));

    expect(res.status).toBe(200);
    expect((res as any).body.received).toBe(true);
    expect(mockUpsertSubscription).not.toHaveBeenCalled();
  });
});
