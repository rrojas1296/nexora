import type { Order } from "../types/workspace";

// Synthetic calendar-year examples, including future months. Not actual sales or forecasts.
const annualVolumes = [
  {
    year: 2025,
    quantities: [34, 42, 39, 56, 61, 52, 67, 72, 58, 81, 96, 112],
    orderCounts: [3, 4, 3, 5, 6, 5, 7, 6, 5, 8, 10, 12],
  },
  {
    year: 2026,
    quantities: [48, 57, 51, 73, 86, 78, 94, 108, 89, 119, 142, 168],
    orderCounts: [5, 6, 5, 7, 8, 7, 9, 10, 8, 11, 13, 15],
  },
];

function distributeUnits(total: number, count: number, index: number) {
  return Math.floor(total / count) + (index < total % count ? 1 : 0);
}

// Order counts and revenue both vary by month, derived from the same linked orders.
export const monthlyOrdersFixture: Order[] = annualVolumes.flatMap(
  ({ year, quantities, orderCounts }) =>
    quantities.flatMap((quantity, month) => {
      const count = orderCounts[month] ?? 1;
      return Array.from({ length: count }, (_, index): Order => {
        const monthLabel = String(month + 1).padStart(2, "0");
        const day = String(4 + Math.floor((index * 20) / count)).padStart(2, "0");
        return {
          id: `ORD-DEMO-${year}-${monthLabel}-${String(index + 1).padStart(2, "0")}`,
          clientId: index % 2 === 0 ? "c1" : "c2",
          storeId: "s1",
          status: index % 3 === 0 ? "paid" : "shipped",
          createdAt: `${year}-${monthLabel}-${day}T12:00:00Z`,
          currency: "USD",
          items: [
            {
              productId: "p1",
              name: "Luna Tote",
              quantity: distributeUnits(quantity, count, index),
              unitPrice: 29,
            },
            {
              productId: "p2",
              name: "Terra Cup",
              quantity: distributeUnits(Math.ceil(quantity * 0.6), count, index),
              unitPrice: 18.5,
            },
            {
              productId: "p4",
              name: "Oliva Notebook",
              quantity: distributeUnits(Math.ceil(quantity * 0.4), count, index),
              unitPrice: 14,
            },
          ],
        };
      });
    }),
);
