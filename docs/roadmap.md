# Roadmap de implementación

## Restricción temporal

La restricción original de no implementar ni ejecutar tests se mantuvo en las etapas históricas descritas abajo. La petición de reorganización backend autoriza ejecutar sus tests existentes; no añadir tests nuevos ni verificar integraciones externas. Lint, formato, TypeScript y build siguen habilitados. El fallo e2e preexistente y el alcance de esta excepción se documentan en la sección de reorganización.

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

## Corrección — Búsqueda de productos sin bootstrap auth por tecla

- Separadas las lecturas GET de listado/detalle del helper de mutaciones: buscar, filtrar o paginar ya no requiere consultar `/auth/me` y `/auth/csrf` antes de cada petición. Conservadas cookies, autorización backend, claves por usuario/negocio y cancelación de queries.
- Alta, edición y borrado conservan Web Lock, verificación de identidad/negocio y CSRF. La revalidación periódica de auth permanece independiente; solo ante un 401 se recupera sesión bajo el lock existente y se repite el GET una vez, previa verificación de usuario/negocio y cancelación. Sin replay de mutaciones ni retry de renovaciones inciertas.
- `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm build` y `git diff --check` correctos; 59 páginas generadas. Sin tests, HTTP ni navegador por la restricción vigente; comportamiento runtime pendiente de comprobación autorizada.

## Ajuste — Debounce de búsqueda de productos

- Añadido hook reutilizable `useDebounce` con limpieza de timeout al cambiar valor/demora o desmontar. El buscador muestra lo escrito inmediatamente y aplica la búsqueda tras 300 ms sin escritura, reiniciando la página junto con el término aplicado. Filtro de estado y paginación sin demora añadida.
- Sin dependencias nuevas ni cambios de auth/API. Verificación limitada a lint, formato, tipos, build y diff; sin tests, HTTP ni navegador por la restricción vigente.

## Corrección — Sidebar acorde al tema activo

- Separados los tokens del sidebar por tema: superficie blanca, texto gris y verde profundo en claro; conservada la paleta negra/verde WhatsApp en oscuro. Navegación de escritorio y móvil comparten los tokens y siguen el tema resuelto, incluido sistema.
- Hover del control de colapso usa texto semántico en lugar de blanco fijo. Sustituye la decisión previa de sidebar siempre oscuro; sin cambios al store, bootstrap ni provider de tema.
- Verificación limitada a lint, formato, tipos, build y diff; sin tests ni comprobaciones de navegador por la restricción vigente.

## Ajuste — Marca Nexora y título del sidebar

- Marca de la app actualizada a Nexora en es/en y en los metadatos de título por defecto/plantilla. Login/registro y navegación comparten las traducciones de marca.
- El componente Brand sustituye texto blanco fijo por `text-sidebar-foreground`, compartido por sidebar de escritorio y navegación móvil. Conservada la clave de almacenamiento del tema para no perder preferencias existentes; los nombres de negocios mock no representan la marca de la aplicación y no se modifican.
- Sin nuevas dependencias ni cambios a auth/API. Verificación estática sin tests ni navegador.

## Ajuste — Ayuda de contraseña simplificada

- Texto de ayuda de registro y cambio de contraseña simplificado a «Usa una contraseña de al menos 12 caracteres.» y su equivalente en inglés. Conservadas las validaciones y los errores del límite de 72 bytes UTF-8; sin cambios de seguridad ni API.

## Ajuste — Política e indicador de contraseña

- Sustituye el mínimo anterior de 12 por 8 caracteres (puntos de código Unicode), al menos una letra y un número decimal Unicode en registro y nueva contraseña de ambos flujos de cambio. Validación alineada entre Zod cliente y DTOs API; conserva máximo 72 bytes UTF-8, confirmación local y diferencia respecto a la actual. Login/contraseña actual no reciben la política de creación.
- Indicador reutilizable con suscripción RHF al campo, barra de tres segmentos, etiquetas/requisitos es/en y medidor accesible. Estimación solo local: débil si incumple, media si cumple, fuerte con al menos 12 caracteres y símbolo adicional; no garantiza seguridad ni consulta filtraciones. No persiste ni envía credenciales para calcularla. Símbolos opcionales, sin transformaciones de contraseña.
- Sin dependencias nuevas, migraciones ni acceso a base de datos. `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm build` y `git diff --check` correctos; sin tests ni navegador por la restricción vigente.

## Ajuste — Visibilidad individual de contraseñas

- `InputField` incorpora un botón Eye/EyeOff para cada input de tipo password, con estado local independiente, oculto inicialmente, etiqueta es/en contextual, foco visible y control por teclado. Respeta disabled y fieldset al enviar; no envía formularios ni cambia el valor/autocomplete del campo.
- Aplicado a login, registro, confirmaciones y ambos cambios de contraseña. Sustituye el botón global del formulario de cambio por control individual. Sin persistencia de visibilidad ni credenciales y sin dependencias nuevas.

