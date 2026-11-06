import { Injectable } from "@nestjs/common";
import {
  GoogleMapsLinkError,
  type IGoogleMapsLinkResolver,
} from "../contracts/google-maps-link-resolver.js";

function shortUrl(value: URL): boolean {
  return (
    (value.hostname === "maps.app.goo.gl" && /^\/[A-Za-z0-9_-]+$/.test(value.pathname)) ||
    (value.hostname === "goo.gl" && /^\/maps\/[A-Za-z0-9_-]+$/.test(value.pathname))
  );
}
function allowed(value: URL): boolean {
  if (
    value.protocol !== "https:" ||
    value.username ||
    value.password ||
    value.port ||
    value.hash ||
    value.href.length > 4096
  )
    return false;
  return (
    shortUrl(value) ||
    (["www.google.com", "google.com", "maps.google.com"].includes(value.hostname) &&
      (value.pathname === "/maps" ||
        value.pathname.startsWith("/maps/") ||
        (value.hostname === "maps.google.com" && value.pathname === "/")))
  );
}
@Injectable()
export class GoogleMapsLinkResolver implements IGoogleMapsLinkResolver {
  async resolve(value: string): Promise<string> {
    const signal = AbortSignal.timeout(4000);
    try {
      let current = new URL(value);
      if (!allowed(current) || !shortUrl(current))
        throw new GoogleMapsLinkError("MAPS_REDIRECT_BLOCKED");
      const visited = new Set<string>();
      for (let hop = 0; hop < 3; hop++) {
        if (!allowed(current) || !shortUrl(current) || visited.has(current.href))
          throw new GoogleMapsLinkError("MAPS_REDIRECT_BLOCKED");
        visited.add(current.href);
        const response = await fetch(current, {
          method: "GET",
          redirect: "manual",
          signal,
          headers: {
            Accept: "text/html",
            "User-Agent": "Mozilla/5.0 (compatible; NexoraMapsResolver/1.0)",
          },
          credentials: "omit",
          cache: "no-store",
        });
        // Only status/Location are needed: never read HTML, files, cookies or script redirects.
        const location = response.headers.get("location");
        await response.body?.cancel();
        if (
          ![301, 302, 303, 307, 308].includes(response.status) ||
          !location ||
          location.length > 4096
        )
          throw new GoogleMapsLinkError("MAPS_LINK_UNRESOLVED");
        const next = new URL(location, current);
        if (!allowed(next)) throw new GoogleMapsLinkError("MAPS_REDIRECT_BLOCKED");
        if (!shortUrl(next)) return next.href; // The long URL is parsed locally, not fetched.
        current = next;
      }
      throw new GoogleMapsLinkError("MAPS_LINK_UNRESOLVED");
    } catch (error) {
      if (signal.aborted) throw new GoogleMapsLinkError("MAPS_LINK_TIMEOUT");
      if (error instanceof GoogleMapsLinkError) throw error;
      throw new GoogleMapsLinkError("MAPS_LINK_UNRESOLVED");
    }
  }
}
