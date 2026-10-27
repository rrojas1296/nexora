# Backend

## Estado implementado

Base NestJS 12 con TypeScript strict, ESM y compilación mediante el ejecutable `tsc` de TypeScript 7. `auth` implementa registro/login, sesión actual, refresh, logout/logout-all y CSRF con jose, bcrypt y repositorio Prisma. `business` permite actualizar el nombre del negocio activo; `products` implementa listado/detalle/alta/edición/borrado lógico con autorización del negocio activo. `agents` implementa lectura y guardado de configuración general del negocio; `clients` y `orders` implementan API persistente del negocio activo, con lecturas para membresía activa y escritura OWNER/ADMIN/CSRF, UUID de creación estable y versiones optimistas; ver [clients-orders.md](./clients-orders.md). `users`/`conversations` siguen reservados y `stores` fue retirado. El frontend consume auth, actualización del nombre, productos, configuración de agente, conexión WhatsApp y conversaciones con lectura/respuesta de texto por un proxy de mismo origen; onboarding, negocios/contexto, clientes y pedidos también son persistentes; dashboard y reportes siguen mock.

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
    common/                           Infraestructura transversal y documentación OpenAPI
    database/
      database.module.ts
      prisma.service.ts               Cliente Prisma con adapter-pg
      generated/                      Generado e ignorado por Git/Oxc
    modules/<feature>/
      <feature>.module.ts
      controllers/                    HTTP, autenticación, entradas y respuestas
      services/                       Coordinación y reglas de aplicación
      repositories/                   Contratos de persistencia y adaptadores Prisma
      models/                         Tipos, errores y reglas independientes
      dto/                            Entradas Zod y esquemas de respuesta OpenAPI
      contracts/                      Puertos de integraciones cuando son necesarios
      providers/                      Criptografía, imágenes e integraciones externas
      guards/, filters/, http/         Solo donde existen responsabilidades reales
