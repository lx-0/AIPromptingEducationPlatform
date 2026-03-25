import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock pg before importing db
vi.mock("pg", () => {
  const mockPool = {
    query: vi.fn(),
    connect: vi.fn(),
    end: vi.fn(),
  };
  return { Pool: vi.fn(function () { return mockPool; }) };
});

describe("lib/db", () => {
  it("creates a Pool with DATABASE_URL", async () => {
    const { Pool } = await import("pg");
    await import("@/lib/db");
    expect(Pool).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionString: process.env.DATABASE_URL,
      })
    );
  });

  it("exports a pool instance", async () => {
    const { default: pool } = await import("@/lib/db");
    expect(pool).toBeDefined();
    expect(typeof pool.query).toBe("function");
  });
});
