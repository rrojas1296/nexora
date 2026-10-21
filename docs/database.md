# Base de datos

## Estado

Prisma 7.10.1 + PostgreSQL, con generador `prisma-client` ESM y adaptador `@prisma/adapter-pg`. La migración `20261020160000_initial_business_auth` está versionada y **aplicada a la base configurada en `apps/api/.env`**, tras confirmar que no tenía tablas en public. Crea las tablas comerciales y de autenticación, sin reset ni seeds. `migrate status` confirmó actualización y el diff contra el esquema no detectó diferencias. El backend persiste cuentas/sesiones al invocar auth; no se crearon usuarios durante esta etapa. El módulo business permite actualizar el nombre del negocio activo; productos tiene CRUD persistente y agente tiene lectura/guardado de configuración general autorizados por negocio activo; los demás módulos comerciales siguen sin lógica persistente y usan fixtures en memoria. Ver [products.md](./products.md) y [agents.md](./agents.md).

La migración posterior `20261020170000_plural_tables_soft_delete` también está **aplicada a la base configurada**, tras autorización explícita del usuario. `migrate status` confirmó las dos migraciones al día y `migrate diff --from-config-datasource --to-schema prisma --exit-code` devolvió `No difference detected.` Se renombraron las tablas y añadieron las columnas sin reset, seeds ni borrado de datos. El esquema y el cliente actuales requieren estos cambios: otra base que solo tenga la migración inicial debe recibir el deploy revisado antes de usar esta API.

`prisma.config.ts` carga el `.env` propio de la API mediante dotenv. La URL se declara allí, no en el bloque datasource del esquema (Prisma 7). Para validate/generate sin base disponible se omite la sección datasource si no existe `DATABASE_URL`; los comandos de migración necesitan una URL configurada. No hay una URL de producción de fallback.

## Organización del esquema

`apps/api/prisma.config.ts` apunta a la carpeta `prisma`: Prisma 7 carga recursivamente sus archivos `.prisma` como un único esquema lógico, sin imports ni flags experimentales. `prisma/schema.prisma` conserva únicamente generator/datasource; la ruta relativa del cliente generado no cambia. Las migraciones continúan en `prisma/migrations`.

```text
apps/api/prisma/
  schema.prisma                 Generador ESM y datasource PostgreSQL
  models/
    business.prisma             Business
    auth.prisma                 User, Membership, AuthSession, RefreshSession y MembershipRole
    stores.prisma               Store
    products.prisma             Product
    clients.prisma              Client y ClientSegment
    orders.prisma               Order, OrderItem y OrderStatus
    conversations.prisma        Conversation, ConversationStatus y ConversationAssignment
    messages.prisma             Message, MessageDirection y MessageStatus
    agents.prisma               Agent y AgentTone
```

Los enums viven junto al dominio que los utiliza. Las relaciones entre archivos no requieren declaraciones adicionales. La separación original en archivos solo reorganizó el esquema, sin cambiar tablas ni requerir una migración. La posterior pluralización y el campo de borrado lógico sí requieren la migración descrita abajo. Los comandos existentes `db:validate`, `db:generate` y de migraciones siguen leyendo la configuración común. Mantener los futuros modelos en el archivo de su dominio o añadir otro archivo bajo `models/`, sin duplicar generadores o datasource.

## Modelo inicial

