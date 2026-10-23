# WhatsApp Cloud API — Conexión, envío y webhook

## Alcance implementado

- Webhook público de verificación y recepción firmada de Meta.
- Una conexión por Business: **Facebook Login for Business por redirección en la misma pestaña** desde Configuración, para cuentas y números **ya configurados en Cloud API**, o conexión manual por API. Token cifrado en PostgreSQL, consulta sin credenciales y desconexión local. La UI ya no carga el SDK ni abre popups.
- Envío autenticado de texto y plantillas simples; registro persistente de intentos con idempotencia y consulta de resultado.

**El webhook persiste los mensajes entrantes y Conversaciones consulta esos datos reales**, previa aplicación explícita de la migración de inbox. No importa historial anterior ni envíos externos a la bandeja. Conversaciones permite responder con texto y persiste esos salientes con el estado local del intento, sin estados de entrega. No implementa procesamiento AI, administración de plantillas, coexistencia con WhatsApp Business App ni migraciones de número. La conexión por redirección suscribe la app a la WABA, pero **no crea ni registra números**: no sustituye Embedded Signup. No envía mensajes de prueba. Los endpoints anteriores de Embedded Signup permanecen por compatibilidad API, sin interfaz actual. El envío es real si se despliega la migración y se configuran credenciales válidas; no se ejecutaron envíos durante la implementación.

## Configuración privada de la API

En `apps/api/.env`:

```dotenv
WHATSAPP_WEBHOOK_VERIFY_TOKEN=whatsapp_verify_2026
WHATSAPP_APP_SECRET=tu_app_secret_real
WHATSAPP_GRAPH_API_VERSION=v25.0
WHATSAPP_CREDENTIALS_KEY=clave_base64_de_32_bytes
# Para login por redirección, además de los valores anteriores:
WHATSAPP_APP_ID=id_de_la_app_meta
WHATSAPP_LOGIN_CONFIG_ID=id_de_configuracion_login_para_activos_existentes
WHATSAPP_OAUTH_REDIRECT_URI=https://tu-dominio.example/api/v1/whatsapp/oauth/callback
# Opcional: solo endpoints anteriores de Embedded Signup, sin UI actual:
# WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID=id_de_configuracion_embedded_signup
```

- El verify token es elegido por el operador y debe coincidir con **Verify token** en Meta. El ejemplo es público: usar otro valor aleatorio privado en producción.
- El App Secret es el secreto de la aplicación Meta, no el access token. `tu_app_secret` no habilita la recepción firmada.
- Elegir una versión Graph soportada por la aplicación en Meta; `v25.0` es el ejemplo, no se selecciona ni actualiza automáticamente. Si falta, no se habilita la integración saliente.
- Generar una clave independiente para el cifrado de access tokens:

  ```sh
  node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
  ```

  Guardar el resultado en `WHATSAPP_CREDENTIALS_KEY` mediante el gestor de secretos o el entorno local privado. No reutilizar secretos de auth. Conservar copia segura: cambiar/perder esta clave impide descifrar conexiones existentes. La rotación requiere reconfigurarlas o un procedimiento coordinado de recifrado; no existe rotación automática.

- Variables opcionales para no romper despliegues sin WhatsApp. Una variable omitida deshabilita su operación; si se proporciona una clave/versión con formato inválido, la API rechaza el entorno al arrancar. No añadir placeholders activos para la clave.
- Reiniciar la API después de configurar el entorno. No se modificó `.env` local. Nunca poner estos valores en `NEXT_PUBLIC_`, logs o archivos versionados.

En la autorización por redirección el **código y access token de Graph** se procesan exclusivamente en el backend. El código llega al callback del servidor como query de OAuth, nunca al código React; el navegador sí transporta esa URL, por lo que deben excluirse sus query strings de logs externos. En la conexión manual se proporciona en el PUT, no como App Secret ni como variable global. Usar un token de sistema apto para el despliegue y los permisos de WhatsApp correspondientes (`whatsapp_business_messaging` para enviar; acceso al activo y permisos de administración requeridos para consultar metadatos). Consultar el Phone Number ID valida acceso de lectura, no garantiza permisos de envío, registro del número ni suscripción del webhook.

## Facebook Login por redirección: preparación en Meta

La cuenta Nexora se crea sin bloquearse por WhatsApp. OWNER/ADMIN entra a **Configuración → WhatsApp del negocio → Conectar WhatsApp**. El frontend hace un POST autenticado/CSRF al backend y navega a la URL oficial devuelta **en la misma pestaña**. Meta autentica y solicita permisos sobre activos existentes; vuelve al callback del backend. Configuración muestra los números autorizados y el usuario elige cuál conectar. No hay SDK Facebook, popup ni petición de PIN en la UI actual.