```

El concepto de negocio se llama `Business`, con módulo singular `src/modules/business/business.module.ts` (`BusinessModule`) y referencias `businessId`. Sigue siendo la unidad de aislamiento multi-tenant; las rutas de colecciones propuestas usan el plural `/businesses`. El renombrado no añadió endpoints; posteriormente se implementó la actualización del nombre descrita a continuación.

### Negocios y configuración (implementados)

POST `/api/v1/businesses` crea Business + Membership OWNER + agente deshabilitado en una transacción; GET `/businesses/:businessId` devuelve configuración a miembros activos y PATCH actualiza nombre/metadatos, borrador o publicación de contexto con revisión optimista, solo OWNER/ADMIN del negocio activo. `/auth/switch-business` rota familia de sesión/cookies tras validar pertenencia; el registro ya no crea negocios. Ver [businesses.md](./businesses.md) para payloads, autorización, revisiones, límites e incertidumbre de red.

- Guard global de sesión/CSRF/Origin; usuario/rol nunca proceden del body. GET filtra Business, usuario y membresía activos; las escrituras revalidan pertenencia/rol dentro de la transacción. UUIDs y DTOs Zod estrictos; `Cache-Control: no-store` y errores normalizados.
- Bloqueo del negocio para revisión y moneda; se prohíbe cambio de moneda si existe cualquier producto, incluso archivado. Crear productos toma la moneda del Business bajo el mismo bloqueo; no convierte datos existentes.
- Modelos, contrato y servicio sin Nest/Prisma; composición con factories de `BusinessModule`. Migración aditiva pendiente `20261020240000_multiple_businesses_context`, sin seeds ni operaciones DB automáticas.

La API se organiza por funcionalidades reales: `auth`, `business`, `products`, `clients`, `orders`, `agents` y `whatsapp`. `users` y `conversations` conservan únicamente su módulo registrado, sin endpoints ni carpetas reservadas. El módulo vacío `stores` se ha retirado al sustituir Tiendas por Negocios; las relaciones físicas legacy se conservan. El árbol anterior muestra responsabilidades posibles, no una plantilla que deba replicarse: por ejemplo, `business` no necesita providers ni guards propios.

Los servicios coordinan operaciones mediante contratos de repositorios o integraciones; modelos, contratos y servicios no importan Nest ni Prisma. Los controllers dependen de sus servicios y DTOs, no consultan Prisma ni ejecutan Sharp. Los adaptadores Prisma permanecen junto a sus contratos de persistencia; los puertos de proveedores externos están en `contracts/`. Las factories de cada módulo componen las dependencias sin añadir cadenas Service → UseCase que solo deleguen. No hay repositorio universal ni nuevos paquetes.

`AuthModule` exporta únicamente los providers de autenticación/CSRF que otros componentes necesitan. Los módulos comerciales no acceden a repositorios o providers internos de otros módulos; reutilizan el contrato HTTP autenticado y los decoradores de auth. El extractor `getAuthenticatedActor` centraliza la comprobación de identidad en los controllers que usan el mismo actor. `DatabaseModule` no es global: cada consumidor lo importa explícitamente.

En productos, `uploadImage` coordina autorización antes de decodificar, normalización mediante un contrato de función y persistencia, que vuelve a comprobar autorización en la transacción. WhatsApp registra sus repositorios, gateways y cifrado como providers privados compartidos en Nest. La autorización por redirección usa composición con el gateway de signup y un cliente Graph común, en lugar de herencia; conserva pruebas de app secret, paginación acotada, timeouts y errores sanitizados. Los esquemas de respuesta OpenAPI pertenecen al `dto/` de cada feature; `common/documentation` solo mantiene utilidades transversales.

La reorganización no modifica rutas, decoradores, formatos de respuesta, variables, transacciones, bloqueos, autorización, webhooks ni modelos/migraciones de PostgreSQL. El único cambio en `prisma/schema.prisma` es la ruta de salida del generador a `src/database/generated`; Git, Oxc y Turbo se actualizaron de forma coordinada.

## Swagger / OpenAPI

Documentadas las operaciones actuales, incluidos creación/lectura/configuración de negocios y cambio de negocio autorizado, con `@nestjs/swagger` 12.0.2 y esquemas explícitos derivados de Zod: UI `/api/v1/docs`, JSON `/api/v1/docs-json`, YAML `/api/v1/docs-yaml`. Habilitado fuera de producción por defecto; override privado `SWAGGER_ENABLED=true|false`. La documentación habilitada es pública; no elimina sesión, CSRF ni autorización de las operaciones. En producción permanece deshabilitada salvo autorización explícita mediante configuración; proteger el acceso en proxy si se habilita.

Ver [openapi.md](./openapi.md) para contratos cubiertos, login por cookies/CSRF desde Swagger, autorización de su Origin, advertencias sobre operaciones reales y el aviso peer de TypeScript 7 (sin plugin Swagger/Nest). No se ha comprobado el UI ni ejecutado peticiones por la restricción vigente.

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

CORS permite credenciales, métodos GET/POST/PUT/PATCH/DELETE/OPTIONS y headers `Content-Type`, `X-CSRF-Token`, `X-Request-Id`, `Idempotency-Key`, con preflight máximo de 600 segundos. No sustituye autorización. Cookie-parser lee cookies y el guard global verifica sesión. Mutaciones validan Origin/Referer exacto y double-submit CSRF firmado ligado a pre-sesión/sesión. Body parsers limitan JSON y formularios a 16 KiB, excepto JSON de creación/configuración directa de Business (128 KiB, sin compresión) y del webhook exacto `/api/v1/whatsapp/webhook` (1 MiB, sin compresión). Ese POST usa firma HMAC de Meta en lugar de cookies/CSRF; ver [whatsapp.md](./whatsapp.md). Throttler limita por IP/proceso; almacenamiento distribuido y configuración de IP tras proxy quedan pendientes.

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

`POST /api/v1/auth/change-password` exige access, CSRF/Origin y contraseña actual, no un rol administrativo. Los DTOs validan una nueva contraseña distinta de la actual, de 8 caracteres mínimo (puntos de código Unicode), con al menos una letra y un número decimal Unicode, y 72 bytes UTF-8 máximo; la misma política aplica al registro. El servicio verifica la contraseña actual con bcrypt. El repositorio compara el hash anterior bajo bloqueo de usuario `FOR NO KEY UPDATE`, revalida sesión/relaciones y actualiza hash y revoca todas las familias/refresh del usuario en una transacción. Login usa el mismo bloqueo y comprueba que el hash verificado no cambió antes de emitir la sesión. No cambia esquema ni usa proveedores externos. También existe `POST /api/v1/auth/change-password-with-credentials`, público con CSRF/Origin y límite de 5 intentos/minuto/IP/proceso, para cambiar desde login con email y contraseña actual. Credenciales desconocidas/incorrectas o cuenta no disponible devuelven 401 genérico; no inicia sesión. Comparte la transacción de hash/revocación, identificando la cuenta solo por credenciales, sin requerir membresía ni aceptar IDs arbitrarios. Contrato, límites y precauciones de concurrencia/runtime en [authentication.md](./authentication.md).

## Contratos HTTP

Auth está implementado bajo `/api/v1`; contratos y respuestas exactas en [authentication.md](./authentication.md). DTOs Zod validan entradas y se devuelven perfiles filtrados, no entidades Prisma. Business, productos y configuración de agente también están implementados (GET/PUT `/businesses/:businessId/agents/configuration`, [agents.md](./agents.md)); clientes/pedidos están implementados según [clients-orders.md](./clients-orders.md); los demás recursos no descritos como implementados siguen siendo propuestas. Productos incluye modelos/servicio/contratos sin Nest/Prisma, repositorio Prisma y controllers con DTOs/filtro: contrato completo y límites en [products.md](./products.md). Usarán UUID, no IDs cortos de fixtures, y Decimal como string.

| Recurso                                        | Operaciones y estado                                                                                                                              |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/auth/*`                                      | **Implementado:** registro, login, refresh, logout/logout-all, cambio de contraseña, sesión actual y bootstrap CSRF.                              |
| `/businesses/:businessId/stores`               | GET/POST colección; GET/PATCH `/:id`.                                                                                                             |
| `/businesses/:businessId/products`             | **Implementado:** GET/POST colección; GET/PATCH/DELETE `/:id`, soft delete, OWNER/ADMIN y protección del historial.                               |
| `/businesses/:businessId/clients`              | GET/POST colección; GET/PATCH `/:id`; historial vinculado autorizado.                                                                             |
| `/businesses/:businessId/orders`               | GET/POST colección; GET/PATCH `/:id`; versiones optimistas, creación idempotente por UUID/hash y transiciones restringidas; implementado.         |
| `/businesses/:businessId/conversations`        | GET colección/detalle; PATCH estado/asignación; GET/POST `/:id/messages`. No implica envío real.                                                  |
| `/businesses/:businessId/agents/configuration` | GET/PUT implementados para configuración general. Colección y agentes de tienda no implementados; activación operativa requiere integración real. |
| `/businesses/:businessId/reports/sales`        | GET con rango UTC y tienda autorizada; agregaciones en servidor.                                                                                  |

