# Productos: catálogo real

## Alcance

`/{locale}/products`, `/products/new` y `/products/[id]/edit` (siempre bajo `/es` o `/en`) consumen PostgreSQL mediante la API del mismo origen. No utilizan fixtures ni los controles de escenario/restablecimiento. No hay seeds ni transferencia automática del catálogo demo. Un negocio sin productos muestra un catálogo vacío con alta habilitada para OWNER/ADMIN.

Dashboard, reportes y pedidos siguen con su catálogo ficticio independiente. Crear pedidos demo **no descuenta stock real**, ni un producto real aparece automáticamente en esos módulos. El inventario se modifica manualmente en el formulario; no hay movimientos, reservas, importaciones masivas, inventario por tienda ni integración con almacenamiento externo. Cada producto admite una imagen opcional: archivo subido o URL HTTP/HTTPS.

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
| `name`, `category`                     | String con trim, 2–100 caracteres; categoría existente y no eliminada del negocio                                            |
| `sku`                                  | String con trim, 2–30 caracteres; único por negocio según la constraint PostgreSQL, sensible a mayúsculas                    |
| `description`                          | String con trim, máximo 2000 caracteres; permite vacío                                                                       |
| `brand`, `supplier`                    | String con trim, máximo 100; permiten vacío                                                                                  |
| `barcode`                              | String con trim, máximo 50; permite vacío                                                                                    |
| `price`, `cost`, `compareAtPrice`      | **Strings** decimales de 0 a 999999, hasta dos decimales, sin exponentes; usar `"0.00"` para precio comparativo no aplicable |
| `stock`, `lowStockThreshold`, `weight` | Números enteros de 0 a 1000000; peso en gramos                                                                               |
| `active`                               | Boolean                                                                                                                      |

`imageUrl` es obligatorio en POST (puede ser `""`), opcional en PATCH: URL HTTP/HTTPS de hasta 2048 caracteres, ruta interna exacta devuelta al subir un archivo, o cadena vacía para quitarla. Se devuelve en todas las respuestas de producto. Una ruta interna debe pertenecer a una imagen no eliminada del mismo negocio: la API lo verifica en la transacción, sin aceptar rutas arbitrarias. Las URLs externas solo se guardan: el servidor no las descarga ni valida su contenido. Listado/editor muestran miniatura con alternativa si falla, con `referrerPolicy="no-referrer"` y sin optimizador/proxy. El sitio externo recibe la solicitud del navegador; HTTPS es recomendable para evitar contenido mixto.

### Archivos de imagen y editor

El editor ofrece dos orígenes: **Desde tu dispositivo** (arrastrar un archivo o abrir el selector nativo) y **URL de imagen** (pegar y pulsar «Usar URL», también con Enter). Incluye vista previa, eliminación, estados de subida/error y mensajes es/en. Elegir un archivo inicia su subida; el producto solo se modifica al guardar. No se puede guardar ni cambiar de origen durante la subida. Si falla, se conserva el valor anterior. Quitar la imagen vacía la referencia al guardar; no elimina el archivo almacenado.

- `POST /api/v1/businesses/:businessId/products/images`: multipart con un solo campo de archivo `image`, sin campos adicionales. Devuelve 201 `{ data: { imageUrl } }`, ruta relativa del mismo origen. Solo OWNER/ADMIN, con sesión/CSRF/Origin y autorización revalidada al persistir. Límite específico: 10 peticiones/minuto por IP/proceso, no una cuota distribuida.
- `GET /api/v1/businesses/:businessId/products/images/:imageId`: bytes WebP, lectura para miembros activos del negocio. Sesión y relaciones revalidadas; recursos ajenos/eliminados dan 404. Respuesta privada sin caché, `nosniff`, `Cross-Origin-Resource-Policy: same-origin`. No son URLs públicas para WhatsApp, emails o terceros.
- Un archivo JPG/PNG/WebP de hasta **2 MiB**, máximo **20 millones de píxeles**. El navegador comprueba MIME/tamaño como ayuda; el servidor decodifica con Sharp **0.35.2**, valida formato real, limita píxeles, aplica orientación y reencoda a WebP (calidad 85, hasta 2048 × 2048 sin agrandar). Descarta metadatos y nunca sirve los bytes originales. SVG/GIF no admitidos; no hay animación, recorte ni escáner antivirus.
- Almacenamiento persistente de bytes en PostgreSQL (`ProductImages`), sin servicios externos ni disco local. Hasta **1000 archivos por negocio**, contando incluso registros marcados eliminados; un advisory lock transaccional por negocio serializa la cuota (una colisión de hash solo serializa negocios adicionales, sin compartir datos). La capacidad física, backups, concurrencia de decodificación y límites del proxy requieren revisión operativa antes de producción.
- Subir/reemplazar/quitar una imagen o abandonar el formulario no borra archivos anteriores: no hay endpoint/UI de borrado ni recolector de huérfanos. Incluso una subida cuya respuesta se perdió puede consumir cuota. No reintentar automáticamente; la limpieza requiere intervención operativa revisada. No se agregaron consultas de bytes al listado del catálogo.

