import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Param,
  Patch,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ApiRoute } from "../../../common/documentation/api-route.js";
import { businessResponse } from "../../../common/documentation/response-schemas.js";
import type { AuthRequest } from "../../auth/presentation/auth.request.js";
import { BusinessService } from "../application/business.service.js";
import { businessIdSchema, updateBusinessSchema } from "./business.dto.js";

@ApiTags("Negocio")
@Controller("businesses")
export class BusinessController {
  constructor(private readonly business: BusinessService) {}

  @Patch(":businessId")
  @ApiRoute({
    summary: "Actualizar nombre del negocio activo (OWNER/ADMIN)",
    csrf: true,
    params: ["businessId"],
    body: updateBusinessSchema,
    response: businessResponse,
    description: "Actualiza únicamente el nombre; no crea negocio ni cambia slug.",
  })
  async update(
    @Req() request: AuthRequest,
    @Param("businessId") id: string,
    @Body() body: unknown,
  ) {
    if (!request.auth) throw new UnauthorizedException();
    const businessId = businessIdSchema.safeParse(id);
    const input = updateBusinessSchema.safeParse(body);
    if (!businessId.success || !input.success) throw new BadRequestException();
    const result = await this.business.updateName(
      {
        userId: request.auth.claims.sub,
        activeBusinessId: request.auth.claims.businessId,
      },
      businessId.data,
      input.data.name,
    );
    if (!result) throw new ForbiddenException();
    return { data: result };
  }
}
