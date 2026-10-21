# WhatsApp AI Sales SaaS

## Objetivo y estado

SaaS multi-tenant de ventas y atención por WhatsApp con agentes AI. Frontend comercial con mocks y autenticación real integrada con backend jose/bcrypt. No implementar integraciones externas ni endpoints comerciales sin ampliar el alcance. Consultar `docs/roadmap.md` antes de comenzar. Los seis pasos del alcance inicial están completados: monorepo, shell frontend, acceso/onboarding, módulos comerciales mock, base backend y documentación. La API incorpora auth real, configuración, Prisma, actualización del nombre del Business activo y CRUD persistente de productos. Productos usa API, paginación remota, KPIs globales, borrado lógico y autorización por negocio activo (lectura con membresía activa; escrituras OWNER/ADMIN). Dashboard, pedidos, clientes, tiendas y demás módulos comerciales conservan fixtures en memoria; no sincronizarlos implícitamente con el catálogo real. Ver `docs/products.md`. Ver `docs/authentication.md`: perfil real en React Query, cookies HttpOnly, comprobación SSR/cliente de workspace/onboarding; progreso de onboarding y comercio excepto productos siguen solo en memoria.

## Workspace

- Un único repositorio Git y lockfile `pnpm-lock.yaml` en la raíz.
- `apps/web`: Next.js App Router, React y Tailwind CSS v4.
- `apps/api`: NestJS modular, capas hexagonales reservadas, configuración Zod, CORS y Prisma/PostgreSQL. Auth real con cookies/sesiones revocables, PATCH del nombre del negocio activo y endpoints de productos; sin endpoints de pedidos. La raíz del starter queda protegida por el guard global.
- `packages/typescript-config`: configuración TypeScript estricta compartida.
- Node.js >=24; usar pnpm según `packageManager` en la raíz.
- Usar las últimas versiones estables de dependencias. Verificar `pnpm view <paquete> version` y, si el tag latest es prerelease, consultar `versions`/`dist-tags` para elegir la última estable (como Prisma 7.10.1 frente a 8.0.0-rc.23); `pnpm update --latest` puede omitir publicaciones recientes por las políticas de seguridad de pnpm. No desactivar globalmente esas políticas. Cualquier excepción debe quedar acotada a una versión y registrada en `pnpm-workspace.yaml`.

## Comandos desde la raíz

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm build
pnpm lint
pnpm lint:fix
pnpm format
pnpm format:check
pnpm typecheck
```

Oxc exclusivamente: no añadir ESLint, Prettier ni Biome. Configuración centralizada en `.oxlintrc.json` y `.oxfmtrc.json`.

## Convenciones frontend

- Leer también `apps/web/AGENTS.md` y las guías instaladas de Next.js antes de editar la aplicación.
- Un componente React por archivo. Server Components por defecto; usar límites client pequeños.
- Features separadas en componentes, hooks, services, schemas, types y mocks cuando corresponda.
- `page.tsx` compone la página, no contiene lógica de negocio. Alias `@/`.
- React Query para estado del servidor; Zustand para estado global de cliente; Axios centralizado y `withCredentials: true`.
- Formularios con React Hook Form y Zod; mensajes es/en con next-intl.
- Estilos de componentes exclusivamente mediante clases Tailwind v4. CSS solo para imports, tokens y configuración global del tema. Sin estilos inline ni CSS Modules.
- Temas propios light/dark/system con Zustand, CSS Variables y ThemeProvider. No instalar next-themes. Resolver tema antes de pintar e hidratar, escuchar `prefers-color-scheme` y sincronizar `color-scheme`.
- Sidebar oscuro, compacto, colapsable, Lucide y diseño responsive. Superficies negras/grises neutras en oscuro: fondo `#050505`, tarjetas `#101010`, sidebar `#080808`; acento WhatsApp `#25d366`. El tema claro usa neutros y verde profundo. Conservar light/dark/system.
- El shell ocupa todo el ancho y el sidebar permanece en el borde izquierdo. Solo el contenido principal de las páginas usa `mx-auto w-full max-w-357` (1428px con la escala base), no el sidebar ni el header. Login, registro y onboarding conservan su contenedor centrado. Sin marco ni sombra exterior; altura mínima de viewport.
- Crear/editar productos, clientes, pedidos y tiendas en páginas dedicadas (`/[module]/new`, `/[module]/[id]/edit` con prefijo de idioma), nunca en modales. Diálogos solo para detalles/confirmaciones y navegación móvil. KPIs de listados calculados sobre la colección completa; reportes con filtros y composición propios, no un duplicado del dashboard.
- Usar escalas y utilidades nativas de Tailwind para tipografía, tamaños, radios, columnas y espaciado; no valores arbitrarios en px/rem para componentes. Ejemplos: `text-xs`, `rounded-3xl`, `w-60`, `grid-cols-5` con `col-span-*`, `max-w-357`. Ver `docs/design-system.md`.

