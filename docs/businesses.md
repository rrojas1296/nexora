# Negocios y contexto comercial

## Alcance actual

Una cuenta puede crear y administrar varios negocios reales. El registro crea **solo el usuario y una sesión de cuenta sin negocio activo**. El onboarding crea el primer negocio; no pide una tienda ni obliga a conectar WhatsApp. Cada creación confirma en una transacción el Business, la Membership OWNER y un agente general **deshabilitado**, con nombre/tono iniciales e instrucciones y saludo vacíos.

La navegación sustituye Tiendas por **Negocios**. El listado usa las membresías autorizadas de `/auth/me`; el selector aparece debajo del logo del sidebar y también en navegación móvil. Permite cambiar de negocio, abrir su configuración o crear otro. La conexión WhatsApp se configura dentro del negocio activo, no en preferencias globales. Agente y Conversaciones siguen siendo módulos separados del negocio activo.

La [automatización IA opcional](./ai.md) usa OpenAI mediante un proveedor reemplazable, cola PostgreSQL y control humano/IA por hilo. Está desactivada por defecto y requiere migración/configuración explícitas. Publicar contexto no la habilita por sí solo: necesita también servicio y agente habilitados, número conectado y ventana de atención; una vez activos, los próximos textos elegibles pueden producir envíos reales.

## Datos y contexto

Cada Business tiene nombre, descripción breve, moneda, zona horaria IANA y:

- `contextDraft`: texto comercial editable, hasta 30000 caracteres.
- `contextPublished`: copia independiente del último borrador publicado.
- `contextVersion`: número de publicaciones; comienza en 0.
- `contextPublishedAt`: fecha de última publicación, o null.
- `revision`: versión optimista de la configuración, incrementada en cada edición.

El editor ofrece plantilla guiada, contador y vista previa **de texto sin formato**. Puede describir propuesta de valor, servicios, horarios, pagos, entregas, políticas, preguntas frecuentes y derivación humana. Guardar borrador no publica; publicar guarda el borrador y su copia en una sola operación. La revisión enviada impide sobrescribir una configuración concurrente desde un borrador antiguo. No hay autosave, historial de versiones ni publicación automática.

El contexto comercial pertenece al negocio. El módulo Agente conserva nombre, tono, saludo, habilitado e instrucciones breves opcionales (hasta 2000 caracteres) para comportamiento; no duplica el editor extenso. Las instrucciones antiguas se conservan sin copiarlas al contexto. La integración usa exclusivamente el contexto publicado y un historial acotado del hilo; no envía el borrador. Trata textos de usuario/configuración como contenido no confiable; el contexto no concede permisos ni herramientas. No consulta ni sincroniza el catálogo: incluir hechos comerciales vigentes en la publicación.

No introducir secretos, tokens, contraseñas ni datos personales innecesarios. El texto se almacena en PostgreSQL sin cifrado aplicativo y la copia publicada se transmite a OpenAI al generar respuestas; no se ejecutan HTML ni enlaces. Revisar consentimiento y políticas de retención del proveedor antes de habilitarlo. No hay documentos, embeddings, RAG ni cargas de archivos para contexto.

Los productos nuevos toman la moneda del Business y sus KPIs la incluyen. No hay conversión de precios: cambiar la moneda se rechaza si el negocio ya tiene productos, incluidos los borrados lógicamente. Los negocios preexistentes conservan PEN. Clientes y pedidos usan API persistente del Business activo; los pedidos toman moneda/precios del catálogo y conservan snapshots. Dashboard y reportes continúan con fixtures independientes en PEN. Ver [clients-orders.md](./clients-orders.md). Los reportes comparan productos, no tiendas.

## API

Base `/api/v1`, cookies HttpOnly; mutaciones con CSRF y Origin permitido. Swagger mantiene los contratos explícitos. JSON de creación/configuración directa de Business admite 128 KiB sin compresión; auth y demás JSON mantienen 16 KiB, y el webhook su límite independiente.

