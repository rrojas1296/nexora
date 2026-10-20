# Plan de implementación — Login real

## Estado y alcance

Plan solicitado tras renombrar `Tenant` a `Business`. **No implementado**: auth sigue siendo una simulación frontend, los módulos backend siguen vacíos y no hay cuentas, cookies ni rutas protegidas. La aprobación de este plan no equivale a ejecutar migraciones, aprovisionar una base, crear usuarios ni levantar servidores. La restricción de tests sigue vigente.

Primera entrega propuesta: login con email/contraseña, sesión persistente revocable, consulta del usuario actual, renovación y logout. Los módulos comerciales continúan siendo mocks claramente señalados; no introducir datos privados ni afirmar aislamiento completo. Registro público, recuperación/verificación de email, MFA, invitaciones y selector de negocios quedan para entregas posteriores.

## 1. Cerrar contratos y topología

- Recomendación: web y API bajo un **mismo origen público**, con `/api/v1` dirigido a NestJS mediante reverse proxy; destinos internos solo en configuración del servidor. Definir proxy local y de producción antes de integrar cookies. Ajustar el validador de configuración de Axios si se adopta una URL relativa; hoy exige URL HTTP(S). No sustituir la autorización de Nest por un proxy.
- Esto permite que las cookies host-only lleguen también a Next.js para validaciones de sesión en servidor. Si se mantienen hosts distintos, diseñar explícitamente la propagación de sesión/SSR; no asumir que una cookie de la API llega al servidor web. CORS exacto con credenciales si hay acceso cross-origin.
- Usuario global por email normalizado; `Membership` activa vincula usuario y `Business`. Login puede recibir `businessId` opcional, siempre verificado. Sin selección, elegir de forma determinista una membresía activa autorizada (orden por creación e ID); devolver el negocio activo y la lista autorizada. No elegir un negocio arbitrario enviado por el cliente.
- Sin membresías activas no se crea sesión comercial. El primer usuario necesitará aprovisionamiento controlado, explícitamente autorizado, de `User` + `Business` + `Membership OWNER`, con hash Argon2id; sin credenciales versionadas ni seeds automáticos. Registro público es una fase separada.
- Propuesta de TTL a confirmar: access 15 minutos, refresh con inactividad máxima de 7 días y límite absoluto de sesión de 30 días. Rotar no reinicia el límite absoluto. No son valores ya configurados.

## 2. Persistencia y puertos hexagonales

- Revisar `User`, `Business`, `Membership` y `RefreshSession`; añadir la información que falte para límite absoluto, actividad, token consumido/sucesor y revocación de sesión/familia. Diseñar concurrencia y transacciones antes de programar rotación.
- Preparar y revisar la migración inicial en PostgreSQL local autorizado. El repositorio aún no tiene migraciones aplicadas/versionadas; generar Prisma no crea tablas. Nunca ejecutar migraciones ni seeds desde build/dev.
- `auth/domain` y `auth/application`: casos de uso `Login`, `GetCurrentSession`, `RefreshSession` y `Logout`, con puertos de usuarios/membresías, sesiones, hash de contraseñas, tokens y reloj. Sin imports de Nest ni Prisma en estas capas.
- `auth/infrastructure`: repositorios Prisma, Argon2id y jose, enlazados por tokens de inyección. `auth/presentation`: DTOs Zod, controladores, cookies y guards. El módulo `business` conserva la responsabilidad del negocio; no es un alias de la identidad de usuario.
- Consultar versiones estables actuales de cada dependencia antes de instalar; jose/argon2 todavía no están instalados. Evitar añadir Passport/JWT u otra abstracción si no es necesaria para el diseño elegido.

## 3. Login y seguridad HTTP

| Ruta bajo `/api/v1`  | Responsabilidad                                                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `GET /auth/csrf`     | Bootstrap CSRF ligado a pre-sesión o sesión; respuesta sin caché.                                                            |
| `POST /auth/login`   | Validar credenciales y membresía; crear sesión y cookies; devolver perfil público, negocio activo y memberships autorizadas. |
| `GET /auth/me`       | Verificar sesión, usuario y membresía vigentes; devolver el mismo perfil público o 401.                                      |
| `POST /auth/refresh` | Verificar cookie refresh, CSRF y sesión; rotación atómica; 204 con cookies nuevas.                                           |
| `POST /auth/logout`  | Revocar familia/sesión actual y borrar cookies; 204 idempotente.                                                             |