1. Preparar una aplicación Meta de negocio y **Facebook Login for Business** con configuración para autorizar **WhatsApp Business Accounts existentes**, token de integración de negocio/sistema y permisos `whatsapp_business_management` y `whatsapp_business_messaging`. Copiar App ID/Configuration ID a `WHATSAPP_APP_ID` y `WHATSAPP_LOGIN_CONFIG_ID`. **No reutilizar sin revisión una configuración cuyo recorrido sea Embedded Signup con SDK.** La disponibilidad de esa configuración depende de Meta y los permisos de la aplicación; si no está disponible, este flujo no crea una alternativa de alta.
2. La cuenta WABA y el número deben estar previamente registrados y operativos en **Cloud API**; se filtra `platform_type=CLOUD_API`. No se llama `/{phoneNumberId}/register`, no se crea WABA, no se verifica OTP, no se migra ni se activa coexistencia. La lectura de metadatos no garantiza que la cuenta esté habilitada para enviar: facturación, revisión y políticas permanecen bajo Meta.
3. Configurar **Valid OAuth Redirect URIs** con el valor HTTPS exacto de `WHATSAPP_OAUTH_REDIRECT_URI`, sin query ni fragmento: `/api/v1/whatsapp/oauth/callback`. El origen debe ser el mismo frontend público donde inició sesión el usuario y estar en `CORS_ORIGINS`. No construirlo con Host/Origin de la petición. El proxy Next existente publica `/api/v1` hacia la API privada. Un túnel solo del puerto API no sirve para este recorrido: publicar frontend + proxy, iniciar sesión por ese dominio y autorizarlo también en Meta.
4. Habilitar login de cliente/web OAuth en Meta y completar dominios, privacidad/eliminación de datos, revisión de aplicación, verificación y acceso avanzado para clientes externos. En desarrollo se aplican las restricciones de roles/activos de Meta. Configurar webhook HTTPS y campo `messages` de la app; la conexión suscribe después cada WABA con `/{wabaId}/subscribed_apps`.
5. Revisar y aplicar explícitamente la migración de autorización indicada abajo, configurar entorno privado y reiniciar API. No hay nuevas dependencias ni secretos `NEXT_PUBLIC_`. Si se usa CSP, permitir navegación a Meta sin cargar su SDK.

