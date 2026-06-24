import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import * as React from "react"

// Mock next/navigation
const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

// Mock useChat from @ai-sdk/react
const mockSendMessage = vi.fn()
const mockUseChatState = {
  messages: [] as Array<{ id: string; role: string; parts: Array<{ type: string; text: string }> }>,
  status: "ready" as string,
  sendMessage: mockSendMessage,
}

vi.mock("@ai-sdk/react", () => ({
  useChat: vi.fn(() => mockUseChatState),
}))

// Mock DefaultChatTransport from "ai" — must be a class (constructor)
vi.mock("ai", () => ({
  DefaultChatTransport: class MockDefaultChatTransport {
    constructor(_opts: unknown) {}
  },
}))

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  SendHorizonalIcon: () => <span data-testid="send-icon">send</span>,
  PlusCircleIcon: () => <span data-testid="plus-icon">plus</span>,
}))

const mockSession = {
  formData: {
    requestType: "reklamacja" as const,
    equipmentCategory: "Laptopy i komputery",
    equipmentModel: "Dell XPS 15",
    purchaseDate: "2024-01-15",
    complaintReason: "Awaria baterii",
  },
  imageAnalysis: {
    status: "ok" as const,
    conditionSummary: "Sprzęt w dobrym stanie.",
    damagePresent: false,
    damageType: null,
    likelyCause: null,
    signsOfUse: false,
    resalable: true,
    unreadableReason: null,
  },
  decision: {
    decision: "zaakceptowano" as const,
    justification:
      "Sprzęt wykazuje wadę produkcyjną zgodnie z regułą RULE-C-05, a data zakupu mieści się w okresie gwarancyjnym.",
    rulesApplied: ["RULE-C-05"],
    nextSteps: [
      "Przyjąć sprzęt do serwisu.",
      "Wystawić potwierdzenie przyjęcia reklamacji.",
    ],
    disclaimer:
      "Decyzja została wygenerowana automatycznie przez system AI. Pracownik jest odpowiedzialny za ostateczną weryfikację.",
  },
}

// Setup sessionStorage mock
const sessionStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, "sessionStorage", {
  value: sessionStorageMock,
  writable: true,
})

