export const META_WHATSAPP_GRAPH_CLIENT = Symbol("IMetaWhatsappGraphClient");

export interface IMetaWhatsappGraphClient {
  credentials(): { appId: string; secret: string; version: string };
  request(
    path: string,
    parameters: URLSearchParams,
    token?: string | undefined,
    body?: object | undefined,
  ): Promise<unknown>;
}
