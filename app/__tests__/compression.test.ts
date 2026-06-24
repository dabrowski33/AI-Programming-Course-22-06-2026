// @vitest-environment node
import { describe, it, expect } from "vitest"
import { compressImage } from "../lib/compression/image"
import sharp from "sharp"

async function makeSyntheticBuffer(widthPx: number, heightPx: number): Promise<Buffer> {
  return sharp({
    create: {
      width: widthPx,
      height: heightPx,
      channels: 3,
      background: { r: 200, g: 150, b: 100 },
    },
  })
    .jpeg({ quality: 100 })
    .toBuffer()
}

describe("compressImage", () => {
  it("returns a JPEG buffer ≤ 1MB for a large synthetic image", async () => {
    // Create a large-ish synthetic JPEG
    const inputBuffer = await makeSyntheticBuffer(3000, 2000)

    const result = await compressImage(inputBuffer, "image/jpeg")

    expect(result).toBeInstanceOf(Buffer)
    expect(result.length).toBeLessThanOrEqual(1_048_576)
  })

  it("returns a buffer ≤ 1MB for a 1920x1920 PNG-style input", async () => {
    const inputBuffer = await makeSyntheticBuffer(1920, 1920)

    const result = await compressImage(inputBuffer, "image/png")

    expect(result).toBeInstanceOf(Buffer)
    expect(result.length).toBeLessThanOrEqual(1_048_576)
  })

  it("does not enlarge small images beyond original dimensions", async () => {
    const inputBuffer = await makeSyntheticBuffer(400, 300)

    const result = await compressImage(inputBuffer, "image/jpeg")
    const meta = await sharp(result).metadata()

    expect(meta.width).toBeLessThanOrEqual(400)
    expect(meta.height).toBeLessThanOrEqual(300)
  })

  it("produces valid JPEG output regardless of input type label", async () => {
    const inputBuffer = await makeSyntheticBuffer(800, 600)

    const result = await compressImage(inputBuffer, "image/webp")
    const meta = await sharp(result).metadata()

    expect(meta.format).toBe("jpeg")
  })
})
