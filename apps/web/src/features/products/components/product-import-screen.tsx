"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { PageEntrance } from "@/components/ui/page-entrance";
import { QueryState } from "@/features/demo/components/query-state";
import { Link } from "@/i18n/navigation";
import { useCategories, useProductAccess } from "../hooks/use-products";
import { productErrorKey } from "../services/product-error";
import { ProductImportForm } from "./product-import-form";

export function ProductImportScreen() {
  const t = useTranslations("Products");
  const access = useProductAccess();
  const categories = useCategories();
  return (
    <PageEntrance className="mx-auto w-full max-w-357 space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t("import.title")}</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{t("import.description")}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/products">{t("backToProducts")}</Link>
        </Button>
      </header>
      {!access.canWrite ? (
        <p className="text-sm text-muted-foreground">{t("readOnly")}</p>
      ) : (
        <QueryState
          pending={categories.isPending}
          error={categories.isError}
          errorMessage={
            categories.error ? t(`errors.${productErrorKey(categories.error)}`) : undefined
          }
          retry={() => {
            void categories.refetch();
          }}
        >
          {categories.data?.length && access.scope ? (
            <ProductImportForm
              key={`${access.scope.userId}:${access.scope.businessId}`}
              categories={categories.data}
            />
          ) : (
            <div className="space-y-4 rounded-3xl border bg-card p-6">
              <p className="text-sm">{t("categoriesEmpty")}</p>
              <Button asChild variant="outline">
                <Link href="/products/categories">{t("manageCategories")}</Link>
              </Button>
            </div>
          )}
        </QueryState>
      )}
    </PageEntrance>
  );
}