| Modelo           | Propósito previsto                                                                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Business`       | Negocio/espacio de trabajo, slug único.                                                                                                                            |
| `User`           | Identidad global, email normalizado único y hash bcrypt; registro/login implementados en auth.                                                                     |
| `Membership`     | Pertenencia usuario–tenant, rol OWNER/ADMIN/AGENT/VIEWER y estado activo. PK compuesta `(businessId, userId)`.                                                     |
| `AuthSession`    | Familia estable por usuario/negocio: expiración absoluta, inactividad y revocación; vinculada a Membership.                                                        |
| `RefreshSession` | Hash SHA-256 del refresh, familia, expiración, consumo y revocación. FK compuesta a AuthSession y Membership del mismo negocio/usuario. No guarda tokens en claro. |
| `Store`          | Tienda, dirección, moneda y zona horaria preferidas, estado.                                                                                                       |
| `Product`        | Catálogo tenant, SKU, descripción/categoría/marca/proveedor/código de barras, importes, stock, umbral y peso.                                                      |
| `Client`         | Contacto, empresa/identificación fiscal, segmento, dirección/país/idioma, estado, notas y consentimiento.                                                          |
| `Order`          | Referencia tenant, cliente/tienda del mismo tenant, estado, moneda y fechas.                                                                                       |
| `OrderItem`      | Producto y pedido del mismo tenant, nombre/precio históricos y cantidad.                                                                                           |
| `Conversation`   | Cliente, tienda opcional, estado, modo agente/humano y responsable humano opcional del mismo tenant.                                                               |
| `Message`        | Dirección, estado, cuerpo y conversación del mismo tenant. No configura WhatsApp.                                                                                  |
| `Agent`          | Instrucciones, saludo, tono, activación inicialmente falsa y tienda opcional del mismo tenant. No configura un proveedor AI.                                       |

IDs UUID y fechas `Timestamptz(3)`. Importes `Decimal(18,2)`; no usar float de JavaScript como representación autoritativa en la API. Moneda ISO de 3 caracteres, con valor por defecto `PEN` (sol peruano) en `Store`, `Product` y `Order`; país de 2 y zona horaria IANA por validar en aplicación. Este valor por defecto también forma parte de la migración inicial aplicada; no convierte importes existentes. Las fechas comerciales usan `placedAt`; `createdAt` conserva la creación del registro. Los campos de snapshot de líneas no deben reescribirse al cambiar el catálogo.

## Tablas plurales y borrado lógico

Los 13 modelos conservan nombres singulares y delegates como `prisma.user` mediante `@@map`; únicamente los nombres físicos PostgreSQL pasan al plural:

| Modelo Prisma    | Tabla PostgreSQL  |
| ---------------- | ----------------- |
| `User`           | `Users`           |
| `Business`       | `Businesses`      |
| `Membership`     | `Memberships`     |
| `AuthSession`    | `AuthSessions`    |
| `RefreshSession` | `RefreshSessions` |
| `Store`          | `Stores`          |
| `Product`        | `Products`        |
| `Client`         | `Clients`         |
| `Order`          | `Orders`          |
| `OrderItem`      | `OrderItems`      |
| `Conversation`   | `Conversations`   |
| `Message`        | `Messages`        |
| `Agent`          | `Agents`          |

Todos incorporan `isDeleted Boolean @default(false)` no nulo. `false` indica registro no eliminado; `true` marca borrado lógico sin eliminar la fila. `active`, `revokedAt` y `consumedAt` mantienen sus significados separados. No se añaden endpoints de eliminación/restauración ni se intercepta `delete`/`deleteMany`: el cliente Prisma crudo todavía puede borrar físicamente. Los futuros casos de uso de eliminación deberán actualizar el flag explícitamente y autorizar cada operación.

- Auth excluye usuarios, membresías, negocios, familias y tokens eliminados en credenciales, creación/validación de sesión, rotación y perfil. Una membresía o negocio eliminado tampoco se devuelve en `/me`. La actualización del nombre requiere negocio, usuario y membresía no eliminados. Productos también comprueba sesión/relaciones y filtra negocio e `isDeleted`; su borrado marca el flag y desactiva, sin liberar SKU ni permitir eliminar referencias con OrderItems.
- Logout y la revocación de familia incluyen filas eliminadas intencionalmente; el bloqueo `FOR UPDATE` usa `AuthSessions`. Un borrado lógico no revoca automáticamente sesiones relacionadas ni se propaga por cascada. Antes de ofrecer restauración, diseñar revocación transaccional y auditoría para evitar reactivar sesiones aún vigentes.
- Los índices únicos se conservan: email, slug, SKU, referencias y claves de membresía siguen reservados aunque una fila esté eliminada. No se habilita reutilización ni recreación de cuentas con el mismo email; requeriría una política y migración independientes.
- Las FK y `Restrict` permanecen. Las FK no verifican `isDeleted`, ni hay filtro global/RLS: los futuros repositorios comerciales deberán filtrar `businessId`, `isDeleted: false` y relaciones autorizadas explícitamente. No se añaden índices sobre el booleano aislado; revisar índices compuestos/parciales según consultas y carga reales.

## Business y relaciones multi-tenant

`Business` sustituye el nombre anterior `Tenant`; el módulo es `business`, las relaciones se llaman `business` y las claves `businessId`. Se conserva el concepto arquitectónico multi-tenant y la misma integridad relacional. La migración inicial ya crea `Business` y sus claves con estos nombres. Una base externa creada con los nombres anteriores necesitaría una migración de renombrado revisada y un baseline apropiado: no aplicar a ciegas esta migración inicial ni borrar/recrear tablas.

- Cada recurso comercial lleva `businessId`. Los índices compuestos comienzan por él para los accesos previstos.
- Además de IDs globalmente únicos, los recursos referenciables declaran `@@unique([businessId, id])`. Las relaciones comerciales usan **ambas columnas**: un pedido no podrá apuntar a una tienda o cliente de otro negocio cuando se apliquen las constraints en PostgreSQL.
- Las líneas atan `(businessId, orderId)` y `(businessId, productId)`; mensajes atan `(businessId, conversationId)`. Las asignaciones humanas y sesiones usan `(businessId, userId)` de Membership.
- SKU, email del cliente y referencia de pedido son únicos dentro del tenant. El email del usuario es global. Normalizar trim/case en los futuros casos de uso; los índices no convierten a minúsculas por sí mismos.
- Borrado con `Restrict`: no borrar historia comercial por cascada. Desactivación y borrados explícitos deberán respetar políticas de retención.
- Un agente por tienda no nula mediante `@@unique([businessId, storeId])`. PostgreSQL permite múltiples valores nulos: **no garantiza un único agente general por tenant**. La API de configuración general serializa sus escrituras bloqueando el negocio y rechaza duplicados/registros eliminados, sin cambiar el esquema. No garantiza unicidad ante escritores externos: para una garantía de base de datos se requiere un índice parcial en una migración revisada. Ver [agents.md](./agents.md).

Estas constraints preparan integridad relacional, **no aislamiento completo**. Una consulta Prisma sin filtro aún puede leer otros tenants. Auth sí tiene repositorio y guard que verifican usuario, sesión y Membership activa para businessId. Productos ya tiene repositorio business-scoped con comprobación de membresía y OWNER/ADMIN para escrituras. El resto de recursos carece de repositorios/RBAC comerciales; no hay RLS ni roles SQL restringidos configurados. El cliente `PrismaService.client` es crudo. La autorización y pertenencia activa deben comprobarse desde servidor; no confiar en `businessId` del navegador ni en claims sin revisar sesión y pertenencia.

Las verificaciones numéricas (precios/stock no negativos, cantidad positiva), moneda/país válidos, consistencia de moneda en pedidos, catálogo activo, estados permitidos, concurrencia de inventario y email normalizado requerirán Zod, reglas de dominio y constraints SQL adicionales cuando correspondan. El esquema Prisma no garantiza por sí solo esas reglas. Las FK no verifican que una Membership esté activa. El booleano de marketing no acredita consentimiento legal con fecha/fuente; esa evidencia deberá diseñarse antes de comunicaciones reales.

## Generación y compilación

Desde la raíz:

```sh
pnpm install --frozen-lockfile
pnpm --filter @whatsapp/api db:validate
pnpm --filter @whatsapp/api db:generate
pnpm --filter @whatsapp/api typecheck
pnpm --filter @whatsapp/api build
```

El cliente se genera en `apps/api/src/infrastructure/database/generated`, ignorado por Git y por Oxc; el build compila su salida a `dist`. Turbo conserva el cliente como artefacto de build. No editar archivos generados. Los scripts build/typecheck/dev ya generan el cliente; `db:generate` separado es útil tras editar el esquema. Ni generación ni compilación requieren conectarse a PostgreSQL.

## Migraciones explícitas

La migración inicial está en `apps/api/prisma/migrations/20261020160000_initial_business_auth/migration.sql`: 13 tablas, enums, índices y FK; se ejecuta dentro de BEGIN/COMMIT. Incluye AuthSession y el estado consumedAt del refresh para rotación y replay. No modifica ni borra tablas existentes. Para desplegar en otra base vacía configurada:

```sh
pnpm --filter @whatsapp/api db:migrate:deploy
pnpm --filter @whatsapp/api exec prisma migrate status

