# Nexora — WhatsApp AI Sales SaaS

Monorepo de ventas y atención por WhatsApp con agentes AI. **Frontend y backend integran autenticación real con cookies HttpOnly, jose/bcrypt y PostgreSQL; productos usa un catálogo persistente con API y la pantalla de agente guarda su configuración general en PostgreSQL y Conversaciones lee mensajes persistentes de WhatsApp y permite responder con texto. Los demás módulos comerciales siguen usando datos ficticios en memoria.** Workspace/onboarding requieren sesión. La base configurada recibió la migración inicial; no se crearon cuentas ni seeds durante implementación. El registro crea la cuenta y el onboarding crea el primer negocio con membresía OWNER/agente deshabilitado; una cuenta puede administrar varios negocios desde el selector del sidebar. Hay API de productos, no de pedidos. La [IA opcional](./docs/ai.md) usa OpenAI detrás de un contrato reemplazable, contexto publicado, cola PostgreSQL y control humano/IA por hilo; está desactivada por defecto y requiere migración/configuración explícitas. WhatsApp dispone de [conexión por negocio con Facebook Login por redirección desde Configuración para números Cloud API existentes (o manual por API) y envío real de texto/plantillas con idempotencia](./docs/whatsapp.md), sujetos a credenciales y migración explícita pendiente. El webhook verifica Meta y persiste mensajes entrantes deduplicados para el número conectado; Conversaciones los consulta con paginación y refresco cada 10 s. Requiere las migraciones explícitas `20261020220000_whatsapp_inbox` y `20261020230000_whatsapp_inbox_sending`, además del webhook/suscripción `messages` de Meta. El compositor OWNER/ADMIN valida conexión y ventana de 24h, persiste salientes e intentos con idempotencia y permite consultar resultados sin reenviar. Aceptación de Meta no significa entrega. No importa historial anterior ni envíos externos a la pantalla ni estados de entrega. La IA responde solo a nuevos textos elegibles, con agente activo/contexto publicado; no reintenta envíos inciertos y cede a humano ante `UNKNOWN`. La migración `20261020250000_whatsapp_ai_replies` está creada, no aplicada.

## Stack y estructura

- `apps/web`: Next.js App Router, React, Tailwind v4, next-intl es/en, Zustand, React Query, Axios, RHF/Zod, Radix y Recharts.
- `apps/api`: NestJS modular, Zod, Prisma 7 estable y adaptador PostgreSQL. Arquitectura por funcionalidades, servicios y contratos independientes de Nest/Prisma; auth real, cookies HttpOnly, access/refresh rotativos, CSRF y sesiones revocables; PATCH del nombre del negocio activo y CRUD de productos/configuración general de agente, con escrituras OWNER/ADMIN; otros módulos sin endpoints de negocio.
- `packages/typescript-config`: TypeScript strict compartido.
- pnpm Workspaces, Turborepo y Oxc exclusivamente.

Requisitos: Node.js >=24 y la versión pnpm indicada en `packageManager` de `package.json`. No crear lockfiles de aplicación ni instalar paquetes desde subrepositorios.

## Preparación local

Desde la raíz:

```sh
pnpm install --frozen-lockfile
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
# Editar cada archivo para el entorno local, sin compartir secretos entre apps.
pnpm --filter @whatsapp/api auth:configure
# PostgreSQL local de desarrollo (requiere Docker Compose).
docker compose up -d db
# En la base autorizada: aplicar migraciones revisadas (no hay seeds).
pnpm --filter @whatsapp/api db:migrate:deploy
```

`compose.yaml` levanta únicamente PostgreSQL 18 en `127.0.0.1:5432`, con base/usuario `conversa` y contraseña local `change-me`, igual que `apps/api/.env.example`. Los datos persisten en un volumen nombrado. No sobrescribe `apps/api/.env`: comprueba que `DATABASE_URL` apunte a esta base antes de aplicar migraciones. Detener con `docker compose down` conserva los datos; `docker compose down -v` los elimina. Configuración solo para desarrollo, sin migraciones ni seeds automáticos.

Para arrancar solo el frontend (el acceso al workspace requiere API/PostgreSQL disponibles):

```sh
pnpm --filter @whatsapp/web dev
```

Para arrancar ambas aplicaciones después de configurar la API:

```sh
pnpm dev
```

Web usa el puerto de desarrollo Next (3000 por defecto); API usa `127.0.0.1:8000` por defecto. La API necesita `DATABASE_URL`, orígenes CORS exactos y tres secretos independientes de autenticación. Las consultas conectan bajo demanda; no hay migraciones ni seeds al arrancar. La migración inicial ya se aplicó explícitamente al destino configurado. También se aplicó explícitamente `20261020170000_plural_tables_soft_delete`, que renombra las 13 tablas al plural y añade `isDeleted`, sin borrar datos. Esta versión de la API requiere ambas migraciones; en otros destinos deben aplicarse explícitamente en un despliegue coordinado. Otras bases también necesitan el deploy revisado. Ver [database.md](./docs/database.md). `GET /` conserva `Hello World!` pero requiere sesión por el guard global; no es un health check. Web reenvía `/api/v1` al destino privado `API_INTERNAL_URL` (por defecto `http://localhost:8000/api/v1`); cambiarlo exige rebuild. `CORS_ORIGINS` debe admitir el origen público exacto de web, por defecto `http://localhost:3000`. Producción exige HTTPS y API `NODE_ENV=production`. No usar hosts públicos separados para web/API en esta integración.

Los comandos de arranque son instrucciones para el operador: no se han ejecutado como verificación de esta fase, por la restricción de tests y smoke checks.

