export const WHATSAPP_MEDIA_WORKER = Symbol("WhatsappMediaWorker");

export interface IWhatsappMediaWorker {
  onModuleInit(): void;
  onModuleDestroy(): Promise<void>;
}
