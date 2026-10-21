"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { QueryState } from "@/features/demo/components/query-state";
import { useProduct, useProductAccess } from "../hooks/use-products";
import { productErrorKey } from "../services/product-error";
import { ProductEditor } from "./product-editor";

export function ProductEditorScreen({ id }: { id?: string }) {
  const t = useTranslations("Products");
  const editor = useTranslations("ResourceEditor");
  const router = useRouter();
  const access = useProductAccess();
  const query = useProduct(id);
  if (!access.canWrite || (id && !query.validId))
    return (
      <section className="rounded-3xl border bg-card p-6">
        <h2 className="text-lg">{editor(id && !query.validId ? "notFound" : "readOnly")}</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          {t(id && !query.validId ? "errors.missing" : "readOnly")}
        </p>
        <Button asChild variant="outline" className="mt-5">
          <Link href="/products">{editor("back")}</Link>
        </Button>
      </section>
    );
  return (
    <QueryState
      pending={!!id && query.isPending}
      error={!!id && query.isError}
      errorMessage={query.error ? t(`errors.${productErrorKey(query.error)}`) : undefined}
      retry={() => {
        void query.refetch();
      }}
    >
      {!id || query.data ? (
        <div className="grid items-start gap-6 xl:grid-cols-4">
          <section className="min-w-0 rounded-3xl border bg-card p-5 sm:p-7 xl:col-span-3">
            <ProductEditor
              key={id ?? "new"}
              product={query.data}
              onClose={() => router.push("/products")}
            />
          </section>
          <aside className="rounded-3xl border bg-card p-5">
            <h2 className="text-sm font-medium">{t("storageTitle")}</h2>
            <p className="mt-3 text-xs leading-6 text-muted-foreground">{t("storageHint")}</p>
            <p className="mt-4 border-t pt-4 text-xs leading-6 text-muted-foreground">
              {t("securityHint")}
            </p>
          </aside>
        </div>
      ) : null}
    </QueryState>
  );
}