## Documentación interactiva de la API

Swagger documenta las 29 operaciones actuales en **<http://localhost:8000/api/v1/docs>**, con contratos de bodies/respuestas, parámetros, upload y seguridad. Especificación JSON: `/api/v1/docs-json`; YAML: `/api/v1/docs-yaml`. Habilitado fuera de producción por defecto; `SWAGGER_ENABLED=true|false` en el entorno privado de API permite sobrescribirlo.

Para ejecutar mutaciones desde Swagger se necesitan cookies de sesión, bootstrap CSRF y un origen autorizado; **no usa Bearer JWT**. Try it out ejecuta operaciones reales, incluido envío de WhatsApp. Ver [guía Swagger/OpenAPI](./docs/openapi.md) para login, configuración CORS, acceso en producción y límites de verificación.

## Qué incluye la demo

Shell responsive con sidebar izquierdo colapsable, contenido limitado a 1428px, temas propios light/dark/system y español/inglés. Login/registro reales, onboarding atómico del primer negocio y gestión multinegocio con contexto comercial borrador/publicado. Dashboard con comparativa de ventas; conversaciones reales con compositor de texto y estados locales del intento (sin cruces con clientes/pedidos mock); configuración persistente de agente y automatización opcional (ver [docs/agents.md](./docs/agents.md) y [docs/ai.md](./docs/ai.md)); productos, clientes, pedidos y negocios con páginas dedicadas de creación/edición; reportes diferenciados con filtros y CSV; ajustes y ayuda. Productos, pedidos y clientes incluyen KPIs de colección. Productos consulta PostgreSQL con filtros/paginación remotos, valida referencias únicas por negocio y usa borrado lógico; sus KPIs provienen de la colección completa del negocio. Dashboard, pedidos y reportes no consumen este catálogo real.

Registrar una cuenta crea usuario y negocio reales; exige contraseña de al menos 12 caracteres y como máximo 72 bytes UTF-8. La sesión se recupera al recargar por cookies, con renovación coordinada entre pestañas y cierre actual/global en el header. Cambio de contraseña real en `/{locale}/settings/password`, accesible desde el header y Configuración: exige la actual, guarda un hash bcrypt nuevo y revoca todas las sesiones antes de pedir login de nuevo. Desde login también hay enlace a `/{locale}/change-password`: email y contraseña actual permiten cambiarla sin entrar al panel ni crear una sesión. Ambos flujos revocan las sesiones de la cuenta verificada. No es recuperación por email; los códigos quedan pendientes. No hay credenciales precreadas ni emails especiales. Los escenarios de los módulos mock permiten normal/vacío/error; el vacío es de solo lectura. Productos, configuración de agente y conversaciones reales quedan fuera de esos controles y conservan sus registros al recargar, cerrar sesión o restablecer la demo. Recargar, cambiar de identidad o restablecer descarta cambios mock; completar el wizard guarda únicamente el nombre del negocio real; el resto sigue en memoria. Los productos se persisten en PostgreSQL, no en almacenamiento web. No se persisten tokens ni colecciones comerciales en almacenamiento web: solo tema y una marca booleana conservadora contra replay de refresh incierto.

## Túnel ngrok para el webhook

Instalado el SDK oficial de ngrok como dependencia de desarrollo. Copia `.env.ngrok.example` a `.env.ngrok` en la raíz y completa `NGROK_AUTHTOKEN` con el token de tu cuenta. Con la API ejecutándose en otra terminal:

```sh
pnpm ngrok
```

Expone `127.0.0.1:8000` (configurable con `NGROK_PORT`) y muestra la URL HTTPS del webhook para Meta. `Ctrl+C` cierra el túnel. **Expone toda la API: usar solo con datos de desarrollo.** Más detalles en [docs/whatsapp.md](./docs/whatsapp.md).

## Verificaciones permitidas

```sh
pnpm lint
pnpm format:check
pnpm typecheck
pnpm build
pnpm --filter @whatsapp/api db:validate
```

`pnpm format` aplica Oxfmt. Build/typecheck de la API generan el cliente Prisma; no requieren una base conectada. Se usa `tsc`, no `nest build`, por la limitación de la API programática de TypeScript 7. No hay migraciones ni seeds automáticos.

**Por instrucción del usuario no se implementan ni ejecutan tests de ningún tipo, smoke checks, peticiones de prueba o comprobaciones de navegador.** Los tests originales se conservan sin ejecutarse. Las verificaciones anteriores no prueban seguridad, persistencia o comportamiento de runtime.

## Documentación

- [Arquitectura](./docs/architecture.md)
- [Roadmap y alcance](./docs/roadmap.md)
- [Frontend](./docs/frontend.md)
- [Negocios: selector, onboarding y contexto comercial](./docs/businesses.md)
- [Productos: API y catálogo persistente](./docs/products.md)
- [Features y límites de los mocks](./docs/features.md)
- [Design system](./docs/design-system.md)
- [Backend y contratos REST futuros](./docs/backend.md)
- [Swagger / OpenAPI de todas las rutas actuales](./docs/openapi.md)
- [Autenticación y sesiones actuales](./docs/authentication.md)
- [Plan de implementación del login real](./docs/login-plan.md)
- [Base de datos y migraciones](./docs/database.md)
- [Reglas de trabajo](./AGENTS.md)

Siguiente fase: ampliar RBAC y repositorios business-scoped más allá de productos, gestión de miembros/invitaciones, API del resto del comercio e integraciones externas. Auditoría, límites distribuidos, recuperación/verificación de email y verificaciones de seguridad siguen pendientes. No declarar listo para producción: compilar no comprueba seguridad ni interacciones.