## Ampliación — Configuración persistente de agente

- Pantalla de agente conectada a GET/PUT `/businesses/:businessId/agents/configuration`; sin fixtures, escenarios ni restablecimiento demo. Formulario inicialmente vacío si no hay configuración, con vista previa local y guardado explícito. Lectura con membresía activa y escritura OWNER/ADMIN.
- Módulo agents con capas domain/application independientes de Nest/Prisma, repositorio PostgreSQL, DTOs Zod, guard global, CSRF y autorización business-scoped. Reutiliza `Agents` (`storeId: null`, `enabled` mapeado a `active`), sin migraciones ni seeds. Bloqueo del negocio serializa escritores de esta API; duplicados/reservas eliminadas devuelven conflicto en lectura y escritura, sin recuperación destructiva. La unicidad no está garantizada ante escritores externos al protocolo.
- React Query separado por usuario/negocio, cancelación de lecturas, recuperación auth solo tras 401, mutaciones sin reenvío automático y reconciliación posterior. Permisos y errores es/en; borradores sucios conservados incluso si falla el refresco. Dashboard/onboarding y demás mocks permanecen independientes.
- `enabled` es solo configuración persistida: no conecta WhatsApp ni ejecuta IA. Contrato, concurrencia y límites en [agents.md](./agents.md). Verificación estática con lint, formato, tipos y build; sin tests, HTTP, navegador ni consultas a base de datos.

## Ajuste — Validación visible antes de guardar el agente

- Ante el reporte de Guardar sin petición HTTP, añadido un resumen de validación al inicio del formulario de agente con los campos rechazados y sus mensajes es/en. Aclara expresamente que no se envió la configuración; conserva las validaciones y los mensajes individuales. No modifica otras pantallas que no solicitan el resumen.
- La inspección estática no confirmó un defecto de persistencia: el formulario solo envía una mutación después de superar Zod. El resumen permite distinguir ese bloqueo de un error HTTP; la causa concreta del reporte requiere observar qué campos marca o si se produce una petición. Sin tests ni comprobación de runtime/base de datos.

## Corrección — Captura explícita de inputs del agente

- Ante la observación de que los inputs no actualizaban los valores enviados, sustituido el `RecordForm` genérico del agente por un formulario propio y `AgentFields` con `Controller` para nombre, instrucciones, saludo y habilitado. Tono conserva `FormSelectField`, también controlado. Cada input recibe valor y cambio del estado RHF; checkbox usa `checked` y booleano explícitos. Vista previa y submit consumen ese mismo estado, conservando Zod, permisos y protección del borrador.
- Eliminado el log de depuración del borrador; no se imprimen instrucciones ni saludo en consola. Otros formularios no cambian. Comprobación estática; sin tests ni validación de persistencia en runtime.

## Ampliación — Imágenes por URL y categorías de productos

- Producto con URL de imagen opcional HTTP/HTTPS (máximo 2048 caracteres), persistida y editable; miniatura en catálogo con alternativa si falla. Sin subida de archivos ni descarga/optimización del lado servidor; el navegador carga el recurso externo sin referrer.
- Pantalla dedicada `/{locale}/products/categories` para listar y crear categorías reales del negocio. Selector compartido en producto con opciones remotas, estados de carga/error/vacío y bloqueo de guardado sin categorías disponibles. Traducciones es/en, permisos y reconciliación React Query conservados.
- GET/POST `/businesses/:businessId/products/categories` con sesión, autorización business-scoped y CSRF en creación; OWNER/ADMIN para escribir. Nombres únicos por negocio; producto valida categoría existente. Sin renombrado/borrado de categorías ni sincronización con mocks.
- Modelo `ProductCategory` con tabla plural y borrado lógico. Conservado el nombre en `Products.category` por compatibilidad; no hay FK producto-categoría. Migración `20261020180000_product_images_categories` preparada, pendiente de revisión/aplicación explícita: añade imagen/tabla e importa los nombres válidos de productos existentes. No se conectó ni modificó la base; la API ampliada requiere desplegar esta migración.
- Verificación estática con formato, lint, tipos, Prisma validate y build. Sin implementar/ejecutar tests, HTTP, navegador ni verificaciones runtime; no declarar producción.

## Ampliación — Arrastrar, seleccionar archivo o pegar URL de imagen

