# Base de datos

## Estado

Prisma 7.10.1 + PostgreSQL, con generador `prisma-client` ESM y adaptador `@prisma/adapter-pg`. `apps/api/prisma/` contiene un esquema multifichero inicial validado estáticamente, **no una base creada o migrada**. No se ejecutaron consultas, migraciones, seeds ni comprobaciones de conexión. No hay datos reales ni servicios de negocio persistentes. El frontend continúa usando sus fixtures en memoria.

`prisma.config.ts` carga el `.env` propio de la API mediante dotenv. La URL se declara allí, no en el bloque datasource del esquema (Prisma 7). Para validate/generate sin base disponible se omite la sección datasource si no existe `DATABASE_URL`; los comandos de migración necesitan una URL configurada. No hay una URL de producción de fallback.

## Organización del esquema

`apps/api/prisma.config.ts` apunta a la carpeta `prisma`: Prisma 7 carga recursivamente sus archivos `.prisma` como un único esquema lógico, sin imports ni flags experimentales. `prisma/schema.prisma` conserva únicamente generator/datasource; la ruta relativa del cliente generado no cambia. Las migraciones continúan en `prisma/migrations`.

```text
apps/api/prisma/
  schema.prisma                 Generador ESM y datasource PostgreSQL
  models/
    business.prisma             Business
    auth.prisma                 User, Membership, RefreshSession y MembershipRole
    stores.prisma               Store
    products.prisma             Product
    clients.prisma              Client y ClientSegment
    orders.prisma               Order, OrderItem y OrderStatus
    conversations.prisma        Conversation, ConversationStatus y ConversationAssignment
    messages.prisma             Message, MessageDirection y MessageStatus
    agents.prisma               Agent y AgentTone
```

Los enums viven junto al dominio que los utiliza. Las relaciones entre archivos no requieren declaraciones adicionales. Esta separación solo reorganiza archivos: no cambia tablas, campos, índices, valores por defecto ni relaciones, y no requiere una migración. Los comandos existentes `db:validate`, `db:generate` y de migraciones siguen leyendo la configuración común. Mantener los futuros modelos en el archivo de su dominio o añadir otro archivo bajo `models/`, sin duplicar generadores o datasource.

## Modelo inicial

| Modelo           | Propósito previsto                                                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `Business`       | Negocio/espacio de trabajo, slug único.                                                                                      |
| `User`           | Identidad global, email normalizado único y hash de contraseña; sin implementación de cuentas.                               |
| `Membership`     | Pertenencia usuario–tenant, rol OWNER/ADMIN/AGENT/VIEWER y estado activo. PK compuesta `(businessId, userId)`.               |
| `RefreshSession` | Hash del refresh, familia, expiración y revocación, vinculados a una Membership del mismo tenant. No guarda tokens en claro. |
| `Store`          | Tienda, dirección, moneda y zona horaria preferidas, estado.                                                                 |
| `Product`        | Catálogo tenant, SKU, descripción/categoría/marca/proveedor/código de barras, importes, stock, umbral y peso.                |
| `Client`         | Contacto, empresa/identificación fiscal, segmento, dirección/país/idioma, estado, notas y consentimiento.                    |
| `Order`          | Referencia tenant, cliente/tienda del mismo tenant, estado, moneda y fechas.                                                 |
| `OrderItem`      | Producto y pedido del mismo tenant, nombre/precio históricos y cantidad.                                                     |
| `Conversation`   | Cliente, tienda opcional, estado, modo agente/humano y responsable humano opcional del mismo tenant.                         |
| `Message`        | Dirección, estado, cuerpo y conversación del mismo tenant. No configura WhatsApp.                                            |
| `Agent`          | Instrucciones, saludo, tono, activación inicialmente falsa y tienda opcional del mismo tenant. No configura un proveedor AI. |

IDs UUID y fechas `Timestamptz(3)`. Importes `Decimal(18,2)`; no usar float de JavaScript como representación autoritativa en la API. Moneda ISO de 3 caracteres, con valor por defecto `PEN` (sol peruano) en `Store`, `Product` y `Order`; país de 2 y zona horaria IANA por validar en aplicación. Este valor por defecto está declarado en el esquema, no aplicado a una base de datos; no convierte importes existentes. Las fechas comerciales usan `placedAt`; `createdAt` conserva la creación del registro. Los campos de snapshot de líneas no deben reescribirse al cambiar el catálogo.

