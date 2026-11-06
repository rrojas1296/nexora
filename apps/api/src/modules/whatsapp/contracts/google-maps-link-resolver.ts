export const GOOGLE_MAPS_LINK_RESOLVER = Symbol("GOOGLE_MAPS_LINK_RESOLVER");
export interface IGoogleMapsLinkResolver {
  resolve(shortUrl: string): Promise<string>;
}
export class GoogleMapsLinkError extends Error {
  constructor(
    readonly code: "MAPS_LINK_UNRESOLVED" | "MAPS_REDIRECT_BLOCKED" | "MAPS_LINK_TIMEOUT",
  ) {
    super(code);
  }
}
