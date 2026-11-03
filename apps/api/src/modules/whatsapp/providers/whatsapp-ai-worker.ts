import { WhatsappAiService } from "../services/whatsapp-ai.service.js";
import { Injectable, Logger, type OnModuleInit, type OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { IWhatsappAiWorker } from "../contracts/whatsapp-ai-worker.js";
import type { Environment } from "../../../config/environment.js";

@Injectable()
export class WhatsappAiWorker implements IWhatsappAiWorker, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WhatsappAiWorker.name);
  private timer: ReturnType<typeof setInterval> | undefined;
  private running: Promise<void> | undefined;

  constructor(
    private readonly service: WhatsappAiService,
    config: ConfigService<Environment, true>,
  ) {
    this.enabled = config.get("AI_AUTOREPLY_ENABLED", { infer: true });
  }

  private readonly enabled: boolean;

  onModuleInit() {
    if (!this.enabled) return;
    this.timer = setInterval(() => {
      if (this.running) return;
      this.running = this.service
        .processOne()
        .catch(() => {
          this.logger.error(
            "AI reply worker failed; inspect configuration/database availability. No automatic send retry.",
          );
        })
        .finally(() => {
          this.running = undefined;
        });
    }, 2000);
    this.timer.unref();
  }

  async onModuleDestroy() {
    clearInterval(this.timer);
    await this.running;
  }
}
