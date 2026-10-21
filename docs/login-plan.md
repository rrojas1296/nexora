# Login real — estado y siguientes etapas

## Backend implementado

El plan inicial tras renombrar Tenant a Business ha sido sustituido por la autorización explícita para implementar autenticación y migrar la base configurada. Se usa **bcrypt**, por petición del usuario, en lugar del Argon2id originalmente propuesto.

Implementados en NestJS: registro transaccional de usuario/Business/Membership OWNER, login, perfil, refresh rotativo, logout, logout-all, bootstrap CSRF, cookies HttpOnly, guard global y rate limits. Sesiones y hashes persistidos mediante Prisma/PostgreSQL. Migración inicial versionada y aplicada; sin seeds, sin cuentas precreadas y sin migraciones automáticas en build/dev/start. Contratos y limitaciones exactos en [authentication.md](./authentication.md); operación de esquema en [database.md](./database.md).

Las capas application/domain no dependen de Nest ni Prisma. Los adaptadores bcrypt, jose, CSRF y Prisma viven en infraestructura y se componen mediante factories del módulo auth. Business incorpora PATCH del nombre del negocio activo con OWNER/ADMIN; productos incorpora CRUD persistente business-scoped, lecturas con membresía activa y escrituras OWNER/ADMIN; los demás módulos comerciales siguen sin endpoints. Ver [products.md](./products.md). La comprobación de sesión/pertenencia no equivale a RBAC comercial completo.

**Frontend integrado:** login/registro usan cuentas reales; workspace/onboarding comprueban sesión en servidor y cliente. El wizard reutiliza el Business registrado y guarda su nombre al finalizar; el resto del wizard y los datos comerciales excepto productos siguen siendo mocks independientes. No se ha verificado runtime por la restricción de tests.

## 1. Topología e integración frontend implementadas

- Mismo origen público mediante rewrite `/api/v1` a `API_INTERNAL_URL`; navegador usa ruta relativa y SSR URL privada. CORS admite el origen público exacto. HTTPS y API en producción son requisitos para cookies Secure/`__Host-`; hosts separados no están soportados por este flujo.
- Formularios RHF/Zod es/en integrados por Axios con cookies; registro pide `businessName`, contraseña de mínimo 8 caracteres con letras y números Unicode, máximo 72 bytes UTF-8. Registro y cambios de contraseña incluyen indicador local orientativo de fortaleza. Login va a dashboard y registro a onboarding; el wizard precarga ese Business y permite actualizar solo su nombre, sin crear otro.
- CSRF en memoria, bootstrap antes de cada mutación y tras autenticarse, header `X-CSRF-Token`; JWT solo en cookies HttpOnly. Perfil público React Query a partir de `/auth/me`, negocio decidido por servidor.
- Web Locks serializa operaciones auth entre pestañas; refresh revalida primero `/me`. Una marca booleana local, sin credenciales, bloquea repetir una renovación incierta incluso tras recarga. Sin Web Locks/almacenamiento se exige relogin al expirar access. No hay retries automáticos de mutaciones ni interceptor global de refresh.
- Server boundary bajo Suspense consulta `/me` sin caché con cookies access; no rota cookies en RSC. Recuperación cliente fuerza una nueva comprobación aunque haya perfil fresco en caché, renueva si procede y vuelve a pedir render servidor. Gates cliente sin shell mientras la identidad es desconocida; contenido remontado por usuario/negocio y oculto durante reconciliación al volver a la pestaña.
- Logout y logout-all, avisos BroadcastChannel, revalidación al recuperar conexión y polling 60 s con pestaña visible, sin revalidación forzada por foco/visibilidad; limpieza de cachés comerciales/repositorio/borradores al cambiar identidad o salir. Las notificaciones son auxiliares: API y revalidación siguen siendo la autoridad.

Los contratos, archivos y límites exactos están en [authentication.md](./authentication.md). Pendientes selección autorizada de negocio, API del resto del comercio y verificación de runtime; no reenviar futuras mutaciones no idempotentes sin contrato de idempotencia.

## 2. Operación y seguridad pendientes

- Elegir HTTPS/proxy, IP confiable, límites de borde y almacenamiento distribuido de rate limits. El limitador actual es por IP y proceso; no por cuenta ni entre réplicas.
- Medir coste bcrypt en el entorno objetivo; gestionar y rotar los tres secretos separados. Actualmente no hay keyring para rotación gradual de firma.
- Programar retención/limpieza sin destruir evidencia de refresh consumidos antes de que expire la familia; auditoría sin contraseñas/cookies/JWT; backups/restauración y roles PostgreSQL de mínimo privilegio.
- Diseñar recuperación y cambio de contraseña, verificación de email, MFA e invitaciones con proveedores/contratos reales. No exponer recuperaciones que devuelvan tokens por canales inseguros.
- Ampliar el RBAC y los repositorios business-scoped de productos al añadir los demás endpoints comerciales. Las FK compuestas garantizan integridad, no autorización de consultas.

## 3. Verificación

Habilitados: `lint`, `format:check`, `typecheck`, `build`, validación/generación Prisma y operación explícitamente autorizada de migraciones. La migración inicial se aplicó sin reset; `migrate status` y el diff contra el esquema confirmaron sincronización. No hubo seeds ni creación de cuentas.

**Sigue prohibido implementar o ejecutar tests**, incluidos unitarios, integración, e2e, smoke checks, peticiones HTTP y navegador. Cuando el usuario lo autorice, cubrir credenciales inválidas, membresía inactiva, negocio ajeno, cookies, CSRF, expiración, replay, concurrencia refresh/logout, rate limits y topología real. Sin esas verificaciones no declarar listo para producción.

## Referencias

- [Autenticación y contratos actuales](./authentication.md)
- [Backend](./backend.md)
- [Base de datos](./database.md)
- [jose](https://github.com/panva/jose)
- [bcrypt y límite de 72 bytes](https://github.com/kelektiv/node.bcrypt.js)
- [NestJS guards](https://docs.nestjs.com/guards)
- [NestJS rate limiting](https://docs.nestjs.com/security/rate-limiting)

Se consultó Context7 para jose (SignJWT/jwtVerify, claims/algoritmos), bcrypt (hash/compare asíncronos y límite UTF-8) y el patrón NestJS de guard global en la fase previa.
