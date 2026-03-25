import { describe, it, expect, vi, beforeEach } from "vitest";

const mockQuery = vi.fn();

vi.mock("@/lib/db", () => ({
  default: { query: mockQuery },
}));

const mockCreate = vi.fn();

vi.mock("@anthropic-ai/sdk", () => ({
  default: vi.fn(function () { return { messages: { create: mockCreate } }; }),
}));

vi.mock("openai", () => ({
  default: vi.fn(function () { return { chat: { completions: { create: vi.fn() } } }; }),
}));

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: vi.fn(function () { return { getGenerativeModel: vi.fn() }; }),
}));

describe("lib/scorer – scoreSubmission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when submission not found", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const { scoreSubmission } = await import("@/lib/scorer");
    await expect(scoreSubmission("missing-id")).rejects.toThrow(
      "Submission not found"
    );
  });

  it("returns a default score when rubric is empty", async () => {
    const fakeScore = {
      id: "score-1",
      submission_id: "sub-1",
      total_score: 1,
      max_score: 1,
      feedback: { criteria: [], overall: "No rubric defined." },
      scored_at: new Date().toISOString(),
    };

    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            id: "sub-1",
            prompt_text: "Hello",
            llm_response: "World",
            instructions: "Write a prompt",
            rubric: [],
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [fakeScore] });

    const { scoreSubmission } = await import("@/lib/scorer");
    const result = await scoreSubmission("sub-1");
    expect(result.total_score).toBe(1);
    expect(result.max_score).toBe(1);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("calls Anthropic and persists score when rubric is defined", async () => {
    const rubric = [{ criterion: "Clarity", max_points: 5 }];
    const judgeResponse = {
      criteria: [{ criterion: "Clarity", score: 4, comment: "Good" }],
      overall: "Nice prompt.",
    };
    const fakeScore = {
      id: "score-2",
      submission_id: "sub-2",
      total_score: 4,
      max_score: 5,
      feedback: judgeResponse,
      scored_at: new Date().toISOString(),
    };

    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            id: "sub-2",
            prompt_text: "My prompt",
            llm_response: "Some response",
            instructions: "Do X",
            rubric,
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [fakeScore] });

    mockCreate.mockResolvedValueOnce({
      content: [{ type: "text", text: JSON.stringify(judgeResponse) }],
    });

    const { scoreSubmission } = await import("@/lib/scorer");
    const result = await scoreSubmission("sub-2");

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(result.total_score).toBe(4);
    expect(result.max_score).toBe(5);
    expect(result.feedback.overall).toBe("Nice prompt.");
  });

  it("handles JSON wrapped in markdown code fences", async () => {
    const rubric = [{ criterion: "Accuracy", max_points: 3 }];
    const judgeResponse = {
      criteria: [{ criterion: "Accuracy", score: 2, comment: "OK" }],
      overall: "Decent.",
    };
    const fakeScore = {
      id: "score-3",
      submission_id: "sub-3",
      total_score: 2,
      max_score: 3,
      feedback: judgeResponse,
      scored_at: new Date().toISOString(),
    };

    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            id: "sub-3",
            prompt_text: "Prompt",
            llm_response: "Resp",
            instructions: "Do Y",
            rubric,
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [fakeScore] });

    // Simulate AI wrapping JSON in markdown
    const markdownWrapped = "```json\n" + JSON.stringify(judgeResponse) + "\n```";
    mockCreate.mockResolvedValueOnce({
      content: [{ type: "text", text: markdownWrapped }],
    });

    const { scoreSubmission } = await import("@/lib/scorer");
    const result = await scoreSubmission("sub-3");
    expect(result.total_score).toBe(2);
  });
});
