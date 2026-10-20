# Acceso y sesiones

## Implementado: simulación frontend

`features/auth/services/mock-auth-service.ts` ofrece login y registro locales con latencia fija. React Hook Form y Zod validan los campos; las pantallas muestran errores, estados de espera y avisos para no usar credenciales reales. Las traducciones están en los catálogos es/en.

Cualquier email válido con una contraseña ficticia de 8–128 caracteres permite continuar. El registro requiere también nombre y confirmación. `error@example.com` activa un rechazo simulado o un email ocupado. No hay cuentas creadas, verificación de identidad, hash de contraseñas ni comprobación posterior de credenciales registradas.

El resultado es un perfil `{ id: "demo-user", name, email }` en Zustand, solo en memoria. No es una sesión autenticada. Las contraseñas no se copian a ese estado, a React Query ni a almacenamiento persistente. El servicio no hace solicitudes HTTP. Los formularios declaran `method="post"` para que el fallback HTML no incluya campos en la URL; no hay un endpoint de acceso y se requiere JavaScript para la demo.

Iniciar un perfil limpia el progreso anterior, la caché React Query, los datos comerciales y el escenario mock, y abre el onboarding. Salir de la demo borra perfil, progreso, caché y datos comerciales. Recargar también borra todos esos datos temporales. Un contador de generación impide que una mutación comercial pendiente escriba tras restablecer el perfil. Las operaciones mock usan AbortSignal para cancelar resultados si se abandona el formulario. Las preferencias visuales son independientes de este perfil.

Ninguna ruta está protegida: el dashboard y el onboarding pueden abrirse directamente. El perfil, los avisos y los controles visuales **no son un límite de seguridad**. La configuración del negocio no provisiona un tenant, no llega a un servidor y no conecta WhatsApp ni IA.

## Previsto: autenticación real (fuera de esta fase)

El tenant arquitectónico se representa ahora mediante `Business` y `businessId` en el backend. Ver [plan de implementación del login](./login-plan.md) para la siguiente etapa propuesta; este documento no implica que ya esté implementada.

La API solo configura CORS explícito con credenciales; no lee cookies ni comprueba CSRF. El esquema Prisma incluye User, Membership y RefreshSession, pero no crea cuentas ni realiza rotación. `jose` y `argon2` no están instalados: se incorporarán al implementar esta fase.

Estas medidas todavía no están implementadas:

- Contratos de login, register, refresh, logout y sesión actual en NestJS; validación autoritativa en el servidor y errores sin enumeración de cuentas.
- Hash de contraseñas con argon2; access/refresh tokens con jose.
- Cookies HttpOnly, Secure en producción y SameSite acorde con el despliegue. Nunca guardar JWT en localStorage.
- Access token de corta duración; refresh rotativo, con hash o identificador persistido, revocación y detección de reutilización. TTL y contratos exactos pendientes de diseño.
- CSRF para operaciones mutantes y refresh/logout, con estrategia elegida según topología, validación de Origin y token cuando corresponda. SameSite no será la única defensa.
- CORS con credenciales y lista explícita de orígenes; nunca wildcard con credenciales.
- RBAC y pertenencia a tenant comprobados en el servidor; el tenant enviado por el navegador no es autoridad. Aislamiento también en la capa de acceso a datos, no solo en la interfaz.
- Rate limiting, auditoría sin secretos, expiración de sesiones y limpieza de caché al cambiar identidad/tenant.

## Contrato de acceso propuesto — no expuesto

Base `/api/v1`; JSON, credenciales incluidas y respuestas de sesión con `Cache-Control: no-store`. Nunca devolver tokens en JSON ni logs. Errores uniformes según [backend.md](./backend.md).

