import { Prisma } from "../../../database/generated/client.js";

export const orderInclude = {
  items: { where: { isDeleted: false } },
  proofs: {
    where: { isDeleted: false },
    select: { id: true, messageId: true, status: true, revision: true },
  },
} satisfies Prisma.OrderInclude;
export type CommerceOrder = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

export function orderView(order: CommerceOrder) {
  const subtotal = order.items.reduce(
    (sum, item) => sum.plus(item.unitPrice.mul(item.quantity)),
    new Prisma.Decimal(0),
  );
  return {
    id: order.id,
    reference: order.reference,
    version: order.version,
    status: order.status,
    currency: order.currency,
    subtotal: subtotal.toFixed(2),
    paymentStatus: order.paymentStatus,
    deliveryMode: order.deliveryMode,
    deliveryAddress: order.deliveryAddress,
    deliveryReference: order.deliveryReference,
    latitude: order.deliveryLatitude,
    longitude: order.deliveryLongitude,
    deliveryQuoteStatus: order.deliveryQuoteStatus,
    items: order.items.map((item) => ({
      productId: item.productId,
      name: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toFixed(2),
    })),
    proofs: order.proofs,
  };
}
