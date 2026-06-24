import sharp from "sharp"

const ONE_MB = 1_048_576
const MAX_DIMENSION = 1920
const INITIAL_QUALITY = 80
const QUALITY_STEP = 10
const MIN_QUALITY = 40

export async function compressImage(
  buffer: Buffer,
  _mimeType: string,
): Promise<Buffer> {
  let quality = INITIAL_QUALITY

  while (quality >= MIN_QUALITY) {
    const result = await sharp(buffer)
      .resize(MAX_DIMENSION, MAX_DIMENSION, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality })
      .toBuffer()

    if (result.length <= ONE_MB) {
      return result
    }

    quality -= QUALITY_STEP
  }

  // Final attempt at minimum quality
  const finalResult = await sharp(buffer)
    .resize(MAX_DIMENSION, MAX_DIMENSION, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: MIN_QUALITY })
    .toBuffer()

  if (finalResult.length <= ONE_MB) {
    return finalResult
  }

  throw new Error("Image cannot be compressed to ≤ 1MB")
}
