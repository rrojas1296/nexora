# @whatsapp/api

Base modular NestJS del monorepo. Incluye configuración validada, CORS explícito, nueve módulos hexagonales vacíos y Prisma/PostgreSQL. No implementa autenticación ni endpoints de negocio. Conserva `GET /` del starter; no es un health check.

Desde la raíz:

```sh
pnpm install --frozen-lockfile
cp apps/api/.env.example apps/api/.env
# Editar la configuración local antes de arrancar.
pnpm --filter @whatsapp/api dev
```

Compilación y verificaciones estáticas:

```sh
pnpm --filter @whatsapp/api db:validate
pnpm --filter @whatsapp/api typecheck
pnpm --filter @whatsapp/api build
```

Se usa el ejecutable `tsc`, no el build de Nest CLI, por la limitación de la API programática de TypeScript 7. El cliente Prisma se genera antes de compilar. No hay migraciones aplicadas ni conexión verificada a PostgreSQL.

- [Arquitectura y contratos de backend](../../docs/backend.md)
- [Modelo de datos y migraciones futuras](../../docs/database.md)
- [Autenticación y límites de la simulación](../../docs/authentication.md)
- [Reglas del proyecto](../../AGENTS.md)

Por instrucción del usuario no se implementan ni ejecutan tests de ningún tipo, smoke checks ni verificaciones de runtime. Los archivos de pruebas existentes se conservan sin ejecutarlos.
