# Acceso y sesiones

## Estado y alcance

El backend implementa autenticación real con **jose 6.2.13**, **bcrypt 6.0.0**, PostgreSQL y cookies. La migración inicial está aplicada a la base configurada en `apps/api/.env`. No se crearon usuarios ni seeds. Las contraseñas se guardan como hashes bcrypt con salt, **no cifradas reversiblemente**; los refresh tokens solo se persisten como SHA-256.

**El frontend consume autenticación real**: `features/auth/services/auth-service.ts` usa Axios contra `/api/v1` en el mismo origen público. Login y registro crean sesiones reales; el perfil público vive en React Query, no en Zustand. El workspace y onboarding tienen comprobación de sesión en servidor y gate cliente. Recargar recupera la sesión por cookies, pero descarta el progreso y los datos comerciales mock. Las contraseñas no se copian a Zustand, React Query ni almacenamiento persistente; access/refresh solo viajan en cookies HttpOnly.

La autorización actual comprueba sesión, usuario y Membership activa en el negocio. Los módulos comerciales siguen vacíos: no hay RBAC comercial ni repositorios de catálogo/pedidos implementados. Las FK multi-tenant no sustituyen autorización.

## Endpoints implementados

Base `/api/v1`, JSON; respuestas auth `Cache-Control: no-store`. Access y refresh **nunca** se devuelven en JSON ni se guardan en localStorage. El token CSRF sí se devuelve al cliente y no sirve como credencial de autenticación.

| Método y ruta           | Entrada y resultado                                                                                                                                                   |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /auth/csrf`        | Bootstrap CSRF: `{ data: { csrfToken } }`, cookie de contexto preautenticado o vínculo a la sesión verificada.                                                        |
| `POST /auth/register`   | `{ name, email, password, businessName }`; crea User, Business, Membership OWNER y sesión en una transacción; 201 y perfil público.                                   |
| `POST /auth/login`      | `{ email, password, businessId? }`; 200 y perfil público. Comprueba pertenencia si se selecciona negocio; sin selección usa la primera membresía activa por fecha/ID. |
| `GET /auth/me`          | Requiere access válido y sesión/usuario/membresía vigentes; 200 y perfil público o 401.                                                                               |
| `POST /auth/refresh`    | Sin JWT en body: usa cookie refresh y CSRF; rota tokens atómicamente; 204.                                                                                            |
| `POST /auth/logout`     | Revoca la sesión/familia y borra cookies; 204 idempotente, sujeto a validación CSRF.                                                                                  |
| `POST /auth/logout-all` | Requiere access y CSRF; revoca todas las sesiones del usuario; 204.                                                                                                   |

Perfil público: `{ data: { user: { id, name, email }, activeBusinessId, memberships: [{ businessId, role, business: { id, name, slug } }] } }`. Nunca incluye passwordHash, hash refresh ni otros usuarios. Errores actuales: `{ statusCode, error: { code, message } }`, mensajes genéricos sin detalles internos; los 500 registran/devuelven un identificador de incidente en `X-Request-Id`, nunca el error crudo. El normalizador Axios frontend mapea este envelope sin mostrar mensajes internos. Email normalizado en servidor. Registro rechaza contraseñas de menos de 12 caracteres o más de **72 bytes UTF-8** para evitar truncamiento silencioso de bcrypt. Login no transforma contraseñas; hash/compare son asíncronos y se usa un hash ficticio si el usuario no existe. Los errores de credenciales son genéricos; un conflicto de registro no identifica cuál campo está ocupado, aunque el estado de conflicto permite inferir disponibilidad. Verificación de email, recuperación de contraseña, MFA, invitaciones y cambio de contraseña no están implementados; requieren contratos/proveedores adicionales.

## Flujo de consumo

1. Solicitar `GET /api/v1/auth/csrf` con cookies habilitadas (`credentials: "include"` o Axios `withCredentials: true`). Conservar `data.csrfToken` solo en memoria.
2. Enviar registro/login con `Origin` permitido, JSON y `X-CSRF-Token`; el navegador adjunta las cookies del bootstrap.
3. Tras autenticarse se invalidan CSRF y pre-sesión anteriores: solicitar **otro** `/auth/csrf` antes de mutar, refrescar o salir. `/auth/me` usa access y no necesita header CSRF por ser lectura.
4. Refresh exige la cookie refresh, el CSRF ligado a la misma sesión y Origin permitido. No requiere access vigente. La sesión estable conserva el vínculo CSRF entre rotaciones hasta que expire el propio CSRF.
5. Logout requiere CSRF válido; después elimina todas las cookies auth. Repetir logout requiere nuevo bootstrap si ya se borraron. Logout-all requiere además access válido.

Para herramientas no navegador, enviar cookies, Origin permitido y CSRF explícitamente. CORS por sí solo no autoriza solicitudes. No se han ejecutado peticiones de ejemplo ni pruebas de runtime por la restricción vigente.

## Cookies y topología

Host-only, sin `Domain`, `Path=/`, `HttpOnly`, `SameSite=Lax`. Producción añade `Secure` y nombres `__Host-access`, `__Host-refresh`, `__Host-csrf`, `__Host-preauth`. En HTTP de desarrollo usa `dev-access`, `dev-refresh`, `dev-csrf`, `dev-preauth`. La eliminación reutiliza los atributos originales. La cookie CSRF es HttpOnly: el cliente obtiene el valor mediante el JSON del bootstrap.

Web/API usan el **mismo origen público**: un rewrite de Next reenvía `/api/v1/:path*` a `API_INTERNAL_URL` (privada, por defecto `http://localhost:8000/api/v1`, también usada por SSR). El navegador nunca llama directamente al host interno; el proxy conserva cookies y `Set-Cookie`. Configurar `CORS_ORIGINS` en Nest con el origen público exacto de la web. La URL interna participa en la clave de build de Turbo: cambiarla requiere rebuild; los despliegues pueden sustituir el rewrite por un reverse proxy equivalente. No reenviar credenciales a una URL arbitraria: se valida como HTTP(S) sin usuario/clave/query/hash. Producción exige HTTPS público y API en `NODE_ENV=production` para las cookies Secure/`__Host-`. Hosts separados o realmente cross-site no están soportados por esta integración; nunca asumir que sus cookies llegan a Next.

