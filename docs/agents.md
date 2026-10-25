# Configuración persistente del agente

La pantalla `/{locale}/agent` consulta y guarda la configuración general del negocio activo en PostgreSQL. No usa fixtures, escenarios ni restablecimiento de la demo. Al no existir configuración, muestra un formulario vacío (tono inicial `friendly`, habilitado `false`); solo guardar crea el registro. El borrador y su vista previa son locales: ni escribir ni cambiar el interruptor guarda automáticamente.

## Contrato

Bajo `/api/v1/businesses/:businessId/agents/configuration`:

- `GET`: membresía activa del negocio de la sesión; responde `{ data: configuration | null }`.
- `PUT`: solo OWNER/ADMIN; reemplaza la configuración editable o crea la primera. Responde `{ data: configuration }`.

`configuration` contiene `id`, `name`, `tone`, `instructions`, `greeting`, `enabled`, `createdAt`, `updatedAt`. La entrada incluye únicamente los cinco campos editables. Nombre recortado de 2–100 caracteres, tono `friendly | professional | concise`, instrucciones breves opcionales recortadas de 0–2000 caracteres, saludo recortado de 5–300 y `enabled` booleano. El adaptador convierte tonos al enum Prisma y `enabled` a `Agent.active`.

Se aplican guard de sesión global, CSRF en PUT, límite de peticiones y comprobación del negocio activo contra la ruta. El repositorio verifica usuario, negocio y membresía no eliminados/activos y sesión no revocada ni expirada. Las lecturas admiten cualquier rol de membresía activa; las escrituras exigen OWNER/ADMIN también en el repositorio. No se confía en el negocio proporcionado por el cliente. Los errores de permiso son 403, conflictos de configuración 409, entrada inválida 400.

## Persistencia y concurrencia

Se reutiliza `Agents` sin cambios de esquema, migraciones ni seeds. La configuración general tiene `storeId: null`; agentes específicos de tienda no se leen ni modifican. No se devuelven registros eliminados. Lectura y escritura incluyen registros generales eliminados únicamente en su comprobación de reservas: ambas rechazan duplicados o un registro reservado eliminado con 409, sin restaurarlos, reemplazarlos ni borrarlos automáticamente. Así no se presenta como vacío ni editable un estado que después impediría guardar.

El índice compuesto existente admite múltiples `storeId: null`. Para serializar creación y actualización desde esta API, cada escritura bloquea el negocio con `FOR NO KEY UPDATE` antes de buscar el registro, y bloquea la membresía con `FOR SHARE`. Las lecturas bloquean membresía y negocio con `FOR SHARE`. No hay unicidad singleton garantizada por la base frente a escritores externos que ignoren este protocolo. Si se amplían los escritores, revisar una migración con índice parcial y resolver duplicados explícitamente antes de aplicarla. Las actualizaciones válidas son de último guardado efectivo; no hay versiones ni resolución de conflictos entre borradores concurrentes.

## Cliente y límites

El formulario propio del agente enlaza sus cinco campos a RHF mediante `Controller`/`FormSelectField` (valor/cambio explícitos y `checked` booleano para habilitado). Vista previa y submit leen ese mismo estado; no depende del registro no controlado del formulario genérico de mocks. React Query separa caché por usuario y negocio; lee mediante Axios con cookies HttpOnly y `AbortSignal`. Un GET normal no solicita `/auth/me` ni CSRF: solo un 401 recupera la sesión, comprueba identidad/negocio y reintenta esa lectura una vez. Guardar usa el flujo de sesión/CSRF existente y no reenvía mutaciones automáticamente. Tras guardar o recibir un error incierto se reconcilia con una lectura; un borrador sucio se conserva. Los fallos de refresco no desmontan el formulario. Mensajes es/en distinguen permisos, sesión, validación, conflictos y guardado incierto.

`enabled` autoriza respuestas automáticas a nuevos textos cuando el servidor tiene `AI_AUTOREPLY_ENABLED=true`, OpenAI configurado, contexto publicado no vacío y el número WhatsApp conectado, en hilos en modo IA. No conecta WhatsApp por sí solo. Deshabilitarlo invalida generaciones antes de reservar envío; no retira un envío ya reservado. La vista previa solo muestra el saludo local del borrador, sin llamar al modelo. El contexto comercial extenso se edita, guarda como borrador y publica desde la configuración del negocio, no en Agente; ver [businesses.md](./businesses.md) y [automatización/privacidad IA](./ai.md). Dashboard y otros módulos mock conservan datos independientes. El agente general debe ser único, incluyendo reservas de registros borrados: duplicados o un único eliminado bloquean la automatización, sin selección arbitraria ni restauración.

## Agente inicial y múltiples negocios

El registro crea únicamente cuenta/sesión. Onboarding o Crear negocio persisten Business + Membership OWNER + agente general **en una transacción**, mediante POST `/businesses`. El formulario inicial pide nombre/tono del agente, no instrucciones comerciales extensas: estas pertenecen al contexto del negocio. El agente nuevo tiene instrucciones y saludo vacíos y `active: false`; no se conecta WhatsApp ni se ejecuta IA. Antes de guardar su configuración desde Agente debe completarse el saludo de 5–300 caracteres que exige el PUT. El nombre admite 2–100 caracteres.

Al cambiar de negocio se limpian queries y borradores; la configuración de agente se consulta con el usuario/Business activo autorizado. Los agentes existentes conservan nombre, tono, instrucciones y saludo; no se copian ni se borran instrucciones antiguas durante la migración. Las columnas/FK legacy de tienda se mantienen por compatibilidad física, sin UI ni nuevos agentes por tienda. Ver [businesses.md](./businesses.md) y la migración aditiva pendiente `20261020240000_multiple_businesses_context`.

Verificación limitada a lint, formato, tipos y build. No se ejecutan tests ni verificaciones de runtime/HTTP/base de datos; la compilación no demuestra seguridad o persistencia en el destino desplegado.
