import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import MessageBubble from "../MessageBubble"
import type { AgentDecision } from "@/lib/validation/types"

const mockDecision: AgentDecision = {
  decision: "zaakceptowano",
  justification:
    "Sprzęt wykazuje wadę produkcyjną zgodnie z regułą RULE-C-05, a data zakupu mieści się w okresie gwarancyjnym.",
  rulesApplied: ["RULE-C-05"],
  nextSteps: [
    "Przyjąć sprzęt do serwisu.",
    "Wystawić potwierdzenie przyjęcia reklamacji.",
  ],
  disclaimer:
    "Decyzja została wygenerowana automatycznie przez system AI. Pracownik jest odpowiedzialny za ostateczną weryfikację.",
}

describe("MessageBubble", () => {
  it("renders structured layout when isFirstMessage and agentDecision provided", () => {
    render(
      <MessageBubble
        role="assistant"
        content=""
        isFirstMessage
        agentDecision={mockDecision}
      />
    )

    expect(
      screen.getByText("Dzień dobry, oto wynik analizy zgłoszenia.")
    ).toBeInTheDocument()
    expect(screen.getByTestId("decision-badge")).toBeInTheDocument()
    expect(screen.getByText("Uzasadnienie:")).toBeInTheDocument()
    expect(screen.getByText("Kolejne kroki:")).toBeInTheDocument()
    expect(
      screen.getByText("Przyjąć sprzęt do serwisu.")
    ).toBeInTheDocument()
    expect(screen.getByText(mockDecision.disclaimer)).toBeInTheDocument()
  })

  it("renders plain text content for regular assistant message", () => {
    render(<MessageBubble role="assistant" content="Odpowiedź asystenta." />)
    expect(screen.getByText("Odpowiedź asystenta.")).toBeInTheDocument()
    expect(screen.queryByTestId("decision-badge")).not.toBeInTheDocument()
    expect(screen.queryByText("Uzasadnienie:")).not.toBeInTheDocument()
  })

  it("renders user message aligned right", () => {
    const { container } = render(
      <MessageBubble role="user" content="Wiadomość użytkownika." />
    )
    expect(screen.getByText("Wiadomość użytkownika.")).toBeInTheDocument()
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain("justify-end")
  })

  it("renders assistant message aligned left", () => {
    const { container } = render(
      <MessageBubble role="assistant" content="Odpowiedź." />
    )
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain("justify-start")
  })
})
