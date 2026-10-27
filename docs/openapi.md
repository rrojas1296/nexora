# Swagger / OpenAPI

## Acceso

Con la API iniciada (`pnpm --filter @whatsapp/api dev`, puerto predeterminado 8000):

- UI: <http://localhost:8000/api/v1/docs>
- OpenAPI JSON: <http://localhost:8000/api/v1/docs-json>
- OpenAPI YAML: <http://localhost:8000/api/v1/docs-yaml>

También pueden servirse mediante el rewrite `/api/v1` del frontend bajo el mismo origen público; no se cambia el proxy. Los enlaces anteriores apuntan directamente a la API. `GET /` conserva su exclusión del prefijo y su autenticación: no es un health check.

Swagger se habilita por defecto fuera de producción. `SWAGGER_ENABLED=true` o `false` permite sobrescribirlo en el entorno privado de la API; reiniciar después de cambiarlo. No acepta otros valores ni requiere modificar `.env` existente. En producción, si no se configura, no se registran UI, assets ni documentos. Al habilitarlo, **la documentación es pública**: restringir estas rutas en el proxy/red si se necesita acceso privado. Los guards de los endpoints de negocio siguen intactos.

## Cobertura actual

Las operaciones existentes tienen resumen, contratos de respuesta, errores, parámetros y cuerpos donde corresponde:

| Grupo         | Operaciones                                                                                                                 |
| ------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Inicio        | GET `/` autenticado, sin prefijo                                                                                            |
| Autenticación | GET csrf/me; POST register/login/refresh/logout/logout-all/change-password/change-password-with-credentials/switch-business |
| Negocio       | POST `/businesses`; GET/PATCH `/businesses/:businessId`                                                                     |
| Productos     | GET/POST colección; GET/PATCH/DELETE detalle; GET/POST categorías; POST upload multipart; GET imagen privada WebP           |
| Agente        | GET/PUT configuración general                                                                                               |
| WhatsApp      | GET/PUT/DELETE conexión; POST mensajes; GET intento                                                                         |
| Webhook Meta  | GET verificación; POST eventos firmados                                                                                     |

Salvo la raíz, los paths se publican bajo `/api/v1`. También se documentan autorización WhatsApp por redirección, endpoints legacy de signup e inbox real (GET hilos/mensajes, POST respuesta y GET intento por clave). Se añaden GET pedidos del hilo, GET adjunto binario privado y POST revisión humana de comprobante; ver [whatsapp-commerce.md](./whatsapp-commerce.md). También se documentan GET/POST `/businesses/:businessId/clients` y `/orders`, GET/PATCH `/:clientId` y `/:orderId`: lectura con membresía activa, escritura OWNER/ADMIN/CSRF, UUID estable de creación y versión para PATCH; ver [clients-orders.md](./clients-orders.md). No hay endpoint público de generación IA; Tiendas ha sido sustituido por Negocios. Los ejemplos y esquemas no cambian la validación real ni habilitan funcionalidades pendientes de migración/configuración.

Los bodies reutilizan los schemas Zod de validación mediante `z.toJSONSchema` para OpenAPI 3.0, sin duplicar clases DTO ni usar el plugin del compilador. Refinamientos semánticos (política Unicode/bytes de contraseña, pertenencia al negocio, categoría existente, patch no vacío, etc.) siguen en los parsers/servicios y se explican en las descripciones: JSON Schema no representa todos esos controles. Los campos de contraseña y access token se marcan writeOnly/password, sin secretos reales en ejemplos.

## Usar Try it out con sesión y CSRF

**No se utiliza Authorization: Bearer.** Los esquemas `accessCookie`/`refreshCookie` describen las cookies HttpOnly reales, con nombres `dev-*` en desarrollo y `__Host-*` en producción. El navegador no permite que Swagger establezca manualmente el header Cookie mediante Authorize: no pegar allí el JWT. Usar login y dejar que el navegador conserve cookies.

1. Abrir Swagger en el origen público de la API/proxy con el navegador que se usará para autenticar. Ese origen debe estar explícitamente en `CORS_ORIGINS`, también en peticiones same-origin, porque el guard CSRF compara Origin/Referer.
2. Ejecutar GET `/api/v1/auth/csrf`: se crea el contexto preautenticado con cookie HttpOnly. Copiar `data.csrfToken` de la respuesta.
3. Ejecutar POST `/api/v1/auth/login` (o registro) con credenciales propias y el valor anterior en `X-CSRF-Token`. Se establecen cookies de sesión, no tokens en JSON.
4. Solicitar **otro GET csrf** tras autenticar: el bootstrap anterior queda invalidado. Copiar el token nuevo en los endpoints de mutación que se quieran ejecutar. Las lecturas solo requieren cookies de sesión.
5. Registro recibe solo nombre/email/contraseña y deja `activeBusinessId: null`. Crear negocio con POST `/businesses` y activarlo con POST `/auth/switch-business` (rota cookies); volver a obtener CSRF. Usar el nuevo `activeBusinessId` del perfil/GET me como parámetro. Ser miembro no autoriza todas las escrituras: aplicar los roles documentados. Una sesión sin negocio solo autoriza cuenta y listado/creación, no productos, agente ni WhatsApp.
6. Refresh usa la cookie refresh, conserva CSRF ligado a sesión y rota credenciales de uso único. No reintentar una renovación incierta. Después de logout/cambio de contraseña, obtener otro bootstrap antes de iniciar sesión de nuevo.

