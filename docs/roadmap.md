# Roadmap de implementación

## Restricción temporal

Por instrucción del usuario, no implementar ni ejecutar tests por ahora, incluidos unitarios, integración, e2e y smoke tests. Conservar los tests existentes. La verificación de esta fase se limita a lint, formato, TypeScript y build hasta nueva autorización.

## Paso 1 — Base del monorepo

- Aplicaciones existentes trasladadas de `apps/client` a `apps/web` y de `apps/backend` a `apps/api`, sin reemplazar sus fuentes.
- Workspaces `@whatsapp/web`, `@whatsapp/api` y `@whatsapp/typescript-config`.
- Un único lockfile y repositorio Git raíz.
- TypeScript strict compartido; Turborepo para dev, build, typecheck y tests.
- Oxlint y Oxfmt raíz; eliminados Prettier y configuraciones anidadas redundantes.
- Dependencias existentes actualizadas a las últimas versiones estables del registro al realizar esta etapa.
- TypeScript 7.0.2 no proporciona la API programática requerida por Nest CLI. Se conserva la última versión usando el CLI oficial `tsc` para compilar y un supervisor Node para desarrollo.
- Se conservó inicialmente el frontend del starter; el paso 2 lo reemplaza por el shell. El endpoint de ejemplo del backend sigue sin ser una funcionalidad del SaaS.

## Paso 2 — Base frontend (implementado)

- Dependencias estables consultadas contra el registro: next-intl, Zustand, React Query, Axios, Zod, Radix, Lucide y utilidades shadcn.
- Rutas prefijadas es/en, catálogos tipados y estructura inicial por features.
- ThemeProvider propio con Zustand, persistencia versionada, script previo al pintado, tokens light/dark y seguimiento del sistema.
- Sidebar oscuro colapsable, header, navegación móvil con Dialog de Radix y selectores de idioma/tema.
- Configuración shadcn y botón base adaptado con Slot/CVA. No se ha generado un catálogo completo de componentes.
- Rediseño solicitado antes del paso 3 con segunda captura: marco redondeado, superficies grafito, acentos lima/lavanda, controles pill y módulos en filas. Se mantienen tema claro equivalente y sidebar oscuro. La segunda referencia sustituye la dirección visual inicial.
- Dashboard temporal de bienvenida y rutas placeholder para los módulos. No son aún módulos comerciales.
- Axios preparado, sin llamadas ni autenticación; React Query montado, sin servicios de negocio.
- Verificación estática y build; sin tests ni verificación de navegador por la restricción vigente.

## Paso 3 — Acceso y onboarding mock (implementado)

- React Hook Form 7.90.0 + resolvers 6.0.0 (últimas versiones estables consultadas), Zod y mensajes es/en.
- Rutas login y registro fuera del shell, con validación de campos, confirmación de contraseña, loading y errores simulados reproducibles con `error@example.com`.
- Perfil demo solo en memoria; limpieza de progreso y caché al iniciar otro perfil o salir. Servicios locales cancelables al abandonar el formulario, sin solicitudes de autenticación ni contraseñas en Zustand o React Query.
- Wizard de cinco pasos: negocio; tienda/moneda/zona horaria/horario; agente; vista previa WhatsApp opcional; resumen editable y finalización. Validación por paso y completa al finalizar.
- Progreso temporal en Zustand durante navegación y cambios de idioma; se pierde al recargar o salir. Finalización mock con fallo opcional para reintentar, retorno al dashboard y tarjeta de confirmación.
- Sin credenciales reales, JWT, cookies de sesión, protección de rutas, persistencia de cuentas, conexión WhatsApp o IA. Documentado en `frontend.md` y `authentication.md`.
- Lint, formato, TypeScript y build correctos. Sin implementación o ejecución de tests ni verificación de navegador.

## Paso 4 — Módulos frontend (implementado)

