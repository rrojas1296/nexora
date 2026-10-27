import { AiGenerationError, type AiTextGenerator } from "../contracts/ai-text-generator.js";
import type { AiToolExchange, AiToolExecutor } from "../contracts/ai-tools.js";
import type { AiReplyFallbackReason, AiReplyWork } from "../contracts/whatsapp-ai-store.js";
import type { WhatsappAiStore } from "../contracts/whatsapp-ai-store.js";
import type { WhatsappService } from "./whatsapp.service.js";

export class WhatsappAiService {
  constructor(
    private readonly store: WhatsappAiStore,
    private readonly generator: AiTextGenerator,
    private readonly sender: WhatsappService,
    private readonly tools: AiToolExecutor,
  ) {}

  private async generate(work: AiReplyWork): Promise<string> {
    const deadline = Date.now() + 85_000;
    const exchanges: AiToolExchange[] = [];
    for (let turn = 0; turn < 8; turn++) {
      if (Date.now() >= deadline) throw new AiGenerationError("UNAVAILABLE");
      const result = await this.generator.generate(
        work.input,
        this.tools.definitions,
        exchanges,
        deadline - Date.now(),
      );
      if (result.type === "message") return result.text;
      if (turn === 4 || result.calls.length !== 1) throw new AiGenerationError("INVALID_RESPONSE");
      const call = result.calls[0]!;
      if (exchanges.some((exchange) => exchange.call.id === call.id))
        throw new AiGenerationError("INVALID_RESPONSE");
      if (Date.now() >= deadline) throw new AiGenerationError("UNAVAILABLE");
      const output = await this.tools.execute(work, call);
      if (output.data.error === "WORK_NO_LONGER_ELIGIBLE")
        throw new AiGenerationError("UNAVAILABLE");
      if (output.finalText) return output.finalText;
      exchanges.push({ call, output: JSON.stringify(output.data) });
    }
    throw new AiGenerationError("INVALID_RESPONSE");
  }

  private async generateOrFallback(
    work: AiReplyWork,
  ): Promise<{ text: string; fallbackReason?: AiReplyFallbackReason }> {
    try {
      const text = (await this.generate(work)).trim();
      if (!text || text.length > 4096) throw new AiGenerationError("INVALID_RESPONSE");
      return { text };
    } catch (error) {
      // A generation/tool failure is not proof that information is absent or an action failed.
      return {
        text: [
          "No pude obtener una respuesta confiable para tu consulta en este momento. Puedes reformular la pregunta o pedir ayuda a un asesor. Si consultabas un pedido o pago, pide revisar su estado antes de repetir la operación.",
          "I couldn't obtain a reliable answer to your question right now. Please rephrase it or ask for human assistance. For an order or payment, ask to check its status before repeating the operation.",
        ].join("\n\n"),
        fallbackReason: error instanceof AiGenerationError ? error.code : "PROCESSING_FAILED",
      };
    }
  }

  async processOne() {
    await this.store.recoverExpired();
    const work = await this.store.claim(this.generator.provider, this.generator.model);
    if (!work) return;
    let reserved = false;
    try {
      const reply = await this.generateOrFallback(work);
      const reservation = await this.store.reserve(work, reply.text, {
        fallbackReason: reply.fallbackReason,
      });
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
