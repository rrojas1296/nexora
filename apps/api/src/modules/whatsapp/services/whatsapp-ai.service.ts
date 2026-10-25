import { AiGenerationError, type AiTextGenerator } from "../contracts/ai-text-generator.js";
import type { WhatsappAiStore } from "../contracts/whatsapp-ai-store.js";
import type { WhatsappService } from "./whatsapp.service.js";

export class WhatsappAiService {
  constructor(
    private readonly store: WhatsappAiStore,
    private readonly generator: AiTextGenerator,
    private readonly sender: WhatsappService,
  ) {}

  async processOne() {
    await this.store.recoverExpired();
    const work = await this.store.claim(this.generator.provider, this.generator.model);
    if (!work) return;
    let reserved = false;
    try {
      const text = await this.generator.generate(work.input);
      const reservation = await this.store.reserve(work, text);
      if (!reservation) return;
      reserved = true;
      const result = await this.sender.dispatchReserved(
        work.businessId,
        reservation.message,
        reservation,
      );
      await this.store.finish(
        work.id,
        result.status === "ACCEPTED"
          ? "ACCEPTED"
          : result.status === "REJECTED"
            ? "FAILED"
            : "UNKNOWN",
        result.status === "REJECTED"
          ? "META_REJECTED"
          : result.status === "UNKNOWN"
            ? "SEND_UNCERTAIN"
            : undefined,
      );
    } catch (error) {
      // Neither OpenAI generation nor uncertain WhatsApp sends are automatically retried.
      await this.store.finish(
        work.id,
        reserved ? "UNKNOWN" : "FAILED",
        reserved
          ? "SEND_UNCERTAIN"
          : error instanceof AiGenerationError
            ? error.code
            : "PROCESSING_FAILED",
      );
    }
  }
}