Listas previstas: `page`, `pageSize` (máximo 100), `search` y filtros tipados; respuesta `{ data: T[], pagination: { page, pageSize, total } }`. Detalle: `{ data: T }`; eliminación sin cuerpo: 204. Errores previstos `{ code, message, requestId?, details? }`, sin stack ni secretos; `details` solo errores de validación de campos, no datos privados. Estados 400/401/403/404/409/429 según validación, sesión, permisos, pertenencia, conflicto y límites. Estas propuestas no se implementaron para los módulos restantes. Productos ya devuelve `pagination` (incluido `pages`), `summary` global, importes string y errores controlados con envelope `{ statusCode, error: { code, message } }`. Auth sí tiene filtro de errores uniforme y respuestas controladas; no confundirlo con contratos comerciales definitivos.

La URL puede seleccionar un tenant, pero jamás autorizarlo: verificar usuario, sesión y Membership activa en cada petición, después RBAC y consultas con tenant. Un ID de otro tenant debe producir una respuesta que no confirme su existencia. Configuración, preferencias y reporting requerirán contratos definitivos antes de conectar Axios; el snapshot y los comandos locales del frontend no son esta API.

## Pendiente antes de producción

Ampliar RBAC comercial/repositorios tenant-scoped más allá de productos y añadir gestión de miembros/invitaciones; recuperación/verificación de email y MFA, auditoría durable sin secretos, observabilidad, rate limits distribuidos/por cuenta e IP tras proxy, limpieza de sesiones, rotación gradual de claves, backup/TLS y verificaciones de seguridad. WhatsApp dispone de Facebook Login for Business por redirección desde la configuración del negocio para números Cloud API ya configurados (state aleatorio de un uso persistido como hash y ligado a sesión/usuario/Business, callback/canje backend, token transitorio cifrado y selección/revalidación de activos). Sin SDK/popup ni alta/registro de números; nueva migración `20261020210000_whatsapp_authorization_redirect` pendiente de aplicación explícita, callback en el mismo origen web HTTPS y configuración/revisión Meta. Los endpoints anteriores de Embedded Signup permanecen por compatibilidad, sin UI actual. También conserva conexión manual por Business y envío autenticado OWNER/ADMIN de texto/plantillas con idempotencia, tokens Graph cifrados y persistencia de intentos; requiere migración explícita pendiente y configuración privada. El webhook verifica y persiste mensajes entrantes firmados antes del 200, resuelve el negocio por el número de conexión activa y deduplica por Business/ID Meta. `WhatsAppModule` expone GET `/businesses/:businessId/whatsapp/conversations` y `/:threadId/messages`, paginados y autorizados para cualquier membresía activa, consumidos por Conversaciones sin fixtures. POST `/:threadId/messages` añade respuesta OWNER/ADMIN con CSRF, idempotencia, conexión del mismo número y ventana local de 24h basada solo en entrantes. Reserva saliente/intento atómicamente antes de Graph; GET `/:threadId/send-attempts/:key` reconcilia respuestas perdidas sin reenviar. El timeline incluye dirección y estado local, no entrega/lectura. El módulo reservado `conversations` no incorpora endpoints propios. Migraciones `20261020220000_whatsapp_inbox` y `20261020230000_whatsapp_inbox_sending` pendientes de aplicación explícita; se conserva la tabla física `WhatsappInboundMessages` para ambas direcciones, sin escribir en `Messages`. Sin importar historial anterior/envíos genéricos ni estados de entrega; ver [whatsapp.md](./whatsapp.md). La [IA opcional](./ai.md) incorpora contrato `AiTextGenerator` reemplazable, adaptador OpenAI Responses API, cola durable PostgreSQL con worker interno y control optimista humano/IA mediante POST `/:threadId/control`, OWNER/ADMIN con CSRF. Revalida configuración/versión/ventana antes de reservar el envío y no reintenta resultados inciertos; `UNKNOWN` cede a humano. Flag global desactivado por defecto, migración `20261020250000_whatsapp_ai_replies` pendiente. Sin nuevas dependencias ni pruebas contra servicios externos. Aunque el código de autenticación y la migración están implementados, no se declara preparado para producción sin las verificaciones autorizadas.

La petición de reorganización autoriza ejecutar los tests existentes del backend, sin añadir una nueva suite ni probar integraciones reales. El unitario del starter pasa (1/1). El e2e compila e inicializa `AppModule` con sus providers, pero falla: `expected 200 "OK", got 401 "Unauthorized"` en `test/app.e2e-spec.ts:20`. Se reprodujo el mismo fallo con una copia previa al refactor y configuración sintética sin base accesible: el test heredado espera una raíz pública, aunque el guard global ya exige sesión. Se conserva la expectativa existente; no se elimina la protección para hacer pasar el test. Por autorización posterior del usuario, se omite el e2e al cerrar esta reorganización, sin borrarlo, deshabilitarlo ni declararlo aprobado. No acredita queries, autorización de otros endpoints ni disponibilidad de PostgreSQL/Meta. Ver el resultado completo de validaciones en [roadmap.md](./roadmap.md).
