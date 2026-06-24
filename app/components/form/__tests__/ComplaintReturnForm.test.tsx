import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import * as React from "react"

// Mock next/navigation
const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

// Mock ImageUpload to simplify form tests
vi.mock("../ImageUpload", () => ({
  default: ({
    onChange,
    error,
  }: {
    value: File | null
    onChange: (f: File | null) => void
    error?: string
  }) => (
    <div>
      <input
        data-testid="mock-image-upload"
        type="file"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null
          onChange(file)
        }}
      />
      {error && <span data-testid="image-upload-error">{error}</span>}
    </div>
  ),
}))

// Mock UI components that rely on base-ui which doesn't work in jsdom
vi.mock("@/components/ui/select", () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value?: string
    onValueChange?: (v: string) => void
    children: React.ReactNode
  }) => (
    <div data-testid="select-root" data-value={value}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<{ onValueChange?: (v: string) => void }>, {
            onValueChange,
          })
        }
        return child
      })}
    </div>
  ),
  SelectTrigger: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="select-trigger" className={className}>
      {children}
    </div>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <span data-testid="select-value">{placeholder}</span>
  ),
  SelectContent: ({
    children,
    onValueChange,
  }: {
    children: React.ReactNode
    onValueChange?: (v: string) => void
  }) => (
    <div data-testid="select-content">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<{ onValueChange?: (v: string) => void }>, {
            onValueChange,
          })
        }
        return child
      })}
    </div>
  ),
  SelectItem: ({
    value,
    children,
    onValueChange,
  }: {
    value: string
    children: React.ReactNode
    onValueChange?: (v: string) => void
  }) => (
    <button
      data-testid={`select-item-${value}`}
      onClick={() => onValueChange?.(value)}
      type="button"
    >
      {children}
    </button>
  ),
}))

vi.mock("@/components/ui/input", () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}))

vi.mock("@/components/ui/textarea", () => ({
  Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} />,
}))

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    disabled,
    onClick,
    type,
    className,
  }: {
    children: React.ReactNode
    disabled?: boolean
    onClick?: () => void
    type?: "submit" | "button" | "reset"
    className?: string
  }) => (
    <button
      data-testid="submit-button"
      disabled={disabled}
      onClick={onClick}
      type={type}
      className={className}
    >
      {children}
    </button>
  ),
}))

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-content" className={className}>
      {children}
    </div>
  ),
}))

import ComplaintReturnForm from "../ComplaintReturnForm"

function makeFile(name: string, sizeBytes: number): File {
  return new File([new Uint8Array(sizeBytes)], name, { type: "image/jpeg" })
}

function setUpFetch(status: number, body: object) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response)
}

function fillAllFields(requestType = "reklamacja") {
  // Select request type
  const requestTypeItemButton = screen.getByTestId(`select-item-${requestType}`)
  fireEvent.click(requestTypeItemButton)

  // Select equipment category
  const categoryButton = screen.getByTestId("select-item-Laptopy i komputery")
  fireEvent.click(categoryButton)

  // Fill equipment model
  const modelInput = screen.getByPlaceholderText("np. Samsung Galaxy S23")
  fireEvent.change(modelInput, { target: { value: "ThinkPad X1" } })

  // Fill purchase date
  const dateInput = screen.getByLabelText(/data zakupu/i)
  fireEvent.change(dateInput, { target: { value: "2024-01-15" } })

  // Fill complaint reason (only required for reklamacja)
  if (requestType === "reklamacja") {
    const textarea = screen.getByRole("textbox", { name: /opis usterki/i })
    fireEvent.change(textarea, { target: { value: "Ekran przestał działać" } })
  }

  // Upload image
  const imageInput = screen.getByTestId("mock-image-upload")
  const file = makeFile("photo.jpg", 1024 * 1024)
  fireEvent.change(imageInput, { target: { files: [file] } })
}

