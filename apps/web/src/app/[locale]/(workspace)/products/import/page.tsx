import { ProductImportScreen } from "@/features/products/components/product-import-screen";

// Auth may omit this segment while verifying the session.
export const instant = false;

export default function ProductImportPage() {
  return <ProductImportScreen />;
}