- Rediseñado el campo del editor con origen archivo/URL, zona drag-and-drop, selector nativo, vista previa/fallback, quitar imagen, progreso de subida y errores es/en. URL explícita con «Usar URL»; guardado bloqueado durante subida y valor previo conservado ante error. Un archivo nuevo no cambia el producto hasta guardar.
- POST multipart `/businesses/:businessId/products/images` para OWNER/ADMIN con CSRF y GET privado `/images/:imageId` para miembros activos. Autorización revalidada, referencias internas comprobadas por negocio, sin reenvío automático de mutaciones ni servicios externos.
- JPG/PNG/WebP de hasta 2 MiB y 20 megapíxeles: Sharp 0.35.2 valida/decodifica, elimina metadatos y convierte a WebP hasta 2048 × 2048. Cuota de 1000 archivos por negocio con bloqueo y límite de 10 subidas/minuto por IP/proceso. Las URLs externas no se descargan en la API.
- Persistencia BYTEA en `ProductImages`, modelo singular con `isDeleted`. Migración `20261020190000_product_image_uploads` preparada, **no aplicada**, posterior a la migración anterior de categorías/imagen. No se conectó a la base. Sin eliminación/limpieza automática de archivos huérfanos, subida pública, almacenamiento externo, recorte ni sincronización con mocks. Documentados límites y operación en `docs/products.md` y `docs/database.md`.
- Formato, lint, TypeScript, Prisma validate y build verificados estáticamente. Sin tests, HTTP, navegador ni comprobaciones runtime por restricción vigente; no afirmar seguridad/aislamiento verificados ni disponibilidad antes de aplicar migraciones.

## Corrección — Configuración del agente desde onboarding

- El wizard antes solo guardaba el nombre del negocio; el agente quedaba en Zustand aunque la pantalla Agente ya tenía persistencia real. Al finalizar ahora guarda nombre, tono e instrucciones mediante el PUT existente y reconcilia su caché React Query.
- Precarga la configuración remota si no existe borrador local, sin pisar campos tocados/modificados. Captura explícita con Controller para inputs/textarea y FormSelectField para selectores.
- Lectura autorizada fresca antes de guardar para conservar saludo y habilitado existentes. Un agente nuevo recibe saludo inicial es/en y queda deshabilitado. No hay conexión con IA/WhatsApp ni migración/API nueva.
- El PATCH de negocio y PUT de agente son independientes: error parcial visible, borrador conservado, sin reintentos automáticos; se completa/navega solo tras confirmar ambos y comprobar identidad/negocio. El resto del wizard y su progreso siguen en memoria. Ver `docs/agents.md`.
- Verificación con formato, lint, tipos y build; sin tests, HTTP, navegador ni consultas a base de datos por restricción vigente.

## Ampliación — Webhook inicial de WhatsApp Cloud API

- GET `/api/v1/whatsapp/webhook` público para verificación de Meta: valida mode/token y devuelve challenge como texto plano. POST en la misma ruta valida HMAC-SHA256 de `X-Hub-Signature-256` sobre raw body y el sobre de notificación; devuelve 200 `EVENT_RECEIVED`.
- Excepción CSRF exclusiva del POST con guard de firma; login/registro y resto de mutaciones mantienen su protección. Parser JSON de hasta 1 MiB para la ruta exacta, sin compresión; parsers restantes conservan 16 KiB, throttler global conservado.
- Variables privadas opcionales `WHATSAPP_WEBHOOK_VERIFY_TOKEN` y `WHATSAPP_APP_SECRET` validadas y añadidas a `apps/api/.env.example` con los valores solicitados. Configuración ausente falla cerrada con 503; el app secret placeholder no permite recibir eventos. No se modifica `.env` local.
- Alcance exclusivamente de transporte: **los eventos reconocidos se descartan**, sin persistencia, asociación a Business, envío, suscripción Graph API ni ejecución de agente. Documentados configuración Meta, HTTPS, límites, replays y pendientes en [whatsapp.md](./whatsapp.md). No usar como inbox de mensajes que deban conservarse.
- Verificación limitada a formato, lint, tipos y build; sin tests, HTTP, navegador, conexión a Meta/DB ni migraciones. La integración operativa y seguridad runtime siguen sin verificar.

## Herramienta local — Túnel ngrok

- Instalado `@ngrok/ngrok` 1.7.0, SDK oficial estable verificado contra el registro, como dependencia de desarrollo raíz. Sin instalación global ni excepciones a políticas de pnpm.
- Comando `pnpm ngrok` mediante `scripts/ngrok.mjs`: lee `.env.ngrok` opcional, exige `NGROK_AUTHTOKEN`, valida `NGROK_PORT` (8000 por defecto), expone solo el destino local `127.0.0.1` y muestra URL pública/callback de Meta. Cierre por SIGINT/SIGTERM; no imprime tokens ni arranca la API.
- Añadido `.env.ngrok.example`, archivo real ignorado por Git, y documentados uso y exposición pública de toda la API. Sin ejecución del script ni apertura de túneles durante la implementación; formato, lint, tipos y build como verificaciones, sin tests/HTTP ni conexión a Meta/DB.

## Ampliación — Conexión manual y envío por WhatsApp Cloud API