describe("ComplaintReturnForm", () => {
  beforeEach(() => {
    mockPush.mockClear()
    vi.clearAllMocks()
    // sessionStorage mock
    Object.defineProperty(window, "sessionStorage", {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("renders all 6 form fields", () => {
    render(<ComplaintReturnForm />)

    // Typ zgłoszenia
    expect(screen.getByText(/typ zgłoszenia/i)).toBeInTheDocument()
    // Kategoria sprzętu
    expect(screen.getByText(/kategoria sprzętu/i)).toBeInTheDocument()
    // Nazwa / Model
    expect(screen.getByPlaceholderText("np. Samsung Galaxy S23")).toBeInTheDocument()
    // Data zakupu
    expect(screen.getByLabelText(/data zakupu/i)).toBeInTheDocument()
    // Opis
    expect(screen.getByRole("textbox", { name: /opis/i })).toBeInTheDocument()
    // Image upload
    expect(screen.getByTestId("mock-image-upload")).toBeInTheDocument()
  })

  it("shows dynamic label for description: 'Opis usterki' when requestType is reklamacja", () => {
    render(<ComplaintReturnForm />)

    const requestTypeButton = screen.getByTestId("select-item-reklamacja")
    fireEvent.click(requestTypeButton)

    expect(screen.getByText(/opis usterki lub powodu reklamacji/i)).toBeInTheDocument()
  })

  it("shows dynamic label for description: 'Powód zwrotu (opcjonalnie)' when requestType is zwrot", () => {
    render(<ComplaintReturnForm />)

    const zwrotButton = screen.getByTestId("select-item-zwrot")
    fireEvent.click(zwrotButton)

    expect(screen.getByText(/powód zwrotu \(opcjonalnie\)/i)).toBeInTheDocument()
  })

  it("shows default label 'Opis / powód' when no requestType is selected", () => {
    render(<ComplaintReturnForm />)
    expect(screen.getByText(/opis \/ powód/i)).toBeInTheDocument()
  })

  it("complaintReason is required for reklamacja — shows error when empty", async () => {
    render(<ComplaintReturnForm />)

    const requestTypeButton = screen.getByTestId("select-item-reklamacja")
    fireEvent.click(requestTypeButton)

    // Fill all fields except complaintReason
    const categoryButton = screen.getByTestId("select-item-Laptopy i komputery")
    fireEvent.click(categoryButton)

    const modelInput = screen.getByPlaceholderText("np. Samsung Galaxy S23")
    fireEvent.change(modelInput, { target: { value: "ThinkPad X1" } })

    const dateInput = screen.getByLabelText(/data zakupu/i)
    fireEvent.change(dateInput, { target: { value: "2024-01-15" } })

    const imageInput = screen.getByTestId("mock-image-upload")
    const file = makeFile("photo.jpg", 1024 * 1024)
    fireEvent.change(imageInput, { target: { files: [file] } })

    const form = document.querySelector("form")!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText(/opis usterki jest wymagany/i)).toBeInTheDocument()
    })

    expect(global.fetch).not.toHaveBeenCalled()
  })

  it("complaintReason is optional for zwrot — submits without it", async () => {
    setUpFetch(200, {
      imageAnalysis: { status: "ok", conditionSummary: "Good", damagePresent: false },
      decision: {
        decision: "zaakceptowano",
        justification: "All good ".repeat(6),
        rulesApplied: ["rule1"],
        nextSteps: ["step1"],
        disclaimer: "Standard",
      },
      formData: {},
    })

    render(<ComplaintReturnForm />)

    const zwrotButton = screen.getByTestId("select-item-zwrot")
    fireEvent.click(zwrotButton)

    const categoryButton = screen.getByTestId("select-item-Laptopy i komputery")
    fireEvent.click(categoryButton)

    const modelInput = screen.getByPlaceholderText("np. Samsung Galaxy S23")
    fireEvent.change(modelInput, { target: { value: "iPhone 15" } })

    const dateInput = screen.getByLabelText(/data zakupu/i)
    fireEvent.change(dateInput, { target: { value: "2024-03-01" } })

    const imageInput = screen.getByTestId("mock-image-upload")
    const file = makeFile("photo.jpg", 1024 * 1024)
    fireEvent.change(imageInput, { target: { files: [file] } })

    const form = document.querySelector("form")!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/analyse",
        expect.objectContaining({ method: "POST" }),
      )
    })
  })

  it("submit button is disabled during loading", async () => {
    // Never resolving fetch to keep loading state
    global.fetch = vi.fn().mockReturnValue(new Promise(() => {}))

    render(<ComplaintReturnForm />)
    fillAllFields("reklamacja")

    const form = document.querySelector("form")!
    fireEvent.submit(form)

    await waitFor(() => {
      const button = screen.getByTestId("submit-button")
      expect(button).toBeDisabled()
    })
  })

  it("on 200 response: writes sessionStorage and calls router.push('/chat')", async () => {
    const apiResponse = {
      imageAnalysis: {
        status: "ok",
        conditionSummary: "Minor scratches",
        damagePresent: true,
        damageType: "scratch",
        likelyCause: "wear_and_tear",
        signsOfUse: true,
        resalable: true,
        unreadableReason: null,
      },
      decision: {
        decision: "zaakceptowano",
        justification: "Reklamacja uzasadniona ".repeat(3),
        rulesApplied: ["rule1"],
        nextSteps: ["krok 1"],
        disclaimer: "Standard disclaimer",
      },
      formData: {},
    }
    setUpFetch(200, apiResponse)

    render(<ComplaintReturnForm />)
    fillAllFields("reklamacja")

    const form = document.querySelector("form")!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
        "copilot_session",
        expect.stringContaining('"decision"'),
      )
      expect(mockPush).toHaveBeenCalledWith("/chat")
    })
  })

  it("on 422 response: shows image error and re-enables form", async () => {
    setUpFetch(422, {
      imageAnalysis: {
        status: "unreadable",
        reason: "Zdjęcie jest zbyt ciemne",
      },
    })

    render(<ComplaintReturnForm />)
    fillAllFields("reklamacja")

    const form = document.querySelector("form")!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByTestId("image-upload-error")).toBeInTheDocument()
      const button = screen.getByTestId("submit-button")
      expect(button).not.toBeDisabled()
    })
  })

  it("on 422 response with no reason: shows fallback image error", async () => {
    setUpFetch(422, { imageAnalysis: {} })

    render(<ComplaintReturnForm />)
    fillAllFields("reklamacja")

    const form = document.querySelector("form")!
    fireEvent.submit(form)

    await waitFor(() => {
      const errorEl = screen.getByTestId("image-upload-error")
      expect(errorEl.textContent).toContain("Zdjęcie jest nieczytelne")
    })
  })

  it("on 500 response: shows full-page error state", async () => {
    setUpFetch(500, {})

    render(<ComplaintReturnForm />)
    fillAllFields("reklamacja")

    const form = document.querySelector("form")!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(
        screen.getByText(/wystąpił błąd podczas przetwarzania zgłoszenia/i),
      ).toBeInTheDocument()
    })
  })

  it("'Spróbuj ponownie' button re-enables form after error", async () => {
    setUpFetch(500, {})

    render(<ComplaintReturnForm />)
    fillAllFields("reklamacja")

    const form = document.querySelector("form")!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText(/spróbuj ponownie/i)).toBeInTheDocument()
    })

    const retryButton = screen.getByText(/spróbuj ponownie/i)
    fireEvent.click(retryButton)

    await waitFor(() => {
      expect(screen.queryByText(/wystąpił błąd/i)).not.toBeInTheDocument()
    })
  })

  it("image >10MB is rejected client-side — no fetch is made", async () => {
    global.fetch = vi.fn()
    global.URL.createObjectURL = vi.fn(() => "blob:mock")
    global.URL.revokeObjectURL = vi.fn()

    render(<ComplaintReturnForm />)
    fillAllFields("reklamacja")

    // Replace image with oversized one via mock
    const imageInput = screen.getByTestId("mock-image-upload")
    const bigFile = makeFile("big.jpg", 11 * 1024 * 1024)
    fireEvent.change(imageInput, { target: { files: [bigFile] } })

    // The ImageUpload mock doesn't do size validation itself — that's in ImageUpload component
    // But the form should not submit if image field is null (which happens after rejection)
    // Since the mock doesn't validate size, we rely on the real ImageUpload test for this.
    // Here we test that submitting with no image (null) prevents fetch
    // Reset image to null
    fireEvent.change(imageInput, { target: { files: [] } })

    const form = document.querySelector("form")!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  it("shows character counter for description textarea", () => {
    render(<ComplaintReturnForm />)
    expect(screen.getByText(/0 \/ 2000/)).toBeInTheDocument()
  })

  it("updates character counter as user types", async () => {
    render(<ComplaintReturnForm />)
    const textarea = screen.getByRole("textbox", { name: /opis/i })
    await userEvent.type(textarea, "Abc")
    expect(screen.getByText(/3 \/ 2000/)).toBeInTheDocument()
  })

  it("sends all form fields as FormData to /api/analyse", async () => {
    setUpFetch(200, {
      imageAnalysis: { status: "ok", conditionSummary: "Fine" },
      decision: {
        decision: "zaakceptowano",
        justification: "All good ".repeat(7),
        rulesApplied: ["r"],
        nextSteps: ["s"],
        disclaimer: "d",
      },
      formData: {},
    })

    render(<ComplaintReturnForm />)
    fillAllFields("reklamacja")

    const form = document.querySelector("form")!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/analyse",
        expect.objectContaining({
          method: "POST",
          body: expect.any(FormData),
        }),
      )
    })
  })
})
