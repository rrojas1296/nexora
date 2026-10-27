"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";
import { QueryState } from "@/features/demo/components/query-state";
import { DataTable } from "@/features/demo/components/data-table";
import { ListToolbar } from "@/features/demo/components/list-toolbar";
import { Pagination } from "@/features/demo/components/pagination";
import { StatusBadge } from "@/features/demo/components/status-badge";
import { EditorDialog } from "@/features/demo/components/editor-dialog";
import { MutationNotice } from "@/features/demo/components/mutation-notice";
import { Link } from "@/i18n/navigation";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { useProductAccess, useProductMutation, useProducts } from "../hooks/use-products";
import type { Product, ProductListFilters } from "../schemas/product-schema";
import { productErrorKey } from "../services/product-error";
import { ProductImage } from "./product-image";
import { ProductKpis } from "./product-kpis";

export function ProductsScreen() {
  const t = useTranslations("Products");
  const common = useTranslations("Demo");
  const format = useFormatter();
  const access = useProductAccess();
  const mutation = useProductMutation();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [filters, setFilters] = useState<ProductListFilters>({
    search: "",
    status: "all",
    page: 1,
    pageSize: 10,
  });
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [deleted, setDeleted] = useState(false);
  if (filters.search !== debouncedSearch) {
    setFilters({ ...filters, search: debouncedSearch, page: 1 });
  }
  const query = useProducts(filters);
  const products = query.data?.data ?? [];
  const pagination = query.data?.pagination;
  return (
    <div className="space-y-5">
      <ProductKpis summary={query.isError ? undefined : query.data?.summary} />
      {!access.canWrite ? <p className="text-xs text-muted-foreground">{t("readOnly")}</p> : null}
      {deleted ? <output className="block text-sm text-primary">{t("deleted")}</output> : null}
      <ListToolbar search={search} onSearch={setSearch} count={pagination?.total ?? 0}>
        <label className="space-y-2 text-xs">
          <span className="block">{common("statusLabel")}</span>
          <SelectField
            value={filters.status}
            onValueChange={(status) => {
              if (status === "all" || status === "active" || status === "inactive")
                setFilters((current) => ({ ...current, status, page: 1 }));
            }}
            options={[
              { value: "all", label: common("all") },
              { value: "active", label: common("status.active") },
              { value: "inactive", label: common("status.inactive") },
            ]}
          />
        </label>
        <Button asChild variant="outline">
          <Link href="/products/categories">{t("manageCategories")}</Link>
        </Button>
        {access.canWrite ? (
          <Button asChild variant="outline">
            <Link href="/products/import">{t("import.title")}</Link>
          </Button>
        ) : null}
        {access.canWrite ? (
          <Button asChild>
            <Link href="/products/new">
              <Plus className="size-4" aria-hidden="true" />
              {t("create")}
            </Link>
          </Button>
        ) : null}
      </ListToolbar>
      <QueryState
        pending={query.isPending}
        error={query.isError}
        errorMessage={query.error ? t(`errors.${productErrorKey(query.error)}`) : undefined}
        empty={!products.length}
        retry={() => {
          void query.refetch();
        }}
      >
        <DataTable
          caption={t("table")}
          rows={products}
          columns={[
            {
              key: "name",
              label: t("name"),
              render: (product) => (
                <div className="flex items-center gap-3">
                  <ProductImage url={product.imageUrl} name={product.name} />
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{product.category}</p>
                    <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
                      {product.description}
                    </p>
                  </div>
                </div>
              ),
            },
            { key: "sku", label: t("sku"), render: (product) => product.sku ?? "—" },
            {
              key: "price",
              label: t("price"),
              render: (product) =>
                format.number(product.price, {
                  style: "currency",
                  currency: product.currency,
                }),
            },
            {
              key: "stock",
              label: t("stock"),
              render: (product) => (
                <div>
                  {format.number(product.stock)}
                  {product.stock <= product.lowStockThreshold ? (
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                      {t("lowStock")}
                    </p>
                  ) : null}
                </div>
              ),
            },
            {
              key: "status",
              label: common("statusLabel"),
              render: (product) => <StatusBadge status={product.active ? "active" : "inactive"} />,
            },
            ...(access.canWrite
              ? [
                  {
                    key: "actions",
                    label: common("actions"),
                    render: (product: Product) => (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label={`${t("edit")}: ${product.name}`}
                          asChild
                        >
                          <Link href={`/products/${product.id}/edit`}>{common("edit")}</Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label={`${common("delete")}: ${product.name}`}
                          disabled={mutation.isPending}
                          onClick={() => {
                            mutation.reset();
                            setDeleted(false);
                            setDeleting(product);
                          }}
                        >
                          {common("delete")}
                        </Button>
                      </div>
                    ),
                  },
                ]
              : []),
          ]}
        />
        {pagination ? (
          <Pagination
            page={pagination.page}
            pages={pagination.pages}
            onPage={(page) => setFilters((current) => ({ ...current, page }))}
          />
        ) : null}
      </QueryState>
      {deleting ? (
        <EditorDialog
          title={t("deleteTitle")}
          description={t("deleteDescription", { name: deleting.name })}
          busy={mutation.isPending}
          onClose={() => setDeleting(null)}
        >
          <MutationNotice
            error={mutation.error}
            message={
              mutation.error ? t(`errors.${productErrorKey(mutation.error, true)}`) : undefined
            }
          />
          <div className="mt-5 flex justify-end gap-3">
            <Button
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => setDeleting(null)}
            >
              {common("cancel")}
            </Button>
            <Button
              disabled={mutation.isPending || !access.canWrite}
              onClick={() =>
                mutation.mutate(
                  { type: "delete", id: deleting.id },
                  {
                    onSuccess: () => {
                      if (access.isCurrent()) {
                        setDeleting(null);
                        setDeleted(true);
                      }
                    },
                  },
                )
              }
            >
              {common(mutation.isPending ? "saving" : "delete")}
            </Button>
          </div>
        </EditorDialog>
      ) : null}
    </div>
  );
}
