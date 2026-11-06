import { z } from "zod";
export const addressInputSchema = z
  .object({
    label: z.string().trim().min(1).max(80),
    address: z.string().trim().min(1).max(2048),
    reference: z.string().trim().max(1024),
    country: z.string().trim().max(80),
    city: z.string().trim().max(120),
    district: z.string().trim().max(120),
    latitude: z.number().min(-90).max(90).nullable(),
    longitude: z.number().min(-180).max(180).nullable(),
    isDefault: z.boolean(),
  })
  .refine(
    (value) => (value.latitude === null) === (value.longitude === null),
    "Coordinates require both values",
  );
export const addressSchema = addressInputSchema.safeExtend({
  id: z.uuid(),
  version: z.number().int().nonnegative(),
});
export const addressesSchema = z.object({ data: z.array(addressSchema) });
export const addressResponseSchema = z.object({ data: addressSchema });
const coordinateText = (min: number, max: number) =>
  z
    .string()
    .trim()
    .refine(
      (text) =>
        text === "" ||
        (Number.isFinite(Number(text)) && Number(text) >= min && Number(text) <= max),
      "Invalid coordinate",
    );
export const addressFormSchema = z
  .object({
    ...addressInputSchema.shape,
    latitude: coordinateText(-90, 90),
    longitude: coordinateText(-180, 180),
  })
  .refine((value) => (value.latitude === "") === (value.longitude === ""), {
    message: "Coordinate pair required",
    path: ["latitude"],
  });
export type AddressFormInput = z.infer<typeof addressFormSchema>;
export type AddressInput = z.infer<typeof addressInputSchema>;
export type ClientAddress = z.infer<typeof addressSchema>;
