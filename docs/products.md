# Productos: catálogo real

## Alcance

`/{locale}/products`, `/products/new` y `/products/[id]/edit` (siempre bajo `/es` o `/en`) consumen PostgreSQL mediante la API del mismo origen. No utilizan fixtures ni los controles de escenario/restablecimiento. No hay seeds ni transferencia automática del catálogo demo. Un negocio sin productos muestra un catálogo vacío con alta habilitada para OWNER/ADMIN.

Dashboard, reportes y pedidos siguen con su catálogo ficticio independiente. Crear pedidos demo **no descuenta stock real**, ni un producto real aparece automáticamente en esos módulos. El inventario se modifica manualmente en el formulario; no hay movimientos, reservas, importaciones, imágenes, inventario por tienda ni integración externa.

## Endpoints implementados

Prefijo: `/api/v1/businesses/:businessId/products`.

| Método | Ruta relativa | Resultado                                                                         |
| ------ | ------------- | --------------------------------------------------------------------------------- |
| GET    | `/`           | 200: `{ data: Product[], pagination: { page, pageSize, total, pages }, summary }` |
| GET    | `/:id`        | 200: `{ data: Product }`                                                          |
| POST   | `/`           | 201: `{ data: Product }`                                                          |
| PATCH  | `/:id`        | 200: `{ data: Product }`                                                          |
| DELETE | `/:id`        | 204 sin cuerpo; borrado lógico                                                    |

Todas las rutas requieren sesión real y UUID válidos. El `businessId` de la URL debe coincidir con los claims verificados de la sesión; no permite seleccionar un negocio distinto. El guard global comprueba autenticación, aplica `Cache-Control: no-store` y exige CSRF firmado/Origin en mutaciones. Dentro de la transacción, el repositorio vuelve a comprobar sesión vigente, usuario activo/no eliminado, negocio no eliminado y membresía activa/no eliminada. Mantiene bloqueos compartidos sobre membresía/negocio hasta completar la operación.

- Lecturas: cualquier rol de membresía activa (OWNER, ADMIN, AGENT, VIEWER).
- Escrituras: solo OWNER/ADMIN, comprobados en servidor; esconder botones no sustituye autorización.
- Todas las búsquedas/escrituras de recursos filtran `businessId` e `isDeleted: false`. No hay extensión global Prisma ni RLS. Otros repositorios futuros deben aplicar su autorización.

### Listado y KPIs

Query estricta: `page` (1–1000000, predeterminado 1), `pageSize` (1–100, predeterminado 10), `search` (trim, hasta 100 caracteres, búsqueda por nombre/SKU sin distinguir mayúsculas) y `status=all|active|inactive` (predeterminado all). Orden estable por `createdAt DESC, id DESC`. La página se ajusta a la última disponible; un catálogo vacío tiene una página. El frontend utiliza diez filas por página.

El listado, total y KPIs se leen en una transacción RepeatableRead. `summary` siempre cubre **todos los productos no eliminados del negocio**, sin aplicar búsqueda/estado/paginación:

- `catalog`: total.
- `available`: productos activos, incluso sin stock.
- `lowStock`: activos con `stock <= lowStockThreshold`.
- `inventoryValue`: suma de `price × stock` de todo el catálogo, incluidos inactivos; decimal como string.

### Entrada de creación/edición

POST requiere todos estos campos; PATCH acepta un subconjunto no vacío. El body es estricto: no acepta IDs, `businessId`, moneda, timestamps ni `isDeleted` del cliente.

| Campos                                 | Validación                                                                                                                   |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `name`, `category`                     | String con trim, 2–100 caracteres                                                                                            |
| `sku`                                  | String con trim, 2–30 caracteres; único por negocio según la constraint PostgreSQL, sensible a mayúsculas                    |
| `description`                          | String con trim, máximo 2000 caracteres; permite vacío                                                                       |
| `brand`, `supplier`                    | String con trim, máximo 100; permiten vacío                                                                                  |
| `barcode`                              | String con trim, máximo 50; permite vacío                                                                                    |
| `price`, `cost`, `compareAtPrice`      | **Strings** decimales de 0 a 999999, hasta dos decimales, sin exponentes; usar `"0.00"` para precio comparativo no aplicable |
| `stock`, `lowStockThreshold`, `weight` | Números enteros de 0 a 1000000; peso en gramos                                                                               |
| `active`                               | Boolean                                                                                                                      |