- Validación autoritativa, límites de cuerpo y normalización de email. No transformar silenciosamente la contraseña. Usar Argon2id con parámetros medidos; verificar un hash ficticio cuando no exista usuario para reducir diferencias evidentes. Respuestas genéricas ante credenciales inválidas, cuentas desactivadas o sin acceso, sin exponer hashes ni detalles internos.
- Cookies host-only, `Path=/`, `HttpOnly`, `Secure` en producción y `SameSite=Lax` para la topología recomendada; nombres de desarrollo separados para HTTP local. `__Host-` solo cuando se cumplen todos sus requisitos.
- jose: algoritmo permitido, issuer/audience, expiración, propósito access/refresh, `sub`, `jti` y vínculo con sesión/negocio. Claves privadas y secretos exclusivamente en configuración backend validada; nunca devolver tokens en JSON ni guardarlos en localStorage/Zustand.
- CSRF para login, refresh, logout y futuras mutaciones: Origin exacto más token sincronizado ligado a pre-sesión/sesión, con puerto y almacén explícitos. Rotar el contexto al autenticar. SameSite y CORS no sustituyen esta defensa. Definir expiración/limpieza de pre-sesiones y token.
- Rate limiting de login por IP y cuenta normalizada sin permitir bloqueo trivial de terceros, límites para refresh/CSRF y configuración confiable de IP tras proxy. Almacén compartido al desplegar múltiples instancias; no confiar en headers reenviados arbitrarios.
- Respuestas auth `Cache-Control: no-store`; errores uniformes y auditoría sin contraseñas, cookies ni JWT.

## 4. Renovación, revocación y autorización

- Guardar solo hash criptográfico del refresh de alta entropía, nunca el token en claro. Verificar firma/claims, expiración, sesión no revocada, usuario y membresía activos.
- Consumir refresh y crear sucesor en una sola transacción con protección frente a doble consumo. Conservar evidencia del token consumido para detectar reutilización y revocar la familia; no borrar esa evidencia al rotar.
- Política inicial estricta: reutilización obliga a reautenticar. Coordinar refresh simultáneos entre solicitudes y pestañas antes de integrar el cliente; no inventar una ventana de gracia ni reintentar un refresh incierto que pudo haberse consumido.
- Logout revoca la sesión/familia. Los guards deben consultar estado vigente para que un access todavía no expirado no siga autorizando tras logout o desactivación. Roles y negocio proceden del servidor, no de claims sin comprobar ni de Zustand.
- Guard de autenticación global, rutas públicas declaradas explícitamente; refresh y CSRF tienen sus propias reglas, no aceptan access como sustituto del refresh. Los futuros recursos comerciales deben filtrar por `businessId` autorizado además de las FK compuestas.

## 5. Integración frontend

- Reutilizar formularios RHF/Zod y mensajes es/en. Sustituir el adaptador mock de login por Axios con `withCredentials`, bootstrap CSRF y manejo de errores sin enumeración. Mantener contraseñas solo en el formulario durante el envío.
- Recuperar perfil mediante `/auth/me` y React Query al recargar; sin copiar tokens al estado global. El registro mock no debe confundirse con registro real: ocultarlo o separarlo explícitamente hasta implementar su endpoint.
- Protección de páginas privadas en servidor bajo los límites dinámicos/Suspense que requieren Cache Components; consultas de sesión sin caché compartida y verificación autoritativa en Nest. El proxy de idioma/redirecciones no será el límite de seguridad.
- No guardar HTML/perfiles autenticados en caché pública. Una redirección de Next es UX, no sustituye los guards API. Redirecciones de retorno limitadas a rutas locales permitidas, sin open redirects.
- Un único refresh coordinado; una sola repetición para lecturas autorizadas tras renovarlo, sin bucles en login/refresh ni renovación por 403. No repetir mutaciones no idempotentes sin una política de idempotencia del servidor.
- Limpiar React Query, perfil, borradores y datos demo al cambiar identidad, salir o perder sesión. Diferenciar 401 de fallo de red; no dejar datos del usuario anterior. La demo comercial y el onboarding siguen sin persistir hasta sus etapas reales.

## 6. Verificación y entregas

1. Infraestructura y contratos: topología, configuración de secretos, diseño de sesión/CSRF, migración revisada y aprovisionamiento explícito. No conectar automáticamente una base.
2. Backend completo de sesión: login + me + refresh + logout + CSRF, guards y rate limits; no exponer un login provisional sin estas defensas.
3. Integración del formulario y navegación privada; separación del registro demo y limpieza de estado.
4. Documentación actualizada y `lint`, `format:check`, `typecheck`, `build`, validación/generación Prisma. Estos comandos no prueban la seguridad.
5. **Solo tras autorización para tests:** pruebas de credenciales inválidas, cuenta/membresía inactiva, negocio ajeno, atributos de cookie, CSRF, expiración, replay, refresh concurrente, logout, rate limiting y aislamiento. E2E de recarga/login/logout en es/en y topología real. Sin esta verificación no declarar la autenticación lista para producción.

## Referencias

- [NestJS: autenticación](https://docs.nestjs.com/security/authentication)
- [NestJS: autorización](https://docs.nestjs.com/security/authorization)
- [NestJS: rate limiting](https://docs.nestjs.com/security/rate-limiting)
- [Diseño de sesiones del proyecto](./authentication.md)
- [Modelo y migraciones pendientes](./database.md)

Se consultó la documentación actual de NestJS mediante Context7 para el patrón de guard global y rutas públicas explícitas. La elección de jose/argon2 y las medidas de sesión anteriores siguen las restricciones del proyecto; no se ha instalado ni implementado autenticación nueva al redactar este plan.
