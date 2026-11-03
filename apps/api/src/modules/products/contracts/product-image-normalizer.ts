export const PRODUCT_IMAGE_NORMALIZER = Symbol("ProductImageNormalizer");

export interface IProductImageNormalizer {
  normalize(data?: Uint8Array): Promise<Uint8Array>;
}
