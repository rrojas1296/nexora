import { Injectable } from "@nestjs/common";
import { createHash } from "node:crypto";
import type { IWhatsappMessageHasher } from "../contracts/whatsapp.ports.js";
import type { WhatsappMessage } from "../models/whatsapp.js";

@Injectable()
export class Sha256WhatsappMessageHasher implements IWhatsappMessageHasher {
  hash(message: WhatsappMessage): string {
    const canonical =
      message.type === "text"
        ? [message.type, message.to, message.text.body, message.text.previewUrl]
        : [
            message.type,
            message.to,
            message.template.name,
            message.template.language,
            message.template.bodyParameters,
          ];
    return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
  }
}
