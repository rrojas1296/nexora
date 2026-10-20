import { z } from "zod";

function isPostgresUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      ["postgres:", "postgresql:"].includes(url.protocol) &&
      Boolean(url.hostname) &&
      url.pathname.length > 1
    );
  } catch {
    return false;
  }
}

function isExactOrigin(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      ["http:", "https:"].includes(url.protocol) &&
      url.origin === value &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

const originsSchema = z
  .string()
  .transform((value) => [...new Set(value.split(",").map((origin) => origin.trim()))])
  .pipe(z.array(z.string().refine(isExactOrigin)).min(1));

export const environmentSchema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    HOST: z.string().trim().min(1).default("127.0.0.1"),
    PORT: z.coerce.number().int().min(1).max(65535).default(8000),
    DATABASE_URL: z.string().refine(isPostgresUrl),
    CORS_ORIGINS: originsSchema,
  })
  .superRefine((environment, context) => {
    if (
      environment.NODE_ENV === "production" &&
      environment.CORS_ORIGINS.some((origin) => !origin.startsWith("https://"))
    ) {
      context.addIssue({
        code: "custom",
        path: ["CORS_ORIGINS"],
        message: "Production origins must use HTTPS",
      });
    }
  });

export type Environment = z.infer<typeof environmentSchema>;

export function validateEnvironment(input: Record<string, unknown>): Environment {
  const result = environmentSchema.safeParse(input);
  if (!result.success) {
    const keys = [...new Set(result.error.issues.map((issue) => issue.path.join(".")))];
    throw new Error(
      `Invalid API environment variables: ${keys.join(", ")}. See apps/api/.env.example.`,
    );
  }
  return result.data;
}
