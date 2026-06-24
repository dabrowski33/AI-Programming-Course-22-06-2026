import { z } from "zod"

export const EQUIPMENT_CATEGORIES = [
  "Laptopy i komputery",
  "Smartfony i telefony",
  "Tablety",
  "Konsole do gier",
  "Sprzęt audio (słuchawki, głośniki)",
  "Telewizory i monitory",
  "Małe AGD",
  "Akcesoria (ładowarki, kable, inne)",
] as const

export const REQUEST_TYPES = ["reklamacja", "zwrot"] as const

export const ImageAnalysisResultSchema = z.object({
  status: z.enum(["ok", "unreadable"]),
  conditionSummary: z.string(),
  damagePresent: z.boolean(),
  damageType: z.string().nullable(),
  likelyCause: z
    .enum(["manufacturing_defect", "user_damage", "wear_and_tear", "unknown"])
    .nullable(),
  signsOfUse: z.boolean().nullable(),
  resalable: z.boolean().nullable(),
  unreadableReason: z.string().nullable(),
})

export const AgentDecisionSchema = z.object({
  decision: z.enum(["zaakceptowano", "odrzucono", "wymaga_weryfikacji"]),
  justification: z.string().min(50),
  rulesApplied: z.array(z.string()).min(1),
  nextSteps: z.array(z.string()).min(1).max(5),
  disclaimer: z.string(),
})

export const FormSubmissionSchema = z
  .object({
    requestType: z.enum(REQUEST_TYPES),
    equipmentCategory: z.enum(EQUIPMENT_CATEGORIES),
    equipmentModel: z.string().min(1).max(200),
    purchaseDate: z.coerce
      .date()
      .refine((d) => d <= new Date(), "Data zakupu nie może być w przyszłości"),
    complaintReason: z.string().max(2000).optional(),
  })
  .refine(
    (data) =>
      data.requestType !== "reklamacja" ||
      (data.complaintReason && data.complaintReason.trim().length > 0),
    { message: "Opis usterki jest wymagany dla reklamacji", path: ["complaintReason"] }
  )

export const ChatContextSchema = z.object({
  requestType: z.enum(REQUEST_TYPES),
  equipmentCategory: z.string(),
  equipmentModel: z.string(),
  purchaseDate: z.string(),
  complaintReason: z.string().optional(),
  imageConditionSummary: z.string(),
  decisionResult: z.string(),
  decisionJustification: z.string(),
  rulesApplied: z.array(z.string()),
})

export type ImageAnalysisResult = z.infer<typeof ImageAnalysisResultSchema>
export type AgentDecision = z.infer<typeof AgentDecisionSchema>
export type FormSubmission = z.infer<typeof FormSubmissionSchema>
export type ChatContext = z.infer<typeof ChatContextSchema>
export type EquipmentCategory = (typeof EQUIPMENT_CATEGORIES)[number]
export type RequestType = (typeof REQUEST_TYPES)[number]