- Dashboard con KPIs calculados, gráfica Recharts 3.10.1 cargada por separado y tabla accesible alternativa; periodos demo de 7/30 días hasta el 14 de junio de 2026, en UTC y USD.
- Conversaciones con búsqueda, filtro, historial, contexto del cliente, cambio de estado/responsable y mensajes locales; sin envío externo ni respuestas AI.
- Agente con formulario validado y vista previa del saludo/borrador. Activación únicamente simulada.
- Productos: búsqueda, filtro activo/inactivo, paginación, alta, edición y eliminación confirmada. SKU único; los vinculados a pedidos solo se pueden desactivar.
- Órdenes: búsqueda, filtros por estado/tienda, paginación, detalle de líneas y cambio libre de estado; las métricas se recalculan. Sin cobros, envíos ni ajustes de stock.
- Clientes: búsqueda, paginación, alta/edición y detalle con historial vinculado; email único.
- Reportes: series de ingresos, productos/clientes por ingresos y distribución de estados.
- Tiendas: búsqueda, alta/edición, moneda y zona horaria como preferencias, sin conversión ni tenants reales.
- Configuración: preferencias mock y controles de tema/idioma existentes. Ayuda con búsqueda y FAQs desplegables.
- Servicio mock independiente de React/React Query, contratos Zod, latencia y snapshot compartido en memoria del navegador; datos enlazados, transacciones locales y invalidación compartida tras guardar. Perfil nuevo, salida, recarga o restablecimiento eliminan los cambios comerciales.
- Controles reproducibles de colecciones vacías y error de lectura; estados de carga/error/vacío, avisos de guardado y reintento. Cambiar escenario descarta borradores abiertos; el modo vacío es de solo lectura.
- Las rutas ahora componen módulos reales en lugar de placeholders. Se conserva la tarjeta de resumen de onboarding en dashboard; el onboarding no modifica las colecciones comerciales.
- Ajuste visual posterior al paso 4: paleta pizarra/verde WhatsApp/petróleo, ancho máximo centrado `max-w-357` en todas las pantallas (incluido acceso/onboarding) y eliminación de longitudes arbitrarias en px de los componentes en favor de la escala Tailwind. Sustituye la decisión previa de ancho ilimitado.
- Lint, formato, tipos y build correctos; sin tests ni comprobaciones de navegador. Ver `features.md` y `frontend.md`.

## Revisión de interfaz posterior al paso 4

- Fondos negros/grises neutros y verde WhatsApp; se preservan light/dark/system.
- Corregido `max-w-357`: solo contenido de páginas; sidebar siempre al borde izquierdo, no centrado dentro del límite.
- Dashboard (rediseño posterior): encabezado uniforme con los demás módulos, cuatro KPIs, barras mensuales enero–diciembre con selector de año y comparación contra el año anterior, pedidos recientes en tabla, agente, productos más vendidos y mensajes. Sin gráfica diaria ni selector 7/30/90 días; escenarios demo plegados. USD/UTC, datos calculados y alternativa tabular accesible.
- KPIs globales en productos, pedidos y clientes. Crear/editar productos, clientes, pedidos y tiendas en páginas dedicadas, sin modales de formulario.
- Campos ampliados de producto y cliente; creación/edición de pedidos mock con líneas y precios históricos, sin pagos ni ajustes de inventario.
- Reportes separados del dashboard: filtros periodo/tienda, resumen lateral, barras por tienda, anillo por estado, tabla por producto/cliente y CSV local.
- Verificación limitada a formato, lint, tipos y build; no pruebas ni navegador.

## Paso 5 — Base backend (implementado)

- Nueve módulos NestJS registrados: auth, users, tenants, stores, products, orders, clients, conversations y agents; capas hexagonales reservadas, sin comportamiento de negocio.
- ConfigModule + Zod: variables privadas propias de API, puerto/host configurables, DATABASE_URL obligatoria al arrancar y orígenes exactos CORS con credenciales, solo HTTPS en producción. Prefijo `/api/v1` para rutas futuras y shutdown hooks.
- Prisma 7.10.1 estable con adapter PostgreSQL, modelo inicial de 12 entidades y relaciones comerciales con tenant compuesto. La versión latest publicada de CLI era prerelease 8; se conservó la última estable.
- Cliente generado antes de build/typecheck/dev, pool acotado y desconexión en shutdown. Sin consultas ni conexión inicial, sin migraciones/seed aplicados y sin repositorios tenant-scoped. Las FK no sustituyen aislamiento ni autorización.
- Contratos REST, seguridad y migraciones futuras documentados en `backend.md`, `authentication.md` y `database.md`.
- Sin autenticación real ni endpoints de negocio nuevos; se conserva `GET /` original, excluido del prefijo y sin garantía de salud.
- Prisma validate/generate, lint, formato, tipos y build correctos; no se levantó el servidor, conectó PostgreSQL ni ejecutaron tests.

## Paso 6 — Documentación final y verificación (implementado)

