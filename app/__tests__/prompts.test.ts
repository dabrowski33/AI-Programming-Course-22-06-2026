// @vitest-environment node
import { describe, it, expect } from "vitest"
import {
  buildImageAnalysisPrompt,
  buildDecisionPrompt,
  buildChatSystemPrompt,
} from "../lib/llm/prompts"
import type { FormSubmission, ImageAnalysisResult, ChatContext } from "../lib/validation/types"

const mockComplaintForm: FormSubmission = {
  requestType: "reklamacja",
  equipmentCategory: "Laptopy i komputery",
  equipmentModel: "Dell XPS 15",
  purchaseDate: new Date("2024-01-15"),
  complaintReason: "Ekran jest pęknięty po lewej stronie.",
}

const mockReturnForm: FormSubmission = {
  requestType: "zwrot",
  equipmentCategory: "Smartfony i telefony",
  equipmentModel: "Samsung Galaxy S23",
  purchaseDate: new Date("2026-06-01"),
  complaintReason: undefined,
}

const mockComplaintImageAnalysis: ImageAnalysisResult = {
  status: "ok",
  conditionSummary: "Device shows visible crack on lower-left corner of the screen.",
  damagePresent: true,
  damageType: "cracked screen",
  likelyCause: "user_damage",
  signsOfUse: null,
  resalable: null,
  unreadableReason: null,
}

const mockReturnImageAnalysis: ImageAnalysisResult = {
  status: "ok",
  conditionSummary: "Device appears in like-new condition with no visible damage.",
  damagePresent: false,
  damageType: null,
  likelyCause: null,
  signsOfUse: false,
  resalable: true,
  unreadableReason: null,
}

const mockChatContext: ChatContext = {
  requestType: "reklamacja",
  equipmentCategory: "Laptopy i komputery",
  equipmentModel: "Dell XPS 15",
  purchaseDate: "2024-01-15",
  complaintReason: "Pęknięty ekran",
  imageConditionSummary: "Device shows visible crack on lower-left corner.",
  decisionResult: "zaakceptowano",
  decisionJustification: "Uszkodzenie jest wadą produkcyjną zgodnie z RULE-C-04.",
  rulesApplied: ["RULE-C-01", "RULE-C-04"],
}

describe("buildImageAnalysisPrompt", () => {
  it("returns non-empty string for reklamacja", () => {
    const result = buildImageAnalysisPrompt("reklamacja")
    expect(result).toBeTruthy()
    expect(result.length).toBeGreaterThan(0)
  })

  it("reklamacja prompt contains damage and manufacturing_defect keywords", () => {
    const result = buildImageAnalysisPrompt("reklamacja")
    expect(result).toContain("damage")
    expect(result).toContain("manufacturing_defect")
  })

  it("returns non-empty string for zwrot", () => {
    const result = buildImageAnalysisPrompt("zwrot")
    expect(result).toBeTruthy()
    expect(result.length).toBeGreaterThan(0)
  })

  it("zwrot prompt contains signs of use and resalable keywords", () => {
    const result = buildImageAnalysisPrompt("zwrot")
    expect(result).toContain("signs of use")
    expect(result).toContain("resalable")
  })

  it("reklamacja and zwrot prompts are different", () => {
    const complaint = buildImageAnalysisPrompt("reklamacja")
    const returnPrompt = buildImageAnalysisPrompt("zwrot")
    expect(complaint).not.toBe(returnPrompt)
  })

  it("reklamacja prompt instructs to set unreadable when image is unclear", () => {
    const result = buildImageAnalysisPrompt("reklamacja")
    expect(result).toContain("unreadable")
  })
})

