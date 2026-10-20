# Backend

## Estado implementado

Base NestJS 12 con TypeScript strict, ESM y compilación mediante el ejecutable `tsc` de TypeScript 7. No hay autenticación real, repositorios, casos de uso ni endpoints de negocio. Los módulos de `auth`, `users`, `business`, `stores`, `products`, `orders`, `clients`, `conversations` y `agents` están registrados, pero vacíos de comportamiento.

Se conserva el controlador original `GET /` → `Hello World!` como ejemplo del starter. No es un health check, no comprueba PostgreSQL y no acredita disponibilidad del SaaS. Las rutas futuras usarán `/api/v1`; la raíz del starter está excluida del prefijo.

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

Las capas están reservadas mediante `.gitkeep`: **no contienen entidades, puertos, adaptadores ni controladores implementados**. Evitar implementaciones ficticias que simulen seguridad. Las dependencias futuras fluyen de presentation/infrastructure hacia application/domain; Prisma no debe importarse en domain o application. Inyectar adaptadores mediante tokens explícitos en cada módulo. `DatabaseModule` no es global: los futuros adaptadores deben importarlo expresamente.

## Configuración

Cada app carga sus propias variables. Desde la raíz, para preparar el entorno local:

```sh
cp apps/api/.env.example apps/api/.env
# Editar apps/api/.env con los datos locales antes de arrancar.
pnpm --filter @whatsapp/api dev
```

Este último comando inicia la aplicación; no se ha ejecutado durante la restricción de tests/smoke. No se provisiona PostgreSQL. No copiar secretos a `apps/web` ni usar `NEXT_PUBLIC_` para valores privados.

