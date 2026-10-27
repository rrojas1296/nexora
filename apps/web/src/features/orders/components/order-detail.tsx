"use client";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { EditorDialog } from "@/features/demo/components/editor-dialog";
import { useCommerceAccess } from "@/features/commerce/hooks/use-commerce";
import type { Order } from "../schemas/order-schema";
import { OrderSummary } from "./order-summary";
export function OrderDetail({ order, onClose }: { order: Order; onClose: () => void }) {
  const t = useTranslations("Orders");
  const common = useTranslations("Demo");
  const c = useTranslations("Commerce");
  const { canWrite } = useCommerceAccess();
  return (
    <EditorDialog title={t("detail")} description={c("liveOrders")} busy={false} onClose={onClose}>
      <OrderSummary order={order} />
      <div className="mt-6 flex flex-wrap gap-2">
        {canWrite ? (
          <Button asChild variant="outline">
            <Link href={`/orders/${order.id}/edit`}>{common("edit")}</Link>
          </Button>
        ) : null}
        {order.threadId ? (
          <Button asChild variant="outline">
            <Link href="/conversations">{c("openInbox")}</Link>
          </Button>
        ) : null}
      </div>
    </EditorDialog>
  );
}