## Convenciones backend y seguridad

- Clean/Hexagonal Architecture por módulo: domain, application, infrastructure y presentation.
- Prisma 7.10.1 estable con adaptador PostgreSQL, esquema tenant y cliente generado antes de build/typecheck/dev. La migración inicial ya está aplicada al destino autorizado. No conectar, migrar ni sembrar datos automáticamente en install/build/dev/start; cambios posteriores requieren migración revisada y ejecución explícita. Ver `docs/backend.md` y `docs/database.md`.
- Modelos Prisma singulares con `@@map` a tablas físicas plurales (`User` → `Users`, `Business` → `Businesses`), todas con `isDeleted Boolean @default(false)`. Filtrar borrados y relaciones autorizadas explícitamente en repositorios; no hay filtro global ni conversión automática de deletes. La migración `20261020170000_plural_tables_soft_delete` ya se aplicó explícitamente al destino autorizado, sin borrar datos; para otros destinos desplegar coordinadamente con la API nueva. Ver `docs/database.md`.
- El negocio del backend se llama `Business`: módulo singular `business`/`BusinessModule`, archivo Prisma `business.prisma`, relación `business` y clave `businessId`. «Multi-tenant» sigue describiendo la arquitectura; las rutas REST propuestas usan `/businesses/:businessId`.
- Las FK compuestas tenant no sustituyen autorización ni filtros: los futuros repositorios deben aislar tenants; nunca confiar en un tenant enviado por el cliente sin autorización. Las capas domain/application permanecen sin Nest ni Prisma.
- Autenticación: jose y bcrypt (elección explícita del usuario), hashes no reversibles, máximo 72 bytes UTF-8; cookies HttpOnly, Secure en producción, refresh rotativo revocable, CSRF firmado ligado a sesión y CORS con orígenes explícitos. Nunca JWT en localStorage. Cambio autenticado en `POST /auth/change-password`: exige contraseña actual, rota hash y revoca todas las sesiones atómicamente; login revalida hash bajo el mismo bloqueo de usuario. Sin recuperación por email. El frontend consume auth bajo el mismo origen público (`/api/v1` proxy a `API_INTERNAL_URL` privada); CORS debe admitir el origen web. Refresh coordinado con Web Locks y sin retries inciertos; nunca reenviar mutaciones automáticamente. Ver `docs/authentication.md` para límites y operación; no declarar listo para producción sin verificaciones autorizadas.
- Variables independientes: web `.env.local`, api `.env`, ejemplos sin secretos. Solo valores públicos bajo `NEXT_PUBLIC_`.
- TypeScript 7 no expone la API programática que Nest CLI necesita: build mediante `tsc -p tsconfig.build.json`, no `nest build`. El script de desarrollo compila primero y coordina los watchers de TypeScript y Node sin dependencias adicionales.

## Calidad

Aplicar Clean Code, SOLID, DRY y KISS sin abstracciones prematuras. Conservar código existente cuando sea posible. Verificar lint, formato, tipos y build tras cambios. Por instrucción del usuario, por ahora no implementar ni ejecutar tests de ningún tipo (unitarios, integración, e2e o smoke tests). Conservar los tests existentes sin ejecutarlos; reanudar este trabajo solo cuando el usuario lo autorice. No afirmar que módulos, mocks o aislamiento de tenants están implementados si solo están planificados. Actualizar documentación y roadmap con cada etapa.
