# Backend

## Estado implementado

Base NestJS 12 con TypeScript strict, ESM y compilación mediante el ejecutable `tsc` de TypeScript 7. `auth` implementa registro/login, sesión actual, refresh, logout/logout-all y CSRF con jose, bcrypt y repositorio Prisma. `business` permite actualizar el nombre del negocio activo; `products` implementa listado/detalle/alta/edición/borrado lógico con autorización del negocio activo. `users`, `stores`, `orders`, `clients`, `conversations` y `agents` siguen registrados sin endpoints comerciales. El frontend consume auth, actualización del nombre y productos por un proxy de mismo origen; el resto del onboarding y del comercio sigue mock.

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

El concepto de negocio se llama `Business`, con módulo singular `src/modules/business/business.module.ts` (`BusinessModule`) y referencias `businessId`. Sigue siendo la unidad de aislamiento multi-tenant; las rutas de colecciones propuestas usan el plural `/businesses`. El renombrado no añadió endpoints; posteriormente se implementó la actualización del nombre descrita a continuación.

### Actualización del nombre del negocio (implementada)

`PATCH /api/v1/businesses/:businessId` recibe exclusivamente `{ name: string }` (trim, 1–120 caracteres) y devuelve `{ data: { id, name, slug } }`. No modifica el slug, no crea otro negocio ni guarda los demás campos del wizard.

- Guard global de sesión y CSRF/Origin; nunca toma usuario o rol del body. El ID debe ser UUID y coincidir con el negocio activo de los claims verificados.
- Repositorio Prisma con filtro por ID y membresía activa OWNER/ADMIN de usuario activo en la misma sentencia de actualización. Negocio, membresía y usuario deben tener `isDeleted: false`. No admite otros negocios, AGENT ni VIEWER; ausencia/no autorización devuelve 403 sin revelar existencia.
- 400 para parámetros/body inválidos (incluidos campos extra), 401 sin sesión válida, 403 por permisos/CSRF y 429 por límite global. Respuestas normalizadas por el filtro global y `Cache-Control: no-store`.
- Domain/application sin Nest ni Prisma; factories de `BusinessModule` componen servicio, puerto y adaptador. Sin cambios de esquema, migraciones ni seeds.

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

`PrismaService` crea el cliente con `@prisma/adapter-pg`: pool máximo 10, espera de conexión 5 segundos, inactividad 30 segundos. No ejecuta `$connect`, migraciones ni seeds al arrancar; las consultas se ejecutan cuando se usan los endpoints auth y el guard. Una conexión fallará al usarse si la base no está disponible: arrancar **no prueba salud de PostgreSQL**. `enableShutdownHooks` permite desconectar el cliente mediante `onModuleDestroy`. El cliente crudo no aplica aislamiento tenant ni borrado lógico automáticos; no exponerlo desde controladores. Los 13 modelos tienen `isDeleted` y `@@map` a tablas plurales; auth, actualización del negocio y productos filtran explícitamente los registros eliminados. La migración `20261020170000_plural_tables_soft_delete` ya se aplicó al destino autorizado, sin reset ni borrado de datos; status al día y diff sin diferencias. En otros destinos, coordinar su ejecución explícita con el despliegue de esta API (la versión anterior usa tablas singulares). Ver `docs/database.md` para semántica, unicidad y límites.

Build, typecheck y el inicio de dev generan el cliente antes de compilar. Después de editar el esquema durante dev, regenerar y reiniciar el supervisor. No ejecutar Nest CLI build/start mientras TypeScript 7 no exponga la API programática necesaria.

```sh
pnpm --filter @whatsapp/api db:validate
pnpm --filter @whatsapp/api db:generate
pnpm --filter @whatsapp/api typecheck
pnpm --filter @whatsapp/api build
```

Validar el esquema, generar tipos y compilar no conectan a una base ni verifican queries. Ver [database.md](./database.md) para migraciones explícitas y límites del modelo.

## Cambio de contraseña

