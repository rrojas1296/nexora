# Clientes y pedidos persistentes

## Alcance y despliegue

Clientes y Pedidos dejan de consumir fixtures. Las páginas, formularios y herramientas IA comparten `Clients`/`Orders`/`OrderItems` del Business activo. Dashboard, reportes y conversaciones demo heredadas siguen independientes en memoria; no se importan fixtures ni se recalculan con pedidos reales. No hay cobros, conciliación bancaria, despacho, impuestos, reserva/descuento de stock o comunicaciones de marketing.

Migración `20261020270000_clients_orders_pages`, **creada y no aplicada**. Requiere `20261020260000_whatsapp_commerce_tools` y todas sus predecesoras. Hace email/país de cliente opcionales, añade versión y hash de creación a clientes, hash de creación a pedidos y vínculo opcional `WhatsappThread.clientId` con FK compuesta Business/cliente e índices. No crea ni vincula clientes históricos, no elimina datos ni deduplica teléfonos. El índice único de email por Business se conserva (PostgreSQL admite varios null); los emails ya reservados, incluidos borrados, no se reutilizan.

Revisar SQL, backup, destino y **todas** las pendientes antes de un deploy explícitamente autorizado. No arrancar este código contra un esquema anterior. `db:migrate:deploy` aplica todas las pendientes, no solo esta. No se conectó a PostgreSQL, Meta u OpenAI ni se modificaron secretos durante esta ampliación.

## API

Prefijo `/api/v1/businesses/:businessId`. Cookie/sesión válida, Business activo igual al de la ruta, usuario/membresía/negocio no eliminados y membresía activa en cada operación. Lectura para cualquier rol activo; escritura solo OWNER/ADMIN con Origin/CSRF. Controllers documentados con Zod/Swagger; servicios/modelos/contratos sin Nest ni Prisma. Sin RLS/filtro global ni autorización delegada a las FK.

