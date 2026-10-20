# Backend

## Estado implementado

Base NestJS 12 con TypeScript strict, ESM y compilación mediante el ejecutable `tsc` de TypeScript 7. `auth` implementa registro/login, sesión actual, refresh, logout/logout-all y CSRF con jose, bcrypt y repositorio Prisma. `users`, `business`, `stores`, `products`, `orders`, `clients`, `conversations` y `agents` siguen registrados sin endpoints ni comportamiento comercial. El frontend consume auth real por un proxy de mismo origen; onboarding y módulos comerciales siguen mock.

Se conserva el controlador original `GET /` → `Hello World!` como ejemplo del starter. No es un health check, no comprueba PostgreSQL y no acredita disponibilidad del SaaS. Auth usa `/api/v1`; la raíz del starter está excluida del prefijo, pero protegida por el guard global.

```text
apps/api/
  prisma.config.ts                    Configuración CLI de Prisma 7
  prisma/schema.prisma                Generador y datasource PostgreSQL
  prisma/models/*.prisma              Modelos y enums separados por dominio
  src/
    app.module.ts                     Composición de módulos
    main.ts                           Prefijo, CORS, shutdown y listen
    config/environment.ts             Configuración validada con Zod
    common/                           Reservado para infraestructura transversal
    infrastructure/database/
      database.module.ts
      prisma.service.ts               Cliente Prisma con adapter-pg
      generated/                      Generado e ignorado por Git/Oxc
    modules/<feature>/
      <feature>.module.ts
      domain/                         Dominio sin dependencias de Nest/Prisma
      application/                    Casos de uso y puertos
      infrastructure/                 Adaptadores de puertos
      presentation/                   Controladores y contratos HTTP
```

El concepto de negocio se llama `Business`, con módulo singular `src/modules/business/business.module.ts` (`BusinessModule`) y referencias `businessId`. Sigue siendo la unidad de aislamiento multi-tenant; las rutas de colecciones propuestas usan el plural `/businesses`. No hay endpoints nuevos por este renombrado.

Auth contiene tipos/errores de dominio, casos de uso y puertos, adaptadores bcrypt/jose/Prisma/CSRF y controladores/DTOs/guards; los otros módulos conservan sus capas reservadas. Las dependencias fluyen de presentation/infrastructure hacia application/domain, sin Nest/Prisma en las capas internas; factories del módulo componen los adaptadores. `DatabaseModule` no es global y auth lo importa expresamente.

## Configuración

Cada app carga sus propias variables. Desde la raíz, para preparar el entorno local:

```sh
cp apps/api/.env.example apps/api/.env
# Editar apps/api/.env con DATABASE_URL y CORS_ORIGINS antes de arrancar.
pnpm --filter @whatsapp/api auth:configure
# Solo en el destino autorizado, aplicar las migraciones revisadas:
pnpm --filter @whatsapp/api db:migrate:deploy
pnpm --filter @whatsapp/api dev
```

Este último comando inicia la aplicación; no se ha ejecutado durante la restricción de tests/smoke. Los comandos no aprovisionan PostgreSQL; la base configurada por el usuario ya recibió la migración inicial explícitamente autorizada. No copiar secretos a `apps/web` ni usar `NEXT_PUBLIC_` para valores privados.

