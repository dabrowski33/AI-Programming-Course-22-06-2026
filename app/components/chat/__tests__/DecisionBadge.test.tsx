import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import DecisionBadge from "../DecisionBadge"

describe("DecisionBadge", () => {
  it("renders 'Zaakceptowano' with green classes for zaakceptowano", () => {
    const { container } = render(<DecisionBadge decision="zaakceptowano" />)
    const badge = screen.getByTestId("decision-badge")
    expect(badge).toHaveTextContent("Zaakceptowano")
    expect(badge.className).toContain("bg-green-100")
    expect(badge.className).toContain("text-green-800")
  })

  it("renders 'Odrzucono' with red classes for odrzucono", () => {
    render(<DecisionBadge decision="odrzucono" />)
    const badge = screen.getByTestId("decision-badge")
    expect(badge).toHaveTextContent("Odrzucono")
    expect(badge.className).toContain("bg-red-100")
    expect(badge.className).toContain("text-red-800")
  })

  it("renders 'Wymaga weryfikacji' with amber classes for wymaga_weryfikacji", () => {
    render(<DecisionBadge decision="wymaga_weryfikacji" />)
    const badge = screen.getByTestId("decision-badge")
    expect(badge).toHaveTextContent("Wymaga weryfikacji")
    expect(badge.className).toContain("bg-amber-100")
    expect(badge.className).toContain("text-amber-800")
  })
})
