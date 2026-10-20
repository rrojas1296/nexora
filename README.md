# WhatsApp AI Sales SaaS

Monorepo de ventas y atención por WhatsApp con agentes AI. **El frontend funciona con datos ficticios en memoria; el backend es únicamente una base estructural.** No hay cuentas reales, persistencia comercial, conexión WhatsApp ni proveedor de IA.

## Stack y estructura

- `apps/web`: Next.js App Router, React, Tailwind v4, next-intl es/en, Zustand, React Query, Axios, RHF/Zod, Radix y Recharts.
- `apps/api`: NestJS modular, Zod, Prisma 7 estable y adaptador PostgreSQL. Capas hexagonales reservadas, sin endpoints de negocio.
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
```

Para explorar solo la demo frontend, no es necesario arrancar API ni PostgreSQL:

```sh
pnpm --filter @whatsapp/web dev
```

Para arrancar ambas aplicaciones después de configurar la API:

```sh
pnpm dev
```

Web usa el puerto de desarrollo Next (3000 por defecto); API usa `127.0.0.1:8000` por defecto. La API necesita `DATABASE_URL` válida y orígenes CORS exactos, pero no conecta ni migra al arrancar. Proveer PostgreSQL y aplicar una migración inicial es trabajo posterior explícito; ver [database.md](./docs/database.md). `GET /` del backend es el ejemplo `Hello World!`, no un health check. `NEXT_PUBLIC_API_URL` es público y todavía no recibe llamadas de negocio.

Los comandos de arranque son instrucciones para el operador: no se han ejecutado como verificación de esta fase, por la restricción de tests y smoke checks.

## Qué incluye la demo

Shell responsive con sidebar izquierdo colapsable, contenido limitado a 1428px, temas propios light/dark/system y español/inglés. Login/registro mock y onboarding de cinco pasos. Dashboard con comparativa de ventas; conversaciones locales; configuración de agente; productos, clientes, pedidos y tiendas con páginas de creación/edición; reportes diferenciados con filtros y CSV; ajustes y ayuda. Productos, pedidos y clientes incluyen KPIs de colección.

Usar únicamente credenciales ficticias: cualquier email válido y contraseña de 8–128 caracteres simulan acceso; `error@example.com` activa un error reproducible. **No hay protección de rutas ni identidad verificada.** Los escenarios comerciales permiten normal/vacío/error; el vacío es de solo lectura. Recargar, cambiar de perfil o restablecer descarta cambios. Solo se persiste el tema, nunca datos comerciales ni tokens.

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
- [Features y límites de los mocks](./docs/features.md)
- [Design system](./docs/design-system.md)
- [Backend y contratos REST futuros](./docs/backend.md)
- [Autenticación y seguridad futura](./docs/authentication.md)
- [Plan de implementación del login real](./docs/login-plan.md)
- [Base de datos y migraciones futuras](./docs/database.md)
- [Reglas de trabajo](./AGENTS.md)

La siguiente fase requerirá autorización separada: autenticación real con jose/argon2, sesiones y cookies seguras, CSRF, RBAC y repositorios tenant-scoped, API comercial, persistencia e integraciones externas. No conectar datos privados antes de completar y verificar esas garantías.