- Documentación técnica completa: `architecture.md`, `frontend.md`, `backend.md`, `authentication.md`, `database.md`, `design-system.md`, `features.md` y este roadmap; README raíz como índice y guía local, AGENTS actualizado.
- Contratos REST futuros de autenticación y recursos, paginación/errores propuestos, DTOs, separación de mocks/API, CSRF, cookies, RBAC, aislamiento tenant y rotación transaccional. Todo identificado como diseño pendiente, no endpoints implementados.
- Esquema de datos, integridad tenant, restricciones no garantizadas, generación y flujo futuro de migraciones documentados. Sin prometer seguridad, persistencia ni comportamiento comprobado.
- Cierre verificado: `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm --filter @whatsapp/api db:validate` y `pnpm build` correctos. Prisma generado y compilación de ambas apps completada; Next genera 53 páginas. El typecheck frontend reutilizó caché válida de Turbo; ambos builds se ejecutaron sin caché.
- No se implementaron ni ejecutaron tests, smoke checks o verificaciones de navegador; no se inició API ni se conectó/migró PostgreSQL. La implementación y ejecución de pruebas queda aplazada hasta autorización.

## Resultado del alcance inicial

Los seis pasos están completados: frontend funcional con mocks y revisiones visuales solicitadas, backend exclusivamente estructural, configuración independiente y documentación técnica. No equivale a un producto listo para producción ni a seguridad/persistencia verificadas.

## Corrección posterior — Prerenderizado e idioma

- Inicialmente restaurada la inicialización del locale con `setRequestLocale` para evitar lecturas de headers; esta solución transitoria queda sustituida por la migración a root params descrita a continuación.
- Retirados el `console.log` de depuración y el límite `Suspense` con fallback nulo de la página de módulos; no cubría el `await params` de la propia página ni accesos del layout padre. Se conservan los límites de streaming de las rutas de edición.
- Añadido `[module]/loading.tsx` con skeleton sin lecturas de petición: envuelve la página y sus rutas hijas para resolver los parámetros de URL bajo `Suspense` con Partial Prefetching, conservando el shell exterior. `generateStaticParams` no elimina ese requisito del shell compartido.
- `pnpm lint`, `pnpm format:check`, `pnpm typecheck` y `pnpm build` correctos tras la corrección; Next.js genera 53 páginas. Sin ejecución de tests ni navegador; no se verificó el overlay de desarrollo.

## Refactor posterior — next-intl con root params

- Consultada la documentación actual de next-intl mediante Context7 y la API instalada de Next.js 16.4.2. Configuración de idioma migrada a `next/root-params`; eliminadas todas las llamadas a `setRequestLocale` y las lecturas de `params` usadas solo para inicializarlo.
- Validación centralizada antes de cargar catálogos y overrides explícitos preservados sin invocar el getter raíz. Los valores de locale inválidos ahora producen `notFound()` en la configuración en lugar de un fallback silencioso a español; el proxy conserva su idioma por defecto.
- Conservados catálogos tipados y comerciales, proxy, navegación, selector es/en, provider cliente, `generateStaticParams`, Cache Components, Partial Prefetching y los límites de carga/edición. Zona horaria por defecto fijada a UTC para los datos demo.
- Sin dependencias nuevas ni cambios de versiones. `pnpm lint`, `pnpm format:check`, `pnpm typecheck` y `pnpm build` correctos: frontend compilado sin caché y 53 páginas generadas; tareas de API reutilizadas desde caché válida de Turbo. Sin implementar ni ejecutar tests ni navegador; overlay de desarrollo no verificado.

## Ajuste posterior — Select compartido

- Adaptado Select de shadcn sobre `radix-ui` a los tokens actuales light/dark, con opciones seleccionadas en verde, menú en portal, foco visible, tamaños estándar/compacto y truncado de valores largos. Primitivas separadas para conservar un componente por archivo.
- Sustituidos todos los `<select>` escritos en la aplicación por `SelectField`: tema/idioma, filtros de módulos, escenarios demo, dashboard, reportes, conversaciones y formularios. Conservadas etiquetas es/en, conversiones numéricas, cambios de precio de líneas de pedido y bloqueos durante guardado.
- `FormSelectField` usa Controller de React Hook Form para valor, blur, referencia de foco y errores, compatible con los valores iniciales y reset del formulario sin doble registro nativo.
- `pnpm lint`, `pnpm format:check`, `pnpm typecheck` y `pnpm build` correctos; Next.js genera 53 páginas. Revisión estática adicional sin otros hallazgos pendientes. Sin implementar ni ejecutar tests ni comprobaciones de navegador; apariencia e interacción no verificadas visualmente.

## Rediseño posterior — Dashboard comercial y operativo