| Ruta                       | Comportamiento                                                                                                                                                                   |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /clients`             | Búsqueda nombre/email/teléfono/empresa, paginación remota y KPIs globales total/activos/VIP.                                                                                     |
| `GET /clients/:clientId`   | Perfil comercial del cliente no eliminado y número de pedidos no eliminados.                                                                                                     |
| `POST /clients`            | Crea cliente con UUID estable `id`, email/país opcionales y perfil comercial validado.                                                                                           |
| `PATCH /clients/:clientId` | Reemplaza campos del perfil con `version` exacta; incrementa versión. Desactivar no borra su historial.                                                                          |
| `GET /orders`              | Búsqueda referencia/nombre de cliente; filtros `status`/`clientId`; paginación y KPIs globales por estado. Incluye pedidos manuales y de WhatsApp, sin escribir en fixtures.     |
| `GET /orders/:orderId`     | Detalle, cliente si existe, líneas históricas, subtotal Decimal como string, moneda, pago/entrega y versión.                                                                     |
| `POST /orders`             | Crea DRAFT manual para cliente activo. UUID `id` estable; de 1 a 10 productos distintos, cantidades enteras 1–10000. Precio/nombre/moneda vienen del servidor, no del navegador. |
| `PATCH /orders/:orderId`   | Exige versión exacta. Cliente/líneas solo editables en DRAFT manual. Transiciones limitadas descritas abajo.                                                                     |

Listados: `page`/`pageSize` (máximo 100)/`search` (máximo 100 caracteres); respuesta `{data, pagination, summary}`. KPIs ignoran búsqueda, estado, cliente y página. Fechas UTC; importes por moneda persistida, sin sumar monedas ni convertir precios. `POST`/detalle/edición devuelven `{data}`.

Cliente: nombre 2–160, teléfono normalizado `+` seguido de 5–20 dígitos (primero no cero); email vacío del formulario se envía/guarda null y los informados en minúsculas. País opcional con código de dos letras mayúsculas (no hay validación contra catálogo ISO completo), preferencias es/en, segmento retail/wholesale/vip y notas de hasta 5000 caracteres. Los teléfonos **no son únicos** en el esquema: coincidencias múltiples no se fusionan ni seleccionan automáticamente por la IA. El booleano marketingConsent no sustituye evidencia legal con fecha/fuente y no activa comunicaciones.

Creación idempotente: UUID y SHA-256 del input validado por registro. Un UUID repetido con el mismo contenido dentro del mismo negocio devuelve el registro existente; con otro contenido/negocio o eliminado devuelve conflicto. El hash no es auditoría ni autorización ni comprueba que el registro no haya sido editado después. Dos UUID diferentes son dos intenciones distintas: no hay deduplicación semántica. Escrituras con versión incorrecta/conflictos de unicidad/transición inválida devuelven 409; no se repiten automáticamente.

### Estados de pedido

- Manual DRAFT → PENDING mediante acción explícita OWNER/ADMIN. Revalida cliente activo, productos activos/no eliminados, stock suficiente, moneda y coincidencia de los snapshots de precio/nombre con catálogo; si cambió el catálogo hay que editar/guardar el borrador antes de confirmar.
- DRAFT/PENDING → CANCELLED. No devuelve dinero ni repone inventario porque no se ejecutó ninguna operación financiera/de stock.
- PENDING → PAID solo si `paymentStatus === VALIDATED`, obtenido por revisión humana de comprobante en Conversaciones. No permite acreditar pagos escribiendo un campo desde este API. Los pedidos manuales no tienen actualmente alta/revisión de comprobantes fuera del inbox; no se pueden marcar pagados por esta UI sin ese prerrequisito.
- PAID → SHIPPED es registro manual del estado, no integración con transporte/cotización ni prueba de entrega.
- Los borradores de WhatsApp **no** pueden editar cliente/líneas ni pasar a PENDING desde esta página: necesitan el resumen y comando exacto del cliente en el hilo. Sí pueden cancelarse. No hay transición de vuelta a DRAFT ni reapertura de CANCELLED/SHIPPED.

Cada edición incrementa versión e invalida token/job de resumen. Precios de líneas no cambian al editar el catálogo; guardar las líneas de un borrador manual vuelve a tomar precios/nombres actuales de todas las líneas. Stock se comprueba, pero no se reserva ni descuenta: pedidos simultáneos pueden competir por existencias. Se conservan Store/FK legacy sin selector de tiendas ni inventario por sucursal. No se borran físicamente clientes, pedidos o líneas: al reemplazar líneas se marcan anteriores `isDeleted`.

## IA: crear/vincular clientes y pedidos

El proveedor sigue siendo reemplazable y acotado; ver [ai.md](./ai.md) y [whatsapp-commerce.md](./whatsapp-commerce.md).

- `get_customer` devuelve solo `{id,name}` del cliente activo vinculado al hilo; no es buscador global y no permite explorar otros contactos.
- `ensure_customer` acepta nombre proporcionado por la persona y email opcional/null. Teléfono se deriva **exclusivamente** de `contactWaId` del hilo autorizado; el modelo no elige Business, hilo, ID de cliente ni teléfono. No se permite sobrescribir perfiles ni otorgar consentimiento.
- Sin vínculo, busca coincidencias no eliminadas del mismo Business por teléfono exacto `+contactWaId`. Una coincidencia activa se vincula, varias o inactivas requieren revisión humana. Un email ya reservado requiere revisión; no se vincula por email ni se revela el perfil coincidente. Si no hay coincidencia, crea cliente con país/email ausentes en null y marketingConsent false.
- Vínculo eliminado/inactivo o cuyo teléfono cambió requiere revisión humana; no se reasigna a otra identidad automáticamente. Vincular a un cliente existente no cambia su nombre/email.
- La vinculación asigna al cliente los borradores del mismo hilo sin cliente, incrementa sus versiones e invalida resúmenes. No rellena pedidos PENDING históricos. Después de vincular, la IA debe releer los borradores.
- Preparar pedido, presentar resumen y confirmar requieren cliente activo vinculado con teléfono del remitente y mismo cliente del pedido. Productos/precios/stock provienen del catálogo real. Se mantienen la confirmación exacta posterior a resumen aceptado por Meta, versiones, control AI/HUMAN y ventana de 24h. No se crean clientes por saludos/consultas de catálogo: el prompt exige intención de compra o registro explícito y preguntar el nombre si falta. Esta intención/nombre suministrado depende del modelo, no de un clasificador verificable.
- Herramientas y mutaciones son transaccionales/idempotentes por job/callId, con bloqueos y revalidación por Business. Pueden persistir clientes/borradores aunque la respuesta posterior falle o se cancele; no se deshacen por un fallo de envío. El límite de herramientas sigue siendo cuatro por trabajo/cinco turnos: una conversación puede requerir varios mensajes para completar registro, selección y resumen.

## Frontend y privacidad

Rutas localizadas `/clients`, `/orders`, `/{module}/new` y `/{module}/{uuid}/edit`. Listados y selectores con búsqueda/paginación remota; polling de listados cada 10 s (no en segundo plano). RHF/Zod, React Query y Axios centralizado; UI de lectura para AGENT/VIEWER y escritura OWNER/ADMIN. Sin escenarios demo en estas rutas; sin fallback de datos mock ante errores.

Queries aisladas por usuario/Business; cambios de sesión/negocio remontan contenido, descartan borradores, cancelan lecturas y limpian caches mediante el ciclo de auth existente. La API sigue siendo la autoridad. UUID de creación y versión inicial viven solo en el borrador de formulario, sin localStorage. Sin replay de mutaciones: ante resultado incierto consultar listado antes de volver a crear; ante conflicto recargar para revisar y editar desde la versión actual. Los detalles y formularios no se resetean silenciosamente por el polling del listado.

Nombre, email, teléfono, notas, dirección y vínculos comerciales son datos personales en PostgreSQL sin cifrado aplicativo ni purga automática. Los resultados IA de cliente solo incluyen ID/nombre; texto/historial ya pueden incluir datos personales transmitidos a OpenAI al habilitarlo. Sin endpoints de eliminación/exportación/retención, auditoría inmutable o gestión de duplicados/consentimiento legal; definirlos antes de producción. Sin pruebas de aislamiento, concurrencia o flujo de usuario en runtime por la restricción vigente.

## Verificación de esta etapa

Prisma validate/generate, formato, lint, tipos, build y revisión de diff locales. Sin tests nuevos/existentes de este alcance, navegador, smoke checks, llamadas a DB/Meta/OpenAI o migraciones aplicadas. La compilación no acredita comportamiento de runtime, envío real, aislamiento efectivo ni preparación para producción.
