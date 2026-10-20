# Arquitectura del monorepo

## Estado actual

```text
apps/
  web/                         Next.js App Router (shell es/en, temas, acceso/onboarding y módulos comerciales mock)
  api/                         NestJS modular, auth jose/bcrypt, CORS/CSRF, Prisma/PostgreSQL (sin API comercial)
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

Base frontend implementada: Server Components para layouts, composición de rutas y títulos; límites client para navegación, formularios, datos interactivos, preferencias y providers. `features/workspace` compone módulos comerciales con datos ficticios. `features/demo` agrupa contratos Zod, fixture enlazada, servicio independiente de React en memoria y hooks React Query. Las mutaciones validan una copia del estado antes de publicarla e invalidan las vistas activas; los recursos comerciales permanecen en React Query, no en Zustand. Zustand gestiona tema, sidebar, progreso temporal del onboarding y escenario/revisión del mock; el perfil público autenticado vive en React Query. Recharts se carga por separado para dashboard y reportes. Ver [features.md](./features.md). `features/auth` integra Axios y cuentas reales, cookies HttpOnly/CSRF, Web Locks para refresh, perfil React Query y boundaries SSR bajo Suspense con `/me` sin caché. El workspace y onboarding tienen gates cliente además de la comprobación servidor; la autorización API sigue siendo obligatoria. `features/onboarding` conserva formularios RHF/Zod y borradores mock, sin persistir cambios comerciales. No hay credenciales en estado global/caché ni JWT en almacenamiento web; ver [authentication.md](./authentication.md). Next-intl gestiona es/en con prefijo obligatorio. El sistema de temas es propio, sin next-themes. Ver [frontend.md](./frontend.md) y [design-system.md](./design-system.md).

Backend: nueve módulos Nest registrados; auth implementa dominio/puertos/casos de uso, adaptadores Prisma/bcrypt/jose/CSRF y presentación HTTP con DTOs, cookies y guards. Los otros ocho módulos conservan capas reservadas sin endpoints comerciales. Configuración `.env` Zod, `/api/v1`, CORS exacto con credenciales, body limit y shutdown hooks. Guard global default-deny y sesiones revocables comprobadas contra Membership activa. `business` (`BusinessModule`) representa el negocio antes llamado tenant, con modelo `Business` y claves `businessId`. Prisma 7 estable/adapter PostgreSQL y migración inicial aplicada explícitamente; no hay seeds ni conexión/migraciones automáticas al arrancar. Las FK comerciales solo garantizan integridad, no RBAC ni aislamiento de futuros repositorios. `GET /` del starter requiere sesión y no comprueba salud. Ver [backend.md](./backend.md), [authentication.md](./authentication.md) y [database.md](./database.md). Las capas internas auth no dependen de Nest/Prisma; factories componen sus puertos/adaptadores.

## Variables y límites de seguridad

Cada aplicación tiene ejemplos separados: web `.env.example` y configuración local `.env.local`; api `.env.example` y `.env`. No compartir secretos entre apps ni publicar valores privados bajo `NEXT_PUBLIC_`. Los archivos locales están ignorados por Git; los ejemplos deben versionarse sin secretos. No se crean credenciales durante install/build/start; el comando explícito `auth:configure` genera los tres secretos ausentes en el .env local sin imprimirlos ni sobrescribir valores. En esta etapa se ejecutó por autorización de autenticación del usuario, sin crear cuentas. Turbo permite pasar las variables auth privadas solo a `@whatsapp/api#dev`; `API_INTERNAL_URL` es privada de web, participa en la clave de build y se pasa a dev. El navegador usa `/api/v1` relativo; un rewrite lo reenvía al mismo destino interno que SSR. CORS conserva el origen público exacto y producción exige HTTPS/cookies Secure. Cambiar el destino requiere rebuild. El build incluye el cliente Prisma generado como artefacto.

## Verificación

```sh
pnpm install --frozen-lockfile
pnpm lint
pnpm format:check
pnpm typecheck
pnpm build
```

Por instrucción del usuario, por ahora no implementar ni ejecutar tests de ningún tipo, incluidos smoke tests. Los tests existentes del starter se conservan, pero no deben ejecutarse hasta nueva autorización. Lint, formato, TypeScript y build siguen habilitados.
