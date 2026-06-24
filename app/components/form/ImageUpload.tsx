"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
const ACCEPTED_FORMATS = ".jpg,.jpeg,.png,.webp"
const ACCEPTED_HINT = "JPG, JPEG, PNG, WEBP"

interface ImageUploadProps {
  value: File | null
  onChange: (file: File | null) => void
  error?: string
}

export default function ImageUpload({ value, onChange, error }: ImageUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [sizeError, setSizeError] = React.useState<string | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)

  // Update preview URL when value changes
  React.useEffect(() => {
    if (value) {
      const url = URL.createObjectURL(value)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setPreviewUrl(null)
    }
  }, [value])

  function validateAndSet(file: File) {
    if (file.size > MAX_SIZE_BYTES) {
      setSizeError("Plik jest za duży. Maksymalny rozmiar to 10 MB.")
      onChange(null)
      return
    }
    setSizeError(null)
    onChange(file)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      validateAndSet(file)
    }
  }

  function handleAreaClick() {
    inputRef.current?.click()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      inputRef.current?.click()
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave() {
    setIsDragging(false)
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      validateAndSet(file)
    }
  }

  const hasError = Boolean(error)

  return (
    <div className="flex flex-col gap-1.5">
      <div
        data-testid="image-upload-area"
        role="button"
        tabIndex={0}
        aria-label="Prześlij zdjęcie sprzętu"
        onClick={handleAreaClick}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
          "hover:border-ring hover:bg-muted/30",
          isDragging && "border-ring bg-muted/30",
          hasError ? "border-destructive" : "border-input",
        )}
      >
        <input
          ref={inputRef}
          data-testid="image-upload-input"
          type="file"
          accept={ACCEPTED_FORMATS}
          className="sr-only"
          onChange={handleInputChange}
          tabIndex={-1}
        />

        {value && previewUrl ? (
          <div className="flex flex-col items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={value.name}
              className="max-h-40 max-w-full rounded-md object-contain"
            />
            <span className="text-sm text-foreground">{value.name}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mb-2 size-8 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.332-8.82 4.5 4.5 0 0 1 8.207-3.155A4.5 4.5 0 0 1 17.25 19.5H6.75Z"
              />
            </svg>
            <p className="text-sm font-medium text-foreground">
              Przeciągnij zdjęcie lub kliknij, aby wybrać
            </p>
            <p className="text-xs text-muted-foreground">
              Akceptowane formaty: {ACCEPTED_HINT} &bull; Maks. 10 MB
            </p>
          </div>
        )}
      </div>

      {/* Size error (internal validation) */}
      {sizeError && (
        <p
          data-testid="image-upload-size-error"
          className="text-sm text-destructive"
        >
          {sizeError}
        </p>
      )}

      {/* External error from parent (form validation) */}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
