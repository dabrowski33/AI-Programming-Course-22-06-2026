import type { FormSubmission, ImageAnalysisResult, ChatContext } from "@/lib/validation/types"

export function buildImageAnalysisPrompt(requestType: "reklamacja" | "zwrot"): string {
  if (requestType === "reklamacja") {
    return `You are a hardware service expert analysing a photograph of electronic equipment submitted as part of a warranty complaint.

Analyse the image and return a structured JSON assessment covering:
1. Whether damage is visible and its type/location (e.g. cracked screen, dented casing, liquid damage indicators).
2. The most likely cause of any damage: manufacturing_defect, user_damage, wear_and_tear, or unknown.
3. Overall condition summary in 2-3 sentences.

If the image does not clearly show the equipment, is too dark, blurry, or is unrelated to electronic equipment, set status to "unreadable" and explain why in unreadableReason.

For complaint analysis: populate likelyCause, set signsOfUse and resalable to null.

Respond only with the JSON object matching the provided schema. Do not include any other text.`
  }

  return `You are a hardware service expert analysing a photograph of electronic equipment submitted as part of a return request.

Analyse the image and return a structured JSON assessment covering:
1. Whether the item shows visible signs of use (scratches, fingerprints on surfaces, worn areas, missing stickers).
2. Whether the item appears to be in resalable condition (like-new or as-new).
3. Whether any damage is present.
4. Overall condition summary in 2-3 sentences.

If the image does not clearly show the equipment, is too dark, blurry, or is unrelated to electronic equipment, set status to "unreadable" and explain why in unreadableReason.

For return analysis: populate signsOfUse and resalable, set likelyCause to null.

Respond only with the JSON object matching the provided schema. Do not include any other text.`
}

export function buildDecisionPrompt(
  requestType: "reklamacja" | "zwrot",
  formData: FormSubmission,
  imageAnalysis: ImageAnalysisResult,
  procedureText: string,
): string {
  const purchaseDate = formData.purchaseDate instanceof Date
    ? formData.purchaseDate.toISOString().split("T")[0]
    : String(formData.purchaseDate)

  const now = new Date()
  const purchase = new Date(formData.purchaseDate)
  const daysSincePurchase = Math.floor(
    (now.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24),
  )

  if (requestType === "reklamacja") {
    const imageSection = `${imageAnalysis.conditionSummary}
- Damage present: ${imageAnalysis.damagePresent}
- Damage type: ${imageAnalysis.damageType ?? "none"}
- Likely cause: ${imageAnalysis.likelyCause ?? "unknown"}`

    return `You are a hardware service decision assistant. Your task is to evaluate a warranty complaint case and produce a decision strictly based on the company's complaint procedure rules provided below.

## Case Information

- Equipment type: ${formData.equipmentCategory}
- Equipment model: ${formData.equipmentModel}
- Purchase date: ${purchaseDate}
- Days since purchase: ${daysSincePurchase}
- Fault description: ${formData.complaintReason ?? "(not provided)"}

## Image Analysis Result

${imageSection}

## Company Complaint Procedure

${procedureText}

## Instructions

1. Evaluate this case against each relevant rule in the procedure above.
2. Cite the specific rule IDs (e.g. RULE-C-05) that apply to this case.
3. Produce one of three decisions: "zaakceptowano", "odrzucono", or "wymaga_weryfikacji".
4. Write the justification in Polish. Be specific: reference the rule, the evidence, and why it leads to the decision.
5. List 1-5 concrete next steps for the employee in Polish.
6. Always include this disclaimer in Polish: "Decyzja została wygenerowana automatycznie przez system AI. Pracownik jest odpowiedzialny za ostateczną weryfikację przed przekazaniem informacji klientowi."

Do not invent rules not present in the procedure. If the case cannot be determined by the provided rules, use "wymaga_weryfikacji".

Respond only with the JSON object matching the provided schema.`
  }

  const imageSection = `${imageAnalysis.conditionSummary}
- Damage present: ${imageAnalysis.damagePresent}
- Damage type: ${imageAnalysis.damageType ?? "none"}
- Signs of use: ${imageAnalysis.signsOfUse ?? "unknown"}
- Resalable: ${imageAnalysis.resalable ?? "unknown"}`

  return `You are a hardware service decision assistant. Your task is to evaluate a return request case and produce a decision strictly based on the company's return procedure rules provided below.

## Case Information

- Equipment type: ${formData.equipmentCategory}
- Equipment model: ${formData.equipmentModel}
- Purchase date: ${purchaseDate}
- Days since purchase: ${daysSincePurchase}
- Return reason: ${formData.complaintReason ?? "(not provided)"}

## Image Analysis Result

${imageSection}

## Company Return Procedure

${procedureText}

## Instructions

1. Evaluate this case against each relevant rule in the procedure above.
2. Cite the specific rule IDs (e.g. RULE-R-05) that apply to this case.
3. Produce one of three decisions: "zaakceptowano", "odrzucono", or "wymaga_weryfikacji".
4. Write the justification in Polish. Be specific: reference the rule, the evidence, and why it leads to the decision.
5. List 1-5 concrete next steps for the employee in Polish.
6. Always include this disclaimer in Polish: "Decyzja została wygenerowana automatycznie przez system AI. Pracownik jest odpowiedzialny za ostateczną weryfikację przed przekazaniem informacji klientowi."

Do not invent rules not present in the procedure. If the case cannot be determined by the provided rules, use "wymaga_weryfikacji".

Respond only with the JSON object matching the provided schema.`
}

export function buildChatSystemPrompt(context: ChatContext): string {
  const complaintReasonSection =
    context.requestType === "reklamacja"
      ? `Complaint reason: ${context.complaintReason ?? "(not provided)"}`
      : `Return reason: ${context.complaintReason ?? "(not provided)"}`

  return `You are a hardware service decision assistant helping an employee process a ${context.requestType} request.

## Current Case

- Request type: ${context.requestType}
- Equipment: ${context.equipmentCategory} — ${context.equipmentModel}
- Purchase date: ${context.purchaseDate}
- ${complaintReasonSection}

## Equipment Condition (from image analysis)

${context.imageConditionSummary}

## Decision Already Issued

Decision: ${context.decisionResult}
Justification: ${context.decisionJustification}
Rules applied: ${context.rulesApplied.join(", ")}

## Your Role in This Conversation

- Answer the employee's follow-up questions about this case in Polish.
- If the employee provides new information that changes the case assessment, acknowledge it and explain how it affects the decision.
- If there is a contradiction between new information and the image analysis, explicitly name the contradiction and explain your reasoning.
- Stay focused on this case. Nie odpowiadaj na pytania niezwiązane z bieżącą sprawą. If the employee asks about unrelated topics, politely decline and redirect: "To zgłoszenie dotyczy ${context.requestType} sprzętu ${context.equipmentModel}. Czy mogę pomóc w kwestiach związanych z tą sprawą?"
- Never invent rules or policies not grounded in the original procedure.
- Always respond in Polish.`
}
