import { z } from "zod";
export const addressInput = z
  .strictObject({
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
    (input) => (input.latitude === null) === (input.longitude === null),
    "Coordinate pair required",
  );
export const addressCreate = addressInput.safeExtend({ id: z.uuid() });
export const addressUpdate = addressInput.safeExtend({ version: z.number().int().nonnegative() });
export const addressRemove = z.strictObject({ version: z.number().int().nonnegative() });
export const addressView = addressInput.safeExtend({ id: z.uuid(), version: z.number().int() });
export const addressResponse = z.object({ data: addressView });
export const addressesResponse = z.object({ data: z.array(addressView) });
