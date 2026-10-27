# Respuestas IA de WhatsApp y control humano

## Alcance

Conversaciones puede responder automáticamente a **nuevos textos, imágenes/documentos y ubicaciones nativas entrantes** usando OpenAI y el contexto publicado del mismo Business. El webhook firmado persiste entrante y trabajo en una transacción y confirma sin esperar al modelo ni a Graph. Un worker dentro de cada proceso API consume la cola PostgreSQL; no requiere Redis ni dependencias nuevas. No se escanea ni responde retroactivamente al histórico.

El proveedor está desacoplado detrás de `AiTextGenerator` en `apps/api/src/modules/whatsapp/contracts/ai-text-generator.ts`; `OpenAiTextGenerator` implementa el contrato y `whatsapp.module.ts` selecciona el adaptador con `AI_PROVIDER`. Para otro proveedor, añadir adaptador, configuración privada y registro exhaustivo de fábrica; no cambiar webhook, control de hilos ni reserva/envío. Solo `openai` está implementado; no basta con escribir otro nombre en el entorno.

Ahora consulta catálogo persistente, prepara borradores y confirma pedidos mediante herramientas autorizadas, con aceptación explícita del cliente verificada por backend. Recibe comprobantes para revisión humana y ubicaciones nativas para delivery pendiente de cotización. Ver [herramientas, pedidos y archivos privados](./whatsapp-commerce.md) para contratos, límites y migración pendiente. Puede crear/vincular al cliente remitente con nombre proporcionado por la persona y email opcional; no cobra, valida pagos automáticamente, reserva/modifica stock ni despacha. Ver [clients-orders.md](./clients-orders.md) para límites y migración adicional pendiente. Sin RAG, visión/OCR, clasificación de intención, transferencia humana inferida por el modelo ni estados de entrega. Clientes/pedidos reales se comparten con sus páginas; dashboard/reportes mock no alimentan al modelo. Las herramientas no permiten explorar otros clientes, solo registrar/vincular al remitente y leer ID/nombre de su vínculo activo. Las instrucciones de no inventar no garantizan exactitud.

## Activación explícita

En `apps/api/.env`, nunca en el frontend:

```dotenv
AI_AUTOREPLY_ENABLED=false
AI_PROVIDER=openai
AI_DAILY_REPLY_LIMIT=200
# Introducir clave privada real y modelo de texto compatible con Responses API:
# OPENAI_API_KEY=...
# OPENAI_MODEL=gpt-4.1-mini
```

1. Revisar backup, destino y **todas las migraciones pendientes**. Aplicar explícitamente `20261020260000_whatsapp_commerce_tools`, `20261020250000_whatsapp_ai_replies` y sus predecesoras, antes de arrancar la API nueva; no se aplicaron durante la implementación. `db:migrate:deploy` aplica todas las pendientes, no solo IA. No se migra ni se conecta a DB en build/install/start.
2. Configurar OpenAI y el modelo deseado. El modelo de ejemplo no se elige automáticamente ni se ha probado contra el proveedor. También se requieren `WHATSAPP_GRAPH_API_VERSION`, `WHATSAPP_CREDENTIALS_KEY`, `WHATSAPP_APP_SECRET` y `WHATSAPP_WEBHOOK_VERIFY_TOKEN`. El entorno rechaza automatización habilitada con cualquiera de esos valores ausente.
3. Revisar privacidad, consentimiento, términos de proveedores, costes y límites de cuenta OpenAI/Meta. Configurar webhook y número Cloud API del negocio según [whatsapp.md](./whatsapp.md).
4. Publicar contexto comercial no vacío en Negocios y habilitar/guardar el agente general. El borrador no alimenta al modelo. Agentes generales duplicados o reservados por un registro eliminado bloquean la automatización sin seleccionar uno arbitrariamente, como el módulo Agente.
5. Cambiar `AI_AUTOREPLY_ENABLED=true` y reiniciar **todas** las instancias API de forma coordinada. El flag es global del despliegue; `Agent.active` y el modo del hilo son los controles por negocio y conversación. No hay selección de proveedor por negocio.

