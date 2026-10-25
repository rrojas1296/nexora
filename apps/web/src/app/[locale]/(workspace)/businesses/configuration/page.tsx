import { getTranslations } from "next-intl/server";
import { BusinessConfigurationScreen } from "@/features/businesses/components/business-configuration-screen";

export default async function BusinessConfigurationPage() {
  const t = await getTranslations("Businesses");
  return (
    <div className="space-y-6">
      <h1 className="text-3xl tracking-tight">{t("configuration")}</h1>
      <BusinessConfigurationScreen />
    </div>
  );
}
