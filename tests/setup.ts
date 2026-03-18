import { vi } from "vitest";

// Mock environment variables
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.SESSION_SECRET = "test-secret-that-is-at-least-32-chars-long!!";
process.env.ANTHROPIC_API_KEY = "test-api-key";
process.env.NODE_ENV = "test";

// Mock next/headers globally
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}));
