import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ApiRoute } from "./common/documentation/api-route.js";
import { AppService } from "./app.service.js";

@ApiTags("Inicio")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiRoute({
    summary: "Saludo del starter (autenticado)",
    mediaType: "text/html",
    responseSchema: { type: "string", example: "Hello World!" },
    description:
      "Ruta raíz GET /, fuera del prefijo /api/v1. Protegida por sesión; no es un health check.",
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