## Business y relaciones multi-tenant

`Business` sustituye el nombre anterior `Tenant`; el módulo es `business`, las relaciones se llaman `business` y las claves `businessId`. Se conserva el concepto arquitectónico multi-tenant y la misma integridad relacional. El cambio afecta al esquema fuente, no a una base desplegada: no se ha ejecutado ninguna migración. Si existiera una base creada con los nombres anteriores, haría falta una migración de renombrado revisada, no borrar/recrear tablas ni asumir que generar Prisma la actualiza.

- Cada recurso comercial lleva `businessId`. Los índices compuestos comienzan por él para los accesos previstos.
- Además de IDs globalmente únicos, los recursos referenciables declaran `@@unique([businessId, id])`. Las relaciones comerciales usan **ambas columnas**: un pedido no podrá apuntar a una tienda o cliente de otro negocio cuando se apliquen las constraints en PostgreSQL.
- Las líneas atan `(businessId, orderId)` y `(businessId, productId)`; mensajes atan `(businessId, conversationId)`. Las asignaciones humanas y sesiones usan `(businessId, userId)` de Membership.
- SKU, email del cliente y referencia de pedido son únicos dentro del tenant. El email del usuario es global. Normalizar trim/case en los futuros casos de uso; los índices no convierten a minúsculas por sí mismos.
- Borrado con `Restrict`: no borrar historia comercial por cascada. Desactivación y borrados explícitos deberán respetar políticas de retención.
- Un agente por tienda no nula mediante `@@unique([businessId, storeId])`. PostgreSQL permite múltiples valores nulos: **no garantiza un único agente general por tenant**. Si se adopta ese requisito, añadir un índice parcial en una migración revisada.

Estas constraints preparan integridad relacional, **no aislamiento completo**. Una consulta Prisma sin filtro aún puede leer otros tenants. No existen repositorios tenant-scoped, guards, RLS, roles SQL restringidos ni un contexto de tenant verificado. El cliente `PrismaService.client` es crudo. La autorización y pertenencia activa deben comprobarse desde servidor; no confiar en `businessId` del navegador ni en claims sin revisar sesión y pertenencia.

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

## Migraciones futuras — no ejecutadas

Cuando se autorice conectar una base local desechable y se revise el modelo:

```sh
# Crear SQL para revisión; requiere PostgreSQL y shadow database/permisos adecuados.
pnpm --filter @whatsapp/api db:migrate:dev --name initial --create-only
# Tras revisar constraints, índices, retención y seguridad:
pnpm --filter @whatsapp/api db:migrate:dev
# En despliegue, solo migraciones revisadas y versionadas:
pnpm --filter @whatsapp/api db:migrate:deploy
```

No hay migración inicial versionada todavía: `migrate deploy` no crea este esquema sin ella. No ejecutar `db push`, reset, migraciones, seeds o introspección automáticamente al instalar, compilar o arrancar. No usar una base de producción para desarrollo. Eliminar/alterar datos requiere aprobación independiente y backup. Migraciones de CI usarán un rol específico; el proceso de aplicación no debe disponer de permisos DDL innecesarios.

## Seguridad y operación pendientes

TLS verificado según proveedor (no desactivar la validación de certificados), backups y restauración, rotación de credenciales, separación de roles, índices revisados con carga real, transacciones, políticas de borrado y datos personales, auditoría, expiración/limpieza de sesiones y límites de pools según réplicas. Las integraciones necesitarán almacenamiento seguro de secretos; no se incluyen tokens WhatsApp o AI en estas tablas.

La familia de sesiones es solo estructura: no hay firma JWT, hashing, bloqueo, rotación, revocación automática ni detección de reutilización implementados. No introducir credenciales reales ni datos privados hasta completar seguridad y verificaciones autorizadas. El usuario mantiene prohibida la implementación y ejecución de tests, incluidos smoke checks; schema validate/typecheck/build no demuestran aislamiento ni funcionamiento de PostgreSQL.