- Conservadas las cuatro KPIs y sus cálculos: ventas totales, conversaciones, proporción de pedidos cobrados y ticket promedio, con comparativas anuales existentes.
- Reorganizado el dashboard con barra global de año/alcance y acceso a reportes; gráfica mensual con total destacado y botones de métrica; seguimiento operativo y agente; tabla de pedidos de ancho completo con fecha UTC; productos y mensajes en dos paneles amplios. Se conserva el encabezado compartido y los tokens/controles light/dark del resto de módulos.
- Seguimiento calculado sobre toda la demo: pedidos pendientes, conversaciones abiertas asignadas al equipo y productos activos sin stock. Alcance sin filtro anual explícito; los enlaces llevan a sus módulos completos, no aplican filtros automáticos. Ventas, pedidos recientes y ranking siguen el año seleccionado.
- Traducciones es/en y alternativa tabular de la gráfica conservadas; sin dependencias ni APIs nuevas. Revisión estática realizada y corregida la navegación ambigua de filas de mensajes: solo el acceso general al módulo permite navegar.
- `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm build` y `git diff --check` correctos; Next.js genera 53 páginas. No se implementaron ni ejecutaron tests ni verificaciones de navegador; diseño responsive revisado en código, no visualmente.

## Ajuste posterior — PEN como moneda predeterminada

- Añadido PEN (sol peruano) a las opciones de onboarding y tiendas, conservando USD/EUR/MXN/COP. Configuración frontend compartida en `src/lib/config/currency.ts`; PEN es el valor inicial de onboarding, tiendas, fixtures y pedidos nuevos.
- Catálogo, KPIs, dashboard, gráficas, tooltips, reportes y exportación CSV usan PEN; etiquetas y mensajes actualizados en es/en. Se conservan valores numéricos, sin conversión de divisas; las preferencias de tienda no cambian el historial ni los importes de la demo.
- Defaults del esquema Prisma de `Store`, `Product` y `Order` alineados a PEN. Sin migraciones, seeds, conexión a PostgreSQL ni modificación de datos persistidos.
- Las menciones de USD en las etapas anteriores registran el estado histórico, sustituido por este ajuste. `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm build`, `pnpm --filter @whatsapp/api db:validate` y `git diff --check` correctos; 53 páginas generadas. Sin tests ni verificaciones de navegador por la restricción vigente.

## Refactor posterior — Business y plan de login

- Renombrado el módulo backend `tenants` a `business`, con `BusinessModule`; modelo Prisma `Business`, relación `business` y claves `businessId` en recursos, membresías y sesiones. Se conservan las relaciones, PK/FK e índices compuestos y las capas hexagonales vacías.
- Actualizados los contratos documentados a `/businesses/:businessId` y el perfil propuesto a memberships con `businessId`. «Multi-tenant» se conserva como término arquitectónico; las menciones de los módulos anteriores describen el estado histórico.
- Sin migraciones ni cambios sobre una base; una base externa con los nombres anteriores requeriría una migración de renombrado revisada. Los defaults PEN existentes se mantienen.
- Añadido [plan de login real](./login-plan.md): contratos/topología, persistencia, Argon2id/jose, cookies, CSRF, sesiones revocables y rotación, guards/rate limits, integración frontend y verificación. Solo planificado: no se han instalado dependencias ni implementado endpoints/auth real.
- `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm build`, `pnpm --filter @whatsapp/api db:validate` y `git diff --check` correctos. API regenerada y compilada; frontend reutiliza caché válida de Turbo. Sin tests, navegador ni conexión a PostgreSQL.

## Etapa posterior — Autenticación backend real y migración inicial

