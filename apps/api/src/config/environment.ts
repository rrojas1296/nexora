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
    SWAGGER_ENABLED: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional(),
    HOST: z.string().trim().min(1).default("127.0.0.1"),
    PORT: z.coerce.number().int().min(1).max(65535).default(8000),
    DATABASE_URL: z.string().refine(isPostgresUrl),
    CORS_ORIGINS: originsSchema,
    AUTH_ACCESS_SECRET: z.string().min(64),
    AUTH_REFRESH_SECRET: z.string().min(64),
    AUTH_CSRF_SECRET: z.string().min(64),
    AUTH_ISSUER: z.string().trim().min(1).max(200).default("nexora-api"),
    AUTH_AUDIENCE: z.string().trim().min(1).max(200).default("nexora-web"),
    AUTH_ACCESS_TTL_SECONDS: z.coerce.number().int().min(60).max(3600).default(900),
    AUTH_REFRESH_TTL_SECONDS: z.coerce.number().int().min(3600).max(2592000).default(604800),
    AUTH_SESSION_TTL_SECONDS: z.coerce.number().int().min(3600).max(7776000).default(2592000),
    AUTH_CSRF_TTL_SECONDS: z.coerce.number().int().min(60).max(86400).default(3600),
    BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: z.string().trim().min(1).max(256).optional(),
    WHATSAPP_APP_SECRET: z.string().trim().min(1).max(256).optional(),
    WHATSAPP_LOGIN_CONFIG_ID: z
      .string()
      .regex(/^[1-9]\d{4,29}$/)
      .optional(),
    WHATSAPP_OAUTH_REDIRECT_URI: z
      .url()
      .refine((value) => {
        try {
          const url = new URL(value);
          return (
            url.protocol === "http:" &&
            !url.username &&
            !url.password &&
            !value.includes("?") &&
            !value.includes("#") &&
            url.pathname === "/api/v1/whatsapp/oauth/callback"
          );
        } catch {
          return false;
        }
      })
      .optional(),
    WHATSAPP_APP_ID: z
      .string()
      .regex(/^[1-9]\d{4,29}$/)
      .optional(),
    WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID: z
      .string()
      .regex(/^[1-9]\d{4,29}$/)
      .optional(),
    WHATSAPP_GRAPH_API_VERSION: z
      .string()
      .regex(/^v[1-9]\d{0,2}\.0$/)
      .optional(),
    WHATSAPP_CREDENTIALS_KEY: z
      .string()
      .regex(/^[A-Za-z0-9+/]{43}=$/)
      .optional(),
  })
  .superRefine((environment, context) => {
    if (
      new Set([
        environment.AUTH_ACCESS_SECRET,
        environment.AUTH_REFRESH_SECRET,
        environment.AUTH_CSRF_SECRET,
      ]).size !== 3
    ) {
      context.addIssue({
        code: "custom",
        path: ["AUTH_ACCESS_SECRET"],
        message: "Authentication secrets must be distinct",
      });
    }
    if (
      environment.AUTH_ACCESS_TTL_SECONDS >= environment.AUTH_REFRESH_TTL_SECONDS ||
      environment.AUTH_REFRESH_TTL_SECONDS > environment.AUTH_SESSION_TTL_SECONDS
    ) {
      context.addIssue({
        code: "custom",
        path: ["AUTH_REFRESH_TTL_SECONDS"],
        message: "TTL must satisfy access < refresh <= session",
      });
    }
    const callback = environment.WHATSAPP_OAUTH_REDIRECT_URI
      ? URL.parse(environment.WHATSAPP_OAUTH_REDIRECT_URI)
      : null;
    if (callback && !environment.CORS_ORIGINS.includes(callback.origin)) {
      context.addIssue({
        code: "custom",
        path: ["WHATSAPP_OAUTH_REDIRECT_URI"],
        message: "OAuth callback must use an allowed public web origin",
      });
    }
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