`POST /api/v1/auth/change-password` exige access, CSRF/Origin y contraseña actual, no un rol administrativo. El servicio valida bcrypt y una nueva contraseña distinta de 12 caracteres mínimo/72 bytes UTF-8 máximo. El repositorio compara el hash anterior bajo bloqueo de usuario `FOR NO KEY UPDATE`, revalida sesión/relaciones y actualiza hash y revoca todas las familias/refresh del usuario en una transacción. Login usa el mismo bloqueo y comprueba que el hash verificado no cambió antes de emitir la sesión. No cambia esquema ni usa proveedores externos. También existe `POST /api/v1/auth/change-password-with-credentials`, público con CSRF/Origin y límite de 5 intentos/minuto/IP/proceso, para cambiar desde login con email y contraseña actual. Credenciales desconocidas/incorrectas o cuenta no disponible devuelven 401 genérico; no inicia sesión. Comparte la transacción de hash/revocación, identificando la cuenta solo por credenciales, sin requerir membresía ni aceptar IDs arbitrarios. Contrato, límites y precauciones de concurrencia/runtime en [authentication.md](./authentication.md).

## Contratos HTTP

Auth está implementado bajo `/api/v1`; contratos y respuestas exactas en [authentication.md](./authentication.md). DTOs Zod validan entradas y se devuelven perfiles filtrados, no entidades Prisma. Business y productos también están implementados; los recursos restantes de la tabla son **propuestas no implementadas**. Productos incluye capas domain/application sin Nest/Prisma, adaptador Prisma y presentación con DTOs/filtro: contrato completo y límites en [products.md](./products.md). Usarán UUID, no IDs cortos de fixtures, y Decimal como string.

| Recurso                                 | Operaciones y estado                                                                                                 |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `/auth/*`                               | **Implementado:** registro, login, refresh, logout/logout-all, cambio de contraseña, sesión actual y bootstrap CSRF. |
| `/businesses/:businessId/stores`        | GET/POST colección; GET/PATCH `/:id`.                                                                                |
| `/businesses/:businessId/products`      | **Implementado:** GET/POST colección; GET/PATCH/DELETE `/:id`, soft delete, OWNER/ADMIN y protección del historial.  |
| `/businesses/:businessId/clients`       | GET/POST colección; GET/PATCH `/:id`; historial vinculado autorizado.                                                |
| `/businesses/:businessId/orders`        | GET/POST colección; GET/PATCH `/:id`; reglas de transición e idempotencia por diseñar.                               |
| `/businesses/:businessId/conversations` | GET colección/detalle; PATCH estado/asignación; GET/POST `/:id/messages`. No implica envío real.                     |
| `/businesses/:businessId/agents`        | GET/POST colección; GET/PATCH `/:id`. Activación futura requiere integración real.                                   |
| `/businesses/:businessId/reports/sales` | GET con rango UTC y tienda autorizada; agregaciones en servidor.                                                     |

Listas previstas: `page`, `pageSize` (máximo 100), `search` y filtros tipados; respuesta `{ data: T[], pagination: { page, pageSize, total } }`. Detalle: `{ data: T }`; eliminación sin cuerpo: 204. Errores previstos `{ code, message, requestId?, details? }`, sin stack ni secretos; `details` solo errores de validación de campos, no datos privados. Estados 400/401/403/404/409/429 según validación, sesión, permisos, pertenencia, conflicto y límites. Estas propuestas no se implementaron para los módulos restantes. Productos ya devuelve `pagination` (incluido `pages`), `summary` global, importes string y errores controlados con envelope `{ statusCode, error: { code, message } }`. Auth sí tiene filtro de errores uniforme y respuestas controladas; no confundirlo con contratos comerciales definitivos.

La URL puede seleccionar un tenant, pero jamás autorizarlo: verificar usuario, sesión y Membership activa en cada petición, después RBAC y consultas con tenant. Un ID de otro tenant debe producir una respuesta que no confirme su existencia. Configuración, preferencias y reporting requerirán contratos definitivos antes de conectar Axios; el snapshot y los comandos locales del frontend no son esta API.

## Pendiente antes de producción

Ampliar RBAC comercial/repositorios tenant-scoped más allá de productos y añadir selección autorizada de negocio; recuperación/verificación de email y MFA, auditoría durable sin secretos, observabilidad, rate limits distribuidos/por cuenta e IP tras proxy, limpieza de sesiones, rotación gradual de claves, backup/TLS y verificaciones de seguridad. WhatsApp/IA continúan sin integrar. Aunque el código de autenticación y la migración están implementados, no se declara preparado para producción sin las verificaciones autorizadas.

Por restricción vigente no se implementan ni ejecutan tests, smoke checks, peticiones al servidor ni validaciones de navegador. Las pruebas existentes permanecen sin cambios y requerirán configuración y revisión cuando se autoricen.
