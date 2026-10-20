# Arquitectura del monorepo

## Estado actual

```text
apps/
  web/                         Next.js App Router (shell es/en, temas, acceso/onboarding y módulos comerciales mock)
  api/                         NestJS modular, configuración Zod, CORS, Prisma/PostgreSQL (sin negocio)
packages/
  typescript-config/base.json  Opciones TypeScript strict compartidas
docs/                          Decisiones y roadmap
```

Este documento describe la base implementada, no módulos futuros como si ya existieran. El detalle de las siguientes etapas está en [roadmap.md](./roadmap.md).

## Herramientas

pnpm Workspaces administra aplicaciones y paquetes internos. Turborepo coordina tareas y cachea artefactos de build. Oxlint y Oxfmt corren desde la raíz; no hay ESLint, Prettier ni Biome. Mantener un único `pnpm-lock.yaml` y un único directorio `.git` raíz.

Las versiones directas se consultaron contra el tag `latest` del registro; usar versiones estables, no prereleases. El lockfile registra las versiones exactas resueltas, incluidas dependencias transitivas. No forzar transitivas fuera de los rangos declarados por sus proveedores para perseguir artificialmente un `latest` incompatible. Las excepciones por antigüedad de publicaciones que genera pnpm están limitadas a versiones concretas en `pnpm-workspace.yaml`, sin desactivar sus políticas globales.

## TypeScript 7 y NestJS

La versión 7.0.2 de TypeScript proporciona el ejecutable `tsc` pero no la API programática que requiere Nest CLI. Para mantener todos los paquetes actualizados:

- `apps/api`: build/typecheck generan primero el cliente Prisma; `tsc -p tsconfig.build.json` compila con decoradores y metadata para NestJS; `node dist/main.js` ejecuta el resultado ESM.
- `apps/api/scripts/dev.mjs`: genera Prisma y compila inicialmente, inicia `tsc --watch` y `node --watch`, y termina ambos procesos si uno falla o recibe una señal de cierre. Tras modificar el esquema, regenerar y reiniciar dev.
- `pnpm --filter @whatsapp/api start:debug`: activa inspector en el proceso de la aplicación.
- Nest CLI permanece instalado para scaffolding; sus comandos que requieran la API programática de TypeScript seguirán sujetos a esa limitación. No usar `nest build` o `nest start` mientras persista.
- `apps/web`: `next typegen && tsc --noEmit` valida tipos y `next build` genera el build de producción.

## Límites de arquitectura

Base frontend implementada: Server Components para layouts, composición de rutas y títulos; límites client para navegación, formularios, datos interactivos, preferencias y providers. `features/workspace` compone módulos comerciales con datos ficticios. `features/demo` agrupa contratos Zod, fixture enlazada, servicio independiente de React en memoria y hooks React Query. Las mutaciones validan una copia del estado antes de publicarla e invalidan las vistas activas; los recursos comerciales permanecen en React Query, no en Zustand. Zustand gestiona tema, sidebar, perfil demo, progreso temporal del onboarding y escenario/revisión del mock. Recharts se carga por separado para dashboard y reportes. Ver [features.md](./features.md). `features/auth` y `features/onboarding` separan formularios RHF, esquemas Zod y servicios mock sin red. No hay credenciales en estado global o caché ni autenticación real; ver [authentication.md](./authentication.md). Next-intl gestiona es/en con prefijo obligatorio. El sistema de temas es propio, sin next-themes. Ver [frontend.md](./frontend.md) y [design-system.md](./design-system.md).

Backend: nueve módulos Nest registrados, cada uno con domain/application/infrastructure/presentation reservados, sin comportamiento de negocio. Configuración `.env` validada por Zod, prefijo `/api/v1`, CORS exacto con credenciales y shutdown hooks. Prisma 7 estable con adapter PostgreSQL y esquema tenant-aware; las relaciones comerciales incluyen tenant para integridad, pero no hay repositorios, autorización, consultas ni migraciones aplicadas. El cliente no conecta al arrancar. `GET /` del starter no comprueba la base. Ver [backend.md](./backend.md) para los contratos REST futuros y [database.md](./database.md) para las limitaciones del modelo. La futura aplicación depende de puertos, no de Prisma; los adaptadores viven en infraestructura.

## Variables y límites de seguridad

Cada aplicación tiene ejemplos separados: web `.env.example` y configuración local `.env.local`; api `.env.example` y `.env`. No compartir secretos entre apps ni publicar valores privados bajo `NEXT_PUBLIC_`. Los archivos locales están ignorados por Git; los ejemplos deben versionarse sin secretos. No se crean credenciales ni archivos locales automáticamente. Turbo permite pasar variables privadas solo a `@whatsapp/api#dev`; `NEXT_PUBLIC_API_URL` participa en la clave de caché del build frontend. El build incluye el cliente Prisma generado como artefacto.

## Verificación

```sh
pnpm install --frozen-lockfile
pnpm lint
pnpm format:check
pnpm typecheck
pnpm build
```

Por instrucción del usuario, por ahora no implementar ni ejecutar tests de ningún tipo, incluidos smoke tests. Los tests existentes del starter se conservan, pero no deben ejecutarse hasta nueva autorización. Lint, formato, TypeScript y build siguen habilitados.
