import { anthropic } from "@ai-sdk/anthropic"
import { generateObject } from "ai"
import { ImageAnalysisResultSchema, type ImageAnalysisResult } from "@/lib/validation/types"
import { buildImageAnalysisPrompt } from "./prompts"

export async function analyseImage(
  imageBuffer: Buffer,
  requestType: "reklamacja" | "zwrot",
): Promise<ImageAnalysisResult> {
  const prompt = buildImageAnalysisPrompt(requestType)
  const base64Image = imageBuffer.toString("base64")

  try {
    const result = await generateObject({
      model: anthropic("claude-sonnet-4-6"),
      schema: ImageAnalysisResultSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              image: base64Image,
              mediaType: "image/jpeg",
            },
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
    })

    return result.object
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error("LLM_ERROR: " + message)
  }
}
