import { z } from "zod";

// Server configuration only: never import this module into a client boundary.
export const internalApiUrl = z
  .url()
  .refine((value) => {
    const url = new URL(value);
    return (
      ["http:", "https:"].includes(url.protocol) &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash
    );
  }, "API_INTERNAL_URL must be an HTTP(S) base URL without credentials, query or fragment")
  .parse(process.env.API_INTERNAL_URL ?? "http://localhost:8000/api/v1")
  .replace(/\/$/, "");