| Método y ruta         | Entrada / resultado propuesto                                                                                                                                                                      |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /auth/csrf`      | Bootstrap de protección CSRF; devuelve un token ligado a contexto preautenticado o sesión, no un JWT.                                                                                              |
| `POST /auth/register` | `{ name, email, password, businessName }`; crea usuario, tenant, Membership OWNER y sesión de forma transaccional; 201 con perfil autorizado. No reutiliza automáticamente identidades existentes. |
| `POST /auth/login`    | `{ email, password }`; 200 con usuario y memberships autorizadas, cookies nuevas y errores genéricos. Elegir tenant por pertenencia comprobada.                                                    |
| `POST /auth/refresh`  | Sin JWT en body; usa cookie refresh y CSRF, rota ambos tokens; 204.                                                                                                                                |
| `POST /auth/logout`   | Revoca sesión/familia actual y borra cookies con los mismos atributos; 204 idempotente.                                                                                                            |
| `GET /auth/me`        | 200 con `{ data: { user: { id, name, email }, memberships: [{ businessId, role }] } }`; 401 sin sesión válida. No devuelve hashes ni datos de otros tenants.                                       |

Registro/login también son mutaciones que requieren defensa frente a login CSRF. Email normalizado y validación de contraseñas en servidor; errores sin enumeración, rate limits y hashing argon2id con parámetros medidos en el entorno real. Los TTL se acordarán antes de implementar (access corto, refresh con límite absoluto e inactividad), no se han configurado valores de seguridad por defecto.

## Cookies, JWT y rotación propuestos

- Preferir frontend/API bajo el mismo site. Cookies host-only sin `Domain`, `Path=/`, `HttpOnly`, `Secure` en producción y `SameSite=Lax` si la topología lo permite; prefijo `__Host-` solo con HTTPS y sus requisitos completos. En local HTTP usar nombres de desarrollo, no debilitar producción. Si son realmente cross-site: `SameSite=None; Secure` y CSRF reforzado; valorar bloqueo de cookies de terceros y proxy same-site antes de elegir esa topología.
- Firmar/verificar access y refresh mediante jose; fijar algoritmo permitido, issuer, audience, `exp`, `sub`, `jti` y propósito del token. No aceptar refresh en rutas de negocio ni access en refresh. Claves privadas fuera del repositorio, rotación y `kid` acotado a claves confiables. Nunca descargar claves desde URLs de un JWT no confiable.
- Persistir únicamente hash criptográfico del refresh aleatorio/firmado de alta entropía, `familyId`, usuario/tenant, expiración y revocación. `RefreshSession` prepara esos campos, no implementa sus garantías. No usar hash de contraseña como token ni almacenar refresh en claro.
- En refresh: verificar firma/claims, sesión no revocada/no vencida y Membership activa; bloquear/consumir el registro y crear sucesor en **una transacción**. Conservar el registro consumido revocado para reconocer reutilización y revocar la familia. Definir antes de conectar el cliente qué sucede con respuestas perdidas y refresh simultáneos; no añadir una ventana de gracia que reabra un token sin análisis.
- Logout, cambio de contraseña, baja de usuario o Membership deben revocar según política. Access corto no equivale a revocación inmediata: los endpoints sensibles deben consultar estado vigente o una estrategia de invalidación definida.

## CSRF y autorización propuestos

Para solicitudes mutantes, validar Origin exacto contra configuración (y Referer como fallback controlado; ausencia no se acepta sin una política explícita para clientes no navegador). Añadir token sincronizado ligado a sesión/pre-sesión y comprobado en `X-CSRF-Token`. Su almacenamiento servidor requerirá un puerto/almacén adicional; aún no forma parte del esquema. Un double-submit firmado y ligado a sesión sería una alternativa a evaluar, no se combinará arbitrariamente. La cookie HttpOnly de autenticación nunca es el token CSRF legible. SameSite y CORS son capas complementarias, no sustitutos. GET no cambia estado comercial.

Cada petición verifica sesión y Membership activa para el tenant elegido, después permisos y filtros de acceso. Roles propuestos:

| Rol    | Alcance inicial por diseñar/implementar                                                            |
| ------ | -------------------------------------------------------------------------------------------------- |
| OWNER  | Administración del tenant, propietarios y membresías; proteger al último owner.                    |
| ADMIN  | Configuración comercial y recursos; no transferir propiedad ni elevarse a OWNER.                   |
| AGENT  | Conversaciones y operaciones comerciales expresamente permitidas; no roles, membresías o secretos. |
| VIEWER | Lecturas permitidas; sin mutaciones y sin acceso automático a todos los datos personales.          |

Aplicar permisos en casos de uso y repositorios tenant-scoped, no solo guards HTTP o componentes ocultos. Consultas y relaciones con tenant autorizado; IDs ajenos no deben revelar existencia. Las FK tenant del esquema son defensa de integridad, no autorización. El frontend debe descartar caché, drafts y selección tenant cuando cambia la identidad o pertenencia.

## Sustitución futura de mocks

Axios ya tiene `withCredentials: true`; falta integrar contratos. El adaptador real deberá pedir CSRF, comprobar `/auth/me` y usar React Query sin copiar JWT a Zustand/localStorage. Coordinar un único refresh en vuelo y reintentar cada solicitud una sola vez; excluir login/register/refresh del bucle. Un 403 no se arregla refrescando. No reenviar automáticamente operaciones comerciales no idempotentes sin una política de idempotencia del servidor. Al fallar refresh, limpiar estado/caché y solicitar acceso, sin suponer que el logout remoto pudo ejecutarse.

No conectar estos formularios a datos privados hasta implementar y verificar esas garantías. La implementación y ejecución de tests siguen aplazadas por instrucción del usuario; lint, formato, tipos y build no validan seguridad ni comportamiento en navegador.
