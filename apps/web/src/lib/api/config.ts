import { z } from "zod";

const publicEnvironmentSchema = z.object({
  apiUrl: z.url().refine((value) => ["http:", "https:"].includes(new URL(value).protocol), {
    message: "NEXT_PUBLIC_API_URL must use HTTP or HTTPS",
  }),
});

export const apiConfig = publicEnvironmentSchema.parse({
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1",
});
