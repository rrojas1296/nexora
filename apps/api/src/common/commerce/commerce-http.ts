import { ArgumentsHost, BadRequestException, Catch, type ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";
import { z } from "zod";
import { CommerceError } from "./commerce.js";

export const commerceId = z.uuid();
export const commerceQuery = z.object({
  page: z.coerce.number().int().min(1).max(100_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().max(100).default(""),
});
export const commercePagination = z.object({
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  pages: z.number(),
});
export function parseCommerce<T>(schema: z.ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success)
    throw new BadRequestException({
      code: "COMMERCE_INVALID_INPUT",
      message: "Invalid commerce request",
    });
  return parsed.data;
}
@Catch(CommerceError)
export class CommerceExceptionFilter implements ExceptionFilter<CommerceError> {
  catch(error: CommerceError, host: ArgumentsHost) {
    const status =
      error.code === "COMMERCE_FORBIDDEN" ? 403 : error.code === "COMMERCE_NOT_FOUND" ? 404 : 409;
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(status)
      .json({ statusCode: status, code: error.code, message: error.code });
  }
}