La API guarda importes con Prisma Decimal/PostgreSQL `Decimal(18,2)`, sin usar floats como representación autoritativa. Productos nuevos usan PEN; no se admite cambio de moneda. `weight` se mapea a `weightGrams`; `compareAtPrice` nulo existente se devuelve como `"0.00"`. La respuesta añade `id`, `currency`, `createdAt` y `updatedAt` (ISO); los importes se devuelven como strings de dos decimales. El cliente los transforma para formulario/formato visual y serializa a dos decimales al guardar.

### Borrado y errores

DELETE marca `isDeleted: true` y `active: false`, sin borrar físicamente. Conserva la referencia única: un SKU eliminado no se puede reutilizar con la misma capitalización. No hay restauración ni liberación de unicidad. Si existe cualquier `OrderItem` vinculado, incluso borrado lógicamente, devuelve 409; se recomienda desactivar. La operación bloquea el producto durante comprobación/borrado. Los futuros endpoints de pedidos deberán validar explícitamente el producto no eliminado; las FK por sí solas no comprueban ese flag.

Errores de dominio: `{ statusCode, error: { code, message } }`:

- 403 `PRODUCT_FORBIDDEN`: negocio distinto, membresía/rol no autorizado o autorización revocada.
- 404 `PRODUCT_NOT_FOUND`: recurso inexistente o eliminado dentro del negocio autorizado; no revela recursos de otro negocio.
- 409 `PRODUCT_SKU_EXISTS`: conflicto de unicidad.
- 409 `PRODUCT_HAS_ORDERS`: historial vinculado.
- 400 para UUID/body/query inválidos; 401 de auth; 403 de CSRF/Origin; 429 del límite global por proceso/IP.

## Frontend y consistencia

`features/products` tiene schemas, servicio Axios, hooks React Query y componentes. Las claves empiezan por `["products", userId, businessId]` y separan listado/filtros y detalle. Las lecturas son cancelables; no se conserva una página previa de otro negocio. El reset de sesión existente cancela/elimina estas queries junto con el resto de la caché comercial.

La búsqueda del listado usa `useDebounce` de 300 ms: el input se actualiza inmediatamente y, al terminar la pausa, se aplica el término junto con el reinicio a página 1. El timeout se cancela al seguir escribiendo o desmontar; estado y paginación mantienen su respuesta inmediata. Las lecturas de listado/detalle envían directamente el GET con cookies de sesión y señal de cancelación; no consultan `/auth/me` ni `/auth/csrf` como prerrequisito al buscar, filtrar o paginar. La API sigue autorizando cada lectura y el provider de auth conserva su revalidación periódica. Solo ante un 401, el servicio intenta recuperar la sesión bajo el lock auth existente, verifica usuario/negocio esperados y repite el GET una sola vez, respetando la cancelación. Si no recupera la sesión o cambia la identidad, no reenvía la lectura. Las escrituras coordinan recuperación de sesión/CSRF mediante el Web Lock de auth y verifican usuario/negocio esperados antes de enviar. React Query no añade retries; el único reenvío de lectura es el GET rechazado con 401 tras recuperar la sesión. Las mutaciones nunca se reintentan automáticamente. Las escrituras invalidan lecturas y esperan la reconciliación; incluso ante respuesta perdida se revalida el catálogo, pues el servidor podría haber confirmado la escritura. No se reenvía la mutación. Los formularios conservan el borrador y muestran aviso de resultado incierto; revisar el listado antes de repetir una operación. No hay idempotency keys, edición con versiones/ETag ni resolución automática de ediciones concurrentes: prevalece la última escritura confirmada.

Creación/edición siguen en páginas dedicadas; solo la confirmación de eliminación usa diálogo. Los miembros sin permiso no ven acciones de escritura. Estados de carga, vacío, errores, validación y referencias duplicadas usan mensajes es/en.

## Esquema y verificación

Reutiliza `Products` y sus campos/índices existentes, incluidos `isDeleted` y `@@unique([businessId, sku])`. **No se añadió ni ejecutó una migración, seed ni operación de base de datos en esta etapa.** Requiere las migraciones existentes aplicadas en el destino de despliegue.

Verificación limitada a lint, formato, TypeScript, build y revisión estática. Por la restricción vigente no se implementaron ni ejecutaron tests, smoke checks, peticiones HTTP ni comprobaciones de navegador; compilar no demuestra comportamiento en ejecución, concurrencia, seguridad ni aislamiento efectivo. No declarar listo para producción.
