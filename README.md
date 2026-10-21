# Nexora — WhatsApp AI Sales SaaS

Monorepo de ventas y atención por WhatsApp con agentes AI. **Frontend y backend integran autenticación real con cookies HttpOnly, jose/bcrypt y PostgreSQL; productos usa un catálogo persistente con API y la pantalla de agente guarda su configuración general en PostgreSQL. Los demás módulos comerciales siguen usando datos ficticios en memoria.** Workspace/onboarding requieren sesión. La base configurada recibió la migración inicial; no se crearon cuentas ni seeds durante implementación. El onboarding reutiliza el negocio registrado y guarda su nombre; hay API de productos, pero no de pedidos, conexión WhatsApp ni proveedor de IA.

## Stack y estructura

- `apps/web`: Next.js App Router, React, Tailwind v4, next-intl es/en, Zustand, React Query, Axios, RHF/Zod, Radix y Recharts.
- `apps/api`: NestJS modular, Zod, Prisma 7 estable y adaptador PostgreSQL. Auth hexagonal real, cookies HttpOnly, access/refresh rotativos, CSRF y sesiones revocables; PATCH del nombre del negocio activo y CRUD de productos/configuración general de agente, con escrituras OWNER/ADMIN; otros módulos sin endpoints de negocio.
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
# En la base autorizada: aplicar migraciones revisadas (no hay seeds).
pnpm --filter @whatsapp/api db:migrate:deploy
```

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

## Qué incluye la demo

Shell responsive con sidebar izquierdo colapsable, contenido limitado a 1428px, temas propios light/dark/system y español/inglés. Login/registro reales y onboarding de cinco pasos con nombre del negocio persistido; el resto sigue mock. Dashboard con comparativa de ventas; conversaciones locales; configuración persistente de agente (sin ejecución IA/WhatsApp, ver [docs/agents.md](./docs/agents.md)); productos, clientes, pedidos y tiendas con páginas de creación/edición; reportes diferenciados con filtros y CSV; ajustes y ayuda. Productos, pedidos y clientes incluyen KPIs de colección. Productos consulta PostgreSQL con filtros/paginación remotos, valida referencias únicas por negocio y usa borrado lógico; sus KPIs provienen de la colección completa del negocio. Dashboard, pedidos y reportes no consumen este catálogo real.

Registrar una cuenta crea usuario y negocio reales; exige contraseña de al menos 12 caracteres y como máximo 72 bytes UTF-8. La sesión se recupera al recargar por cookies, con renovación coordinada entre pestañas y cierre actual/global en el header. Cambio de contraseña real en `/{locale}/settings/password`, accesible desde el header y Configuración: exige la actual, guarda un hash bcrypt nuevo y revoca todas las sesiones antes de pedir login de nuevo. Desde login también hay enlace a `/{locale}/change-password`: email y contraseña actual permiten cambiarla sin entrar al panel ni crear una sesión. Ambos flujos revocan las sesiones de la cuenta verificada. No es recuperación por email; los códigos quedan pendientes. No hay credenciales precreadas ni emails especiales. Los escenarios de los módulos mock permiten normal/vacío/error; el vacío es de solo lectura. Productos y configuración de agente quedan fuera de esos controles y conservan sus registros al recargar, cerrar sesión o restablecer la demo. Recargar, cambiar de identidad o restablecer descarta cambios mock; completar el wizard guarda únicamente el nombre del negocio real; el resto sigue en memoria. Los productos se persisten en PostgreSQL, no en almacenamiento web. No se persisten tokens ni colecciones comerciales en almacenamiento web: solo tema y una marca booleana conservadora contra replay de refresh incierto.

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
- [Productos: API y catálogo persistente](./docs/products.md)
- [Features y límites de los mocks](./docs/features.md)
- [Design system](./docs/design-system.md)
- [Backend y contratos REST futuros](./docs/backend.md)
- [Autenticación y sesiones actuales](./docs/authentication.md)
- [Plan de implementación del login real](./docs/login-plan.md)
- [Base de datos y migraciones](./docs/database.md)
- [Reglas de trabajo](./AGENTS.md)

Siguiente fase: ampliar RBAC y repositorios business-scoped más allá de productos, selección autorizada de negocio, API del resto del comercio e integraciones externas. Auditoría, límites distribuidos, recuperación/verificación de email y verificaciones de seguridad siguen pendientes. No declarar listo para producción: compilar no comprueba seguridad ni interacciones.