- Por autorización explícita del usuario se implementó auth real en NestJS con **jose 6.2.13 y bcrypt 6.0.0** (sustituye Argon2id del plan anterior). Passwords como hashes con salt, no cifrado reversible; máximo 72 bytes UTF-8 para evitar truncamiento bcrypt.
- Endpoints `/api/v1/auth/csrf`, `register`, `login`, `me`, `refresh`, `logout` y `logout-all`. Registro crea User + Business + Membership OWNER + sesión transaccionalmente. DTOs Zod, perfiles filtrados y errores genéricos; no devuelve JWT en JSON.
- Cookies host-only HttpOnly, SameSite=Lax y Secure/__Host- en producción. Access 15 min; refresh con 7 días de inactividad, límite absoluto de sesión 30 días; valores configurables. Secretos independientes access/refresh/CSRF, generados en el .env local sin imprimirlos ni sobrescribir valores; configuración validada y sin secretos en web.
- Nuevos AuthSession y consumedAt/familia en RefreshSession: hash SHA-256 del refresh, bloqueo de familia FOR UPDATE, consumo/rotación atómica y revocación por replay. Política estricta de doble consumo, incluso concurrente. Guard global default-deny comprueba usuario, sesión y Membership activa; la raíz starter también queda protegida.
- CSRF double-submit firmado y ligado a pre-sesión/sesión, Origin/Referer exacto, límite de cuerpo de 16 KiB, throttler global y límites específicos. Registro/login invalidan CSRF anterior; pedir bootstrap nuevamente. Rate limits en memoria por IP/proceso: proxy confiable, protección por cuenta y almacenamiento compartido siguen pendientes. Los errores inesperados solo registran un ID de incidente; tamaños excesivos responden 413.
- Migración versionada `20261020160000_initial_business_auth`, aplicada explícitamente a la base PostgreSQL configurada tras confirmar que estaba vacía: 13 tablas comerciales/auth con enums, índices y FK, dentro de transacción. Sin reset, seeds ni cuentas precreadas. `migrate status`: actualizado; diff de base/esquema: sin diferencias. No hay migraciones/conexiones automáticas en install/build/start.
- Actualizadas guías de backend, sesiones, base de datos y plan de integración. **Frontend sin integrar:** continúa usando login/registro demo y páginas sin protección; no hay API comercial, RBAC comercial ni repositorios de recursos business-scoped. Las etapas anteriores describen estados históricos, no límites vigentes del backend auth.
- Revisión estática independiente sin bypass concreto identificado; corregida normalización de payload 413 y documentados límites operativos. `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm build`, `pnpm --filter @whatsapp/api db:validate` y `git diff --check` correctos. API regenerada y compilada; frontend reutiliza caché válida. Sin tests, HTTP, navegador ni arranque de servidor por restricción vigente. Compilar/migrar no valida comportamiento auth ni seguridad de producción.

## Etapa posterior — Integración frontend con autenticación real

- Sustituidos servicios/perfil demo de auth por Axios, DTOs Zod, perfil público React Query y formularios RHF traducidos es/en. Registro pide negocio y contraseña compatible con bcrypt (12 caracteres mínimo/72 bytes UTF-8 máximo), crea cuenta real y abre onboarding; login abre dashboard. No hay emails mágicos ni credenciales precreadas.
- Mismo origen público: navegador llama `/api/v1`; rewrite Next y SSR usan `API_INTERNAL_URL` privada. Ejemplo web versionado y configuración Turbo actualizada; CORS admite el origen público exacto. Producción requiere HTTPS y API en modo producción; proxy/IP/rate limits siguen siendo prerrequisito operativo documentado.
- CSRF solo en memoria, bootstrap antes de mutaciones y tras autenticar. Web Locks serializa operaciones auth entre pestañas; refresh comprueba de nuevo `/me`, no repite mutaciones y deja una marca booleana sin tokens para no reintentar resultados inciertos tras recarga. Sin coordinación/almacenamiento se exige relogin al expirar access.
- Workspace/onboarding bajo Suspense con comprobación servidor de `/me` sin caché y cookies access; no se mutan cookies en Server Components. Recuperación cliente fuerza revalidación aunque haya caché fresca, renueva si procede y vuelve a renderizar el servidor. Error de API muestra reintento, no el shell.
- Gates cliente remontan contenido por usuario/negocio y lo ocultan durante reconciliación al recuperar foco/visibilidad/conexión. Perfil revalidado cada 60 s y avisos BroadcastChannel; logout actual/global en header. Limpieza de borradores, escenarios, repositorio mock y cachés comerciales al cambiar identidad/salir/perder sesión.
- Onboarding y recursos comerciales siguen ficticios y temporales: completar wizard no modifica el negocio creado al registrar. No se agregaron endpoints comerciales, RBAC, selección de negocio, WhatsApp o IA.
- Revisión estática independiente: corregidos retención de estado local entre identidades y recuperación basada en una caché contradicha por el servidor. Verificación permitida: lint, formato, tipos, build y diff; sin tests, HTTP, navegador ni arranque de servidores. La integración aún requiere comprobación de runtime y seguridad autorizada.

## Corrección posterior — Segmentos descartados en validación instant

