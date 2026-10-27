"use client";
import { useState } from "react";
import { useFieldArray, useWatch, type UseFormReturn } from "react-hook-form";
import { useFormatter, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { useClient, useClients } from "@/features/commerce/hooks/use-commerce";
import { useProducts } from "@/features/products/hooks/use-products";
import { CommerceQueryState as QueryState } from "@/features/commerce/components/commerce-query-state";
import { Pagination } from "@/features/demo/components/pagination";
import type { OrderInput } from "../schemas/order-schema";
import { OrderLineField } from "./order-line-field";
export function OrderCatalogFields({ form }: { form: UseFormReturn<OrderInput> }) {
  const t = useTranslations("Orders");
  const c = useTranslations("Commerce");
  const format = useFormatter();
  const [clientSearch, setClientSearch] = useState("");
  const [clientPage, setClientPage] = useState(1);
  const [productSearch, setProductSearch] = useState("");
  const [productPage, setProductPage] = useState(1);
  const clients = useClients({ search: clientSearch, page: clientPage, pageSize: 10 });
  const products = useProducts({
    search: productSearch,
    page: productPage,
    pageSize: 10,
    status: "active",
  });
  const clientId = useWatch({ control: form.control, name: "clientId" });
  const selected = useClient(clientId);
  const choices = (clients.data?.data ?? [])
    .filter((client) => client.active)
    .map((client) => ({ value: client.id, label: `${client.name} · ${client.phone}` }));
  if (clientId && !choices.some((option) => option.value === clientId))
    choices.unshift({ value: clientId, label: selected.data?.name ?? clientId });
  const productOptions = (products.data?.data ?? []).map((product) => ({
    value: product.id,
    label: `${product.name} · ${format.number(product.price, { style: "currency", currency: product.currency })} · ${c("stock")}: ${product.stock}`,
  }));
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });
  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <h2 className="text-sm font-medium">{t("client")}</h2>
        <InputField
          id="client-search"
          label={c("searchClients")}
          value={clientSearch}
          maxLength={100}
          onChange={(event) => {
            setClientSearch(event.target.value);
            setClientPage(1);
          }}
        />
        <QueryState
          pending={clients.isPending}
          error={clients.isError}
          retry={() => {
            void clients.refetch();
          }}
        >
          <label htmlFor="order-client" className="block text-xs font-medium">
            {c("selectClient")}
          </label>
          <FormSelectField
            control={form.control}
            name="clientId"
            id="order-client"
            options={choices}
            placeholder={c("selectClient")}
            aria-invalid={!!form.formState.errors.clientId}
          />
        </QueryState>
        {form.formState.errors.clientId ? (
          <p role="alert" className="text-xs text-destructive">
            {c("validation")}
          </p>
        ) : null}
        {clients.data && !clients.isError ? (
          <Pagination
            page={clientPage}
            pages={clients.data.pagination.pages}
            onPage={setClientPage}
          />
        ) : null}
      </section>
      <section className="space-y-4">
        <h2 className="text-sm font-medium">{c("items")}</h2>
        <InputField
          id="product-search"
          label={c("searchProducts")}
          value={productSearch}
          maxLength={100}
          onChange={(event) => {
            setProductSearch(event.target.value);
            setProductPage(1);
          }}
        />
        <QueryState
          pending={products.isPending}
          error={products.isError}
          retry={() => {
            void products.refetch();
          }}
        >
          <p className="text-xs text-muted-foreground">{c("catalogPage")}</p>
        </QueryState>
        {products.data && !products.isError ? (
          <Pagination
            page={productPage}
            pages={products.data.pagination.pages}
            onPage={setProductPage}
          />
        ) : null}
        {fields.map((field, index) => (
          <OrderLineField
            key={field.id}
            form={form}
            index={index}
            options={productOptions}
            onRemove={() => remove(index)}
          />
        ))}
        {form.formState.errors.items ? (
          <p role="alert" className="text-xs text-destructive">
            {c("itemsValidation")}
          </p>
        ) : null}
        <Button
          type="button"
          variant="outline"
          disabled={fields.length >= 10}
          onClick={() => append({ productId: "", quantity: 1 })}
        >
          {c("addLine")}
        </Button>
      </section>
    </div>
  );
}
