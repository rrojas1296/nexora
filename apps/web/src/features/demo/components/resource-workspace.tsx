import { PageEntrance } from "@/components/ui/page-entrance";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { validateResource } from "../lib/resources";
import { DemoToolbar } from "./demo-toolbar";
import { DemoContent } from "./demo-content";
import { ResourceEditorScreen } from "./resource-editor-screen";
import { ProductEditorScreen } from "@/features/products/components/product-editor-screen";

const namespaces = {
  products: "Products",
  clients: "Clients",
  stores: "Stores",
  orders: "Orders",
} as const;
export async function ResourceWorkspace({ module, id }: { module: string; id?: string }) {
  const resource = validateResource(module);
  const [t, nav] = await Promise.all([
    getTranslations(namespaces[resource]),
    getTranslations("Nav"),
  ]);
  return (
    <PageEntrance key={`${resource}:${id ?? "new"}`} className="space-y-6">
      <header className="space-y-4">
        <Link
          href={`/${resource}`}
          className="inline-flex items-center gap-2 rounded-full text-xs text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {nav(resource)}
        </Link>
        <h1 className="text-3xl font-normal tracking-tight sm:text-4xl">
          {t(id ? "edit" : "create")}
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{t("formHint")}</p>
      </header>
      {resource === "products" ? (
        <ProductEditorScreen id={id} />
      ) : (
        <>
          <DemoToolbar />
          <DemoContent>
            <ResourceEditorScreen resource={resource} id={id} />
          </DemoContent>
        </>
      )}
    </PageEntrance>
  );
}
