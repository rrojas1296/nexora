export class ProductError extends Error {
  constructor(
    readonly code:
      | "PRODUCT_FORBIDDEN"
      | "PRODUCT_NOT_FOUND"
      | "PRODUCT_SKU_EXISTS"
      | "PRODUCT_HAS_ORDERS"
      | "PRODUCT_CATEGORY_EXISTS"
      | "PRODUCT_CATEGORY_INVALID"
      | "PRODUCT_IMAGE_INVALID"
      | "PRODUCT_IMAGE_LIMIT",
  ) {
    super(code);
  }
}

export interface StoredProductImage {
  id: string;
  data: Uint8Array;
}

export interface ProductCategory {
  id: string;
  name: string;
}

export interface ProductActor {
  userId: string;
  businessId: string;
  sessionId: string;
}

export interface ProductInput {
  name: string;
  sku: string;
  description: string;
  category: string;
  imageUrl: string;
  brand: string;
  supplier: string;
  barcode: string;
  price: string;
  cost: string;
  compareAtPrice: string;
  stock: number;
  lowStockThreshold: number;
  weight: number;
  active: boolean;
}

export interface Product extends ProductInput {
  id: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListQuery {
  page: number;
  pageSize: number;
  search: string;
  status: "all" | "active" | "inactive";
}

export interface ProductSummary {
  catalog: number;
  available: number;
  lowStock: number;
  inventoryValue: string;
  currency: string;
}

export interface ProductList {
  data: Product[];
  pagination: { page: number; pageSize: number; total: number; pages: number };
  summary: ProductSummary;
}
