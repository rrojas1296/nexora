import sharp from "sharp";
import { ProductError } from "../domain/product.js";

export const maxProductImageBytes = 2 * 1024 * 1024;

export async function normalizeProductImage(data?: Buffer): Promise<Uint8Array> {
  if (!data?.length || data.length > maxProductImageBytes) {
    throw new ProductError("PRODUCT_IMAGE_INVALID");
  }
  try {
    const image = sharp(data, { limitInputPixels: 20_000_000, failOn: "warning" });
    const metadata = await image.metadata();
    if (!metadata.format || !["jpeg", "png", "webp"].includes(metadata.format)) {
      throw new ProductError("PRODUCT_IMAGE_INVALID");
    }
    // Decode and re-encode: discard metadata and never serve the original uploaded bytes.
    const output = await image
      .rotate()
      .resize({ width: 2048, height: 2048, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
    if (output.length > maxProductImageBytes) throw new ProductError("PRODUCT_IMAGE_INVALID");
    return new Uint8Array(output);
  } catch {
    throw new ProductError("PRODUCT_IMAGE_INVALID");
  }
}
