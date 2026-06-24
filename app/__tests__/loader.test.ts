// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock fs before importing the module under test
vi.mock("fs", () => ({
  default: {
    readFileSync: vi.fn(),
  },
  readFileSync: vi.fn(),
}))

describe("getProcedureText", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it("returns non-empty string for reklamacja", async () => {
    const fs = await import("fs")
    vi.mocked(fs.readFileSync).mockReturnValue("# Complaint Procedure\n\nRULE-C-01 ...")

    const { getProcedureText } = await import("../lib/procedures/loader")
    const result = getProcedureText("reklamacja")

    expect(result).toBeTruthy()
    expect(result.length).toBeGreaterThan(0)
    expect(result).toContain("Complaint Procedure")
  })

  it("returns non-empty string for zwrot", async () => {
    const fs = await import("fs")
    vi.mocked(fs.readFileSync).mockReturnValue("# Return Procedure\n\nRULE-R-01 ...")

    const { getProcedureText } = await import("../lib/procedures/loader")
    const result = getProcedureText("zwrot")

    expect(result).toBeTruthy()
    expect(result.length).toBeGreaterThan(0)
    expect(result).toContain("Return Procedure")
  })

  it("returns different text for reklamacja vs zwrot", async () => {
    const fs = await import("fs")
    vi.mocked(fs.readFileSync)
      .mockReturnValueOnce("# Complaint Procedure text")
      .mockReturnValueOnce("# Return Procedure text")

    const { getProcedureText } = await import("../lib/procedures/loader")

    const complaint = getProcedureText("reklamacja")
    const returnProc = getProcedureText("zwrot")

    expect(complaint).not.toBe(returnProc)
  })
})
