// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock all external dependencies before importing the route
vi.mock("../lib/compression/image", () => ({
  compressImage: vi.fn(),
}))

vi.mock("../lib/llm/multimodal", () => ({
  analyseImage: vi.fn(),
}))

vi.mock("../lib/llm/agent", () => ({
  generateDecision: vi.fn(),
}))

vi.mock("../lib/procedures/loader", () => ({
  getProcedureText: vi.fn(),
}))

import { compressImage } from "../lib/compression/image"
import { analyseImage } from "../lib/llm/multimodal"
import { generateDecision } from "../lib/llm/agent"
import { getProcedureText } from "../lib/procedures/loader"
import type { ImageAnalysisResult, AgentDecision } from "../lib/validation/types"

const mockImageAnalysisOk: ImageAnalysisResult = {
  status: "ok",
  conditionSummary: "Device shows cracked screen.",
  damagePresent: true,
  damageType: "cracked screen",
  likelyCause: "manufacturing_defect",
  signsOfUse: null,
  resalable: null,
  unreadableReason: null,
}

const mockImageAnalysisUnreadable: ImageAnalysisResult = {
  status: "unreadable",
  conditionSummary: "",
  damagePresent: false,
  damageType: null,
  likelyCause: null,
  signsOfUse: null,
  resalable: null,
  unreadableReason: "Image is too dark to assess equipment condition.",
}

const mockDecision: AgentDecision = {
  decision: "zaakceptowano",
  justification:
    "Zgodnie z RULE-C-04 uszkodzenie klasyfikuje się jako wada produkcyjna. Sprzęt jest w okresie gwarancji (RULE-C-01).",
  rulesApplied: ["RULE-C-01", "RULE-C-04"],
  nextSteps: ["Przyjąć sprzęt do serwisu.", "Wystawić potwierdzenie przyjęcia reklamacji."],
  disclaimer:
    "Decyzja została wygenerowana automatycznie przez system AI. Pracownik jest odpowiedzialny za ostateczną weryfikację przed przekazaniem informacji klientowi.",
}

function createValidFormData(overrides: Record<string, string> = {}): FormData {
  const form = new FormData()
  form.set("requestType", overrides.requestType ?? "reklamacja")
  form.set("equipmentCategory", overrides.equipmentCategory ?? "Laptopy i komputery")
  form.set("equipmentModel", overrides.equipmentModel ?? "Dell XPS 15")
  form.set("purchaseDate", overrides.purchaseDate ?? "2025-01-01")
  if (overrides.complaintReason !== undefined) {
    form.set("complaintReason", overrides.complaintReason)
  } else {
    form.set("complaintReason", "Pęknięty ekran po lewej stronie.")
  }
  return form
}

function addImageToForm(
  form: FormData,
  options: { type?: string; sizeBytes?: number } = {},
): void {
  const type = options.type ?? "image/jpeg"
  const size = options.sizeBytes ?? 1024
  const buffer = new Uint8Array(size).fill(0xff)
  const file = new File([buffer], "test.jpg", { type })
  form.set("image", file)
}

async function callRoute(formData: FormData): Promise<Response> {
  const { POST } = await import("../app/api/analyse/route")
  const request = new Request("http://localhost/api/analyse", {
    method: "POST",
    body: formData,
  })
  return POST(request)
}

describe("POST /api/analyse", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.mocked(compressImage).mockResolvedValue(Buffer.alloc(512))
    vi.mocked(analyseImage).mockResolvedValue(mockImageAnalysisOk)
    vi.mocked(generateDecision).mockResolvedValue(mockDecision)
    vi.mocked(getProcedureText).mockReturnValue("# Complaint Procedure\nRULE-C-01 ...")
  })

  it("returns 200 with imageAnalysis and decision on happy path", async () => {
    const form = createValidFormData()
    addImageToForm(form)

    const response = await callRoute(form)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toHaveProperty("imageAnalysis")
    expect(body).toHaveProperty("decision")
    expect(body.decision.decision).toBe("zaakceptowano")
  })

  it("returns 422 when image is unreadable", async () => {
    vi.mocked(analyseImage).mockResolvedValue(mockImageAnalysisUnreadable)

    const form = createValidFormData()
    addImageToForm(form)

    const response = await callRoute(form)
    const body = await response.json()

    expect(response.status).toBe(422)
    expect(body.error).toBe("unreadable_image")
    expect(body.reason).toBeTruthy()
  })

  it("returns 503 when LLM throws an error", async () => {
    vi.mocked(analyseImage).mockRejectedValue(
      new Error("LLM_ERROR: Anthropic API timeout"),
    )

    const form = createValidFormData()
    addImageToForm(form)

    const response = await callRoute(form)
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body.error).toBe("service_unavailable")
  })

  it("returns 400 validation error for missing required fields", async () => {
    const form = new FormData()
    // Only set requestType, missing all other required fields
    form.set("requestType", "reklamacja")
    addImageToForm(form)

    const response = await callRoute(form)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe("validation_error")
  })

  it("returns 400 for missing complaintReason when requestType is reklamacja", async () => {
    const form = createValidFormData({ complaintReason: "" })
    // Override to remove complaint reason
    form.delete("complaintReason")
    addImageToForm(form)

    const response = await callRoute(form)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe("validation_error")
  })

  it("returns 400 for invalid image type", async () => {
    const form = createValidFormData()
    addImageToForm(form, { type: "application/pdf" })

    const response = await callRoute(form)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe("invalid_image")
  })

  it("returns 400 for image exceeding 10MB", async () => {
    const form = createValidFormData()
    addImageToForm(form, { type: "image/jpeg", sizeBytes: 10_485_761 })

    const response = await callRoute(form)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe("invalid_image")
  })

  it("returns 400 for future purchase date", async () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const form = createValidFormData({
      purchaseDate: tomorrow.toISOString().split("T")[0],
    })
    addImageToForm(form)

    const response = await callRoute(form)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe("validation_error")
  })

  it("returns 503 when generateDecision throws LLM error", async () => {
    vi.mocked(generateDecision).mockRejectedValue(
      new Error("LLM_ERROR: Network error"),
    )

    const form = createValidFormData()
    addImageToForm(form)

    const response = await callRoute(form)
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body.error).toBe("service_unavailable")
  })
})
