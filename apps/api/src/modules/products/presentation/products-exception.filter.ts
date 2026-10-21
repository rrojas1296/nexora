import { Catch, type ArgumentsHost, type ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";
import { ProductError } from "../domain/product.js";

const statuses = {
  PRODUCT_FORBIDDEN: 403,
  PRODUCT_NOT_FOUND: 404,
  PRODUCT_SKU_EXISTS: 409,
  PRODUCT_HAS_ORDERS: 409,
} as const;

@Catch(ProductError)
export class ProductsExceptionFilter implements ExceptionFilter<ProductError> {
  catch(error: ProductError, host: ArgumentsHost) {
    const statusCode = statuses[error.code];
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(statusCode)
      .json({
        statusCode,
        error: { code: error.code, message: "Unable to complete product request." },
      });
  }
}
