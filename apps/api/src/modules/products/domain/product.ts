export class ProductError extends Error {
  constructor(
    readonly code:
      | "PRODUCT_FORBIDDEN"
      | "PRODUCT_NOT_FOUND"
      | "PRODUCT_SKU_EXISTS"
      | "PRODUCT_HAS_ORDERS",
  ) {
    super(code);
  }
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
}

export interface ProductList {
  data: Product[];
  pagination: { page: number; pageSize: number; total: number; pages: number };
  summary: ProductSummary;
}
