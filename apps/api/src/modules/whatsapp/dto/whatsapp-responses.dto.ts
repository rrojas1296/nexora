import { z } from "zod";
import { envelope } from "../../../common/documentation/response-schemas.js";

const id = z.uuid();
const timestamp = z.iso.datetime();
const timestamps = { createdAt: timestamp, updatedAt: timestamp };

export const connectionResponse = z.object({
  id,
  phoneNumberId: z.string(),
  displayPhoneNumber: z.string(),
  verifiedName: z.string(),
  updatedAt: timestamp,
});
export const attemptResponse = envelope(
  z.object({
    id,
    status: z.enum(["PENDING", "ACCEPTED", "REJECTED", "UNKNOWN"]),
    providerMessageId: z.string().nullable(),
    providerErrorCode: z.number().int().nullable(),
    providerHttpStatus: z.number().int().nullable(),
    ...timestamps,
  }),
);