- Endpoints `/api/v1/businesses/:businessId/whatsapp`: GET/PUT/DELETE `connection`, POST `messages`, GET `messages/:attemptId`. Sesión, Business activo, OWNER/ADMIN y CSRF/Origin en mutaciones; revalidación de sesión/membresía/usuario/negocio y aislamiento en repositorio.
- Conexión verificada con Graph API y access token cifrado AES-256-GCM con AAD Business/Phone Number ID, sin credenciales en respuestas/logs. Una conexión por Business y número globalmente único, incluido borrado lógico; desconexión local elimina ciphertext, sin revocación en Meta.
- Texto y plantillas simples con parámetros de body, número internacional validado y timeout; `Idempotency-Key` UUID obligatorio. Reserva transaccional previa a la llamada, hash de contenido, respuestas existentes sin reenviar; sin retry ni recuperación automática de PENDING/UNKNOWN. Consulta local de intentos, códigos numéricos de error y status HTTP de Meta; ACCEPTED no garantiza entrega.
- Nuevos modelos/migración `20261020200000_whatsapp_connection_sending`, **pendiente de aplicación explícita**. Variables privadas opcionales `WHATSAPP_GRAPH_API_VERSION` y `WHATSAPP_CREDENTIALS_KEY` en ejemplo/validación/Turbo; no se configura token global ni modifica `.env`. Sin dependencias nuevas.
- El webhook conserva descarte de eventos: sin inbox durable, estados posteriores, UI, Embedded Signup, suscripciones Graph ni IA. Documentados contratos, ventana de conversación, plantillas/consentimiento, claves y límites en [whatsapp.md](./whatsapp.md).
- Verificación estática de Prisma, formato, lint, tipos y build; sin tests, HTTP, navegador, llamadas a Meta, conexión a PostgreSQL ni migraciones. Requiere verificaciones runtime autorizadas antes de producción.

## Ampliación — Swagger para toda la API actual

- Instalado `@nestjs/swagger` 12.0.2 estable para Nest 12 y documentación de las 29 operaciones actuales: raíz protegida, auth, negocio, productos/categorías/imágenes, agente, conexión/envíos WhatsApp y webhook Meta.
- UI `/api/v1/docs`, JSON `/api/v1/docs-json` y YAML `/api/v1/docs-yaml`; habilitados fuera de producción por defecto, con override privado `SWAGGER_ENABLED=true|false`. Documentación pública cuando se habilita; acceso restringible en proxy. Sin relajar guards, cookies, CSRF, RBAC ni firma del webhook.
- Contratos explícitos mediante decoradores compartidos y conversión de Zod a OpenAPI 3.0, sin plugin del compilador. Incluye bodies estrictos, filtros/paginación, multipart/binary, headers de firma/idempotencia, respuestas, errores y límites. Instrucciones de login con cookies HttpOnly/CSRF y advertencia de efectos reales de Try it out en [openapi.md](./openapi.md).
- El peer de Swagger declara TypeScript 5/6 y pnpm avisa con TypeScript 7.0.2; no se oculta ni se rebaja el compilador. Sin uso de API programática/plugin de TypeScript. Script de telemetría transitivo de `@scarf/scarf` bloqueado explícitamente; instalación congelada operativa.
- Verificación: instalación, formato, lint, tipos y build. Sin tests, HTTP, navegador, arranque de API, Meta, DB ni migraciones. Compilar no verifica ejecución de Swagger ni seguridad runtime.

## Ampliación — Conexión de cliente con Meta Embedded Signup

- Configuración incorpora conexión opcional posterior al registro, separada de preferencias mock: consulta real, carga del SDK oficial bajo acción del usuario, autorización en ventana Meta, PIN de registro validado con RHF/Zod, progreso, cancelación, errores, reconciliación de resultados inciertos y desconexión local confirmada. Mensajes es/en y temas existentes. Solo OWNER/ADMIN; caché pública de conexión aislada por usuario/Business; código/PIN/contexto solo en memoria temporal, sin React Query/Zustand/localStorage.
- Nuevos GET `signup/configuration` y POST `signup/complete` en el Business activo, documentados en Swagger. Contexto firmado de 15 minutos ligado a usuario/sesión/Business, CSRF/Origin y límites. Canje privado de código, validación de token/app/permisos/WABA y pertenencia del número contra Meta, consulta de metadatos, suscripción de app a la WABA y registro del número. Cifrado existente; no se sustituye una conexión activa concurrente ni se comparte número entre negocios.
- Solo final `FINISH` del flujo Cloud API estándar con un número. No coexistencia WhatsApp Business App, migraciones, altas sin número, envío de prueba, conexión de conversaciones ni IA. No hay transacción distribuida/recuperación durable de altas; ante fallo después de llamadas externas, revisar Meta y GET local antes de autorizar de nuevo. No se guardan ni registran PIN/código ni se propagan errores externos con secretos. Sin retries automáticos.
- Variables privadas opcionales `WHATSAPP_APP_ID` y `WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID`, ejemplo sin duplicados/placeholders activos inválidos y passthrough Turbo. Sin dependencias ni migraciones nuevas; reutiliza migración de conexiones todavía pendiente de aplicación explícita. No se modificó el entorno privado ni se configuró Meta: dominio HTTPS, Facebook Login for Business/Embedded Signup v4, permisos, revisión y habilitación para clientes externos requieren operación en Meta.
- Verificación: formato, lint, tipos y build; sin tests, navegador, arranque de servidores, llamadas operativas a Meta, DB ni migraciones. La autorización y el registro de número no se validaron en ejecución: requieren configuración Meta y verificación autorizada antes de producción. Requisitos y límites en [whatsapp.md](./whatsapp.md).