La API guarda importes con Prisma Decimal/PostgreSQL `Decimal(18,2)`, sin usar floats como representación autoritativa. Productos nuevos toman la moneda persistida del Business (PEN por defecto); la creación y la configuración comparten bloqueo del negocio. No se admite moneda enviada por producto ni conversión de precios. Cambiar la moneda del negocio se rechaza si hay cualquier producto, incluso archivado; ver [businesses.md](./businesses.md). Los KPIs incluyen `currency` del Business. `weight` se mapea a `weightGrams`; `compareAtPrice` nulo existente se devuelve como `"0.00"`. La respuesta añade `id`, `currency`, `createdAt` y `updatedAt` (ISO); los importes se devuelven como strings de dos decimales. El cliente los transforma para formulario/formato visual y serializa a dos decimales al guardar.

### Borrado y errores

DELETE marca `isDeleted: true` y `active: false`, sin borrar físicamente. Conserva la referencia única: un SKU eliminado no se puede reutilizar con la misma capitalización. No hay restauración ni liberación de unicidad. Si existe cualquier `OrderItem` vinculado, incluso borrado lógicamente, devuelve 409; se recomienda desactivar. La operación bloquea el producto durante comprobación/borrado. Los futuros endpoints de pedidos deberán validar explícitamente el producto no eliminado; las FK por sí solas no comprueban ese flag.

Errores de dominio: `{ statusCode, error: { code, message } }`:

- 403 `PRODUCT_FORBIDDEN`: negocio distinto, membresía/rol no autorizado o autorización revocada.
- 404 `PRODUCT_NOT_FOUND`: recurso inexistente o eliminado dentro del negocio autorizado; no revela recursos de otro negocio.
- 409 `PRODUCT_SKU_EXISTS`: conflicto de unicidad.
- 409 `PRODUCT_HAS_ORDERS`: historial vinculado.
- 409 `PRODUCT_CATEGORY_EXISTS`: nombre de categoría ya reservado en el negocio.
- 400 `PRODUCT_CATEGORY_INVALID`: la categoría enviada no existe o está eliminada en el negocio.
- 400 `PRODUCT_IMAGE_INVALID`: archivo no decodificable, formato/límites inválidos o referencia interna inexistente/ajena.
- 409 `PRODUCT_IMAGE_LIMIT`: cuota de imágenes del negocio alcanzada.
- 413 para archivo multipart demasiado grande; 400 para multipart inválido.
- 400 para UUID/body/query inválidos; 401 de auth; 403 de CSRF/Origin; 429 del límite global por proceso/IP.

## Categorías persistentes

`GET /api/v1/businesses/:businessId/products/categories` devuelve `{ data: [{ id, name }] }`, ordenadas por nombre e ID y filtradas por negocio e `isDeleted: false`. `POST` en la misma ruta recibe `{ name }` estricto (trim, 2–100 caracteres) y devuelve 201 `{ data: { id, name } }`. Las rutas estáticas se declaran antes de `/:id`. Comparten autorización, CSRF, sesiones y permisos de productos: lectura para miembros activos, creación solo OWNER/ADMIN. El nombre es único por negocio, sensible a mayúsculas.