Un agente nuevo sigue deshabilitado. Los hilos migrados y nuevos comienzan en modo `AI`, pero eso **no** autoriza llamadas si el flag global, agente, contexto o conexión no están listos. Con el servicio habilitado y un agente existente activo/contexto publicado, los próximos textos sí pueden producir envíos reales; revisar ese alcance antes de activarlo. Desactivar el flag exige reiniciar todas las réplicas: no retira llamadas que ya están en curso. Deshabilitar el agente o tomar control detiene futuras reservas bajo el protocolo de bloqueo, no envíos ya reservados.

## Modelo, historial y privacidad

- Se envían nombre del negocio, contexto **publicado** (hasta 30000 caracteres), nombre/tono/instrucciones/saludo del agente y hasta 20 mensajes de texto/metadatos de adjuntos o ubicaciones del hilo. Historial acotado a 16000 caracteres en total y 4096 por entrada; prioriza lo reciente. Solo salientes aceptados por Meta se incluyen como respuestas anteriores. El saludo se solicita solo cuando no existe un saliente aceptado en el hilo.
- No se incluyen teléfonos/IDs del contacto como campos del prompt, tokens, otros negocios/contactos ni bytes de archivos. Sí se envían captions, IDs internos de mensajes, ubicación nativa y resultados comerciales de herramientas del mismo hilo/Business (catálogo, pedidos, comprobantes y entrega). **El cuerpo del chat y el contexto pueden contener datos personales** que sí se transmiten a OpenAI; no se anonimizan ni cifran antes de la transmisión HTTPS. No introducir secretos o información innecesaria.
- Llamada a `https://api.openai.com/v1/responses`, sin URL configurable, redirects ni retries; timeout 30 s, `store: false`, máximo 1200 tokens de salida por turno. Hasta ocho herramientas y nueve turnos por trabajo (el último sin herramientas, reservado para respuesta textual), presupuesto entre pasos de 85 s, sin llamadas paralelas. El mismo límite controla el bucle y el corte: el registro/vínculo de cliente, lectura del pedido, consulta de catálogo y preparación/resumen pueden requerir más de cuatro herramientas distintas. Al agotar herramientas, el modelo solo puede explicar los resultados ya obtenidos y lo pendiente; no afirmar acciones no ejecutadas. No aumenta el presupuesto de tiempo ni añade retries, pero puede aumentar las inferencias/coste por trabajo respecto al límite anterior de cuatro herramientas. Respuesta del proveedor limitada a 128 KiB; exige estado `completed`, texto no vacío y máximo 4096 caracteres. Truncamiento/incompleto, rechazo sin texto, error, timeout o agotamiento del bucle de herramientas descartan el texto generado y preparan un aviso fijo de respaldo es/en, sin una nueva llamada al proveedor. Una respuesta final vacía o >4096 caracteres también usa ese respaldo. El aviso indica que no se obtuvo una respuesta confiable y ofrece reformular/pedir ayuda humana; no afirma ausencia de información ni éxito/fallo de pedidos o pagos.
- `store: false` no acredita retención cero, región específica ni cumplimiento legal del proveedor. Revisar términos y ajustes de la cuenta. Generaciones fallidas, canceladas u obsoletas pueden generar costes; tomar control descarta el resultado pero no garantiza interrumpir una inferencia ya iniciada.
- Prompts/configuración y mensajes del cliente se tratan como texto no confiable, sin HTML ejecutado ni autoridad para saltar reglas. Las herramientas son una lista cerrada con argumentos estrictos, scope derivado del trabajo y revalidación transaccional; no aceptan SQL, URLs arbitrarias ni cambios de negocio/hilo. La prevención de prompt injection es limitada: requiere revisión operativa autorizada antes de producción.
- PostgreSQL conserva cuerpos y metadatos sin cifrado aplicativo de contenido ni purga automática; Graph tokens mantienen AES-GCM. No se guardan prompts/respuestas crudas del proveedor ni claves en jobs/logs. La respuesta destinada a WhatsApp sí se persiste como saliente antes de enviarla.

## Cola, concurrencia y estados

`WhatsappAiReplyJobs` conserva Business/hilo/entrante disparador, versión del hilo, proveedor/modelo/versión de contexto usados, estado, motivo y tiempos, con FK compuestas de tenant, `isDeleted` y unicidad por `(businessId, triggerMessageId)` que incluye borrados. El replay de Meta no duplica trabajos. Índices para cola y consulta por hilo. `WhatsappThread` incorpora `controlMode` y `controlVersion`; el timeline añade `source` (`CUSTOMER`, `HUMAN`, `AI`). Se conserva la tabla heredada `WhatsappInboundMessages`; no se escribe en `Messages` reservado.