## Ampliación — Facebook Login por redirección para números WhatsApp existentes

- Alcance confirmado: reemplaza en Configuración el popup/SDK por navegación en la misma pestaña, iniciada mediante POST autenticado/CSRF al backend. **Conecta WABA/números ya configurados en Cloud API; no crea, verifica ni registra números nuevos**, no migra ni activa coexistencia. Los endpoints anteriores de Embedded Signup se conservan como compatibilidad API sin UI actual.
- State aleatorio de 256 bits almacenado como hash, de un uso, TTL 15 minutos y ligado a usuario/sesión/Business. Callback backend autentica la misma cookie/sesión OWNER/ADMIN; canjea código con redirect_uri exacto, valida app/scopes/WABAs y descubre números existentes. Token transitorio cifrado, opciones locales y redirección limpia solo con ID de intento. Sin tokens/código en React, SDK Facebook, popup ni PIN.
- Selección de número tras volver; completion atómica local de un uso, revalidación contra Meta, reserva por negocio y suscripción WABA antes de guardar. Sin reintentos de mutaciones; reconciliación de conexión/estado ante respuesta incierta. Limpieza diferida por ámbito; pendientes limpieza programada/retención y recuperación de operaciones externas parciales. El callback OAuth transporta código en query: excluir query strings y credenciales de logs/APM externos.
- Nuevas variables privadas `WHATSAPP_LOGIN_CONFIG_ID` y `WHATSAPP_OAUTH_REDIRECT_URI`, mismo origen HTTPS de frontend/callback autorizado en CORS/Meta. Revisar Facebook Login for Business para activos existentes, no una configuración que obligue a Embedded Signup. `.env.example`, Turbo y documentación actualizados; no se alteraron secretos privados ni se configuró Meta.
- Nueva migración revisable `20261020210000_whatsapp_authorization_redirect` y modelo `WhatsappAuthorizationAttempt`; **no aplicada**, sin conexiones DB ni cambios de datos durante implementación. No hay nuevas dependencias. Validación solo estática; sin tests, HTTP de aplicación, navegador ni operaciones Meta por restricción vigente. No se declara apto para producción sin configuración, migración y verificaciones runtime autorizadas.

## Ampliación posterior — Conversaciones entrantes reales con la conexión WhatsApp

- Ampliación solicitada: usar el número ya conectado para mostrar datos reales en Conversaciones. Nuevos modelos `WhatsappThread`/`WhatsappInboundMessage`, tablas plurales con `isDeleted`, relaciones Business y FK compuesta tenant/hilo; migración aditiva `20261020220000_whatsapp_inbox` creada y **pendiente de aplicación explícita**. No modifica ni importa fixtures/históricos.
- El webhook firmado valida mensajes, resuelve el Business desde una conexión activa por Phone Number ID y revalida bajo bloqueo compartido con conectar/desconectar. Persiste antes del 200; los reintentos no duplican `(businessId, providerMessageId)`. Máximo 100 mensajes por notificación/1 MiB; fallos de persistencia no confirman, grupos anteriores pueden quedar guardados y se deduplican al repetir. Eventos de estados y otros cambios se descartan; no existe cola/worker adicional.
- Texto y captions de imagen/video/documento, remitente/nombre de Meta, tipo y fechas locales/Meta persistentes; sin descargar medios ni almacenar payload completo. Resumen protegido contra eventos fuera de orden. No se recupera historial anterior o recibido mientras estaba desconectado; el histórico local permanece legible tras desconectar.
- GET de conversaciones y mensajes bajo `/businesses/:businessId/whatsapp/conversations`, documentados en Swagger: 20 hilos/50 mensajes por página, cursor UUID, filtros explícitos de tenant/borrado y membresía activa de cualquier rol. Cache-Control privado/no-store; IDs ajenos producen 404.
- Conversaciones reemplaza fixtures por React Query aislado por usuario/Business y polling de 10 s solo en página reciente en primer plano. Se retiran composer, estados/asignación y relaciones con clientes/pedidos ficticios. Lectura real sin envío, estados de entrega, no leídos ni IA; dashboard/reportes/comercio restante conserva fixtures. Sin persistencia de inbox en almacenamiento web.
- Contenido personal en PostgreSQL sin cifrado aplicativo ni purga/retención automática; no se registra en logs. Antes de producción: acordar privacidad/retención/borrado, backups/cifrado operativo, dimensionar webhook/rate limits y realizar verificaciones runtime autorizadas.
- Verificación de esta etapa limitada a Prisma validate/generate y formato/lint/tipos/build. Sin tests de ningún tipo, navegador/smoke, llamadas HTTP/Meta, conexiones DB ni migraciones ejecutadas por el asistente.