## Tokens y sesiones persistidas

- jose firma/verifica HS256 con secretos independientes access/refresh; algoritmo permitido, issuer, audience, propósito, expiración, `sub`, `jti`, `sid` y `businessId` comprobados. Ninguna clave se obtiene de URLs del token. Roles y pertenencia se consultan en servidor.
- `AuthSession` es la familia estable revocable: usuario/negocio, expiración absoluta e inactividad. `RefreshSession` representa cada refresh emitido: hash SHA-256, `jti` como ID, familia, expiración, consumo y revocación.
- Valores por defecto: access **15 minutos**, inactividad refresh **7 días**, límite absoluto de sesión **30 días**, CSRF **1 hora**, bcrypt **12 rondas**. Configurables en `.env.example`; access < refresh <= sesión. Renovar extiende inactividad, nunca el límite absoluto; expiración de tokens acotada por la sesión.
- Refresh bloquea la familia con `SELECT ... FOR UPDATE`, comprueba vigencia/pertenencia, consume el token y crea el sucesor en una transacción. El rechazo por reutilización conserva el commit de revocación. Se guardan registros consumidos para detectar replay; no borrar esa evidencia antes de vencer la familia.
- Política estricta: **refresh simultáneo o reutilizado revoca la familia**. Coordinar un solo refresh entre solicitudes/pestañas; no reintentar automáticamente una renovación incierta o con respuesta perdida.
- Guards consultan estado de sesión y Membership en cada petición protegida: logout revoca también access aún no expirado. El guard global protege por defecto las rutas salvo metadata pública explícita; `GET /` del starter también queda protegido y no es un health check.

## CSRF, límites y configuración

Mutaciones verifican Origin exacto contra `CORS_ORIGINS`, o Referer controlado si falta Origin; sin ninguno se rechazan. CSRF usa **double-submit firmado con HMAC**, header `X-CSRF-Token` y cookie coincidentes, con caducidad y vínculo criptográfico a sesión/pre-sesión. No se combina con un almacén ficticio de tokens sincronizados. SameSite y CORS son defensas adicionales, no sustitutos.