El worker revisa cada 2 s, procesa un trabajo por vez por proceso y usa bloqueos PostgreSQL `FOR NO KEY UPDATE ... SKIP LOCKED` sobre Business. No hay un tope global de concurrencia entre réplicas; hay exclusión de ejecución por hilo y contabilidad por negocio bajo el mismo bloqueo. Todas las mutaciones relevantes siguen el orden Business → hilo/trabajo. Los cambios de agente/contexto/conexión y el control humano comparten ese bloqueo.

- `QUEUED` → `GENERATING`: revalida Business, agente general, contexto, hilo AI y número conectado. Exige disparador no futuro y menor a 24h. Acepta texto o metadatos de imagen/documento/ubicación, nunca contenido binario para el modelo. La versión cambia con cada nuevo entrante: los trabajos anteriores se omiten; un mensaje nuevo durante generación invalida el resultado antes de reservar envío. No es una garantía de debounce ni de respuesta a cada mensaje individual.
- Límite distribuido por Business: 10 generaciones iniciadas por minuto y `AI_DAILY_REPLY_LIMIT` por 24h móviles (200 por defecto, configurable entre 1 y 10000). Fallos/cancelaciones iniciados también cuentan. Exceso → `SKIPPED / RATE_LIMIT`; no se espera para reintentarlo luego. El historial/trabajos no tienen TTL ni purga, y el webhook no tiene una cuota de cola por negocio: dimensionar almacenamiento y abuso antes de producción.
- Antes de `SENDING`, vuelve a validar modo/versión del hilo, edad del disparador, versión de contexto, `updatedAt` del agente/conexión y mismo número. Si algo cambió → `CANCELLED`; no usa una respuesta generada con configuración obsoleta.
- En una transacción crea `WhatsappSendAttempt`, saliente `source: AI` y resumen, usando el UUID del job como clave de idempotencia; luego usa el envío Graph existente **una sola vez**. No mantiene una transacción abierta mientras llama al modelo o a Graph.
- El respaldo usa el mismo job y la misma reserva atómica/idempotencia, revalidando control/configuración/conexión/24h y lease; no elude límites ni convierte trabajos cancelados en envíos. Se guarda `GENERATION_FALLBACK_UNAVAILABLE`, `GENERATION_FALLBACK_INVALID_RESPONSE`, `GENERATION_FALLBACK_NOT_CONFIGURED` o `GENERATION_FALLBACK_PROCESSING_FAILED` en reason, conservándolo al finalizar/recuperar una aceptación. Se invalidan tokens/resúmenes de confirmación ligados a ese job: aceptar el aviso no equivale a aceptar un resumen. Mutaciones previas ya ejecutadas no se deshacen. No se envía un segundo aviso si falla la reserva o Graph; `UNKNOWN` no se reenvía. Respaldo bilingüe fijo porque el trabajo no guarda idioma fiable del cliente; la respuesta normal sigue el idioma del cliente. Las instrucciones exigen contestar aunque falten detalles/productos y pedir precisión o ayuda humana, sin bucles de consultas idénticas ni inventar información.
- Resultado Graph `ACCEPTED` → job `ACCEPTED`; `REJECTED` → `FAILED`; incierto → `UNKNOWN`, pasa el hilo a `HUMAN` y cancela sus trabajos no enviados. `ACCEPTED` significa aceptación HTTP con ID, nunca entrega o lectura. `FAILED`/`SKIPPED` no reintentan ni transfieren automáticamente a humano.
- Lease 120 s: recuperación sin replay. `GENERATING` interrumpido → `FAILED`. Para `SENDING` vencido se consulta el intento local: aceptado → `ACCEPTED`, rechazado → `FAILED`, pendiente/ausente/incierto → `UNKNOWN` y control humano. Nunca se repite OpenAI ni Graph. Puede quedar el intento en `PENDING` aunque el job sea `UNKNOWN`; no se consulta ni reconcilia contra Meta.

**No existe transacción distribuida ni entrega exactamente una vez.** Una caída antes de Graph puede dejar un texto no enviado; una caída después puede dejar un resultado incierto. Se prioriza no duplicar sobre garantizar entrega. La recuperación requiere que la API esté activa con el worker habilitado; con flag apagado no se procesan ni recuperan trabajos hasta reactivarlo. Los jobs en cola antiguos solo podrán avanzar si siguen elegibles y dentro de 24h; el flag no los borra.

