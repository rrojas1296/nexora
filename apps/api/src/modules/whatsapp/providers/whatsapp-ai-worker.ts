import { Logger, type OnModuleInit, type OnModuleDestroy } from "@nestjs/common";
import type { WhatsappAiService } from "../services/whatsapp-ai.service.js";

export class WhatsappAiWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WhatsappAiWorker.name);
  private timer: ReturnType<typeof setInterval> | undefined;
  private running: Promise<void> | undefined;

  constructor(
    private readonly service: WhatsappAiService,
    private readonly enabled: boolean,
  ) {}

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