- Diagnosticado el aviso `Could not validate that a segment in your UI has instant navigation`: el layout auth puede omitir los segmentos hijos mientras recupera/verifica sesión. Es distinto del acceso a `params` fuera de Suspense; otro límite en la página no obliga al padre a renderizar sus hijos.
- Las cuatro páginas del workspace (dashboard, módulos, alta y edición) declaran `instant = false`, mecanismo documentado por Next.js 16.4.2 y Context7 para excluir esos segmentos de validación. No se modifica la configuración global, los guards, las consultas `no-store`, Suspense/loading ni Cache Components/Partial Prefetching. Onboarding conserva su límite interno y las páginas públicas siguen validadas.
- Es una exclusión deliberada de validación, no una garantía u optimización de navegación instantánea. Verificación limitada a lint, formato, tipos, build y diff; sin tests, peticiones HTTP ni navegador. El overlay de desarrollo no se comprueba durante la restricción vigente.

## Ajuste posterior — Sesión sin reconsulta al recuperar foco

- Eliminados los listeners de `focus` y `visibilitychange` de `AuthProvider` que invalidaban manualmente la sesión, al margen de `refetchOnWindowFocus: false`. Recuperar foco/visibilidad ya no dispara esa invalidación ni oculta el contenido por reconciliación de esos eventos.
- Conservados polling de 60 s en pestaña visible, revalidación al recuperar conexión, sincronización BroadcastChannel y comprobaciones de sesión al montar/recargar. La detección de revocaciones sin aviso depende de la siguiente revalidación; no hay push entre dispositivos.
- `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm build` y `git diff --check` correctos; builds sin caché y 53 páginas generadas. Sin tests ni comprobaciones de navegador/runtime por la restricción vigente.

## Ampliación — Registro conectado con onboarding

- Implementado `PATCH /api/v1/businesses/:businessId` para `{ name }` (trim, 1–120 caracteres), sin modificar slug ni crear otro negocio. UUID/body estricto, sesión global, CSRF/Origin y respuesta sin caché.
- Autorización acotada al negocio activo verificado y membresía OWNER/ADMIN activa de usuario activo; el adaptador Prisma incluye membresía y rol en la misma sentencia de actualización. Capas domain/application libres de Nest/Prisma.
- Wizard precarga el nombre real de `/me`; al finalizar lo guarda bajo el lock auth con verificación de identidad y CSRF, actualiza React Query y revalida el perfil. No hay reenvío automático de mutaciones; ante pérdida de respuesta se comunica resultado incierto.
- Nombre del negocio alineado con registro (1–120); textos es/en distinguen persistencia real de demo. Descripción, tienda, agente, WhatsApp, progreso y marca de completado permanecen solo en memoria; sin migraciones, seeds ni conexiones adicionales a la base.
- Verificación: `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm build` y `git diff --check` correctos. Build de ambas apps, 53 páginas generadas; sin migraciones ni acceso adicional a la base. No se implementaron ni ejecutaron tests ni comprobaciones HTTP/navegador por la restricción vigente.

## Ajuste — Onboarding orientado a Latinoamérica

- Teléfono WhatsApp separado en selector de país/código (26 países) y número nacional opcional, con Perú (+51) como valor inicial. Conserva los dígitos al cambiar de país, admite separadores habituales y pegar un número internacional con el mismo prefijo seleccionado. El borrador/resumen mantienen el número combinado y el país para distinguir códigos compartidos (+1).
- Validación estructural del teléfono: mínimo 6 dígitos nacionales y 8–15 dígitos totales. Sin verificación por país, envío de mensajes ni conexión real con WhatsApp; los datos siguen solo en memoria.
- Ampliadas de 4 a 38 las zonas IANA del onboarding, con etiquetas traducidas de país/ciudad: Sudamérica, Centroamérica y Caribe, variantes regionales de México, Brasil y Chile; conservadas Nueva York y Madrid. Lima como valor inicial, sin offsets fijos ni cambios en el editor de tiendas o backend.
- Campos accesibles, controles bloqueados al guardar y traducciones es/en. `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm build` y `git diff --check` correctos (53 páginas). Sin tests, peticiones HTTP ni navegador por la restricción vigente.

## Ampliación — Tablas plurales y borrado lógico

