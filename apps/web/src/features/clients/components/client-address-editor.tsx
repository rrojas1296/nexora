"use client";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useCommerceAccess } from "@/features/commerce/hooks/use-commerce";
import { commerceErrorKey } from "@/features/commerce/services/commerce-error";
import { RecordForm } from "@/features/demo/components/record-form";
import { useAddressMutation } from "../hooks/use-client-addresses";
import {
  addressFormSchema,
  type AddressFormInput,
  type ClientAddress,
} from "../schemas/address-schema";
export function ClientAddressEditor({
  clientId,
  address,
  onClose,
}: {
  clientId: string;
  address?: ClientAddress;
  onClose: () => void;
}) {
  const t = useTranslations("Delivery");
  const c = useTranslations("Commerce");
  const { canWrite, isCurrent } = useCommerceAccess();
  const mutation = useAddressMutation(clientId);
  const creationId = useRef<string | null>(null);
  const version = useRef(address?.version);
  const form = useForm<AddressFormInput>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      label: address?.label ?? "",
      address: address?.address ?? "",
      reference: address?.reference ?? "",
      country: address?.country ?? "",
      city: address?.city ?? "",
      district: address?.district ?? "",
      latitude: address?.latitude?.toString() ?? "",
      longitude: address?.longitude?.toString() ?? "",
      isDefault: address?.isDefault ?? false,
    },
  });
  return (
    <div className="space-y-6">
      <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{t("addressHint")}</p>
      <RecordForm
        form={form}
        columns
        pending={mutation.isPending}
        error={mutation.error}
        errorMessage={c(commerceErrorKey(mutation.error))}
        validationMessage={c("validation")}
        readOnly={!canWrite}
        onCancel={onClose}
        fields={[
          { name: "label", label: t("label"), maxLength: 80 },
          { name: "isDefault", label: t("default"), kind: "checkbox" },
          { name: "address", label: t("address"), kind: "textarea", maxLength: 2048 },
          { name: "reference", label: t("reference"), kind: "textarea", maxLength: 1024 },
          { name: "country", label: t("country"), maxLength: 80 },
          { name: "city", label: t("city"), maxLength: 120 },
          { name: "district", label: t("district"), maxLength: 120 },
          { name: "latitude", label: t("latitude"), hint: t("coordinatesHint") },
          { name: "longitude", label: t("longitude") },
        ]}
        onSave={async (input) => {
          if (!isCurrent()) return;
          creationId.current ??= crypto.randomUUID();
          try {
            await mutation.mutateAsync({
              id: address?.id,
              input: {
                ...input,
                latitude: input.latitude === "" ? null : Number(input.latitude),
                longitude: input.longitude === "" ? null : Number(input.longitude),
                ...(address ? { version: version.current } : { id: creationId.current }),
              },
            });
            if (isCurrent()) onClose();
          } catch {
            /* Preserve UUID/version and draft; do not replay an uncertain mutation. */
          }
        }}
      />
      {address && canWrite ? (
        <Button
          variant="outline"
          disabled={mutation.isPending}
          onClick={async () => {
            if (!isCurrent() || !window.confirm(t("removeConfirm"))) return;
            try {
              await mutation.mutateAsync({
                id: address.id,
                input: { version: version.current },
                remove: true,
              });
              if (isCurrent()) onClose();
            } catch {
              /* Display the shared mutation error above. */
            }
          }}
        >
          {t("removeAddress")}
        </Button>
      ) : null}
    </div>
  );
}
