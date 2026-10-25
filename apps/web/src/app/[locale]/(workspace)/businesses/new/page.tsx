import { getTranslations } from "next-intl/server";
import { BusinessForm } from "@/features/businesses/components/business-form";

export default async function NewBusinessPage() {
  const t = await getTranslations("Businesses");
  return (
    <div className="space-y-6">
      <h1 className="text-3xl tracking-tight">{t("create")}</h1>
      <p className="max-w-3xl text-sm leading-7 text-muted-foreground">{t("creationNotice")}</p>
      <BusinessForm />
    </div>
  );
}
