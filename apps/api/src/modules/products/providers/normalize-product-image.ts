import { Injectable } from "@nestjs/common";
import type { IProductImageNormalizer } from "../contracts/product-image-normalizer.js";
import { ProductError } from "../models/product.js";
import { maxProductImageBytes } from "../models/product-image.js";
import sharp from "sharp";

@Injectable()
export class SharpProductImageNormalizer implements IProductImageNormalizer {
  async normalize(data?: Uint8Array): Promise<Uint8Array> {
    if (!data?.length || data.length > maxProductImageBytes) {
      throw new ProductError("PRODUCT_IMAGE_INVALID");
    }
    try {
      const image = sharp(Buffer.from(data), { limitInputPixels: 20_000_000, failOn: "warning" });
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
}
