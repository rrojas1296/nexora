import { applyDecorators } from "@nestjs/common";
import {
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  type SchemaObject,
} from "@nestjs/swagger";
import { z } from "zod";

interface RouteDocumentation {
  summary: string;
  description?: string;
  auth?: "access" | "refresh" | "none";
  csrf?: boolean;
  params?: string[];
  query?: z.ZodObject;
  queryRequired?: boolean;
  body?: z.ZodType;
  response?: z.ZodType;
  responseSchema?: SchemaObject;
  status?: number;
  mediaType?: string;
  errors?: Record<number, string>;
}

// Runtime validation stays in the existing Zod parsers, not Swagger DTOs/plugins.
export function openApiSchema(schema: z.ZodType, io: "input" | "output" = "input"): SchemaObject {
  const result = z.toJSONSchema(schema, { target: "openapi-3.0", io }) as SchemaObject;
  if (io === "input") {
    for (const [name, property] of Object.entries(result.properties ?? {})) {
      if (
        (name.toLowerCase().includes("password") || name === "accessToken") &&
        !("$ref" in property)
      ) {
        property.format = "password";
        property.writeOnly = true;
      }
    }
  }
  return result;
}

export function ApiRoute(options: RouteDocumentation) {
  const auth = options.auth ?? "access";
  const decorators = [ApiOperation({ summary: options.summary, description: options.description })];
  if (auth !== "none") decorators.push(ApiSecurity(`${auth}Cookie`));
  if (options.csrf) {
    decorators.push(
      ApiHeader({
        name: "X-CSRF-Token",
        required: true,
        description:
          "data.csrfToken de GET /api/v1/auth/csrf. Conservar también su cookie HttpOnly. Origin/Referer debe estar autorizado.",
        schema: { type: "string" },
      }),
    );
  }
  for (const name of options.params ?? []) {
    decorators.push(ApiParam({ name, required: true, schema: { type: "string", format: "uuid" } }));
  }
  if (options.query) {
    const query = openApiSchema(options.query, "output");
    for (const [name, schema] of Object.entries(query.properties ?? {})) {
      decorators.push(ApiQuery({ name, required: options.queryRequired ?? false, schema }));
    }
  }
  if (options.body)
    decorators.push(ApiBody({ required: true, schema: openApiSchema(options.body) }));
  const responseSchema =
    options.responseSchema ??
    (options.response ? openApiSchema(options.response, "output") : undefined);
  decorators.push(
    ApiResponse({
      status: options.status ?? 200,
      description: options.status === 204 ? "Sin contenido." : "Operación completada.",
      ...(responseSchema
        ? {
            content: {
              [options.mediaType ?? "application/json"]: {
                schema: responseSchema,
              },
            },
          }
        : {}),
    }),
  );
  const errors: Record<number, string> = {
    400: "Petición inválida.",
    403: "Acceso denegado o CSRF/Origin no válido.",
    429: "Límite de solicitudes por IP/proceso excedido.",
    500: "Error inesperado; mensaje genérico sin secretos.",
  };
  if (auth !== "none") errors[401] = "Sesión ausente, expirada o revocada.";
  if (options.body) errors[413] = "Cuerpo demasiado grande.";
  Object.assign(errors, options.errors);
  for (const [status, description] of Object.entries(errors)) {
    decorators.push(
      ApiResponse({
        status: Number(status),
        description,
        schema: {
          type: "object",
          required: ["statusCode", "error"],
          properties: {
            statusCode: { type: "integer", example: Number(status) },
            error: {
              type: "object",
              required: ["code", "message"],
              properties: {
                code: { type: "string" },
                message: { type: "string" },
              },
            },
          },
        },
      }),
    );
  }
  return applyDecorators(...decorators);
}
