# Funcionalidades frontend y límites

## Estado actual

**Negocios/contexto, productos, agente y conversaciones/WhatsApp tienen API y persistencia real en PostgreSQL**, con autorización por negocio activo y roles de escritura; ver [businesses.md](./businesses.md), [products.md](./products.md), [agents.md](./agents.md) y [whatsapp.md](./whatsapp.md). Dashboard, clientes, pedidos, reportes y preferencias comerciales conservan la interfaz de demostración del paso 4: JavaScript y datos ficticios en memoria del navegador, sin operaciones reales ni aislamiento multi-tenant. No usar información personal real en los mocks.

| Ruta (con prefijo `/es` o `/en`) | Funcionalidad                                                                                                                                                                                                           |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dashboard`                     | Ventas, conversaciones, porcentaje de pedidos cobrados y ticket promedio; barras mensuales enero–diciembre por año; pedidos recientes, agente, productos más vendidos, mensajes y onboarding.                           |
| `/conversations`                 | Inbox real paginado, selección e historial recibido desde webhook y respuestas OWNER/ADMIN de texto dentro de 24h; polling 10s, respuesta IA opcional con OpenAI/cola durable y control humano/IA OWNER/ADMIN por hilo. |
| `/agent`                         | Configuración persistente de nombre, tono, instrucciones breves opcionales, saludo y habilitado; vista previa local. Habilitado autoriza respuestas con servicio IA/configuración/contexto listos.                      |
| `/products`                      | API real: búsqueda, disponibilidad, paginación remota, KPIs globales, alta, edición y borrado lógico confirmado. SKU único por negocio; OWNER/ADMIN para escrituras.                                                    |
| `/orders`                        | Búsqueda por referencia/cliente, filtro por estado, paginación, detalle de líneas con precios históricos y cambio libre de estado.                                                                                      |
| `/clients`                       | Búsqueda por nombre/email/teléfono, paginación, alta, edición y detalle con pedidos/conversaciones vinculados. Email único.                                                                                             |
| `/reports`                       | Periodo 7/30 días, resumen lateral, barras por producto, anillo por estado, tabla por producto/cliente y exportación CSV local.                                                                                         |
| `/settings`                      | Preferencias ficticias del negocio, email, notificaciones e inicio de semana; controles existentes de tema e idioma.                                                                                                    |
| `/businesses`                    | Listado real, creación y configuración; contexto comercial con borrador/publicación y conexión WhatsApp del negocio activo.                                                                                             |
| `/help`                          | Búsqueda de guías traducidas, FAQs desplegables, acceso al onboarding y documentación oficial externa de WhatsApp. No hay canal de soporte conectado.                                                                   |

Login, registro y onboarding están descritos en [authentication.md](./authentication.md), [frontend.md](./frontend.md) y [businesses.md](./businesses.md). Registro crea solo cuenta; onboarding crea Business, membresía OWNER y agente deshabilitado atómicamente. La tarjeta del dashboard enlaza a la configuración del negocio. Los fixtures comerciales no se sustituyen ni se sincronizan con los negocios reales.

## Recursos y revisión visual

- Sidebar en el borde izquierdo; solo el contenido de páginas tiene `max-w-357`. Fondos y tarjetas oscuros negros/grises neutros con verde WhatsApp.
- Productos, clientes y pedidos muestran KPIs globales independientes de búsqueda/paginación.
- Altas: `/{products|clients|orders|businesses}/new`; edición: `/{products|clients|orders}/[id]/edit`, configuración del negocio activo en `/businesses/configuration`, siempre con prefijo de idioma. Las rutas inválidas muestran recurso no encontrado sin simular autorización.
- Producto: nombre, SKU, descripción, categoría, marca, proveedor, código de barras, precio, coste, precio comparativo opcional, stock, umbral de stock bajo, peso en gramos y estado. Validación de importes, decimales, enteros y precio comparativo cuando se indica.
- Cliente: contacto, empresa, identificación fiscal, segmento, estado, dirección, ciudad, región, código postal, país, idioma preferido, notas y consentimiento de marketing únicamente simulado.
- Pedido: referencia única, cliente, fecha UTC, estado y hasta 100 líneas con producto, cantidad y precio unitario. Sin cobros ni cambios de stock. Crear/editar no modifica automáticamente el historial de conversaciones.
- Reportes: filtro de periodo, resumen lateral, comparación de ingresos por producto, anillo de estados y tabla agrupable por producto/cliente, con unidades, pedidos, ingresos y participación. No duplica el dashboard. Exporta la tabla filtrada a CSV UTF-8 local, con comillas escapadas y protección de fórmulas en celdas de texto. No exporta desde un backend.

## Productos reales

- Listado, alta y edición consumen `features/products/services/products-service.ts` y hooks propios, no el snapshot demo. Formularios con todos los campos existentes, validación RHF/Zod y errores es/en.
- Catálogo vacío permite crear; escenarios/error/restablecimiento demo no afectan datos ni borradores reales. La base de datos conserva productos tras recarga o logout; no se copian fixtures a PostgreSQL.
- KPIs sobre todo el catálogo no eliminado del negocio, independientes de filtros y páginas. Los pedidos/reportes/dashboard siguen usando su catálogo ficticio y no afectan stock real.
- Sesión/CSRF, alcance por usuario/negocio, soft delete, detalle de DTOs y limitaciones en [products.md](./products.md).

## Arquitectura del mock

- `apps/web/src/features/demo/schemas/workspace-schema.ts`: contratos Zod e inputs compartidos para recursos relacionados.
- `apps/web/src/features/demo/schemas/command-schema.ts`: comandos discriminados para las escrituras admitidas.
- `apps/web/src/features/demo/mocks/workspace-fixture.ts`: catálogo, clientes, pedidos y conversaciones demo enlazados; configuración del agente y del negocio. Todas las identidades/contactos son ficticios. Algunos contenidos de ejemplo son bilingües; las etiquetas y mensajes de interfaz se traducen al locale activo.
- `apps/web/src/features/demo/services/workspace-service.ts`: adaptador independiente de React y React Query. Valida entradas y snapshots; cada escritura clona, aplica y valida antes de publicar el nuevo estado. No se realizan solicitudes HTTP.
- `apps/web/src/features/demo/hooks/use-workspace.ts`: lectura cancelable y mutación con invalidación compartida del prefijo `demo-workspace`. El servicio devuelve clones, no referencias mutables al repositorio.
- `apps/web/src/features/demo/stores/demo-scenario-store.ts`: escenario y revisión de interfaz, sin recursos de negocio ni credenciales.
- Los componentes por feature consumen los hooks, no acceden directamente al repositorio. Los formularios usan RHF + Zod y primitivas compartidas en páginas dedicadas para productos, clientes y pedidos; negocios usa formulario propio persistente. Los diálogos Radix se reservan para detalles y confirmaciones, no altas/ediciones.
- Recharts 3.10.1 se incorpora con importación dinámica y datos derivados, sin precargar la librería en módulos no analíticos. Hay tabla alternativa de valores, tooltip traducido y animación desactivada.

La API futura puede sustituir el adaptador manteniendo los contratos de lectura/escritura y los hooks. El snapshot agregado y los comandos son un contrato local de la demo, **no un contrato REST ya implementado**. Al conectar el backend habrá que introducir endpoints y query keys por recurso/tenant, autorización del servidor, paginación remota y errores de dominio acordados. El cliente Axios central con `withCredentials` ya se usa en productos; los módulos restantes necesitan endpoints, hooks y autorización propios.

## Escenarios reproducibles

El control sobre cada módulo comercial mock (no negocios, productos, agente ni conversaciones) permite:

1. **Con datos**: leer y guardar cambios en el repositorio temporal.
2. **Colecciones vacías**: mostrar listas vacías sin borrar los registros reales de la demo. Los formularios de configuración quedan de solo lectura y se deshabilitan las altas; volver a «Con datos» recupera los cambios guardados.
3. **Error de lectura**: simular fallo de query sin reintento automático. El botón Reintentar vuelve a leer, pero fallará mientras siga seleccionado ese escenario.
4. **Restablecer demo**: confirmación explícita, cancelación de lecturas, restauración de las fixtures, regreso al escenario normal, invalidación y descarte de borradores. No borra negocios reales ni el perfil.

Las lecturas tienen 450 ms de latencia y aceptan AbortSignal. Las escrituras esperan 550 ms, sin reintento automático. Se deshabilitan acciones durante el guardado; los formularios conservan borradores y muestran errores si la operación falla. SKU repetido, email repetido, producto vinculado a pedidos y conversación cerrada son errores de dominio simulados. El escenario es global: cambiarlo remonta el contenido para no dejar formularios abiertos sobre datos de otro escenario y descarta borradores sin guardar.

Los cambios comerciales mock sobreviven a la navegación interna y a cambios de idioma, pero no a recarga, perfil nuevo, salida de la demo o restablecimiento. Iniciar/salir limpia además la caché de React Query y el escenario. Un contador de generación invalida escrituras que estaban pendientes al cambiar de perfil. La fixture no contiene datos privados; las cuentas reales pertenecen al módulo auth.

## Definiciones de métricas

La gráfica mensual del dashboard tiene dos controles: año y métrica (ingresos o pedidos vendidos). Ambas vistas comparan enero–diciembre con el año anterior. Los ingresos suman el precio histórico de cada línea por sus unidades; los pedidos vendidos cuentan pedidos únicos pagados o enviados, no artículos. El eje, tooltip, total anual y tabla accesible cambian de unidad con la métrica; los pedidos siempre se muestran como enteros. El control de métrica solo afecta esta gráfica, no cambia los KPIs generales del dashboard.

La fixture `apps/web/src/features/demo/mocks/monthly-orders-fixture.ts` añade 188 pedidos sintéticos (74 en 2025 y 114 en 2026), distribuidos por todos los meses con volúmenes de pedidos y unidades variables. Se suman a los siete pedidos originales (195 en total). Las unidades mensuales se reparten entre los pedidos, conservando los ingresos del calendario demo. Incluye intencionalmente meses futuros para visualizar todo el calendario: **no son ventas reales ni previsiones**. El dashboard calcula sus barras, KPIs y rankings sobre estos pedidos, no sobre cifras independientes de la gráfica. El escenario vacío sigue vacío y los reportes conservan su filtro temporal. Recargar o «Restablecer demo» vuelve a cargar estas fixtures.

- **Reportes**: periodos móviles de **7 o 30 días inclusive**, con corte fijo en **2026-06-14 23:59:59.999 UTC**. No dependen del reloj actual.
- **Dashboard**: selector de año (2026 por defecto y años de los pedidos), barras de **enero a diciembre**. Cada barra verde suma ventas del mes del año elegido; gris suma el mismo mes del año anterior. Se consideran años calendario completos en UTC, incluyendo pedidos nuevos de ese año; no aplica el corte móvil de reportes. Los meses sin ventas muestran cero, sin rellenar fixtures ni proyectar ingresos. Tooltip mensual y tabla alternativa de doce filas. KPIs de ventas/ticket/cobro, pedidos recientes y ranking de productos usan el mismo año. Las variaciones son `(actual − anterior) / anterior`; sin base anterior positiva se muestra «sin base comparable».
- **Pedidos cobrados**: pedidos `paid` o `shipped` / todos los pedidos del año; no es conversión atribuida a conversaciones. Su variación es relativa al porcentaje del año anterior, no puntos porcentuales.
- **Conversaciones**: total de toda la demo, sin filtro de año ni variación inventada. Agente y mensajes recientes también usan toda la demo. El panel de agente muestra configuración y conversaciones asignadas abiertas, no conexión, cuota ni satisfacción real. Los controles de escenario/restablecimiento están dentro de un desplegable en dashboard.
- **Ingresos**: suma de líneas de pedidos `paid` o `shipped` dentro del periodo.
- **Pedidos**: número de pedidos de cualquier estado dentro del periodo.
- **Ticket promedio**: ingresos / número de pedidos pagados o enviados; cero sin ventas.
- **Compradores**: clientes únicos con pedidos pagados o enviados dentro del periodo.
- **Por atender (panel de agente)**: conversaciones asignadas al agente y no cerradas de toda la demo, independiente del año.
- Rankings de productos/clientes: ingresos de pedidos pagados o enviados del periodo. Los productos muestran además unidades vendidas.
- Los importes de catálogo/pedidos **demo** están en PEN. Negocios ofrece PEN/USD/EUR/MXN/COP (PEN inicial); sus productos nuevos usan la moneda persistida y no se permite cambiarla con productos existentes. Sin conversión de divisas. Las fechas demo/reportes usan UTC y la zona del negocio no las reinterpreta.
- Los pedidos conservan sus líneas/precios aunque cambie el catálogo; cambiar estado recalcula las vistas sin pagos, envíos, impuestos ni ajustes de inventario.

Se pueden crear/editar pedidos mock; no conversaciones nuevas. Tampoco hay eliminación de clientes, inventario por tienda, herramientas IA para comercio, suscripciones ni notificaciones comerciales reales. WhatsApp y el catálogo tienen sus integraciones persistentes separadas, no simuladas por estos mocks. La IA opcional solo genera texto de chat con el contexto publicado y el historial del mismo hilo; no consulta catálogo ni crea pedidos. Ver [ai.md](./ai.md). La exportación CSV de reportes es local y no conecta servicios externos. Activación, inicio de semana y notificaciones son valores de configuración simulados, sin efectos operativos.

## Verificación y pendientes

La verificación de esta etapa se limita a formato, lint, tipos y build. No se han implementado ni ejecutado tests ni comprobaciones en navegador por la restricción vigente. La compilación no verifica interacciones, disposición responsive, accesibilidad efectiva ni seguridad. El backend incorpora auth, múltiples negocios/contexto, catálogo, agente y WhatsApp/inbox reales; clientes, pedidos y reportes siguen sin endpoints comerciales. Ver `authentication.md` y `backend.md`.