| Método/ruta                     | Comportamiento                                                                                                                                                                                                                      |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /businesses`              | `{ id, name, description, currency, timezone, contextDraft, agentName, agentTone }`; cuenta autenticada incluso sin negocio. Crea Business + OWNER + agente atómicamente; 201 con configuración. No cambia el negocio de la sesión. |
| `GET /businesses/:businessId`   | Configuración del negocio activo con membresía activa, cualquier rol.                                                                                                                                                               |
| `PATCH /businesses/:businessId` | Nombre y campos opcionales de configuración; OWNER/ADMIN del negocio activo. `revision` obligatoria para editar/publicar contexto. `publish: true` copia el borrador a publicado.                                                   |
| `POST /auth/switch-business`    | `{ businessId }`; sesión/CSRF. Revalida membresía activa destino y crea una nueva familia de sesión/cookies, revocando la familia anterior en la misma transacción. Devuelve el perfil autorizado.                                  |

Un ID estable generado por el formulario permite recuperar una creación incierta del mismo propietario sin crear otro negocio. No es un mecanismo general de idempotencia con comparación de payloads: el mismo ID ya creado devuelve el estado existente autorizado. No se reenvían mutaciones automáticamente; si el guardado se confirmó pero falló activar el nuevo negocio, se ofrece Abrir negocio sin repetir la creación. Recargar el formulario descarta ese ID y los borradores: consultar primero el listado si el resultado anterior fue incierto.

Lecturas/escrituras de negocios ajenos, inactivos o eliminados y escrituras sin rol devuelven 403. Una revisión obsoleta o cambio de moneda no permitido también se rechazan con 403; la UI conserva el borrador y permite recargar explícitamente. No hay invitaciones, edición de miembros, transferencia de propiedad ni borrado de negocio.

## Sesiones, caché y navegación

`activeBusinessId` y `AuthSession.businessId` admiten null. Una sesión de cuenta sin negocio conserva `/me`, refresh, logout, cambio de contraseña y creación de negocios; no autoriza productos, agente ni WhatsApp. El login sin selección utiliza la primera membresía activa por fecha/ID; si no existe, inicia sesión de cuenta. Un ID de negocio explícito no autorizado se rechaza, sin fallback silencioso.

Cambiar de negocio pasa por el backend bajo el Web Lock auth; nunca modifica solo Zustand ni confía en un businessId del navegador. Tras confirmar cookies/perfil se cancelan y limpian queries comerciales, fixtures y borradores, se conserva tema/idioma/sidebar y se notifica a las otras pestañas mediante BroadcastChannel. Se solicita confirmación de descarte en el selector. Los guards API siguen siendo la autoridad ante peticiones antiguas o cambios de sesión concurrentes; las lecturas/mutaciones comprueban identidad y negocio esperado.

La configuración y datos reales usan claves de React Query por usuario/negocio. El editor mantiene borradores solo en memoria, no en localStorage; una recarga explícita los descarta. Los módulos demo se reinician al cambiar de contexto y nunca se sincronizan implícitamente con el catálogo o inbox real. Una sesión sin negocio puede acceder al listado/creación; el resto del workspace redirige a onboarding.

## Migración y operación

`apps/api/prisma/migrations/20261020240000_multiple_businesses_context/migration.sql` es **aditiva y pendiente de aplicación explícita**. Añade datos/contexto del negocio y permite sesiones sin negocio; los negocios existentes conservan su ID, membresías, agentes, catálogo y WhatsApp. No convierte tiendas legacy en negocios, no elimina datos ni mueve relaciones entre tenants. La tabla/modelo `Store` y FK históricas se conservan por compatibilidad; se retira su módulo backend vacío y su UI/mock. Su retirada física exigiría inventario y migración separada autorizada.

Aplicar de forma coordinada con API y frontend: el registro nuevo requiere las columnas/sesiones nullable. No hay migraciones, conexiones DB ni seeds en install/build/dev/start. Revisar y aplicar manualmente las migraciones previas pendientes y esta antes de usar la funcionalidad. No se modificaron variables privadas ni se llamó a Meta o a un proveedor IA.

Validación estática completada: `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm build` y `pnpm --filter @whatsapp/api db:validate`, todos correctos (Prisma generate/validate no conectan a PostgreSQL). No se crearon/ejecutaron tests, smoke checks, HTTP de aplicación, navegador, consultas DB ni integraciones externas. La concurrencia, cookies y navegación requieren verificaciones runtime autorizadas antes de producción; la compilación no las acredita.