La pantalla `/{locale}/products/categories`, accesible desde el listado/editor, permite consultar y crear categorías; no implementa edición ni borrado. El formulario de producto usa el Select compartido y bloquea el guardado si las categorías están cargando, fallaron o no hay ninguna. Crear una categoría no crea productos. Las consultas usan el prefijo React Query de productos con identidad/negocio y las mutaciones reconcilian lecturas sin reenvíos automáticos. Al navegar a categorías desde un producto, un borrador no guardado no se conserva.

Se conserva `Products.category` como nombre para compatibilidad con los registros existentes: la API valida su pertenencia al catálogo de categorías en la transacción de escritura. No hay FK producto-categoría ni renombrado/cascadas; escritores externos deben respetar esta invariancia. La migración importa las categorías existentes válidas (2–100 caracteres) de productos no eliminados, sin modificar productos ni inventar categorías para valores vacíos/inválidos.

## Frontend y consistencia

`features/products` tiene schemas, servicio Axios, hooks React Query y componentes. Las claves empiezan por `["products", userId, businessId]` y separan listado/filtros y detalle. Las lecturas son cancelables; no se conserva una página previa de otro negocio. El reset de sesión existente cancela/elimina estas queries junto con el resto de la caché comercial.

La búsqueda del listado usa `useDebounce` de 300 ms: el input se actualiza inmediatamente y, al terminar la pausa, se aplica el término junto con el reinicio a página 1. El timeout se cancela al seguir escribiendo o desmontar; estado y paginación mantienen su respuesta inmediata. Las lecturas de listado/detalle envían directamente el GET con cookies de sesión y señal de cancelación; no consultan `/auth/me` ni `/auth/csrf` como prerrequisito al buscar, filtrar o paginar. La API sigue autorizando cada lectura y el provider de auth conserva su revalidación periódica. Solo ante un 401, el servicio intenta recuperar la sesión bajo el lock auth existente, verifica usuario/negocio esperados y repite el GET una sola vez, respetando la cancelación. Si no recupera la sesión o cambia la identidad, no reenvía la lectura. Las escrituras coordinan recuperación de sesión/CSRF mediante el Web Lock de auth y verifican usuario/negocio esperados antes de enviar. React Query no añade retries; el único reenvío de lectura es el GET rechazado con 401 tras recuperar la sesión. Las mutaciones nunca se reintentan automáticamente. Las escrituras invalidan lecturas y esperan la reconciliación; incluso ante respuesta perdida se revalida el catálogo, pues el servidor podría haber confirmado la escritura. No se reenvía la mutación. Los formularios conservan el borrador y muestran aviso de resultado incierto; revisar el listado antes de repetir una operación. No hay idempotency keys, edición con versiones/ETag ni resolución automática de ediciones concurrentes: prevalece la última escritura confirmada.

Creación/edición siguen en páginas dedicadas; solo la confirmación de eliminación usa diálogo. Los miembros sin permiso no ven acciones de escritura. Estados de carga, vacío, errores, validación y referencias duplicadas usan mensajes es/en.

## Esquema y verificación

Conserva los índices de `Products`, incluidos `isDeleted` y `@@unique([businessId, sku])`. La ampliación de imágenes/categorías añade `Products.imageUrl` y `ProductCategory` → `ProductCategories`, con `isDeleted`, FK al negocio y unicidad `[businessId, name]`. La migración versionada `20261020180000_product_images_categories` está preparada, **no ejecutada**: requiere revisión y despliegue explícito coordinado con esta API. No se conectó a la base ni se ejecutaron seeds. La migración posterior `20261020190000_product_image_uploads`, también **no aplicada**, añade `ProductImage` → `ProductImages` (bytes, FK al negocio, `isDeleted` e índice de negocio). Ambas requieren revisión y aplicación explícita en orden antes de usar la API ampliada. No hay cambios de datos existentes ni ejecución automática en install/build/dev.

Verificación limitada a lint, formato, TypeScript, build y revisión estática. Por la restricción vigente no se implementaron ni ejecutaron tests, smoke checks, peticiones HTTP ni comprobaciones de navegador; compilar no demuestra comportamiento en ejecución, concurrencia, seguridad ni aislamiento efectivo. No declarar listo para producción.
