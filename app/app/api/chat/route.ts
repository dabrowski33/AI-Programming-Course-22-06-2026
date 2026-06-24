import { anthropic } from "@ai-sdk/anthropic"
import { streamText, convertToModelMessages, type UIMessage } from "ai"
import { NextResponse } from "next/server"
import { ChatContextSchema } from "@/lib/validation/types"
import { buildChatSystemPrompt } from "@/lib/llm/prompts"

export async function POST(request: Request): Promise<Response> {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "validation_error" }, { status: 400 })
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "validation_error" }, { status: 400 })
  }

  const { messages, context } = body as { messages?: unknown; context?: unknown }

  const contextParseResult = ChatContextSchema.safeParse(context)
  if (!contextParseResult.success) {
    return NextResponse.json({ error: "validation_error" }, { status: 400 })
  }

  if (!Array.isArray(messages)) {
    return NextResponse.json({ error: "validation_error" }, { status: 400 })
  }

  const systemPrompt = buildChatSystemPrompt(contextParseResult.data)

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: systemPrompt,
    messages: await convertToModelMessages(messages as UIMessage[]),
  })

  return result.toUIMessageStreamResponse()
}