## Ampliación posterior — Respuestas de texto desde Conversaciones

- Compositor real con React Hook Form/Zod y traducciones es/en: texto de 1–4096 caracteres, envío explícito, sin adjuntos/plantillas. Se preservan temas y estilos Tailwind; salientes a la derecha, entrantes a la izquierda, con estados locales de intento diferenciados de entrega/lectura.
- POST `/:threadId/messages` y GET `/:threadId/send-attempts/:key` bajo `/businesses/:businessId/whatsapp/conversations`, documentados en Swagger. OWNER/ADMIN, sesión/CSRF, destinatario resuelto desde hilo autorizado, conexión del mismo número, ventana de 24h calculada sobre último entrante; salientes no la prolongan. Lectura sigue disponible a cualquier membresía activa.
- Reserva atómica de intento + cuerpo saliente + resumen antes de Graph, finalización atómica de resultado/ID Meta. Reutiliza cifrado de tokens y envío idempotente existente; una clave de otro hilo/payload no puede usarse para reenviar ni asociarse al inbox. Reconciliación por clave solo consulta DB. Nunca hay retry automático ni garantía exactly-once ante fallos externos; PENDING puede permanecer tras caída de proceso.
- Nueva migración aditiva `20261020230000_whatsapp_inbox_sending`, **pendiente de aplicación explícita**: dirección, FK/índice compuesto tenant/intento, ID Meta nullable, CHECK según dirección e índice de ventana. Conserva tabla física `WhatsappInboundMessages` para ambas direcciones y el historial entrante existente. No escribe en `Messages`/`Conversation` reservados ni importa envíos genéricos/anteriores.
- Frontend conserva seguimiento y borrador solo en memoria mientras siga montado, bloquea doble envío y advierte ante resultado incierto; consulta local sin reenviar, acción explícita para preparar un mensaje distinto. Refresca timeline/listado tras la operación; polling de 10 s continúa, sin WebSockets. No hay estados de entrega, IA, adjuntos descargados ni relaciones con fixtures comerciales.
- Verificación limitada a Prisma format/validate/generate, formato, lint, tipos y build; sin tests de ningún tipo, HTTP/smoke/navegador, llamadas Meta, conexiones DB ni migraciones ejecutadas. Antes de producción: aplicar migraciones revisadas, configurar permisos/número y realizar verificaciones runtime autorizadas.

## Corrección posterior — Borrador al enviar mensajes consecutivos

- El compositor controla explícitamente `body` mediante React Hook Form (`useController`) para sincronizar el textarea y el valor validado después de `reset` al preparar otro mensaje. Usa `readOnly` durante el bloqueo, en lugar de deshabilitar el campo registrado; el botón de envío y las comprobaciones de permisos/pendientes siguen bloqueados. No cambia límites, CSRF, ventana, persistencia ni idempotencia.
- Verificación limitada a formato, lint, tipos y build. Sin tests, navegador, envíos a Meta ni operaciones DB; pendiente confirmación del flujo de mensajes consecutivos en el entorno del usuario.

## Configuración local — PostgreSQL con Docker Compose

- Añadido `compose.yaml` con PostgreSQL 18 Alpine, puerto limitado a `127.0.0.1:5432`, credenciales locales alineadas con `apps/api/.env.example` y volumen nombrado persistente. Solo desarrollo; sin servicios adicionales, migraciones ni seeds automáticos.
- README actualizado con arranque, conexión y parada; no se modifica el `.env` privado ni se inicia la base ni se aplican migraciones como parte de esta configuración.

## Corrección — Selector de números tras Facebook Login

- Sustituido el `<select>` nativo de la conexión WhatsApp en Configuración por `FormSelectField`, el selector compartido de la app integrado con React Hook Form. Conserva placeholder, número/nombre verificado, etiquetas accesibles, errores y bloqueo durante el guardado; sin cambios al flujo OAuth ni a las APIs.
- Verificación estática de formato, lint, tipos y build; sin tests ni comprobaciones de navegador/runtime por la restricción vigente.

## Corrección — Hidratación de sesión tras volver de Facebook

- `SessionGate` podía renderizar `SessionStatus` en SSR y el shell en el primer render cliente si el `AuthProvider` ya había recuperado `/me` antes de hidratar ese límite de streaming. El retorno de OAuth por navegación completa expone esta carrera; no implica por sí solo un fallo del callback backend.
- Añadido snapshot de hidratación con `useSyncExternalStore`: servidor e hidratación inicial muestran el mismo estado de carga; después se usa la sesión cliente. Conserva comprobación SSR, perfil autorizado, redirección al login, errores y reconciliación; sin `suppressHydrationWarning` ni desactivar SSR.
- Verificación limitada a formato, lint, tipos y build; sin tests, navegador, llamadas Meta ni operaciones de base de datos. Confirmación del retorno OAuth en runtime pendiente en el entorno del usuario.

## Reorganización backend — Arquitectura por funcionalidades

