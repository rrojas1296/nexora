# @whatsapp/api

Backend NestJS del monorepo con auth real (jose/bcrypt, cookies HttpOnly, access/refresh, sesiones revocables y CSRF), configuración Zod, CORS y Prisma/PostgreSQL. Los otros ocho módulos siguen sin endpoints comerciales. `GET /` del starter queda protegido por el guard global; no es un health check. El frontend todavía usa sus servicios mock.

Desde la raíz:

```sh
pnpm install --frozen-lockfile
cp apps/api/.env.example apps/api/.env
# Editar DATABASE_URL y CORS_ORIGINS antes de arrancar.
pnpm --filter @whatsapp/api auth:configure
# Solo contra el destino autorizado, aplicar migraciones revisadas:
pnpm --filter @whatsapp/api db:migrate:deploy
pnpm --filter @whatsapp/api dev
```

Compilación y verificaciones estáticas:

```sh
pnpm --filter @whatsapp/api db:validate
pnpm --filter @whatsapp/api typecheck
pnpm --filter @whatsapp/api build
```

Se usa el ejecutable `tsc`, no el build de Nest CLI, por la limitación de la API programática de TypeScript 7. El cliente Prisma se genera antes de compilar. La migración inicial `20261020160000_initial_business_auth` se aplicó a la base configurada tras confirmar que estaba vacía. Prisma status/diff confirmaron sincronización. No se ejecutaron seeds ni se crearon usuarios; los endpoints auth no se probaron en runtime.

- [Arquitectura y contratos de backend](../../docs/backend.md)
- [Modelo de datos y migraciones](../../docs/database.md)
- [Endpoints, cookies, CSRF y límites de autenticación](../../docs/authentication.md)
- [Reglas del proyecto](../../AGENTS.md)

Por instrucción del usuario no se implementan ni ejecutan tests de ningún tipo, smoke checks ni verificaciones de runtime. Los archivos de pruebas existentes se conservan sin ejecutarlos.
