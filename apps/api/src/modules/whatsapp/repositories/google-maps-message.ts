import type { Prisma } from "../../../database/generated/client.js";
import type { AiReplyWork } from "../contracts/whatsapp-ai-store.js";
import { parseGoogleMapsLocation } from "../models/google-maps-location.js";
import { ToolInputError } from "./whatsapp-tool-error.js";

export function googleMapsMessageLocation(body: string) {
  const result = parseGoogleMapsLocation(body);
  if (!result.ok) throw new ToolInputError(result.reason);
  return result.location;
}
export async function readGoogleMapsMessageBody(
  tx: Prisma.TransactionClient,
  work: AiReplyWork,
  messageId: string,
) {
  const message = await tx.whatsappInboundMessage.findFirst({
    where: {
      id: messageId,
      businessId: work.businessId,
      threadId: work.threadId,
      direction: "INBOUND",
      type: "text",
      isDeleted: false,
    },
    select: { body: true },
  });
  if (!message) throw new ToolInputError("MAPS_MESSAGE_NOT_FOUND");
  return message.body;
}
