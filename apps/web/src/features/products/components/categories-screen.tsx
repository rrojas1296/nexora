"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { PageEntrance } from "@/components/ui/page-entrance";
import { RecordForm } from "@/features/demo/components/record-form";
import { QueryState } from "@/features/demo/components/query-state";
import { useCategories, useProductAccess, useProductMutation } from "../hooks/use-products";
import { categoryInputSchema, type CategoryInput } from "../schemas/product-schema";
import { productErrorKey } from "../services/product-error";

export function CategoriesScreen() {
  const t = useTranslations("Products");
  const access = useProductAccess();
  const query = useCategories();
  const mutation = useProductMutation();
  const form = useForm<CategoryInput>({
    resolver: zodResolver(categoryInputSchema),
    defaultValues: { name: "" },
  });
  return (
    <PageEntrance className="mx-auto w-full max-w-357 space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t("manageCategories")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("categoriesDescription")}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/products">{t("backToProducts")}</Link>
        </Button>
      </header>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border bg-card p-6">
          <h2 className="mb-5 text-base font-medium">{t("categoriesList")}</h2>
          <QueryState
            pending={query.isPending}
            error={query.isError}
            errorMessage={query.error ? t(`errors.${productErrorKey(query.error)}`) : undefined}
            retry={() => {
              void query.refetch();
            }}
          >
            {query.data?.length ? (
              <ul className="divide-y">
                {query.data.map((category) => (
                  <li key={category.id} className="break-words py-3 text-sm">
                    {category.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{t("categoriesEmpty")}</p>
            )}
          </QueryState>
        </section>
        {access.canWrite ? (
          <section className="rounded-3xl border bg-card p-6">
            <h2 className="mb-5 text-base font-medium">{t("createCategory")}</h2>
            <RecordForm
              form={form}
              fields={[{ name: "name", label: t("categoryName"), maxLength: 100 }]}
              pending={mutation.isPending}
              error={mutation.error}
              errorMessage={
                mutation.error ? t(`errors.${productErrorKey(mutation.error, true)}`) : undefined
              }
              success={mutation.isSuccess}
              onSave={async (input) => {
                try {
                  await mutation.mutateAsync({ type: "category", input });
                  if (access.isCurrent()) form.reset({ name: "" });
                } catch {
                  /* Preserve the draft and show the mutation error. */
                }
              }}
            />
          </section>
        ) : (
          <p className="text-sm text-muted-foreground">{t("readOnly")}</p>
        )}
      </div>
    </PageEntrance>
  );
}