| Variable       | Regla                                                                                                                                                                         |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`     | `development`, `production` o `test`; por defecto `development`.                                                                                                              |
| `HOST`         | No vacío; por defecto `127.0.0.1`. Usar `0.0.0.0` explícitamente si el despliegue requiere escucha externa.                                                                   |
| `PORT`         | Entero 1–65535; por defecto 8000.                                                                                                                                             |
| `DATABASE_URL` | Obligatoria, URL PostgreSQL con host y nombre de base. Credenciales/TLS según el entorno.                                                                                     |
| `CORS_ORIGINS` | Obligatoria, lista CSV de orígenes exactos únicos: esquema HTTP(S), host y puerto opcional. Sin slash final, ruta, credenciales, query ni wildcard. En producción solo HTTPS. |

`ConfigModule.forRoot` carga `.env` del directorio de la app y valida antes de escuchar. Los errores enumeran claves, no sus valores ni secretos. Los comandos pnpm filtrados y el supervisor dev usan el directorio de `apps/api`. En despliegues directos, ejecutar desde ese directorio o suministrar las variables mediante el entorno del proceso. Turborepo permite pasar las variables privadas del backend solo a su tarea dev; no al frontend.

También son obligatorios tres secretos independientes `AUTH_ACCESS_SECRET`, `AUTH_REFRESH_SECRET`, `AUTH_CSRF_SECRET` de al menos 64 caracteres. `auth:configure` genera únicamente los ausentes en el .env local sin imprimirlos. TTLs, issuer/audience y BCRYPT_ROUNDS están documentados en `.env.example` y [authentication.md](./authentication.md). Turborepo permite pasar estas variables solo al dev del backend.

CORS permite credenciales, métodos GET/POST/PUT/PATCH/DELETE/OPTIONS y headers `Content-Type`, `X-CSRF-Token`, `X-Request-Id`, con preflight máximo de 600 segundos. No sustituye autorización. Cookie-parser lee cookies y el guard global verifica sesión. Mutaciones validan Origin/Referer exacto y double-submit CSRF firmado ligado a pre-sesión/sesión. Body parsers limitan JSON y formularios a 16 KiB. Throttler limita por IP/proceso; almacenamiento distribuido y configuración de IP tras proxy quedan pendientes.

## Prisma y lifecycle

Prisma CLI, cliente y adaptador PostgreSQL están fijados a **7.10.1**. Al instalar, el tag `latest` de CLI apuntaba a `8.0.0-rc.23`; se eligió la versión estable, no la candidata. `pg` usa su versión estable consultada. Los scripts de instalación permitidos incluyen `prisma`, `@prisma/engines` y `bcrypt` (binario nativo). La excepción de antigüedad de jose queda acotada a `jose@6.2.13` en pnpm-workspace.yaml, sin desactivar políticas globales.

`PrismaService` crea el cliente con `@prisma/adapter-pg`: pool máximo 10, espera de conexión 5 segundos, inactividad 30 segundos. No ejecuta `$connect`, migraciones ni seeds al arrancar; las consultas se ejecutan cuando se usan los endpoints auth y el guard. Una conexión fallará al usarse si la base no está disponible: arrancar **no prueba salud de PostgreSQL**. `enableShutdownHooks` permite desconectar el cliente mediante `onModuleDestroy`. El cliente crudo no aplica aislamiento tenant automático; no exponerlo desde controladores.

Build, typecheck y el inicio de dev generan el cliente antes de compilar. Después de editar el esquema durante dev, regenerar y reiniciar el supervisor. No ejecutar Nest CLI build/start mientras TypeScript 7 no exponga la API programática necesaria.

```sh
pnpm --filter @whatsapp/api db:validate
pnpm --filter @whatsapp/api db:generate
pnpm --filter @whatsapp/api typecheck
pnpm --filter @whatsapp/api build
```

Validar el esquema, generar tipos y compilar no conectan a una base ni verifican queries. Ver [database.md](./database.md) para migraciones explícitas y límites del modelo.

## Contratos HTTP

Auth está implementado bajo `/api/v1`; contratos y respuestas exactas en [authentication.md](./authentication.md). DTOs Zod validan entradas y se devuelven perfiles filtrados, no entidades Prisma. Los demás recursos de la tabla son **propuestas no implementadas**. Usarán UUID, no IDs cortos de fixtures, y Decimal como string.

| Recurso                                 | Operaciones propuestas                                                                           |
| --------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `/auth/*`                               | **Implementado:** registro, login, refresh, logout/logout-all, sesión actual y bootstrap CSRF.   |
| `/businesses/:businessId/stores`        | GET/POST colección; GET/PATCH `/:id`.                                                            |
| `/businesses/:businessId/products`      | GET/POST colección; GET/PATCH/DELETE `/:id`, con protección del historial.                       |
| `/businesses/:businessId/clients`       | GET/POST colección; GET/PATCH `/:id`; historial vinculado autorizado.                            |
| `/businesses/:businessId/orders`        | GET/POST colección; GET/PATCH `/:id`; reglas de transición e idempotencia por diseñar.           |
| `/businesses/:businessId/conversations` | GET colección/detalle; PATCH estado/asignación; GET/POST `/:id/messages`. No implica envío real. |
| `/businesses/:businessId/agents`        | GET/POST colección; GET/PATCH `/:id`. Activación futura requiere integración real.               |
| `/businesses/:businessId/reports/sales` | GET con rango UTC y tienda autorizada; agregaciones en servidor.                                 |

Listas previstas: `page`, `pageSize` (máximo 100), `search` y filtros tipados; respuesta `{ data: T[], pagination: { page, pageSize, total } }`. Detalle: `{ data: T }`; eliminación sin cuerpo: 204. Errores previstos `{ code, message, requestId?, details? }`, sin stack ni secretos; `details` solo errores de validación de campos, no datos privados. Estados 400/401/403/404/409/429 según validación, sesión, permisos, pertenencia, conflicto y límites. Paginación y errores de recursos comerciales no están implementados. Auth sí tiene filtro de errores uniforme y respuestas controladas; no confundirlo con contratos comerciales definitivos.

La URL puede seleccionar un tenant, pero jamás autorizarlo: verificar usuario, sesión y Membership activa en cada petición, después RBAC y consultas con tenant. Un ID de otro tenant debe producir una respuesta que no confirme su existencia. Configuración, preferencias y reporting requerirán contratos definitivos antes de conectar Axios; el snapshot y los comandos locales del frontend no son esta API.

## Pendiente antes de producción

RBAC comercial y selección autorizada de negocio, repositorios tenant-scoped, recuperación/verificación de email y MFA, auditoría durable sin secretos, observabilidad, rate limits distribuidos/por cuenta e IP tras proxy, limpieza de sesiones, rotación gradual de claves, backup/TLS y verificaciones de seguridad. WhatsApp/IA continúan sin integrar. Aunque el código de autenticación y la migración están implementados, no se declara preparado para producción sin las verificaciones autorizadas.

Por restricción vigente no se implementan ni ejecutan tests, smoke checks, peticiones al servidor ni validaciones de navegador. Las pruebas existentes permanecen sin cambios y requerirán configuración y revisión cuando se autoricen.
