"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import ImageUpload from "./ImageUpload"
import {
  FormSubmissionSchema,
  EQUIPMENT_CATEGORIES,
  type RequestType,
  type EquipmentCategory,
} from "@/lib/validation/types"
import { Loader2Icon } from "lucide-react"

type FormErrors = Partial<Record<string, string>>

const today = new Date().toISOString().split("T")[0]

const LOADING_MESSAGES = ["Analizowanie zdjęcia…", "Generowanie decyzji…"]

export default function ComplaintReturnForm() {
  const router = useRouter()

  const [requestType, setRequestType] = useState<RequestType | "">("")
  const [equipmentCategory, setEquipmentCategory] = useState<
    EquipmentCategory | ""
  >("")
  const [equipmentModel, setEquipmentModel] = useState("")
  const [purchaseDate, setPurchaseDate] = useState("")
  const [complaintReason, setComplaintReason] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)

  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [loadingMessageIdx, setLoadingMessageIdx] = useState(0)
  const [serverError, setServerError] = useState<string | null>(null)

  function validate(): FormErrors {
    const errs: FormErrors = {}

    if (!imageFile) {
      errs.imageFile = "Zdjęcie sprzętu jest wymagane."
    }

    const result = FormSubmissionSchema.safeParse({
      requestType: requestType || undefined,
      equipmentCategory: equipmentCategory || undefined,
      equipmentModel,
      purchaseDate,
      complaintReason: complaintReason || undefined,
    })

    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string
        if (!errs[field]) {
          errs[field] = issue.message
        }
      }
    }

    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(null)

    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setErrors({})

    const formData = new FormData()
    formData.append("requestType", requestType as string)
    formData.append("equipmentCategory", equipmentCategory as string)
    formData.append("equipmentModel", equipmentModel)
    formData.append("purchaseDate", purchaseDate)
    if (complaintReason) formData.append("complaintReason", complaintReason)
    formData.append("image", imageFile as File)

    setSubmitting(true)
    setLoadingMessageIdx(0)

    const timer = setTimeout(() => setLoadingMessageIdx(1), 3000)

    try {
      const res = await fetch("/api/analyse", {
        method: "POST",
        body: formData,
      })

      if (res.status === 422) {
        clearTimeout(timer)
        setSubmitting(false)
        setErrors({
          imageFile:
            "Zdjęcie jest nieczytelne lub nie przedstawia sprzętu. Prześlij inne zdjęcie.",
        })
        return
      }

      if (!res.ok) {
        clearTimeout(timer)
        setSubmitting(false)
        setServerError(
          "Wystąpił błąd podczas przetwarzania zgłoszenia. Spróbuj ponownie."
        )
        return
      }

      const data = await res.json()
      clearTimeout(timer)

      const sessionPayload = {
        imageAnalysis: data.imageAnalysis,
        decision: data.decision,
        formData: {
          requestType,
          equipmentCategory,
          equipmentModel,
          purchaseDate,
          complaintReason: complaintReason || undefined,
        },
      }
      sessionStorage.setItem("copilot_session", JSON.stringify(sessionPayload))
      router.push("/chat")
    } catch {
      clearTimeout(timer)
      setSubmitting(false)
      setServerError(
        "Wystąpił błąd podczas przetwarzania zgłoszenia. Spróbuj ponownie."
      )
    }
  }

  const isComplaint = requestType === "reklamacja"

  // Dynamic label: matches test expectations
  let reasonLabel: string
  if (requestType === "reklamacja") {
    reasonLabel = "Opis usterki lub powodu reklamacji"
  } else if (requestType === "zwrot") {
    reasonLabel = "Powód zwrotu (opcjonalnie)"
  } else {
    reasonLabel = "Opis / powód"
  }

  const reasonRequired = isComplaint

  if (submitting) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border bg-card p-10 text-center shadow-sm">
        <Loader2Icon className="size-10 animate-spin text-primary" />
        <p className="text-base font-medium text-foreground">
          {LOADING_MESSAGES[loadingMessageIdx]}
        </p>
      </div>
    )
  }

  if (serverError) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border bg-card p-8 text-center shadow-sm">
        <p className="text-sm text-destructive">{serverError}</p>
        <Button onClick={() => setServerError(null)} variant="outline">
          Spróbuj ponownie
        </Button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-5 rounded-xl border bg-card p-6 shadow-sm"
    >
      {/* Typ zgłoszenia */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">
          Typ zgłoszenia <span className="text-destructive">*</span>
        </label>
        <Select
          value={requestType || null}
          onValueChange={(v: RequestType | null) => {
            if (v) setRequestType(v)
            setErrors((prev) => ({ ...prev, requestType: undefined }))
          }}
        >
          <SelectTrigger
            className="w-full h-10"
            aria-invalid={!!errors.requestType}
          >
            <SelectValue placeholder="Wybierz typ zgłoszenia" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="reklamacja">Reklamacja</SelectItem>
            <SelectItem value="zwrot">Zwrot</SelectItem>
          </SelectContent>
        </Select>
        {errors.requestType && (
          <p className="text-xs text-destructive">{errors.requestType}</p>
        )}
      </div>

      {/* Kategoria sprzętu */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">
          Kategoria sprzętu <span className="text-destructive">*</span>
        </label>
        <Select
          value={equipmentCategory || null}
          onValueChange={(v: EquipmentCategory | null) => {
            if (v) setEquipmentCategory(v)
            setErrors((prev) => ({ ...prev, equipmentCategory: undefined }))
          }}
        >
          <SelectTrigger
            className="w-full h-10"
            aria-invalid={!!errors.equipmentCategory}
          >
            <SelectValue placeholder="Wybierz kategorię" />
          </SelectTrigger>
          <SelectContent>
            {EQUIPMENT_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.equipmentCategory && (
          <p className="text-xs text-destructive">{errors.equipmentCategory}</p>
        )}
      </div>

      {/* Nazwa / Model sprzętu */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">
          Nazwa / Model sprzętu <span className="text-destructive">*</span>
        </label>
        <Input
          type="text"
          placeholder="np. Samsung Galaxy S23"
          value={equipmentModel}
          maxLength={200}
          aria-invalid={!!errors.equipmentModel}
          onChange={(e) => {
            setEquipmentModel(e.target.value)
            setErrors((prev) => ({ ...prev, equipmentModel: undefined }))
          }}
        />
        {errors.equipmentModel && (
          <p className="text-xs text-destructive">{errors.equipmentModel}</p>
        )}
      </div>

      {/* Data zakupu */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="purchase-date"
          className="text-sm font-medium text-foreground"
        >
          Data zakupu <span className="text-destructive">*</span>
        </label>
        <input
          id="purchase-date"
          type="date"
          value={purchaseDate}
          max={today}
          aria-invalid={!!errors.purchaseDate}
          className={`h-10 w-full rounded-lg border px-2.5 py-1 text-sm outline-none transition-colors bg-transparent focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 ${
            errors.purchaseDate ? "border-destructive" : "border-input"
          }`}
          onChange={(e) => {
            setPurchaseDate(e.target.value)
            setErrors((prev) => ({ ...prev, purchaseDate: undefined }))
          }}
        />
        {errors.purchaseDate && (
          <p className="text-xs text-destructive">{errors.purchaseDate}</p>
        )}
      </div>

      {/* Opis usterki / powód zwrotu */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="complaint-reason"
          className="text-sm font-medium text-foreground"
        >
          {reasonLabel}{" "}
          {reasonRequired && <span className="text-destructive">*</span>}
        </label>
        <Textarea
          id="complaint-reason"
          placeholder={
            isComplaint
              ? "Opisz usterkę sprzętu…"
              : "Opcjonalnie opisz powód zwrotu…"
          }
          value={complaintReason}
          maxLength={2000}
          aria-invalid={!!errors.complaintReason}
          onChange={(e) => {
            setComplaintReason(e.target.value)
            setErrors((prev) => ({ ...prev, complaintReason: undefined }))
          }}
          className="min-h-24"
        />
        <div className="flex justify-between">
          <span>
            {errors.complaintReason && (
              <span className="text-xs text-destructive">
                {errors.complaintReason}
              </span>
            )}
          </span>
          <span className="text-xs text-muted-foreground">
            {complaintReason.length} / 2000
          </span>
        </div>
      </div>

      {/* Zdjęcie sprzętu */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">
          Zdjęcie sprzętu <span className="text-destructive">*</span>
        </label>
        <ImageUpload
          value={imageFile}
          onChange={(file) => {
            setImageFile(file)
            setErrors((prev) => ({ ...prev, imageFile: undefined }))
          }}
          error={errors.imageFile}
        />
      </div>

      <Button
        type="submit"
        disabled={submitting}
        className="w-full h-10 text-sm font-medium"
      >
        {submitting ? (
          <>
            <Loader2Icon className="mr-2 size-4 animate-spin" />
            Przetwarzanie…
          </>
        ) : (
          "Wyślij zgłoszenie"
        )}
      </Button>
    </form>
  )
}