El UI envía credenciales con `withCredentials: true`, no persiste Authorization entre recargas y desactiva el validador remoto de Swagger. No automatiza login, extracción de tokens, renovaciones ni reintenta mutaciones.

Si Swagger se abre directamente en `http://localhost:8000`, las mutaciones requieren añadir explícitamente ese origen en la configuración local, por ejemplo:

```dotenv
CORS_ORIGINS=http://localhost:3000,http://localhost:8000
```

No se añaden orígenes automáticamente ni se relajan cookies/CSRF. En producción usar orígenes HTTPS. No mezclar localhost/127.0.0.1 ni entornos: cookies y tokens deben pertenecer al mismo host/contexto. Si se abre a través del frontend, usar su origen ya autorizado. El navegador gestiona Origin/Referer, no es necesario añadirlos como parámetros manuales en Swagger.

## Operaciones con efectos reales

**Try it out no es una simulación:** crea/edita datos, cambia contraseñas, revoca sesiones, sube imágenes y puede enviar mensajes WhatsApp facturables. Usar cuentas y datos de desarrollo. Las rutas autenticadas y las migraciones pendientes conservan sus prerrequisitos.

- Upload: `multipart/form-data`, único campo `image` JPG/PNG/WebP de hasta 2 MiB. Swagger permite seleccionar archivo; el GET devuelve binario `image/webp`.
- WhatsApp: registrar `phoneNumberId` y access token de **Meta** con PUT connection; token cifrado en DB. POST messages requiere UUID en `Idempotency-Key`, además de sesión/CSRF. Reutilizar la misma clave/body para recuperar un intento, no generar otra para forzar un envío incierto. ACCEPTED no confirma entrega.
- Control IA de Conversaciones: POST `/businesses/:businessId/whatsapp/conversations/:threadId/control`, body estricto `{mode: "AI" | "HUMAN", version: entero >= 0}`, OWNER/ADMIN/CSRF, devuelve modo/versión. Conflicto de versión 409; AI no configurada 503. La lectura paginada de mensajes añade origen y `automation` (modo/versión, permisos, preparación, envío en curso y último estado del job); no hay endpoint público para generar prompts. El envío manual requiere `HUMAN` para una reserva nueva (409 `WHATSAPP_AI_ACTIVE` si no). Devolver a IA habilita solo próximos entrantes; puede producir llamadas facturables a OpenAI/Meta si el servidor, agente y contexto están listos. Ver [ai.md](./ai.md).
- Clientes/Pedidos generales: Business activo igual a la ruta; 409 por conflicto de versión/UUID/datos reservados/cliente-productos inválidos/transición no permitida. Precios del catálogo servidor, DRAFT WhatsApp no editable/confirmable desde aquí y PAID requiere revisión humana de comprobante. No hay endpoints de pago, borrado o despacho automático. Esquemas Zod estrictos reflejados en Swagger.
- Comprobantes del hilo: GET `/.../conversations/:threadId/orders` y `/media/:messageId` requieren membresía activa y negocio activo. POST `/.../orders/:orderId/proofs/:proofId/review` exige OWNER/ADMIN/CSRF y `{status: "VALIDATED" | "REJECTED", revision, orderVersion}` vigentes. 409 ante conflicto; sin retries, cobro, conciliación bancaria ni despacho automático. La descarga es attachment WebP/PDF no escaneado por antivirus.
- Webhook: GET requiere los tres query params `hub.*`. POST exige `X-Hub-Signature-256` calculado sobre los bytes exactos del JSON: editar o reformatear el body invalida la firma. Es público únicamente con esa validación; el webhook guarda entrantes deduplicados de conexiones activas y descarta estados/otros eventos.

Detalles: [authentication.md](./authentication.md), [businesses.md](./businesses.md), [products.md](./products.md), [agents.md](./agents.md) y [whatsapp.md](./whatsapp.md).

## Dependencias y límites de verificación

Se instaló `@nestjs/swagger` **12.0.2**, última versión estable consultada, compatible con Nest 12. Su peer de TypeScript declara `^5.5.0 || ^6.0.0`: pnpm avisa porque este proyecto usa **7.0.2**. No se rebaja TypeScript ni se oculta el aviso con una excepción global. No se utiliza el plugin de Swagger/Nest ni la API programática de TypeScript: metadatos y esquemas son explícitos, build con `tsc` como antes. La comprobación estática/build pasa, pero eso no equivale a compatibilidad runtime comprobada.

El script postinstall de telemetría de `@scarf/scarf` 1.4.0, transitivo de Swagger, se bloquea explícitamente con `allowBuilds: false` para ese paquete. No se habilitan scripts o excepciones de antigüedad globales. La instalación con lockfile congelado queda operativa; `pnpm peers check` conserva únicamente el aviso anterior.

Verificación limitada a instalación, formato, lint, TypeScript y build, sin tests, HTTP, navegador, arranque de API, llamadas Meta ni conexión/migración de DB. La UI, ejecución desde Swagger y seguridad runtime requieren comprobación autorizada antes de afirmar preparación para producción.