# Cambios posteriores: solo en base de desarrollo con shadow database/permisos adecuados.
pnpm --filter @whatsapp/api db:migrate:dev --name descriptive_change --create-only
# Revisar SQL antes de aplicar; nunca usar migrate dev contra producción.
```

### Migración de pluralización y borrado lógico (aplicada al destino autorizado)

`apps/api/prisma/migrations/20261020170000_plural_tables_soft_delete/migration.sql` usa una transacción con `ALTER TABLE ... RENAME TO`, añade `isDeleted NOT NULL DEFAULT false` a las 13 tablas y renombra PK, FK e índices según los nombres esperados por Prisma. No modifica la migración inicial ya aplicada, no recrea tablas ni elimina filas. Los registros existentes quedan con `isDeleted = false`; las referencias se conservan en PostgreSQL.

El cambio **no es compatible con ejecutar simultáneamente la API antigua y la nueva**. Preparar backup y ventana coordinada: detener instancias antiguas y trabajos que usen los nombres singulares, revisar/aplicar explícitamente la migración en el destino autorizado con `pnpm --filter @whatsapp/api db:migrate:deploy`, y desplegar/arrancar la API con el cliente regenerado. En el destino configurado se ejecutaron explícitamente `db:migrate:deploy`, `migrate status` y el diff de base a esquema: migraciones al día y sin diferencias. No se borraron datos ni se modificaron filas comerciales existentes, salvo el nuevo flag con valor inicial `false`. Estos comandos comprueban aplicación/sincronización del esquema, no el funcionamiento de consultas de negocio, comportamiento de auth o garantías de aislamiento; no se ejecutaron tests.

Si el destino ya tiene tablas o migraciones ajenas, detenerse y diseñar un baseline/migración compatible; no asumir que está vacío. No ejecutar `db push`, reset, migraciones, seeds o introspección automáticamente al instalar, compilar o arrancar. No usar una base de producción para desarrollo. Eliminar/alterar datos requiere aprobación independiente y backup. Migraciones de CI usarán un rol específico; el proceso de aplicación no debe disponer de permisos DDL innecesarios.

## Seguridad y operación pendientes

TLS verificado según proveedor (no desactivar la validación de certificados), backups y restauración, rotación de credenciales, separación de roles, índices revisados con carga real, transacciones, políticas de borrado y datos personales, auditoría, expiración/limpieza de sesiones y límites de pools según réplicas. Las integraciones necesitarán almacenamiento seguro de secretos; no se incluyen tokens WhatsApp o AI en estas tablas.

La familia de sesiones implementa bloqueo FOR UPDATE, rotación transaccional, consumo persistido y revocación por replay; ver [authentication.md](./authentication.md). Programar limpieza preservando evidencia hasta la expiración de la familia; no hay job de retención. La operación de migración confirmó sincronización de esquema, no el comportamiento de las consultas de autenticación ni aislamiento comercial. El usuario mantiene prohibida la implementación y ejecución de tests, incluidos smoke checks; schema validate/typecheck/build tampoco demuestran esas garantías. No declarar listo para producción.