describe("ChatInterface", () => {
  beforeEach(() => {
    sessionStorageMock.clear()
    mockPush.mockClear()
    mockSendMessage.mockClear()
    mockUseChatState.messages = []
    mockUseChatState.status = "ready"
    vi.resetModules()
  })

  afterEach(() => {
    sessionStorageMock.clear()
  })

  it("redirects to / when copilot_session is missing from sessionStorage", async () => {
    // No session stored
    const { default: ChatInterface } = await import("../ChatInterface")
    render(<ChatInterface />)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/")
    })
  })

  it("redirects to / when copilot_session contains invalid JSON", async () => {
    sessionStorageMock.setItem("copilot_session", "invalid json{")
    const { default: ChatInterface } = await import("../ChatInterface")
    render(<ChatInterface />)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/")
    })
  })

  it("renders the first message bubble from stored decision when session exists", async () => {
    sessionStorageMock.setItem("copilot_session", JSON.stringify(mockSession))
    const { default: ChatInterface } = await import("../ChatInterface")
    render(<ChatInterface />)

    await waitFor(() => {
      expect(
        screen.getByText("Dzień dobry, oto wynik analizy zgłoszenia.")
      ).toBeInTheDocument()
    })

    expect(screen.getByTestId("decision-badge")).toBeInTheDocument()
    expect(screen.getByText("Uzasadnienie:")).toBeInTheDocument()
  })

  it("input textarea is disabled while isLoading is true (status=submitted)", async () => {
    sessionStorageMock.setItem("copilot_session", JSON.stringify(mockSession))
    mockUseChatState.status = "submitted"

    const { default: ChatInterface } = await import("../ChatInterface")
    render(<ChatInterface />)

    await waitFor(() => {
      expect(
        screen.getByText("Dzień dobry, oto wynik analizy zgłoszenia.")
      ).toBeInTheDocument()
    })

    const textarea = screen.getByPlaceholderText("Wpisz wiadomość…")
    expect(textarea).toBeDisabled()
  })

  it("input textarea is disabled while isLoading is true (status=streaming)", async () => {
    sessionStorageMock.setItem("copilot_session", JSON.stringify(mockSession))
    mockUseChatState.status = "streaming"

    const { default: ChatInterface } = await import("../ChatInterface")
    render(<ChatInterface />)

    await waitFor(() => {
      expect(
        screen.getByText("Dzień dobry, oto wynik analizy zgłoszenia.")
      ).toBeInTheDocument()
    })

    const textarea = screen.getByPlaceholderText("Wpisz wiadomość…")
    expect(textarea).toBeDisabled()
  })

  it("input textarea is enabled when not loading", async () => {
    sessionStorageMock.setItem("copilot_session", JSON.stringify(mockSession))
    mockUseChatState.status = "ready"

    const { default: ChatInterface } = await import("../ChatInterface")
    render(<ChatInterface />)

    await waitFor(() => {
      expect(
        screen.getByText("Dzień dobry, oto wynik analizy zgłoszenia.")
      ).toBeInTheDocument()
    })

    const textarea = screen.getByPlaceholderText("Wpisz wiadomość…")
    expect(textarea).not.toBeDisabled()
  })

  it("'Nowe zgłoszenie' button clears sessionStorage and navigates to /", async () => {
    sessionStorageMock.setItem("copilot_session", JSON.stringify(mockSession))
    const { default: ChatInterface } = await import("../ChatInterface")
    render(<ChatInterface />)

    await waitFor(() => {
      expect(
        screen.getByText("Dzień dobry, oto wynik analizy zgłoszenia.")
      ).toBeInTheDocument()
    })

    const newCaseButton = screen.getByRole("button", {
      name: /nowe zgłoszenie/i,
    })
    fireEvent.click(newCaseButton)

    expect(sessionStorageMock.getItem("copilot_session")).toBeNull()
    expect(mockPush).toHaveBeenCalledWith("/")
  })

  it("shows typing indicator when isLoading is true", async () => {
    sessionStorageMock.setItem("copilot_session", JSON.stringify(mockSession))
    mockUseChatState.status = "submitted"

    const { default: ChatInterface } = await import("../ChatInterface")
    const { container } = render(<ChatInterface />)

    await waitFor(() => {
      expect(
        screen.getByText("Dzień dobry, oto wynik analizy zgłoszenia.")
      ).toBeInTheDocument()
    })

    // Typing indicator: three animated dots inside an assistant bubble
    const animatedDots = container.querySelectorAll(".animate-bounce")
    expect(animatedDots.length).toBe(3)
  })

  it("does not show typing indicator when not loading", async () => {
    sessionStorageMock.setItem("copilot_session", JSON.stringify(mockSession))
    mockUseChatState.status = "ready"

    const { default: ChatInterface } = await import("../ChatInterface")
    const { container } = render(<ChatInterface />)

    await waitFor(() => {
      expect(
        screen.getByText("Dzień dobry, oto wynik analizy zgłoszenia.")
      ).toBeInTheDocument()
    })

    const animatedDots = container.querySelectorAll(".animate-bounce")
    expect(animatedDots.length).toBe(0)
  })

  it("renders 'Nowe zgłoszenie' button in header", async () => {
    sessionStorageMock.setItem("copilot_session", JSON.stringify(mockSession))
    const { default: ChatInterface } = await import("../ChatInterface")
    render(<ChatInterface />)

    await waitFor(() => {
      expect(
        screen.getByText("Dzień dobry, oto wynik analizy zgłoszenia.")
      ).toBeInTheDocument()
    })

    expect(
      screen.getByRole("button", { name: /nowe zgłoszenie/i })
    ).toBeInTheDocument()
  })
})