Cuerpo HTTP máximo 16 KiB. Throttler global y límites específicos para registro/login/bootstrap/refresh; almacenamiento **en memoria por proceso e IP**, no por cuenta ni distribuido. No se confía automáticamente en `X-Forwarded-For`; desplegar detrás de proxy requiere definir IP confiable y límites de borde/almacén compartido. Una IP de proxy compartida puede agotar el límite de todos sus clientes. Ajustar y verificar antes de producción.

`AUTH_ACCESS_SECRET`, `AUTH_REFRESH_SECRET`, `AUTH_CSRF_SECRET`: obligatorios, distintos, mínimo 64 caracteres. Ejecutar `pnpm --filter @whatsapp/api auth:configure` para generar los que faltan en el `.env` local, sin imprimirlos ni sobrescribir valores existentes. En producción usar gestor de secretos, HTTPS, TLS verificado hacia PostgreSQL y un plan de rotación; la implementación actual no ofrece keyring/`kid` para rotación sin invalidar tokens. Cambiar secretos invalida los tokens firmados con los anteriores.

## Integración Next.js implementada

- Formularios RHF/Zod es/en: login envía email/password; registro añade nombre del usuario y negocio, confirmación solo local y límites alineados con bcrypt (12 caracteres mínimo, 72 bytes UTF-8 máximo). Los errores distinguen validación, 401, conflicto, CSRF, límite y conexión; no hay cuentas ni errores simulados.
- CSRF se obtiene antes de cada mutación y de nuevo tras login/registro; solo se conserva en variables en memoria. No hay interceptor que reenvíe indiscriminadamente mutaciones, ni retries de login/register/refresh/logout. Tras renovar solo se repite `/auth/me` una vez.
- `auth-service.ts` serializa TODAS las operaciones auth con Web Locks del mismo origen (también entre pestañas). Antes de renovar vuelve a comprobar `/auth/me` dentro del lock; otro consumidor puede haber renovado mientras esperaba. El polling del perfil es cada 60 s, al recuperar foco/reconexión y tras eventos de otras pestañas.
- Antes de enviar refresh se guarda **solo una marca booleana de incertidumbre** en localStorage, nunca JWT, CSRF, contraseñas o perfil. Se elimina tras un perfil válido de `/me`, un refresh exitoso o un nuevo login/registro/logout exitoso; un refresh rechazado también la conserva de forma conservadora. Si se pierde la respuesta, no se reintenta refresh automáticamente, incluso tras recargar; se pide volver a iniciar sesión. Sin Web Locks o sin almacenamiento disponible se desactiva renovación automática de forma conservadora. Esto puede exigir relogin al expirar access; no garantiza continuidad offline.
- `server-session.ts` lee cookies bajo un `Suspense` padre y consulta `/auth/me` con `cache: "no-store"`, timeout y solo las cookies access conocidas. No renueva ni escribe cookies desde Server Components. Si falta/expira access, una recuperación cliente renueva y luego solicita un nuevo render del servidor; si la API falla muestra error/reintento sin renderizar el área protegida. Cache Components y partial prerender conservan únicamente el fallback público, no el contenido autenticado.
- `SessionGate` no entrega el shell ni onboarding sin un perfil verificado. El guard API sigue siendo la autoridad; la redirección de idioma o de acceso no sustituye autorización. Login va a dashboard y registro a onboarding; el registro ya creó Business antes del wizard, que sigue siendo una demo no persistida.
- Logout y logout-all en el header, avisos BroadcastChannel y revalidación por visibilidad/foco/conexión, limpieza de React Query comercial, repositorio mock, escenarios y borradores al salir/cambiar identidad/perder sesión. El estado visual de tema/sidebar se conserva. El cierre de todas las sesiones en otros dispositivos se detecta al volver a validar, no por push.

## Pendiente y verificación

No hay selección de negocio ni RBAC comercial en frontend; `activeBusinessId` y memberships proceden del servidor. No reintentar futuras mutaciones comerciales no idempotentes ni usar una redirección frontend como autorización. Ver [estado y próximos pasos](./login-plan.md).

Auditoría durable sin secretos, limpieza programada de sesiones, límites distribuidos/por cuenta, recuperación/verificación de email, políticas RBAC comerciales, observabilidad y verificaciones de seguridad siguen pendientes. No declarar listo para producción: por instrucción del usuario **no se implementaron ni ejecutaron tests, smoke checks, peticiones HTTP ni comprobaciones de navegador**. Lint, formato, tipos y build no prueban seguridad ni comportamiento de las sesiones.
