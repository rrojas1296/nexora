export interface GoogleMapsLocation {
  address: string;
  latitude: number | null;
  longitude: number | null;
  source: "PLACE_POINT" | "QUERY_POINT" | "TEXT_LABEL";
}
export type GoogleMapsLocationResult =
  | { ok: true; location: GoogleMapsLocation }
  | {
      ok: false;
      reason:
        | "MAPS_URL_REQUIRED"
        | "MAPS_SHORT_URL_UNSUPPORTED"
        | "MAPS_URL_UNSUPPORTED"
        | "MAPS_LOCATION_AMBIGUOUS"
        | "MAPS_COORDINATES_INVALID"
        | "MAPS_CENTER_ONLY";
    };

const hosts = new Set(["google.com", "www.google.com", "maps.google.com"]);
const coordinatePattern = /^([+-]?\d+(?:\.\d+)?),\s*([+-]?\d+(?:\.\d+)?)$/;
function coordinates(value: string): { latitude: number; longitude: number } | null {
  const match = coordinatePattern.exec(value.trim());
  if (!match) return null;
  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  return Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
    ? { latitude, longitude }
    : null;
}
function label(value: string): string {
  return value
    .replace(/\p{Cc}/gu, " ")
    .trim()
    .slice(0, 2048);
}
// Pure local parsing. Never fetch, expand redirects, geocode, or use @ camera coordinates.
export function parseGoogleMapsLocation(text: string): GoogleMapsLocationResult {
  const links = text.match(/https?:\/\/[^\s<>"']+/gi) ?? [];
  if (links.length === 0) return { ok: false, reason: "MAPS_URL_REQUIRED" };
  if (links.length !== 1) return { ok: false, reason: "MAPS_LOCATION_AMBIGUOUS" };
  try {
    const raw = links[0]!.replace(/[.,;]+$/, "");
    if (raw.length > 4096) return { ok: false, reason: "MAPS_URL_UNSUPPORTED" };
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.username || url.password || url.port || url.hash)
      return { ok: false, reason: "MAPS_URL_UNSUPPORTED" };
    if (
      url.hostname === "maps.app.goo.gl" ||
      (url.hostname === "goo.gl" && url.pathname.startsWith("/maps"))
    )
      return { ok: false, reason: "MAPS_SHORT_URL_UNSUPPORTED" };
    if (
      !hosts.has(url.hostname) ||
      !(
        url.pathname === "/maps" ||
        /^\/maps\/(?:place\/|search(?:\/|$)|$)/.test(url.pathname) ||
        (url.hostname === "maps.google.com" && url.pathname === "/")
      )
    )
      return { ok: false, reason: "MAPS_URL_UNSUPPORTED" };
    const path = decodeURIComponent(url.pathname);
    const place = /\/maps\/place\/([^/]+)/.exec(path)?.[1];
    const address = place ? label(place.replace(/\+/g, " ")) : "";
    const points: { latitude: number; longitude: number; source: "PLACE_POINT" | "QUERY_POINT" }[] =
      [];
    const data = path.split("/data=");
    if (data.length > 2) return { ok: false, reason: "MAPS_LOCATION_AMBIGUOUS" };
    const placeData = place ? (data[1] ?? "") : "";
    const markers = [...placeData.matchAll(/!3d([^!/?]+)!4d([^!/?]+)/g)];
    if (
      (placeData.match(/!3d/g)?.length ?? 0) !== markers.length ||
      (placeData.match(/!4d/g)?.length ?? 0) !== markers.length
    )
      return { ok: false, reason: "MAPS_COORDINATES_INVALID" };
    for (const marker of markers) {
      const point = coordinates(`${marker[1]},${marker[2]}`);
      if (!point) return { ok: false, reason: "MAPS_COORDINATES_INVALID" };
      points.push({ ...point, source: "PLACE_POINT" });
    }
    const queries = [...url.searchParams.getAll("q"), ...url.searchParams.getAll("query")];
    if (queries.length > 1) return { ok: false, reason: "MAPS_LOCATION_AMBIGUOUS" };
    const query = queries[0]?.trim() ?? "";
    const queryPoint = coordinates(query);
    if (queryPoint) points.push({ ...queryPoint, source: "QUERY_POINT" });
    else if (query && /^[+\-\d.,\s]+$/.test(query))
      return { ok: false, reason: "MAPS_COORDINATES_INVALID" };
    if (
      points.some(
        (point) =>
          point.latitude !== points[0]!.latitude || point.longitude !== points[0]!.longitude,
      )
    )
      return { ok: false, reason: "MAPS_LOCATION_AMBIGUOUS" };
    const point = points[0];
    if (point) return { ok: true, location: { ...point, address } };
    if (path.includes("/@")) return { ok: false, reason: "MAPS_CENTER_ONLY" };
    const addressText = address || label(query);
    if (!addressText) return { ok: false, reason: "MAPS_URL_UNSUPPORTED" };
    return {
      ok: true,
      location: { address: addressText, latitude: null, longitude: null, source: "TEXT_LABEL" },
    };
  } catch {
    return { ok: false, reason: "MAPS_URL_UNSUPPORTED" };
  }
}