| Variable       | Regla                                                                                                                                                                         |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`     | `development`, `production` o `test`; por defecto `development`.                                                                                                              |
| `HOST`         | No vacío; por defecto `127.0.0.1`. Usar `0.0.0.0` explícitamente si el despliegue requiere escucha externa.                                                                   |
| `PORT`         | Entero 1–65535; por defecto 8000.                                                                                                                                             |
| `DATABASE_URL` | Obligatoria, URL PostgreSQL con host y nombre de base. Credenciales/TLS según el entorno.                                                                                     |
| `CORS_ORIGINS` | Obligatoria, lista CSV de orígenes exactos únicos: esquema HTTP(S), host y puerto opcional. Sin slash final, ruta, credenciales, query ni wildcard. En producción solo HTTPS. |

`ConfigModule.forRoot` carga `.env` del directorio de la app y valida antes de escuchar. Los errores enumeran claves, no sus valores ni secretos. Los comandos pnpm filtrados y el supervisor dev usan el directorio de `apps/api`. En despliegues directos, ejecutar desde ese directorio o suministrar las variables mediante el entorno del proceso. Turborepo permite pasar las variables privadas del backend solo a su tarea dev; no al frontend.

CORS permite credenciales, métodos GET/POST/PUT/PATCH/DELETE/OPTIONS y los headers `Content-Type`, `X-CSRF-Token`, `X-Request-Id`, con preflight máximo de 600 segundos. Una lista CORS no es control de acceso: clientes no navegador pueden llamar al servidor y ausencia de Origin no autentica. Permitir un header CSRF **no verifica su valor**. Todavía no hay protección CSRF, lectura de cookies, guards ni middleware de sesión.

## Prisma y lifecycle

Prisma CLI, cliente y adaptador PostgreSQL están fijados a **7.10.1**. Al instalar, el tag `latest` de CLI apuntaba a `8.0.0-rc.23`; se eligió la versión estable, no la candidata. `pg` usa su versión estable consultada. Las únicas nuevas aprobaciones de scripts de instalación son `prisma` y `@prisma/engines`.

`PrismaService` crea el cliente con `@prisma/adapter-pg`: pool máximo 10, espera de conexión 5 segundos, inactividad 30 segundos. No ejecuta `$connect`, consultas, migraciones ni seeds al arrancar. Una conexión fallará al usarse si la base no está disponible: arrancar **no prueba salud de PostgreSQL**. `enableShutdownHooks` permite desconectar el cliente mediante `onModuleDestroy`. El cliente crudo no aplica aislamiento tenant automático; no exponerlo desde controladores.

Build, typecheck y el inicio de dev generan el cliente antes de compilar. Después de editar el esquema durante dev, regenerar y reiniciar el supervisor. No ejecutar Nest CLI build/start mientras TypeScript 7 no exponga la API programática necesaria.

```sh
pnpm --filter @whatsapp/api db:validate
pnpm --filter @whatsapp/api db:generate
pnpm --filter @whatsapp/api typecheck
pnpm --filter @whatsapp/api build
```

Validar el esquema, generar tipos y compilar no conectan a una base ni verifican queries. Ver [database.md](./database.md) para migraciones explícitas y límites del modelo.

## Contratos HTTP futuros — no implementados

La propuesta usa JSON y `/api/v1`. Las entidades de base no se devolverán directamente: validar DTOs Zod, filtrar campos sensibles y serializar Decimal como string. Los identificadores de la futura API serán UUID, no los IDs cortos de las fixtures frontend.

| Recurso                                 | Operaciones propuestas                                                                                          |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `/auth/*`                               | Registro, login, refresh, logout, sesión actual y bootstrap CSRF. Ver [authentication.md](./authentication.md). |
| `/businesses/:businessId/stores`        | GET/POST colección; GET/PATCH `/:id`.                                                                           |
| `/businesses/:businessId/products`      | GET/POST colección; GET/PATCH/DELETE `/:id`, con protección del historial.                                      |
| `/businesses/:businessId/clients`       | GET/POST colección; GET/PATCH `/:id`; historial vinculado autorizado.                                           |
| `/businesses/:businessId/orders`        | GET/POST colección; GET/PATCH `/:id`; reglas de transición e idempotencia por diseñar.                          |
| `/businesses/:businessId/conversations` | GET colección/detalle; PATCH estado/asignación; GET/POST `/:id/messages`. No implica envío real.                |
| `/businesses/:businessId/agents`        | GET/POST colección; GET/PATCH `/:id`. Activación futura requiere integración real.                              |
| `/businesses/:businessId/reports/sales` | GET con rango UTC y tienda autorizada; agregaciones en servidor.                                                |

Listas previstas: `page`, `pageSize` (máximo 100), `search` y filtros tipados; respuesta `{ data: T[], pagination: { page, pageSize, total } }`. Detalle: `{ data: T }`; eliminación sin cuerpo: 204. Errores previstos `{ code, message, requestId?, details? }`, sin stack ni secretos; `details` solo errores de validación de campos, no datos privados. Estados 400/401/403/404/409/429 según validación, sesión, permisos, pertenencia, conflicto y límites. Nada de esto está expuesto todavía, ni existe un filtro global que garantice ese formato.

La URL puede seleccionar un tenant, pero jamás autorizarlo: verificar usuario, sesión y Membership activa en cada petición, después RBAC y consultas con tenant. Un ID de otro tenant debe producir una respuesta que no confirme su existencia. Configuración, preferencias y reporting requerirán contratos definitivos antes de conectar Axios; el snapshot y los comandos locales del frontend no son esta API.

## Pendiente antes de producción

Autenticación jose/argon2, cookies seguras, rotación transaccional, CSRF, RBAC, validación HTTP, errores uniformes, límites de cuerpo/rate, auditoría sin secretos, observabilidad, transacciones, repositorios tenant-scoped, migración revisada, backup/TLS, verificaciones de seguridad y contratos de proveedores WhatsApp/IA. No se instalaron jose/argon2 porque no se implementa autenticación en esta fase.

Por restricción vigente no se implementan ni ejecutan tests, smoke checks, peticiones al servidor ni validaciones de navegador. Las pruebas existentes permanecen sin cambios y requerirán configuración y revisión cuando se autoricen.