## Control humano y API

La lectura de mensajes sigue disponible para cualquier membresía activa autorizada, con `Cache-Control: private, no-store`. Añade `automation:{mode,version,configured,ready,canManage,inFlight,lastJob}` independiente del cursor. `ready` refleja flag/agente/contexto; conexión/ventana se validan por separado. `lastJob` contiene `status` y motivo sanitizado, no prompt ni respuesta interna. Los mensajes incluyen `source` y los hilos `controlMode`.

`POST /api/v1/businesses/:businessId/whatsapp/conversations/:threadId/control`:

```json
{ "mode": "HUMAN", "version": 3 }
```

Body estricto (`AI | HUMAN`, versión entera no negativa). Sesión/Business activo/Origin/CSRF y OWNER/ADMIN revalidados en transacción; 20 cambios/min/IP/proceso más límite global. Devuelve `{data:{mode,version}}`. Versión obsoleta → 409 `WHATSAPP_CONTROL_CONFLICT`; no reintentar la mutación automáticamente, consultar estado. `AI` exige flag y agente/contexto listos, si no 503 `WHATSAPP_NOT_CONFIGURED`. ID de hilo ajeno/inexistente → 404 sin revelar otro tenant.

- **Tomar control** incrementa la versión y cancela cola/generación del hilo; el humano puede escribir con permisos y ventana habituales. El POST manual revalida `HUMAN` antes de reservar: si sigue AI devuelve 409 `WHATSAPP_AI_ACTIVE`. La consulta de intentos y devolución idempotente de un envío ya reservado siguen permitidas aunque cambie el modo.
- **Devolver a IA** incrementa la versión y solo habilita futuros entrantes: no crea jobs del histórico ni reintenta los anteriores. La UI permite leer pero no modificar el modo a AGENT/VIEWER.
- Una reserva `SENDING` es el punto de no retorno: tomar control/desconectar/deshabilitar después **no cancela Graph ni garantiza que el cliente no lo reciba**. La UI exige confirmación y muestra advertencia de envío incierto/en curso. Revisar el resultado antes de repetir texto manualmente; no hay botón de retry IA.
- Frontend valida Zod, usa Axios/CSRF y React Query aislado por sesión/negocio, sin persistencia local del estado IA. Muestra modo, acciones según rol, último estado del trabajo y etiqueta «Agente IA» para salientes automáticos. Reutiliza polling de 10 s y estados locales del intento; no WebSockets ni entrega/leído. Error incierto de control → GET de estado, nunca reenvío automático de POST.

Los endpoints genéricos de envío de texto/plantillas siguen siendo OWNER/ADMIN y **no cambian ni respetan automáticamente el modo de un hilo**, ni se importan al inbox. No usarlos para saltar el flujo de coordinación humana/IA; esta restricción de modo se aplica al compositor del inbox.

## Archivos y operación

- Migración comercial adicional `20261020260000_whatsapp_commerce_tools`, creada/no aplicada; ver [whatsapp-commerce.md](./whatsapp-commerce.md). Las mutaciones de herramientas persisten aunque después falle generación o envío; no hay rollback distribuido.
- Migración revisable: `apps/api/prisma/migrations/20261020250000_whatsapp_ai_replies/migration.sql`, **creada, no aplicada**. Conserva mensajes existentes, asigna origen según dirección y modo AI por defecto; añade trabajos sin poblarlos del histórico.
- Contratos/modelos/servicio sin Nest ni Prisma. Adaptadores de proveedor, worker Nest y repositorio Prisma se componen desde `whatsapp.module.ts`. Sin un servicio HTTP público para generar prompts o elegir destinatarios arbitrarios.
- No se modificó `.env` privado ni se conectó a DB, OpenAI o Meta. Validación limitada a Prisma format/validate/generate, formato, lint, tipos y build. No se crearon/ejecutaron tests, navegador, HTTP de aplicación ni smoke checks por la restricción vigente.
- Antes de producción requieren autorización y verificación real: credenciales/modelo y políticas de proveedores, migración en destino, concurrencia/crashes/réplicas, privacidad, costes, abuso de cola y prompt injection, bloqueo humano, ventana/duplicados y comportamiento de cookies/cambio de negocio. La compilación no acredita esas garantías en runtime.