Referencias oficiales consultadas: [Facebook Login for Business: manual login](https://developers.facebook.com/documentation/facebook-login/facebook-login-for-business#build-a-manual-login-flow), [manual flow: dialog, state y canje con redirect_uri](https://developers.facebook.com/documentation/facebook-login/guides/advanced/manual-flow), [debug_token](https://developers.facebook.com/docs/graph-api/reference/debug_token/), [números WABA](https://developers.facebook.com/docs/whatsapp/business-management-api/phone-numbers/). Se usa la versión Graph configurada (no endpoints sin versión); no parámetros de Embedded Signup `sessionInfoVersion` ni métodos SDK. El login manual documentado no equivale al alta de números de Embedded Signup.

## Migración y persistencia

Revisar y aplicar explícitamente `apps/api/prisma/migrations/20261020200000_whatsapp_connection_sending/migration.sql` antes de usar los endpoints autenticados nuevos. Añade:

- `WhatsappConnections`: Business único, Phone Number ID globalmente único, metadatos y token AES-256-GCM con nonce aleatorio y AAD ligado a Business/Phone Number ID.
- `WhatsappSendAttempts`: clave UUID de idempotencia única por Business, hash del contenido, estado del intento, identificador Meta y códigos numéricos HTTP/error si están disponibles. No guarda el texto, plantilla completa, destinatario ni token en el intento.

No se aplicó ninguna migración, ni se conectó a PostgreSQL durante la implementación. `db:migrate:deploy` aplicaría **todas** las migraciones pendientes, incluidas las de productos: revisar el conjunto y coordinar el despliegue. No hay migraciones/seeds automáticos en install/build/start.

La desconexión hace borrado lógico y elimina el token cifrado; no revoca el token en Meta ni cancela solicitudes ya iniciadas. El Phone Number ID queda reservado por el índice único incluso desconectado. Puede reconectarse explícitamente en el mismo Business; no hay transferencia entre negocios ni restauración implícita desde otra cuenta. Un cambio explícito a otro número sustituye la asociación anterior.

## Endpoints autenticados

Prefijo común: **`/api/v1/businesses/:businessId/whatsapp`**.

Todos exigen sesión válida, Business activo coincidente y rol **OWNER/ADMIN**, también las consultas. El repositorio revalida sesión, membresía, usuario y Business no eliminados; serializa cambios de conexión y reservas de envío con bloqueo del Business. Los IDs son UUID. Las mutaciones conservan Origin/Referer y CSRF firmado; un access token de Meta no autentica al usuario del SaaS. Ver [authentication.md](./authentication.md) para cookies/bootstrap de CSRF. Respuestas sin caché y sin access token/ciphertext.

### POST `/authorization`

Body estricto `{ "locale": "es" }` (`es`/`en`). OWNER/ADMIN, Origin/CSRF y 5 solicitudes/minuto/IP/proceso. Rechaza conexión activa antes de iniciar. Devuelve `{ "data": { "authorizationUrl": "https://www.facebook.com/v25.0/dialog/oauth?..." } }`. El frontend navega con `location.assign`: Axios no navega con redirects. Parámetros: `client_id`, `config_id`, `redirect_uri`, `state` aleatorio de 256 bits y `response_type=code`. La DB solo conserva SHA-256 del state, ligado a usuario/sesión/Business, de un uso y TTL 15 minutos.

### GET `/api/v1/whatsapp/oauth/callback`

Callback de navegador fuera del prefijo Business. Aunque está marcado público para devolver errores con una redirección limpia, **autentica manualmente la cookie access existente** y exige la misma sesión/usuario/negocio OWNER/ADMIN que inició el intento. No crea sesión ni acepta state como autenticación. Una cookie ausente, caducada, cambiada o revocada requiere iniciar de nuevo tras autenticarse. No rota refresh durante este callback.

Consume state con actualización condicional atómica PENDING→PROCESSING antes de canjear código. El canje servidor-servidor usa el **mismo `redirect_uri`** del inicio. Consulta `debug_token` (app, validez, scopes y WABA IDs granulares), enumera `/{wabaId}/phone_numbers` con `appsecret_proof` y solo retiene activos Cloud API. Máximos: 20 WABAs, 10 páginas de 100 por WABA, 200 números, presupuesto de descubrimiento 45 segundos más la llamada en curso (cada fetch timeout 10 segundos). No sigue URLs next de Meta, solo cursores en el host fijo.

Guarda temporalmente el token cifrado con AAD Business/`oauth:attemptId`, nunca en React ni localStorage, y pasa a READY. Errores/cancelación pasan a FAILED/CANCELLED y eliminan token/opciones. Redirige 303 a `/{locale}/settings?whatsappAttempt=<UUID>`; solo ID opaco, sin código/token. Los fallos previos a identificar el intento redirigen a `/es/settings?whatsappResult=failed`. Cabeceras no-store/no-referrer. **Excluir query strings, bodies y headers sensibles de logs/APM/proxy/CDN**, incluido el callback y llamadas Graph: el navegador necesariamente transporta el código OAuth en su URL hasta la redirección. Asegurar timeout del proxy suficiente para el callback (recomendado 90 segundos). No hay retries.

### GET `/authorization/:attemptId`

Solo la misma sesión/usuario/Business activo OWNER/ADMIN. Devuelve `{ data: { id, status, expiresAt, assets } }`; `assets` solo en READY, con WABA ID, Phone Number ID, nombre y teléfono del propio negocio. Nunca devuelve token/código. Estados PENDING, PROCESSING, READY, COMPLETING, CONNECTED, FAILED, CANCELLED y EXPIRED. Consultar estado no repite operaciones Meta.

### POST `/authorization/complete`

Body `{ "attemptId": "uuid", "wabaId": "123456789012345", "phoneNumberId": "123456789012346" }`, Origin/CSRF, OWNER/ADMIN, 5/min/IP/proceso. Exige selección entre los activos del intento. Comprueba reserva local y consume READY→COMPLETING atómicamente para evitar replay/ejecución doble. Revalida permisos/pertenencia contra Meta y consulta metadatos; suscribe la app a la WABA y guarda la conexión cifrada bajo reautorización y bloqueo Business, sin sustituir una activa concurrente. **No registra números nuevos ni envía mensajes**. Al terminar elimina el token transitorio y opciones, conservando metadatos del intento.

No hay transacción distribuida: una caída/timeout/revocación puede dejar suscripción externa o conexión guardada sin estado final; COMPLETING no se repite automáticamente. La UI reconcilia conexión e intento, nunca repite POST. Comprobar Meta y GET `/connection` antes de iniciar nueva autorización. Hay timeout HTTP cliente de 75 segundos; el resultado puede seguir siendo incierto si la secuencia externa tarda más. No es recuperación automática tras caída.

Los nuevos usos vencen a los 15 minutos. La limpieza diferida, ejecutada al crear/consultar/consumir intentos de la misma sesión/usuario/Business, borra token/opciones de los vencidos y marca EXPIRED; COMPLETING recibe hasta cinco minutos de margen para terminar llamadas ya iniciadas antes de limpiarse. **Sin tráfico no hay borrado físico puntual**: configurar tarea operativa de limpieza/retención de intentos según política antes de producción. Los filtros impiden reutilizar intentos vencidos incluso antes de la limpieza. No se persiste código OAuth ni state en claro.

### Compatibilidad: GET `/signup/configuration` (sin UI actual)

200 `{ "data": { "appId": "…", "configId": "…", "graphVersion": "v25.0", "state": "…" } }`. Solo configuración pública y contexto JWT HS256 de 15 minutos, con issuer/audience propios y usuario/sesión/Business vinculados. Usa el secreto CSRF existente con audience exclusivo; no es un access token ni autoriza por sí mismo. La configuración incompleta responde 503; no impide registrar una cuenta Nexora.

### Compatibilidad: POST `/signup/complete` (sin UI actual)

Cookies/Origin/CSRF obligatorios, 5 solicitudes/minuto/IP/proceso. Body estricto:

```json
{
  "state": "CONTEXTO_DEL_GET",
  "code": "CODIGO_DE_UN_USO_DE_META",
  "wabaId": "123456789012345",
  "phoneNumberId": "123456789012346",
  "pin": "123456"
}
```

Contrato anterior para clientes Embedded Signup con SDK, no usado por Configuración actual. El cliente externo debe correlacionar código y evento FINISH, mantener código/PIN solo temporalmente y validar origen de postMessage. Los IDs recibidos no prueban propiedad: el backend vuelve a comprobarlos contra Meta.

Secuencia del servidor:

1. Autorizar sesión/Business/OWNER-ADMIN y contexto firmado; rechazar número reservado a otro Business (también desconectado) o conexión local activa antes de canjear.
2. Canjear el código de un uso en `oauth/access_token` con App ID/Secret privados. Meta documenta TTL de **30 segundos**: se envía inmediatamente cuando ambos callbacks están completos; esperar activos más de 10 segundos tras recibir código cancela el intento.
3. Consultar `debug_token`: app coincidente, token válido, scope de mensajería y permiso granular de administración para la WABA solicitada. Verificar pertenencia del número consultando `/{wabaId}/phone_numbers` (máximo 10 páginas de 100; nunca seguir URLs externas de paginación) y obtener sus metadatos. `appsecret_proof` en solicitudes autenticadas.
4. Reautorizar y comprobar disponibilidad local; suscribir `/{wabaId}/subscribed_apps` y registrar `/{phoneNumberId}/register` con PIN. No enviar mensaje de prueba.
5. Reautorizar bajo bloqueo de Business y guardar token cifrado con AES-GCM/AAD existente y metadatos. No sustituir una conexión activa que pudo guardarse en paralelo. Respuesta 200 igual al GET de conexión, sin secretos.

Timeout de 10 segundos por llamada, redirects prohibidos, sin retries automáticos. No se persiste WABA ID, PIN, código ni estado de signup: la asociación local durable continúa por Phone Number ID. El código Meta es de un uso; el contexto firmado no tiene tabla propia de consumo y vence tras 15 minutos. Los resultados se reconcilian mediante GET de conexión, nunca repitiendo automáticamente el POST. Estos endpoints ya no tienen una UI en Nexora; sus clientes deben reconciliar el resultado y descartar datos al cambiar de identidad/negocio. El timeout HTTP cliente es 75 segundos para la secuencia completa.

**No es una transacción distribuida ni un flujo recuperable durable.** Una revocación concurrente, conflicto con otro negocio, caída de proceso o fallo después de suscribir/registrar en Meta puede dejar cambios externos sin token local. La reserva final/índices impiden sobrescribir una conexión activa o asignar un número a dos negocios locales, pero no serializan todas las llamadas externas en curso. Actualizar conexión y revisar el estado/permiso en Meta antes de autorizar de nuevo. No se revoca ni se deshace automáticamente la autorización externa para evitar afectar otros usos del activo. Desconectar en Nexora tampoco revoca en Meta.

Errores adicionales: 400 `WHATSAPP_SIGNUP_EXPIRED`, 422 `WHATSAPP_SIGNUP_INCOMPLETE`/`WHATSAPP_INVALID_CREDENTIALS`, 409 conexión activa/reservada, 502 proveedor indisponible, 503 configuración ausente. Excepciones externas y cuerpos de Meta nunca se propagan ni registran: pueden contener secretos. Revisar proxy/APM para excluir query strings y cuerpos de OAuth/PIN/tokens de cualquier captura externa.

### GET `/connection`

200 `{ "data": null }` si no existe conexión activa, o:

```json
{
  "data": {
    "id": "uuid-de-conexion",
    "phoneNumberId": "123456789012345",
    "displayPhoneNumber": "+51 999 999 999",
    "verifiedName": "Mi negocio",
    "updatedAt": "2026-10-20T20:00:00.000Z"
  }
}
```

No consulta Meta cada vez: la existencia de conexión no garantiza que el token siga vigente.

### PUT `/connection`

Body estricto:

```json
{
  "phoneNumberId": "123456789012345",
  "accessToken": "TOKEN_REAL_DE_GRAPH"
}
```

Primero autoriza al actor; comprueba `GET https://graph.facebook.com/{version}/{phoneNumberId}?fields=id,display_phone_number,verified_name` con Bearer token y timeout de 10 segundos. Sin redirecciones ni reintentos. Solo si Meta devuelve el mismo ID y metadatos válidos, vuelve a autorizar y guarda la conexión. Respuesta 200 con metadatos públicos del GET. El body/token no se registra ni devuelve. Limitado a 5 intentos/minuto/IP/proceso.

### DELETE `/connection`

204, idempotente. Desconexión local; sin llamadas a Meta. Un envío que ya reservó credenciales puede terminar después de la desconexión o revocación de sesión. Para detener uso del token fuera del SaaS, revocarlo también en Meta.

### POST `/messages`

Header obligatorio **`Idempotency-Key: <UUID>`**, además de cookies, Origin y `X-CSRF-Token`. CORS admite `Idempotency-Key` solo para orígenes ya autorizados. Limitado a 20 solicitudes/minuto/IP/proceso.

Texto:

```json
{
  "type": "text",
  "to": "51999999999",
  "text": {
    "body": "Hola, gracias por escribirnos.",
    "previewUrl": false
  }
}
```

- `to`: número internacional con código de país, 8–15 dígitos, sin `+`, espacios ni separadores. La validación es estructural, no comprueba que exista en WhatsApp.
- `text.body`: no vacío, máximo 4096 caracteres; `previewUrl` opcional (false por defecto).
- Meta normalmente permite texto libre dentro de las 24 horas posteriores al último mensaje del usuario. El endpoint de respuesta del inbox calcula esa ventana a partir del último entrante persistido de ese hilo (los salientes no la prolongan). El endpoint genérico de texto/plantillas conserva la validación de políticas en Meta; no aplica el cálculo local del inbox.

Plantilla previamente aprobada en Meta:

```json
{
  "type": "template",
  "to": "51999999999",
  "template": {
    "name": "hello_world",
    "language": "en_US",
    "bodyParameters": []
  }
}
```

Admite plantillas sin parámetros o con parámetros de texto ordenados en el body (máximo 20 de 1024 caracteres). No admite header, botones, medios, catálogos ni otros tipos de parámetros. El idioma/nombre deben coincidir con la plantilla aprobada. Fuera de la ventana, usar una plantilla admitida y cumplir consentimiento/políticas de Meta. Con números de prueba solo se puede enviar a destinatarios autorizados en Meta. El parser general limita estos bodies a 16 KiB.

Devuelve **200 con el resultado del intento**, no una confirmación de entrega:

```json
{
  "data": {
    "id": "uuid-del-intento",
    "status": "ACCEPTED",
    "providerMessageId": "wamid.identificador",
    "providerErrorCode": null,
    "providerHttpStatus": 200,
    "createdAt": "2026-10-20T20:00:00.000Z",
    "updatedAt": "2026-10-20T20:00:01.000Z"
  }
}
```

- `PENDING`: intento reservado, sin resultado persistido todavía.
- `ACCEPTED`: Meta respondió éxito y devolvió ID; **no significa enviado/entregado/leído**.
- `REJECTED`: rechazo HTTP 4xx de Meta (excepto 408), o fallo local conocido antes del envío. Revisar `providerHttpStatus`/`providerErrorCode` cuando existan. No se reenvía automáticamente.
- `UNKNOWN`: timeout, fallo de red, HTTP 5xx/408 o éxito sin ID interpretable. Meta podría haber aceptado el mensaje. **No crear otra clave ni reenviar a ciegas.**

El servidor crea el intento en PostgreSQL **antes** de llamar a `POST /{phoneNumberId}/messages`. Repetir la misma clave y body devuelve el intento existente sin una nueva llamada a Meta; la misma clave con contenido distinto devuelve 409. Un intento eliminado lógicamente tampoco libera la clave. Cada mensaje nuevo intencional requiere un UUID nuevo.

Si se pierde la respuesta del SaaS, repetir la solicitud con **la misma clave y body** es seguro respecto al reenvío y permite recuperar su ID/estado. Un crash antes/después del envío o un fallo de escritura del resultado puede dejar `PENDING` indefinidamente: no hay worker de recuperación ni reenvío automático. Esta política evita reenvíos automáticos a costa de posibles mensajes no enviados; **no garantiza entrega exactamente una vez**. Las claves/intentos no tienen limpieza automática.

### GET `/messages/:attemptId`

200 con el mismo contrato de intento. Consulta local; no reenvía mensajes ni consulta estados en Meta. La visibilidad está restringida al Business activo y rol OWNER/ADMIN. Como el webhook sigue descartando estados de entrega, este GET solo muestra el resultado del envío HTTP, no estados posteriores.

### Errores de aplicación

- 400: UUID/body/header de idempotencia inválido.
- 401/403: sesión, CSRF/Origin, Business o rol no autorizado.
- 404 `WHATSAPP_ATTEMPT_NOT_FOUND`: intento inexistente/no visible.
- 409 `WHATSAPP_NOT_CONNECTED`: falta conexión activa.
- 409 `WHATSAPP_CONNECTION_CONFLICT`: número ya reservado.
- 409 `WHATSAPP_IDEMPOTENCY_CONFLICT`: clave usada con otro contenido/reservada.
- 422 `WHATSAPP_INVALID_CREDENTIALS`: Meta rechaza la consulta del número/token al conectar.
- 502 `WHATSAPP_PROVIDER_UNAVAILABLE`: verificación de número indisponible o respuesta inesperada.
- 503 `WHATSAPP_NOT_CONFIGURED`: versión/clave privada ausente o credenciales no descifrables.
- 413/429: tamaño/rate limit. Fallos inesperados de DB conservan el filtro global con mensaje genérico.

Los fallos de envío comunicados por Meta se representan en el intento con HTTP 200 y `REJECTED`/`UNKNOWN`, no como entrega exitosa. Nunca se devuelve el body de error de Meta, que podría contener datos sensibles; solo códigos numéricos. No se registran mensajes, teléfonos, tokens, ciphertext ni firmas.

## Webhook público de Meta

Publicar `https://tu-dominio/api/v1/whatsapp/webhook` con HTTPS válido. En Meta configurar esa Callback URL, el verify token y suscribir explícitamente `messages` para mensajes/estados. El operador debe autorizar/suscribir la app a la WABA correspondiente; el PUT local de conexión **no** realiza esa suscripción ni registra el número.

La ruta puede exponerse directamente por el reverse proxy de API o por el rewrite `/api/v1` existente de Next.js. Debe preservar query strings, bytes del cuerpo y `X-Hub-Signature-256`, sin login frontend ni CSRF. No añadir headers de Meta a CORS: Meta no es un navegador.

### GET `/api/v1/whatsapp/webhook`

Público, sin sesión. Espera `hub.mode=subscribe`, `hub.verify_token` y `hub.challenge` (1–1024 caracteres). Compara hashes del token en tiempo constante y devuelve **200 text/plain** con el challenge exacto, sin JSON ni caché. Query inválida: 400; token incorrecto: 403; verify token no configurado: 503.

### POST `/api/v1/whatsapp/webhook`

- JSON con header `X-Hub-Signature-256: sha256=<64 dígitos hexadecimales>`.
- HMAC-SHA256 con App Secret sobre bytes originales, comparación de tiempo constante; no se reconstruye JSON.
- Hasta **1 MiB** únicamente en la ruta exacta (sin slash final), sin compresión; otros parsers conservan 16 KiB.
- Valida `object: "whatsapp_business_account"`, `entry[]` y `changes[]`. Para `field=messages` con `value.messages`, valida IDs, metadatos del número, remitente, timestamp y tipo; hasta **100 mensajes por notificación**. El resto de campos se tolera; los eventos de estados de entrega y otros tipos se reconocen sin persistir.
- Resuelve `metadata.phone_number_id` contra una conexión local activa, con token y Business no borrados; no confía en un businessId del evento. Números desconocidos/desconectados se ignoran con 200, sin asignarlos a otro negocio. La ingestión revalida la conexión bajo el mismo bloqueo de Business que conexión/desconexión.
- Guarda texto, caption de imagen/video/documento, tipo y fechas, más nombre/contacto de Meta. Otros contenidos se representan por su tipo; no descarga archivos ni conserva URLs, IDs de medios, ubicaciones o payload completo.
- **200 text/plain `EVENT_RECEIVED` solo tras persistir** los mensajes aceptados. Si falla DB se devuelve error sin confirmar el lote; Meta puede reintentar. Grupos/números ya confirmados en DB se deduplican al repetir el evento: no existe atomicidad global de todo el HTTP ni cola/worker externo. Un lote inválido devuelve 400 sin insertar. Firma ausente/incorrecta: 403; media type: 415; tamaño: 413; App Secret ausente/placeholder: 503 para JSON con cuerpo.

Solo este POST firmado está exento de CSRF/Origin mediante metadata explícita y guard de firma. `@Public()` por sí solo no exime otras mutaciones. Conserva el throttler global de 120 solicitudes/minuto/IP/proceso (429), pendiente de dimensionar con almacenamiento compartido/IP confiable tras proxy. La firma no impide replays por sí sola; el índice `(businessId, providerMessageId)` evita duplicar mensajes incluso si el registro está borrado lógicamente. No se resucitan conversaciones borradas.

## Inbox persistente y pantalla Conversaciones

- `GET /api/v1/businesses/:businessId/whatsapp/conversations?cursor=<uuid>` devuelve `{data:{items,nextCursor}}`: hasta 20 conversaciones, ordenadas por último mensaje y UUID descendentes. Incluye nombre, WhatsApp ID del contacto, ID del número del negocio, texto/tipo/fecha del último mensaje.
- `GET /api/v1/businesses/:businessId/whatsapp/conversations/:threadId/messages?cursor=<uuid>` devuelve la misma envoltura, hasta 50 mensajes, más recientes primero. Incluye ID interno, dirección `INBOUND`/`OUTBOUND`, tipo, cuerpo, `sentAt` (timestamp Meta para entrantes, reserva local para salientes), `receivedAt` (ingreso local) y `sendStatus` (null para entrantes; estado local del intento para salientes). Añade `reply:{allowed,reason,windowExpiresAt}` con disponibilidad para responder, independiente del cursor. La UI los presenta cronológicamente dentro de cada página.
- Ambos exigen sesión vigente, Business activo coincidente y membresía activa de **cualquier rol** (OWNER/ADMIN/AGENT/VIEWER). Se filtran Business/conversación/mensajes borrados. Un ID/cursor ajeno o inexistente no revela datos y produce 404 `WHATSAPP_CONVERSATION_NOT_FOUND`. Respuestas `Cache-Control: private, no-store`; los endpoints de envío descritos abajo requieren OWNER/ADMIN.
- La identidad de una conversación es `(businessId, phoneNumberId, contactWaId)`. No crea ni vincula registros del módulo Clientes mock. El resumen no retrocede de fecha ante eventos fuera de orden. El histórico local sigue visible si se desconecta WhatsApp; solo se detiene la ingestión nueva. No recupera lo recibido mientras estuvo desconectado ni lo previo a este despliegue.
- React Query aislado por usuario/Business/conversación/cursor, cancelación al desmontar y limpieza al cambiar de sesión; sin localStorage ni caché inactiva de inbox. La página reciente refresca cada 10 s en primer plano y al recuperar foco; las páginas anteriores se actualizan manualmente. Tras error se detiene el polling hasta recargar/actualizar. La paginación no es un snapshot: nuevos mensajes pueden mover conversaciones entre páginas.
- La pantalla incluye compositor de texto, entrantes a la izquierda y salientes de la bandeja a la derecha. Muestra estado pendiente, aceptado por Meta (no entrega), rechazado o incierto. No importa los envíos del endpoint genérico ni muestra estados leído/entregado, asignaciones, contador de no leídos o respuestas AI. Dashboard, pedidos/clientes y reportes conservan fixtures independientes.
- Los cuerpos, nombres y teléfonos se guardan como datos comerciales en PostgreSQL, **sin cifrado aplicativo de contenido** (el AES-GCM existente solo protege tokens). No se registran en logs ni se envían a proveedores de IA. No hay retención/purga automática ni UI de borrado; antes de producción deben acordarse retención, acceso, cifrado/backup operativo y borrado de datos personales.

### Responder desde una conversación

`POST /api/v1/businesses/:businessId/whatsapp/conversations/:threadId/messages`, con cookies de sesión, `X-CSRF-Token` e `Idempotency-Key` UUID. Body estricto:

```json
{ "body": "Hola, ¿en qué podemos ayudarte?" }
```

- OWNER/ADMIN; texto de 1–4096 caracteres tras trim. El destinatario se obtiene del hilo autorizado, nunca de un `to` proporcionado por el navegador. Revalida Business, sesión, membresía, hilo no borrado y conexión activa del **mismo** `phoneNumberId` bajo bloqueo del negocio.
- Exige último mensaje **entrante** persistido del hilo dentro de las últimas 24h. Un saliente no abre/extiende la ventana. Si no hay ventana, 409 `WHATSAPP_REPLY_WINDOW_CLOSED` sin reservar ni enviar. Plantillas/adjuntos no están disponibles en este compositor; el endpoint genérico de plantillas existente sigue independiente. Meta puede imponer restricciones adicionales y rechazar el envío.
- Reserva el intento y crea el saliente `PENDING` **en una transacción**, antes de llamar a Graph, actualizando el resumen sin retroceder fecha. El cuerpo se guarda en la tabla de inbox; `WhatsappSendAttempts` sigue guardando hash/metadatos, no cuerpos. El resultado y el ID Meta se confirman atómicamente en DB. Nunca se escribe en los modelos reservados `Conversation`/`Message` ni se duplica el mensaje allí.
- Repetir clave y payload del mismo hilo devuelve el intento sin reenviar; cambiar body/destinatario/hilo con la misma clave produce 409 `WHATSAPP_IDEMPOTENCY_CONFLICT`. Claves de envíos genéricos no pueden asociarse después a un hilo. La desconexión o cierre posterior de ventana no impide consultar/devolver un intento existente autorizado.
- HTTP 200 devuelve `{data:{id,status,providerMessageId,providerErrorCode,providerHttpStatus,createdAt,updatedAt}}`, incluso si Meta responde `REJECTED` o `UNKNOWN`. `ACCEPTED` solo significa aceptación de Graph, no entrega ni lectura. Rate limit 20 envíos/minuto/IP/proceso en esta ruta, además del límite global; sin límite distribuido ni agregado por negocio entre rutas.
- `GET /api/v1/businesses/:businessId/whatsapp/conversations/:threadId/send-attempts/:key` consulta solo DB, con OWNER/ADMIN y ámbito hilo/negocio. Permite recuperar el resultado cuando se pierde la respuesta del POST sin reenviarlo. Un 404 no prueba que una solicitud original en curso no vaya a reservar después. No consulta a Meta ni modifica estados.
- Frontend usa React Hook Form/Zod y la sesión/CSRF existentes, valida usuario/Business antes del POST y no reintenta mutaciones. Deshabilita envío doble y conserva la clave en memoria mientras el compositor siga montado. El textarea usa `useController` para mantener sincronizado el valor visible/validado al reiniciar el borrador entre mensajes; mientras está bloqueado se mantiene `readOnly` (sin desregistrar/excluir el valor por deshabilitación). La acción de consultar estado solo hace GET; preparar otro mensaje descarta seguimiento local y vacía el borrador, con advertencia ante incertidumbre. No guarda borradores/claves/cuerpos en localStorage; navegar/recargar puede perder el seguimiento local, pero los intentos ya reservados siguen en el historial.
- Al perder la respuesta o fallar DB después de Graph, no se garantiza exactamente una entrega. Un proceso caído puede dejar `PENDING` de forma indefinida; no existe worker, replay automático, TTL ni reconciliación con Meta. No repetir el texto con una clave nueva a ciegas. Los rechazos y los intentos pendientes también aparecen en el timeline/resumen: no son prueba de envío exitoso.

### Migración adicional para salientes

`apps/api/prisma/migrations/20261020230000_whatsapp_inbox_sending/migration.sql` añade `WhatsappInboxDirection` y columnas `direction` (default `INBOUND` para datos existentes), `sendAttemptId` opcional, ID Meta nullable, relación compuesta Business/intento, unicidad por intento, CHECK de campos según dirección e índice para ventana de atención. **Se conserva el nombre físico heredado `WhatsappInboundMessages`, que ahora almacena ambas direcciones**; no se renombran tablas ni se pierde historial. `Messages` sigue reservado e independiente; unificarlo no forma parte de esta etapa. La FK y el índice únicos impiden asociar un saliente a otro Business o duplicarlo por intento.

**Migración creada, no aplicada por el asistente.** Revisar destino, backup y todas las pendientes antes de ejecutar explícitamente `pnpm --filter @whatsapp/api db:migrate:deploy`; el comando aplica todas las pendientes. Coordinar despliegue: primero migración, luego API y frontend compatibles. La API nueva necesita estas columnas también al finalizar envíos genéricos. No migrar, conectar DB ni abrir Meta automáticamente en build/dev/start.

### Migración de inbox pendiente

`apps/api/prisma/migrations/20261020220000_whatsapp_inbox/migration.sql` crea `WhatsappThreads` y `WhatsappInboundMessages`, índices tenant/timeline y FK compuesta Business/conversación. Ambos modelos incluyen `isDeleted`. Es aditiva: no importa ni transforma los intentos de envío existentes. **No fue aplicada por el asistente**. Revisar destino, backup y todas las migraciones pendientes antes de ejecutar explícitamente `pnpm --filter @whatsapp/api db:migrate:deploy`. Ese comando aplica **todas** las migraciones pendientes, no solo inbox; no usar reset ni migrate dev. Desplegar la migración antes de la API nueva y activar `messages` en Meta; si falta la tabla, la recepción no confirma esos mensajes y las lecturas fallan. No se abre DB ni se migra en install/build/dev/start.

## Nueva migración de autorización — aplicación explícita pendiente

`apps/api/prisma/migrations/20261020210000_whatsapp_authorization_redirect/migration.sql` crea `WhatsappAuthorizationAttempts`: Business/usuario/sesión, hash único de state, locale, estado, vencimiento, token transitorio cifrado y opciones de números autorizados, timestamps e `isDeleted`. FK Restrict al Business e índices de ámbito/vencimiento. No modifica conexiones ni mensajes existentes. Requiere migraciones previas. **No fue aplicada por el asistente**; revisar destino, backup y todas las migraciones pendientes antes de `pnpm --filter @whatsapp/api db:migrate:deploy`. No se ejecuta automáticamente en install/build/dev/start.

## Túnel local con ngrok

SDK oficial `@ngrok/ngrok` 1.7.0 como dependencia de desarrollo raíz; comando del proyecto, no CLI global:

1. Copiar `.env.ngrok.example` a `.env.ngrok` en la raíz (ignorado por Git).
2. Completar `NGROK_AUTHTOKEN` desde <https://dashboard.ngrok.com/get-started/your-authtoken>. No es un secreto de Meta.
3. Iniciar la API en otra terminal con `pnpm --filter @whatsapp/api dev`.
4. Ejecutar desde la raíz `pnpm ngrok`.

Lee `.env.ngrok` opcional con Node; entorno exportado tiene prioridad. Apunta a `127.0.0.1:8000`; ajustar `NGROK_PORT` si la API usa otro puerto. Muestra URL HTTPS/callback; no arranca API ni copia secretos. `Ctrl+C` cierra el túnel. Si cambia la URL, actualizarla en Meta.

Para login por redirección, usar `NGROK_PORT=3000` (o el puerto web real), publicar frontend y su proxy, iniciar sesión en ese dominio y configurar callback/CORS en ese origen. El puerto API por defecto sirve para webhook/pruebas manuales, no conserva por sí solo la sesión del navegador para OAuth.

**Expone el servicio local a Internet**, no solo el webhook: usar datos/credenciales de desarrollo y cerrar al terminar. No configura CORS, proxies confiables ni límites distribuidos. No se abre en install/build/dev ni se abrió durante estas implementaciones.

## Pendientes y verificación

Cola/worker para absorber picos y ampliar el límite de lotes, estados de entrega y reconciliación de intentos pendientes; retención/purga/privacidad; UI de plantillas/adjuntos y alta de conversaciones; coexistencia/migraciones; recuperación/revocación de autorizaciones inciertas, limpieza programada/retención de intentos OAuth y validación operativa de login/revisión Meta; alta nueva por Embedded Signup (solo endpoints anteriores, sin UI actual); plantillas complejas y medios; controles de consentimiento, ventana y abuso por cuenta/negocio; rotación de claves y recuperación de intentos inciertos. Dashboard, clientes, pedidos y reportes conservan mocks independientes; Conversaciones ya no usa esos fixtures.

Verificación limitada a Prisma format/validate/generate, formato, lint, tipos y build. No se ejecutaron tests, HTTP, navegador, llamadas a Meta, migraciones ni conexiones a DB. La seguridad, concurrencia y entrega real requieren verificaciones runtime autorizadas antes de declarar el flujo listo para producción.
