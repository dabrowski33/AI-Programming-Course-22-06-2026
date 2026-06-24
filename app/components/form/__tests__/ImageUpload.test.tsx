import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import ImageUpload from "../ImageUpload"

// URL.createObjectURL is not available in jsdom
beforeEach(() => {
  global.URL.createObjectURL = vi.fn(() => "blob:mock-url")
  global.URL.revokeObjectURL = vi.fn()
})

function makeFile(name: string, sizeBytes: number, type = "image/jpeg"): File {
  const content = new Uint8Array(sizeBytes)
  return new File([content], name, { type })
}

describe("ImageUpload", () => {
  it("renders the drop area with accepted formats hint", () => {
    const onChange = vi.fn()
    render(<ImageUpload value={null} onChange={onChange} />)

    expect(screen.getByText(/jpg/i)).toBeInTheDocument()
    expect(screen.getByText(/10 MB/i)).toBeInTheDocument()
  })

  it("renders a file input with correct accept attribute", () => {
    const onChange = vi.fn()
    render(<ImageUpload value={null} onChange={onChange} />)

    const input = screen.getByTestId("image-upload-input") as HTMLInputElement
    expect(input.accept).toBe(".jpg,.jpeg,.png,.webp")
  })

  it("calls onChange with the file when a valid file is selected", async () => {
    const onChange = vi.fn()
    render(<ImageUpload value={null} onChange={onChange} />)

    const input = screen.getByTestId("image-upload-input") as HTMLInputElement
    const file = makeFile("photo.jpg", 1024 * 1024) // 1 MB

    await userEvent.upload(input, file)

    expect(onChange).toHaveBeenCalledWith(file)
    expect(onChange).not.toHaveBeenCalledWith(null)
  })

  it("rejects a file larger than 10 MB and calls onChange(null)", async () => {
    const onChange = vi.fn()
    render(<ImageUpload value={null} onChange={onChange} />)

    const input = screen.getByTestId("image-upload-input") as HTMLInputElement
    const bigFile = makeFile("big.jpg", 11 * 1024 * 1024) // 11 MB

    await userEvent.upload(input, bigFile)

    expect(onChange).toHaveBeenCalledWith(null)
    expect(screen.getByText(/10 MB/i, { selector: "[data-testid='image-upload-size-error']" })).toBeInTheDocument()
  })

  it("shows filename and thumbnail after valid file selected", async () => {
    const file = makeFile("my-photo.png", 512 * 1024)
    const onChange = vi.fn()
    render(<ImageUpload value={file} onChange={onChange} />)

    expect(screen.getByText("my-photo.png")).toBeInTheDocument()
    const img = screen.getByRole("img") as HTMLImageElement
    expect(img.src).toBe("blob:mock-url")
  })

  it("shows red border and error message when error prop is passed", () => {
    const onChange = vi.fn()
    render(<ImageUpload value={null} onChange={onChange} error="Zdjęcie jest wymagane" />)

    expect(screen.getByText("Zdjęcie jest wymagane")).toBeInTheDocument()
    const dropArea = screen.getByTestId("image-upload-area")
    expect(dropArea.className).toMatch(/border-destructive|border-red/)
  })

  it("calls onChange(null) when no file is provided in drop", () => {
    const onChange = vi.fn()
    render(<ImageUpload value={null} onChange={onChange} />)

    const dropArea = screen.getByTestId("image-upload-area")
    fireEvent.drop(dropArea, {
      dataTransfer: { files: [] },
    })

    // no call expected for empty drop
    expect(onChange).not.toHaveBeenCalled()
  })

  it("handles drag-and-drop with a valid file", async () => {
    const onChange = vi.fn()
    render(<ImageUpload value={null} onChange={onChange} />)

    const file = makeFile("dropped.jpg", 2 * 1024 * 1024)
    const dropArea = screen.getByTestId("image-upload-area")

    fireEvent.dragOver(dropArea, { preventDefault: vi.fn() })
    fireEvent.drop(dropArea, {
      dataTransfer: { files: [file] },
    })

    expect(onChange).toHaveBeenCalledWith(file)
  })

  it("handles drag-and-drop with a file too large", async () => {
    const onChange = vi.fn()
    render(<ImageUpload value={null} onChange={onChange} />)

    const bigFile = makeFile("big-dropped.jpg", 15 * 1024 * 1024)
    const dropArea = screen.getByTestId("image-upload-area")

    fireEvent.drop(dropArea, {
      dataTransfer: { files: [bigFile] },
    })

    expect(onChange).toHaveBeenCalledWith(null)
    expect(screen.getByTestId("image-upload-size-error")).toBeInTheDocument()
  })
})
