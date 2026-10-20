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

## Fase posterior, fuera del alcance actual

Autenticación real con jose y argon2; sesiones y cookies seguras; autorización RBAC y tenant; endpoints de negocio; persistencia real; WhatsApp Cloud API y proveedores de IA.