- Análisis previo de los diez módulos Nest, controllers, servicios, repositorios, contratos, DTOs, guards, filtros, providers, Prisma/configuración y dependencias. La base ya separaba negocio/persistencia, pero mantenía carpetas de capas reservadas, respuestas OpenAPI centrales acopladas a DTOs comerciales, extracción duplicada de actores y composición repetida de adaptadores WhatsApp.
- Reorganizados `auth`, `business`, `products`, `agents` y `whatsapp` en controllers/services/repositories/models/dto y contratos/providers/auxiliares solo cuando existen responsabilidades reales. Los cinco módulos reservados (`users`, `stores`, `orders`, `clients`, `conversations`) mantienen su registro sin carpetas vacías ni endpoints nuevos. No se añadieron clases UseCase ni repositorios universales.
- Prisma centralizado en `src/database`: cliente generado en `src/database/generated`, imports, ignore de Git/Oxc y artefactos Turbo coordinados. Solo cambia el output del generador, no modelos, enums, migraciones ni datos; sin conexión/migración/seed ni nuevas dependencias.
- Contratos de inbox/autorización WhatsApp separados de los modelos; adaptadores privados compartidos mediante providers Nest. Cliente Graph común para signup/autorización por composición, conservando firma app secret, límites, timeout y sanitización de errores. Sin cambios a endpoints, tokens, cookies, CSRF, OAuth, HMAC, idempotencia, locks o transacciones.
- Esquemas de respuesta OpenAPI trasladados al `dto/` de cada feature; utilidades comunes sin dependencias comerciales. Extracción del actor autenticado centralizada en auth. Carga de imágenes coordinada por ProductsService, con normalizador inyectado y autorización antes de decodificar; persistencia sigue revalidando permisos en transacción.
- Actualizados README, guías de arquitectura/backend/database/login e instrucciones del proyecto. Se preservaron cambios locales anteriores del usuario y del frontend.
- Validaciones: `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm build` y `git diff --check` correctos. Análisis estático de 97 archivos fuente: sin imports relativos sin resolver, sin ciclos (incluidas dependencias de tipos), sin Nest/Prisma en modelos, contratos y servicios. Registro Nest y resolución de providers alcanzan `app.init()` en el e2e existente.
- Tests existentes ejecutados por la autorización de esta petición: unitario 1/1 correcto; e2e 0/1, `expected 200 "OK", got 401 "Unauthorized"` en `apps/api/test/app.e2e-spec.ts:20`. Mismo fallo reproducido en snapshot anterior al refactor con configuración sintética y PostgreSQL inaccesible: expectativa obsoleta del starter frente al guard global. Test conservado sin cambiar su expectativa ni hacer pública la raíz. Posteriormente, el usuario autorizó omitir el e2e y continuar: no se vuelve a ejecutar ni se considera bloqueo de cierre de este refactor; su fallo conocido queda registrado, no como una prueba aprobada. No se ejecutaron queries a PostgreSQL ni llamadas Meta y no se acredita funcionamiento completo de auth/comercio.

## Ampliación — Múltiples negocios y contexto comercial

- Registro crea únicamente User/sesión sin negocio (`activeBusinessId: null`). Login sin membresías también admite sesión de cuenta. Onboarding crea el primer Business + Membership OWNER + agente general deshabilitado en una transacción; se elimina el paso tienda y la conexión WhatsApp obligatoria. La misma página dedicada permite crear otros negocios.
- POST `/businesses`, GET/PATCH `/businesses/:businessId` y POST `/auth/switch-business`, con contratos Swagger. Cambio autorizado de negocio crea nueva familia/cookies y revoca la anterior atómicamente; no es un cambio local de Zustand. Lecturas con membresía activa y escrituras OWNER/ADMIN del negocio activo. ID estable de creación recuperable por propietario, sin reintentos automáticos.
- Tiendas sustituido por Negocios, listado real desde membresías, selector debajo del logo y en móvil. Página de configuración con nombre, descripción, moneda, zona horaria, contexto extenso y conexión WhatsApp. El contexto incluye plantilla, contador de 30000 caracteres y vista previa plana, borrador/publicación independientes y revisión optimista; instrucciones del agente pasan a ser breves y opcionales. Publicar no activa IA ni envía mensajes.
- Productos nuevos usan la moneda del negocio y sus KPIs la informan; se bloquea cambiarla cuando existen productos, incluidos archivados, sin conversión. Se retiran dependencias de tiendas del comercio mock y reportes pasan a comparar productos. Dashboard, clientes, pedidos y reportes mantienen fixtures en PEN, nunca sincronizados con datos reales. Se limpian queries/fixtures/borradores al cambiar de negocio o cuenta, preservando tema/idioma/sidebar y sincronizando pestañas.
- Migración aditiva `20261020240000_multiple_businesses_context`, **pendiente de aplicación explícita**: contexto/metadatos en Business y sesiones con negocio nullable. Conserva negocios, agentes, mensajes, catálogo y relaciones legacy de tiendas, sin borrado ni conversión de datos. Retirados módulo backend vacío y UI/mock de tiendas; retirada física pendiente de inventario/migración separada. Sin dependencias nuevas, cambios de secretos ni operaciones DB/Meta/IA.
- Guía completa en [businesses.md](./businesses.md), auth/agente/backend/database/OpenAPI actualizados. Verificación limitada a formato, lint, tipos y build; sin tests, smoke checks, navegador ni llamadas HTTP de aplicación. Esas verificaciones estáticas no acreditan seguridad ni comportamiento runtime antes de producción.