- Los 13 modelos Prisma mantienen nombres singulares y delegates existentes; `@@map` define tablas plurales (`Users`, `Businesses`, `Memberships`, `AuthSessions`, `RefreshSessions`, `Stores`, `Products`, `Clients`, `Orders`, `OrderItems`, `Conversations`, `Messages`, `Agents`). Todos incorporan `isDeleted Boolean @default(false)`.
- Migración `20261020170000_plural_tables_soft_delete` no destructiva: renombra tablas, PK, FK e índices y añade el flag; conserva filas y claves únicas. Migración inicial intacta. Aplicada explícitamente al destino configurado tras autorización del usuario; no fue necesario usar su permiso excepcional de borrar datos. Sin reset ni seeds: `migrate status` al día y diff de base a esquema sin diferencias.
- Credenciales, inicio/validación de sesión, refresh y perfil excluyen registros y relaciones eliminados; actualización del negocio exige negocio/membresía/usuario no eliminados. SQL de bloqueo actualizado a `AuthSessions`. Revocaciones incluyen filas eliminadas deliberadamente.
- Sin endpoints de borrado/restauración, cascadas lógicas, liberación de claves únicas ni filtro Prisma global. Documentados los límites y el despliegue coordinado; futuros repositorios deberán filtrar tenant y borrado explícitamente.
- Verificación: Prisma format/validate/generate, lint, formato, tipos, build y `git diff --check` correctos. No se implementaron ni ejecutaron tests, peticiones HTTP ni navegador. La verificación de migración confirma sincronización del esquema, no comportamiento runtime de auth o aislamiento.

## Ampliación — Cambio de contraseña autenticado

- Pantalla dedicada `/{locale}/settings/password`, acceso desde header y Seguridad de Configuración. Formularios RHF/Zod es/en con contraseña actual, nueva y confirmación local, autocomplete, mostrar/ocultar y bloqueo al enviar. Separada de preferencias mock; recuperaciones por email siguen fuera de alcance.
- `POST /api/v1/auth/change-password` con body estricto, guard de sesión, CSRF/Origin, límite de 5 intentos por minuto/IP/proceso y respuesta 204 sin cookies de sesión vigentes. Comprueba la contraseña actual con bcrypt; nueva distinta, mínimo 12 caracteres y máximo 72 bytes UTF-8. Identidad solo desde claims, sin edición de otras cuentas.
- Transacción con bloqueo `Users FOR NO KEY UPDATE`, revalidación de sesión/relaciones y comparación de hash anterior: hash nuevo y revocación de todas las sesiones/refresh del usuario se confirman juntos. Login toma el mismo bloqueo y revalida el hash para evitar crear sesiones con una contraseña anterior durante la rotación. Sin migraciones, seeds, dependencias nuevas ni acceso a la base durante esta etapa.
- Cliente serializa el POST bajo lock auth y verifica identidad; no almacena contraseñas en QueryClient/Zustand ni reenvía mutaciones inciertas. Éxito limpia caché/perfil/borradores, notifica pestañas y navega a un documento nuevo de login con aviso. Errores de red/5xx indican que el cambio puede haberse guardado y recomiendan probar la nueva contraseña antes de repetirlo.
- Verificación: lint, formato, tipos, build y diff. No se implementaron ni ejecutaron tests, peticiones HTTP ni comprobaciones de navegador; la concurrencia y el comportamiento de sesiones requieren verificaciones runtime autorizadas antes de declarar el flujo listo para producción.

## Ampliación — Cambio de contraseña desde el login

- Enlace visible en login hacia `/{locale}/change-password`, fuera del shell del workspace. Reutiliza formulario RHF/Zod es/en con email, contraseña actual, nueva y confirmación; no exige iniciar sesión ni crea sesión intermedia. Cambio desde Configuración conservado.
- `POST /api/v1/auth/change-password-with-credentials`: público con CSRF/Origin y throttling de 5 intentos/minuto/IP/proceso, DTO estricto y respuesta 204. Bcrypt compara también contra hash ficticio para emails inexistentes; credenciales incorrectas/cuenta inactiva o eliminada reciben el mismo 401 genérico. Sin IDs arbitrarios ni requisito de membresía para cambiar las credenciales de la propia cuenta.
- Comparte bloqueo de usuario, comparación del hash y transacción de actualización/revocación con el cambio autenticado. Revoca las sesiones de la cuenta verificada, borra cookies locales, limpia estado/notifica pestañas y abre documento nuevo de login con aviso. Contraseñas transitorias, sin caché/persistencia ni replay; conserva solo el email al fallar. Sin dependencias, migraciones, acceso a DB ni proveedores nuevos.
- Los códigos de recuperación por email siguen pendientes por decisión del usuario; conocer la contraseña actual es obligatorio. La verificación de esta etapa se limita a lint, formato, tipos, build y diff; sin tests, peticiones HTTP ni navegador. Concurrencia/comportamiento runtime pendientes de autorización antes de declarar producción.

## Ajuste — Animación de entrada de pantallas

