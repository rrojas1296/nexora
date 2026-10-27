export interface CommerceActor {
  businessId: string | null;
  userId: string;
  sessionId: string;
}
export interface CommerceQuery {
  page: number;
  pageSize: number;
  search: string;
  status?: "DRAFT" | "PENDING" | "PAID" | "SHIPPED" | "CANCELLED";
  clientId?: string;
}
export class CommerceError extends Error {
  constructor(
    readonly code:
      | "COMMERCE_FORBIDDEN"
      | "COMMERCE_NOT_FOUND"
      | "COMMERCE_CONFLICT"
      | "COMMERCE_INVALID_CLIENT"
      | "COMMERCE_INVALID_PRODUCTS"
      | "COMMERCE_INVALID_TRANSITION",
  ) {
    super(code);
  }
}
export function checkBusiness(actor: CommerceActor, businessId: string) {
  if (actor.businessId !== businessId) throw new CommerceError("COMMERCE_FORBIDDEN");
}
export function pagination(query: CommerceQuery, total: number) {
  return {
    page: query.page,
    pageSize: query.pageSize,
    total,
    pages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}
