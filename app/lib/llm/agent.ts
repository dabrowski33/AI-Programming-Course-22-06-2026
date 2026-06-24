import { anthropic, type AnthropicLanguageModelOptions } from "@ai-sdk/anthropic"
import { generateObject } from "ai"
import {
  AgentDecisionSchema,
  type AgentDecision,
  type FormSubmission,
  type ImageAnalysisResult,
} from "@/lib/validation/types"
import { buildDecisionPrompt } from "./prompts"

export async function generateDecision(
  formData: FormSubmission,
  imageAnalysis: ImageAnalysisResult,
  procedureText: string,
): Promise<AgentDecision> {
  const prompt = buildDecisionPrompt(
    formData.requestType,
    formData,
    imageAnalysis,
    procedureText,
  )

  try {
    const result = await generateObject({
      model: anthropic("claude-sonnet-4-6"),
      schema: AgentDecisionSchema,
      prompt,
      providerOptions: {
        anthropic: {
          thinking: { type: "enabled", budgetTokens: 8000 },
        } satisfies AnthropicLanguageModelOptions,
      },
    })

    return result.object
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error("LLM_ERROR: " + message)
  }
}
