export const WHATSAPP_AI_WORKER = Symbol("WhatsappAiWorker");

export interface IWhatsappAiWorker {
  onModuleInit(): void;
  onModuleDestroy(): Promise<void>;
}
