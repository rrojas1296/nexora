"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { defaultCurrency } from "@/lib/config/currency";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";
import { useWorkspace, useWorkspaceMutation } from "@/features/demo/hooks/use-workspace";
import { usePagedRows } from "@/features/demo/hooks/use-paged-rows";
import { QueryState } from "@/features/demo/components/query-state";
import { DataTable } from "@/features/demo/components/data-table";
import { ListToolbar } from "@/features/demo/components/list-toolbar";
import { Pagination } from "@/features/demo/components/pagination";
import { StatusBadge } from "@/features/demo/components/status-badge";
import { EditorDialog } from "@/features/demo/components/editor-dialog";
import { MutationNotice } from "@/features/demo/components/mutation-notice";
import type { Product } from "@/features/demo/types/workspace";
import { Link } from "@/i18n/navigation";
import { ResourceKpis } from "@/features/demo/components/resource-kpis";
import { useDemoScenarioStore } from "@/features/demo/stores/demo-scenario-store";

export function ProductsScreen() {
  const t = useTranslations("Products");
  const common = useTranslations("Demo");
  const format = useFormatter();
  const query = useWorkspace();
  const mutation = useWorkspaceMutation();
  const readOnly = useDemoScenarioStore((state) => state.scenario !== "normal");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [deleting, setDeleting] = useState<Product | null>(null);
  const products = (query.data?.products ?? []).filter(
    (product) =>
      `${product.name} ${product.sku}`.toLowerCase().includes(search.toLowerCase()) &&
      (status === "all" || (status === "active" ? product.active : !product.active)),
  );
  const paging = usePagedRows(products);
  return (
    <div className="space-y-5">
      <ResourceKpis resource="products" workspace={query.isError ? undefined : query.data} />
      <ListToolbar
        search={search}
        onSearch={(value) => {
          setSearch(value);
          paging.setPage(1);
        }}
        count={products.length}
      >
        <label className="space-y-2 text-xs">
          <span className="block">{common("statusLabel")}</span>
          <SelectField
            value={status}
            onValueChange={(value) => {
              setStatus(value);
              paging.setPage(1);
            }}
            options={[
              { value: "all", label: common("all") },
              { value: "active", label: common("status.active") },
              { value: "inactive", label: common("status.inactive") },
            ]}
          />
        </label>
        <Button asChild>
          <Link href="/products/new">
            <Plus className="size-4" aria-hidden="true" />
            {t("create")}
          </Link>
        </Button>
      </ListToolbar>
      <QueryState
        pending={query.isPending}
        error={query.isError}
        empty={!products.length}
        retry={() => {
          void query.refetch();
        }}
      >
        <DataTable
          caption={t("table")}
          rows={paging.rows}
          columns={[
            {
              key: "name",
              label: t("name"),
              render: (product) => (
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
                    {product.description}
                  </p>
                </div>
              ),
            },
            { key: "sku", label: t("sku"), render: (product) => product.sku },
            {
              key: "price",
              label: t("price"),
              render: (product) =>
                format.number(product.price, { style: "currency", currency: defaultCurrency }),
            },
            { key: "stock", label: t("stock"), render: (product) => product.stock },
            {
              key: "status",
              label: common("statusLabel"),
              render: (product) => <StatusBadge status={product.active ? "active" : "inactive"} />,
            },
            {
              key: "actions",
              label: common("actions"),
              render: (product) => (
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
                    disabled={readOnly}
                    onClick={() => {
                      mutation.reset();
                      setDeleting(product);
                    }}
                  >
                    {common("delete")}
                  </Button>
                </div>
              ),
            },
          ]}
        />
        <Pagination page={paging.page} pages={paging.pages} onPage={paging.setPage} />
      </QueryState>
      {deleting ? (
        <EditorDialog
          title={t("deleteTitle")}
          description={t("deleteDescription", { name: deleting.name })}
          busy={mutation.isPending}
          onClose={() => setDeleting(null)}
        >
          <MutationNotice error={mutation.error} />
          <div className="mt-5 flex justify-end gap-3">
            <Button
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => setDeleting(null)}
            >
              {common("cancel")}
            </Button>
            <Button
              disabled={mutation.isPending}
              onClick={() =>
                mutation.mutate(
                  { type: "product.delete", id: deleting.id },
                  { onSuccess: () => setDeleting(null) },
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
