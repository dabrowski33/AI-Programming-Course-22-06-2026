// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock AI SDK streamText before importing route
vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>()
  return {
    ...actual,
    streamText: vi.fn(),
    convertToModelMessages: vi.fn().mockResolvedValue([]),
  }
})

vi.mock("@ai-sdk/anthropic", () => ({
  anthropic: vi.fn().mockReturnValue("mock-model"),
}))

import { streamText } from "ai"

const mockChatContext = {
  requestType: "reklamacja" as const,
  equipmentCategory: "Laptopy i komputery",
  equipmentModel: "Dell XPS 15",
  purchaseDate: "2025-01-01",
  complaintReason: "Pęknięty ekran",
  imageConditionSummary: "Device shows cracked screen.",
  decisionResult: "zaakceptowano",
  decisionJustification: "Uszkodzenie to wada produkcyjna zgodnie z RULE-C-04.",
  rulesApplied: ["RULE-C-01", "RULE-C-04"],
}

const mockMessages = [
  { role: "user", content: "Czy mogę uzyskać więcej informacji o tej decyzji?" },
]

async function callChatRoute(body: unknown): Promise<Response> {
  const { POST } = await import("../app/api/chat/route")
  const request = new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return POST(request)
}

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.resetModules()

    // Mock toUIMessageStreamResponse to return a streaming Response
    const mockStreamResponse = new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode(
              'data: {"type":"text-delta","textDelta":"Witaj"}\n\n',
            ),
          )
          controller.close()
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
        },
      },
    )

    vi.mocked(streamText).mockReturnValue({
      toUIMessageStreamResponse: vi.fn().mockReturnValue(mockStreamResponse),
    } as unknown as ReturnType<typeof streamText>)
  })

  it("returns 200 streaming response for valid request", async () => {
    const response = await callChatRoute({
      messages: mockMessages,
      context: mockChatContext,
    })

    expect(response.status).toBe(200)
  })

  it("sets Content-Type text/event-stream for valid request", async () => {
    const response = await callChatRoute({
      messages: mockMessages,
      context: mockChatContext,
    })

    expect(response.headers.get("Content-Type")).toContain("text/event-stream")
  })

  it("returns 400 for invalid context (missing required fields)", async () => {
    const response = await callChatRoute({
      messages: mockMessages,
      context: { requestType: "reklamacja" }, // missing required fields
    })

    expect(response.status).toBe(400)
  })

  it("returns 400 for non-JSON body", async () => {
    const { POST } = await import("../app/api/chat/route")
    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not valid json",
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it("returns 400 when messages is not an array", async () => {
    const response = await callChatRoute({
      messages: "not an array",
      context: mockChatContext,
    })

    expect(response.status).toBe(400)
  })

  it("calls streamText with correct model", async () => {
    await callChatRoute({
      messages: mockMessages,
      context: mockChatContext,
    })

    expect(vi.mocked(streamText)).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "mock-model",
      }),
    )
  })

  it("calls streamText with system prompt containing context data", async () => {
    await callChatRoute({
      messages: mockMessages,
      context: mockChatContext,
    })

    expect(vi.mocked(streamText)).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining("Dell XPS 15"),
      }),
    )
  })
})
