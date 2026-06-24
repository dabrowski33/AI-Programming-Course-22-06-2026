import { NextResponse } from "next/server"
import { FormSubmissionSchema } from "@/lib/validation/types"
import { compressImage } from "@/lib/compression/image"
import { analyseImage } from "@/lib/llm/multimodal"
import { generateDecision } from "@/lib/llm/agent"
import { getProcedureText } from "@/lib/procedures/loader"

const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])
const MAX_IMAGE_SIZE = 10_485_760 // 10 MB

export async function POST(request: Request): Promise<NextResponse> {
  let formData: FormData

  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }

  // Validate form fields
  const fields = {
    requestType: formData.get("requestType"),
    equipmentCategory: formData.get("equipmentCategory"),
    equipmentModel: formData.get("equipmentModel"),
    purchaseDate: formData.get("purchaseDate"),
    complaintReason: formData.get("complaintReason") ?? undefined,
  }

  const parseResult = FormSubmissionSchema.safeParse(fields)
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "validation_error", details: parseResult.error.issues },
      { status: 400 },
    )
  }

  const parsedForm = parseResult.data

  // Validate image
  const imageFile = formData.get("image")
  if (!imageFile || !(imageFile instanceof File)) {
    return NextResponse.json(
      { error: "invalid_image", reason: "Nie przesłano pliku zdjęcia." },
      { status: 400 },
    )
  }

  if (!ACCEPTED_IMAGE_TYPES.has(imageFile.type)) {
    return NextResponse.json(
      {
        error: "invalid_image",
        reason: `Niedozwolony format pliku: ${imageFile.type}. Akceptowane formaty: JPG, PNG, WebP.`,
      },
      { status: 400 },
    )
  }

  if (imageFile.size > MAX_IMAGE_SIZE) {
    return NextResponse.json(
      {
        error: "invalid_image",
        reason: "Plik przekracza maksymalny rozmiar 10 MB.",
      },
      { status: 400 },
    )
  }

  try {
    const imageArrayBuffer = await imageFile.arrayBuffer()
    const imageBuffer = Buffer.from(imageArrayBuffer)

    // Compress image
    const compressedBuffer = await compressImage(imageBuffer, imageFile.type)

    // Analyse image with multimodal LLM
    const imageAnalysis = await analyseImage(compressedBuffer, parsedForm.requestType)

    if (imageAnalysis.status === "unreadable") {
      return NextResponse.json(
        {
          error: "unreadable_image",
          reason: imageAnalysis.unreadableReason ?? "Zdjęcie jest nieczytelne.",
        },
        { status: 422 },
      )
    }

    // Load procedure text
    const procedureText = getProcedureText(parsedForm.requestType)

    // Generate decision with thinking agent
    const decision = await generateDecision(parsedForm, imageAnalysis, procedureText)

    return NextResponse.json({ imageAnalysis, decision }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    if (message.startsWith("LLM_ERROR:")) {
      return NextResponse.json({ error: "service_unavailable" }, { status: 503 })
    }

    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}