describe("buildDecisionPrompt", () => {
  it("returns non-empty string for complaint", () => {
    const result = buildDecisionPrompt(
      "reklamacja",
      mockComplaintForm,
      mockComplaintImageAnalysis,
      "RULE-C-01 Complaint is eligible within 24 months.",
    )
    expect(result).toBeTruthy()
    expect(result.length).toBeGreaterThan(0)
  })

  it("complaint prompt contains equipment model", () => {
    const result = buildDecisionPrompt(
      "reklamacja",
      mockComplaintForm,
      mockComplaintImageAnalysis,
      "RULE-C-01 ...",
    )
    expect(result).toContain("Dell XPS 15")
  })

  it("complaint prompt contains purchase date", () => {
    const result = buildDecisionPrompt(
      "reklamacja",
      mockComplaintForm,
      mockComplaintImageAnalysis,
      "RULE-C-01 ...",
    )
    expect(result).toContain("2024-01-15")
  })

  it("complaint prompt contains image condition summary", () => {
    const result = buildDecisionPrompt(
      "reklamacja",
      mockComplaintForm,
      mockComplaintImageAnalysis,
      "RULE-C-01 ...",
    )
    expect(result).toContain("crack on lower-left corner")
  })

  it("complaint prompt contains procedure text", () => {
    const procedureText = "RULE-C-01 Complaint is eligible within 24 months."
    const result = buildDecisionPrompt(
      "reklamacja",
      mockComplaintForm,
      mockComplaintImageAnalysis,
      procedureText,
    )
    expect(result).toContain("RULE-C-01")
  })

  it("complaint prompt instructs Polish response", () => {
    const result = buildDecisionPrompt(
      "reklamacja",
      mockComplaintForm,
      mockComplaintImageAnalysis,
      "RULE-C-01 ...",
    )
    expect(result).toContain("Polish")
  })

  it("return prompt contains signs of use fields", () => {
    const result = buildDecisionPrompt(
      "zwrot",
      mockReturnForm,
      mockReturnImageAnalysis,
      "RULE-R-01 Return within 14 days.",
    )
    expect(result).toContain("Signs of use")
    expect(result).toContain("Resalable")
  })

  it("return prompt contains RULE-R prefix reference", () => {
    const result = buildDecisionPrompt(
      "zwrot",
      mockReturnForm,
      mockReturnImageAnalysis,
      "RULE-R-01 Return is valid.",
    )
    expect(result).toContain("RULE-R")
  })

  it("includes disclaimer instruction in Polish", () => {
    const result = buildDecisionPrompt(
      "reklamacja",
      mockComplaintForm,
      mockComplaintImageAnalysis,
      "RULE-C-01 ...",
    )
    expect(result).toContain("Decyzja została wygenerowana automatycznie")
  })

  it("calculates days since purchase as non-negative number", () => {
    const result = buildDecisionPrompt(
      "reklamacja",
      mockComplaintForm,
      mockComplaintImageAnalysis,
      "RULE-C-01 ...",
    )
    // Should contain a positive number for days since purchase
    expect(result).toMatch(/Days since purchase: \d+/)
  })
})

describe("buildChatSystemPrompt", () => {
  it("returns non-empty string", () => {
    const result = buildChatSystemPrompt(mockChatContext)
    expect(result).toBeTruthy()
    expect(result.length).toBeGreaterThan(0)
  })

  it("contains decision result", () => {
    const result = buildChatSystemPrompt(mockChatContext)
    expect(result).toContain("zaakceptowano")
  })

  it("contains equipment model", () => {
    const result = buildChatSystemPrompt(mockChatContext)
    expect(result).toContain("Dell XPS 15")
  })

  it("contains rules applied", () => {
    const result = buildChatSystemPrompt(mockChatContext)
    expect(result).toContain("RULE-C-01")
    expect(result).toContain("RULE-C-04")
  })

  it("contains off-topic redirect instruction in Polish", () => {
    const result = buildChatSystemPrompt(mockChatContext)
    expect(result).toContain("Nie odpowiadaj na pytania niezwiązane")
  })

  it("contains instruction to always respond in Polish", () => {
    const result = buildChatSystemPrompt(mockChatContext)
    expect(result).toContain("Polish")
  })

  it("contains image condition summary", () => {
    const result = buildChatSystemPrompt(mockChatContext)
    expect(result).toContain("crack on lower-left corner")
  })

  it("contains contradiction handling instruction", () => {
    const result = buildChatSystemPrompt(mockChatContext)
    expect(result).toContain("contradiction")
  })

  it("prompt-building functions return in under reasonable time (pure sync)", () => {
    const start = Date.now()
    buildImageAnalysisPrompt("reklamacja")
    buildImageAnalysisPrompt("zwrot")
    buildDecisionPrompt(
      "reklamacja",
      mockComplaintForm,
      mockComplaintImageAnalysis,
      "RULE-C-01 ...",
    )
    buildChatSystemPrompt(mockChatContext)
    const elapsed = Date.now() - start
    // Pure sync functions should complete well under 100ms
    expect(elapsed).toBeLessThan(100)
  })
})