## Corrección — Retorno de Facebook a Negocios

- El callback de Facebook Login for Business vuelve a `/{locale}/businesses/configuration`, donde reside ahora la conexión WhatsApp, conservando `whatsappAttempt` y el idioma del intento. El fallback de errores anteriores a identificar el intento vuelve a `/es/businesses/configuration?whatsappResult=failed`.
- Sin cambios al callback registrado en Meta, variables, validación de state/sesión/permisos, tokens ni suscripciones. Verificación estática mediante formato, lint, tipos y build; sin pruebas OAuth, navegador, llamadas Meta ni operaciones DB.

## Ampliación — Respuestas IA opcionales y control humano

- Contrato `AiTextGenerator` sin Nest/Prisma y adaptador inicial OpenAI Responses API, reemplazable desde la composición/configuración. Sin SDK/dependencias nuevas. Variables privadas `AI_AUTOREPLY_ENABLED=false`, `AI_PROVIDER=openai`, `AI_DAILY_REPLY_LIMIT`, `OPENAI_API_KEY` y `OPENAI_MODEL`; activación incompleta rechazada por Zod. Ningún secreto enviado al frontend.
- Webhook persiste trabajo junto al nuevo texto firmado/deduplicado, sin esperar modelo/envío; no crea jobs del histórico. Cola durable PostgreSQL y worker interno de 2 s, locks Business/SKIP LOCKED, control/versiones por hilo y revalidación del agente general único, contexto publicado, conexión/mismo número y 24h antes de generar y reservar envío. Nuevos entrantes/configuración/control invalidan resultados obsoletos. Historial de texto acotado del mismo hilo, sin otros contactos, tools, catálogo ni comercio mock.
- Estados QUEUED/GENERATING/SENDING/ACCEPTED/FAILED/UNKNOWN/CANCELLED/SKIPPED, límites distribuidos por negocio (10/min, 200/24h por defecto). Timeout/errores de generación no envían; reserva atómica de intento/saliente `source: AI` antes de Graph y clave estable por job. Nunca se reintenta OpenAI ni Meta automáticamente. Recupera trabajos interrumpidos sin reenviar; `UNKNOWN` cede a humano y cancela cola. No garantiza entrega exactamente una vez ni reconcilia contra Meta.
- POST `/:threadId/control` OWNER/ADMIN con sesión/CSRF/versión optimista; lectura con cualquier membresía activa. Frontend es/en muestra modo, origen IA, último estado y advertencia de envío en curso/incierto. Tomar control cancela cola/descarta generación; devolver a IA solo habilita futuros textos. El compositor manual exige HUMAN en UI y repositorio, preservando consulta idempotente de intentos. Un envío ya reservado puede llegar después de tomar control/desconectar/deshabilitar.
- Migración aditiva `20261020250000_whatsapp_ai_replies`, **creada y pendiente de aplicación explícita**, añade control/versiones, origen de mensajes y jobs con FK tenant e idempotencia; conserva historial, no escribe en Messages reservado ni modifica tablas comerciales mock. Revisar todas las pendientes y desplegar coordinadamente antes de la API nueva.
- Guía de activación, arquitectura, costes, privacidad, concurrencia y límites en [ai.md](./ai.md). No se modificó `.env` privado, aplicaron migraciones, conectó DB ni llamó a OpenAI/Meta. Verificación de esta etapa limitada a Prisma format/validate/generate, formato, lint, tipos y build; sin tests, navegador, HTTP de aplicación ni smoke checks. La validación estática no acredita funcionamiento/runtime ni preparación para producción.

## Fase posterior, fuera del alcance actual

Recuperación/verificación de email y MFA; rate limits distribuidos/por cuenta, auditoría durable, retención de sesiones, rotación gradual de claves y verificaciones de seguridad; invitaciones/gestión de miembros y ampliación de RBAC/repositorios business-scoped más allá de productos, configuración de agente y WhatsApp; endpoints de pedidos y del resto del comercio; cola para picos, reconciliación durable de intentos y estados de WhatsApp, retención/purga de inbox, UI de plantillas/adjuntos y alta de conversaciones, coexistencia/migraciones de número, recuperación durable y habilitación operativa de Embedded Signup, y proveedores IA adicionales, mayor observabilidad/retención y endurecimiento operativo de la cola, evaluaciones autorizadas de calidad/seguridad del modelo e integración comercial persistente fuera del texto de chat.