- Entrada compartida de 320 ms con desvanecimiento y desplazamiento vertical corto, definida como token Tailwind v4 en `styles/motion.css`. Aplicada a dashboard/módulos, formularios de alta/edición, login/registro, cambio de contraseña público/autenticado y onboarding; sidebar/header permanecen estables.
- Solo se animan opacidad y transform, sin librerías, timers, listeners de navegación ni templates que remonten layouts. Claves de pantalla en las composiciones compartidas renuevan la entrada por módulo/recurso/ID/modo, no por escribir, filtrar, revalidar datos o cambiar tema. Sin cascadas por tarjeta ni transformaciones persistentes.
- Variante `motion-safe` para respetar movimiento reducido del sistema. Sin cambios de datos, auth, APIs ni dependencias. Verificación limitada a lint, formato, tipos, build y diff; sin tests ni comprobación visual/HTTP/navegador por la restricción vigente.

## Corrección — Entrada visible de los bloques al navegar

- Tras el aviso del usuario de que el contenido aparecía de golpe, sustituida la entrada única del contenedor por `PageEntrance`, límite cliente pequeño con bloques escalonados: 560 ms y retrasos acotados de 0/80/160/240 ms. Sustituye los tiempos y la ausencia de cascada descritos en el ajuste anterior.
- Reinicia solo CSS animations `page-enter` al montar/reactivar usando la API nativa de animaciones; permite reproducir la entrada después de hidratación y en rutas reactivadas, sin medir layout ni reiniciar indicadores de espera/gráficas. Sin listeners, timers, librerías ni cambios a providers/guards.
- `QueryState` incorpora la entrada cuando el contenido de datos está listo, para no depender de una animación exterior que puede terminar durante la carga. Movimiento reducido conservado mediante `motion-safe`; sin disparadores por escritura/filtros/tema ni replay de consultas/mutaciones. El contenido desmontado que vuelve a montarse sí anima de nuevo.
- Verificación limitada a lint, formato, tipos, build y diff. No se ejecutaron tests, HTTP ni navegador por la restricción vigente; el resultado visual y las navegaciones reales siguen sin comprobación runtime autorizada.

## Ampliación — Productos con API y persistencia real

- Primer módulo comercial conectado a PostgreSQL: `GET/POST /api/v1/businesses/:businessId/products` y `GET/PATCH/DELETE /:id`. DTOs estrictos, UUIDs, filtros/búsqueda, paginación remota estable y detalle; respuesta con importes decimales string y timestamps. Reutiliza el esquema/índices existentes, sin nueva migración, seed ni acceso operativo a la base.
- Capas domain/application sin Nest/Prisma; repositorio por negocio activo verificado. Revalida sesión, usuario, negocio y membresía no eliminados dentro de la transacción, con bloqueo compartido de membresía/negocio. Lecturas para membresía activa; escrituras solo OWNER/ADMIN. CSRF/Origin y guard global conservados; no confía en tenant/rol del body.
- CRUD completo de los campos existentes de la pantalla, importes de dos decimales en PEN, stock manual, activación/desactivación y SKU único por negocio (constraint sensible a mayúsculas). Borrado lógico, sin liberar SKU y bloqueado si tiene OrderItems históricos vinculados. Sin restauración ni edición con versiones.
- Listado/KPIs en snapshot RepeatableRead: catálogo, activos, activos con stock bajo y valor total del inventario; globales del negocio y sin depender de filtros/páginas. Formulario y listado usan schemas/servicios/hooks propios, claves React Query por usuario/negocio y lecturas cancelables; errores/carga/vacío y permisos es/en.
- Creación/edición en páginas dedicadas y diálogo solo para confirmar borrado. Recupera sesión/CSRF bajo Web Lock y valida identidad/negocio esperados antes de enviar; invalida lecturas tras el resultado, sin retry de escrituras ni replay ante resultados inciertos, conservando el borrador al fallar.
- Productos queda fuera de escenarios/restablecimiento demo y persiste tras recarga/logout. Dashboard, pedidos y reportes conservan fixtures independientes: no sincronizan productos ni afectan stock real. Sin nuevas dependencias ni integraciones externas. Contratos y límites en [products.md](./products.md).
- Verificación: lint, formato, tipos, build y diff; sin tests, smoke checks, peticiones HTTP ni navegador por la restricción vigente. Estas verificaciones no demuestran comportamiento runtime, concurrencia ni aislamiento efectivo; no declarar producción.

## Fase posterior, fuera del alcance actual

Recuperación/verificación de email y MFA; rate limits distribuidos/por cuenta, auditoría durable, retención de sesiones, rotación gradual de claves y verificaciones de seguridad; selección autorizada de negocio y ampliación de RBAC/repositorios business-scoped más allá de productos; endpoints de pedidos y del resto del comercio, persistencia del resto del onboarding; WhatsApp Cloud API y proveedores de IA.
