# Frontend

## Base implementada

- Next.js App Router con React Compiler, Cache Components y Tailwind v4.
- `src/app/[locale]/layout.tsx`: documento, fuente Geist, script del tema y providers.
- `src/app/[locale]/(workspace)`: shell a ancho completo con sidebar anclado a la izquierda; solo el contenido de las páginas se centra con `max-w-357`. Dashboard, módulos mock y páginas de alta/edición para productos, clientes, pedidos y tiendas.
- `src/app/[locale]/(access)`: login, registro y onboarding fuera del shell, disponibles en es/en.
- `src/features/auth`: formularios React Hook Form + Zod, Axios auth real, perfil React Query, coordinación entre pestañas, comprobación SSR sin caché y gates de sesión.
- `src/features/onboarding`: wizard de cinco pasos, esquema Zod, resumen editable y progreso temporal.
- `src/features/workspace/components`: composición de módulos, títulos traducidos, controles de demo y tarjeta de onboarding. Los componentes de bienvenida anteriores se conservan, pero ya no son la vista principal.
- `src/features/demo`: contratos Zod compartidos, fixtures enlazadas, servicio en memoria, hooks React Query, escenarios y primitivas de listas/formularios/diálogos.
- `src/features/{analytics,conversations,agent,products,orders,clients,settings,stores,help}`: módulos funcionales frontend. Ver [features.md](./features.md).
- `src/components/layout`: sidebar, header, navegación responsive y preferencias.
- Dashboard: barra común de año/alcance y enlace a reportes, las cuatro KPIs existentes sin cambios de cálculo, gráfica mensual con selector de métrica por botones, seguimiento operativo y agente, pedidos recientes de ancho completo y paneles amplios de productos/mensajes. Ventas/pedidos/productos siguen el año seleccionado; conversaciones y seguimiento usan toda la demo, con alcance explícito. No hay actividad externa ni nuevas APIs.
- `src/components/ui`: botón con CVA y Slot de Radix, input con etiquetas/errores y Select de shadcn adaptado sobre `radix-ui`, dividido en un componente por archivo. `SelectField` recibe opciones, valor y `onValueChange`; `FormSelectField` integra Controller de React Hook Form, referencia de foco, blur y estado inválido. Los selectores de tema/idioma, filtros, dashboard y formularios usan esta base en lugar de `<select>` nativos escritos en las pantallas. Configuración `components.json` para futuras incorporaciones shadcn; no es un catálogo completo.
- `src/lib`: utilidades, cliente Axios, configuración validada con Zod, normalización de errores y QueryClient.

## Idiomas

Next-intl usa `es` como idioma por defecto y `en` como alternativa; ambos llevan prefijo en la URL. El proxy redirige entradas sin prefijo y excluye API, internals de Next y archivos. `routing.ts`, `navigation.ts` y `request.ts` centralizan la configuración; los catálogos están en `src/i18n/messages`. La ampliación `src/types/next-intl.d.ts` tipa idioma y claves. Los mensajes comerciales están separados en `src/i18n/messages/commerce/{es,en}.json` y se fusionan con el catálogo base al cargar el locale.

`request.ts` obtiene el idioma del getter `locale()` de `next/root-params`, disponible porque `[locale]/layout.tsx` es el root layout. `validateLocale` rechaza valores no soportados con `notFound()` antes de cargar catálogos: ya no se sustituye silenciosamente un locale inválido por español dentro de la configuración. El idioma por defecto del proxy sigue siendo `es`. Las traducciones implícitas, `getLocale()` y `getMessages()` comparten esta configuración, sin leer headers ni inicializar estado mutable en páginas/layouts. Se han retirado todas las llamadas a la API deprecada `setRequestLocale`; se conserva `generateStaticParams` para es/en y Cache Components.

La configuración respeta un locale explícito (`localeOverride ?? await getRootLocale()`) sin invocar el getter raíz cuando se proporciona. `next/root-params` no está disponible en Server Actions ni Route Handlers: las futuras llamadas de traducción en esos contextos deben pasar `{ locale, namespace }` explícitamente. No hay acciones ni handlers implementados actualmente. Los componentes cliente mantienen `useLocale`, `useTranslations` y `useFormatter` bajo `NextIntlClientProvider`; el layout entrega el locale validado y los mensajes desde las APIs del servidor. La zona horaria por defecto se fija a `UTC`, coherente con los datos demo; las preferencias mock de tienda no la modifican.

Referencias: [migración de next-intl a root params](https://next-intl.dev/blog/nextjs-root-params), [configuración de routing](https://next-intl.dev/docs/routing/setup) y [API de Next.js](https://nextjs.org/docs/app/api-reference/functions/next-root-params).

Con `partialPrefetching`, los parámetros de URL que no son root params (como `module`) también deben resolverse bajo `Suspense`, incluso si están enumerados en `generateStaticParams`. `[module]/loading.tsx` proporciona ese límite alrededor de la página y sus rutas hijas, con un skeleton independiente de traducciones y sin incluir el shell del workspace. El `await params` de la página queda dentro del límite; añadir `Suspense` solo en su JSX después del `await` no lo cubre. La validación del shell compartido puede mostrar avisos en desarrollo que no bloquean el build. El selector conserva pathname, query y hash; las rutas desconocidas no se convierten en módulos válidos.

### Validación de navegación del workspace

Las páginas de dashboard, módulos y alta/edición exportan `instant = false`. El límite de autenticación del layout puede omitir `children` (sesión anónima, recuperación o perfil cliente pendiente), por lo que Next no llega a renderizar esos segmentos durante su validación y emite `instant-unrendered-segment`. La exclusión es explícita en cada página protegida: ponerla solo en el layout no excluye las navegaciones entre sus descendientes. No se oculta el contenido con CSS para eludir el guard ni se cachean sesiones para hacer pasar la validación.

Este ajuste desactiva únicamente la validación instant de esos segmentos, no garantiza navegación instantánea ni optimiza su latencia. Se conservan Cache Components, Partial Prefetching, los límites Suspense/loading y las lecturas auth `no-store`; las páginas públicas siguen con la validación predeterminada. Onboarding contiene su propio límite auth dentro de la página y no requiere esta exclusión por un layout que descarte el segmento. Referencia: [instant](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config/instant).

## Moneda

`src/lib/config/currency.ts` centraliza `defaultCurrency = "PEN"` y las opciones PEN/USD/EUR/MXN/COP. Onboarding y tiendas nuevas seleccionan PEN; las fixtures y los pedidos nuevos usan PEN, al igual que el catálogo, KPIs, gráficas y exportaciones de reportes. El formato monetario sigue el idioma activo mediante next-intl. Las monedas de tienda siguen siendo preferencias mock: no convierten importes ni cambian la moneda de los pedidos. No se han convertido valores numéricos ni datos persistidos; la demo continúa en memoria.

## Estado y API

React Query tiene un QueryClient por render de servidor y una instancia estable en navegador. Configuración: `staleTime` 60 segundos, un reintento en queries, ninguno en mutations y sin refetch al recuperar foco. Los módulos comerciales usan un snapshot compartido `demo-workspace` segmentado por escenario. Sus lecturas son cancelables con AbortSignal y no reintentan automáticamente los errores simulados. Las mutaciones invalidan ese prefijo y esperan el refetch de las vistas activas; no hay polling ni llamadas HTTP de negocio.

Zustand mantiene tema, sidebar, progreso del onboarding y escenario/revisión comercial, no perfil ni credenciales. El perfil público autenticado vive en React Query con retry desactivado; se revalida cada 60 s y al recuperar foco/reconexión. La sesión se recupera al recargar por cookies HttpOnly, mientras onboarding y colecciones comerciales vuelven a sus fixtures. Cambio de identidad/negocio, salida o pérdida de sesión limpian borradores, escenario, repositorio mock y queries comerciales antes de publicar el nuevo perfil. No hay aislamiento comercial multi-tenant: todavía son mocks locales sin endpoints.

Axios usa la base relativa fija `/api/v1`, `withCredentials: true` y timeout de 15 segundos. El rewrite Next y la lectura SSR usan `API_INTERNAL_URL`, privada y validada, por defecto `http://localhost:8000/api/v1`; ya no se utiliza `NEXT_PUBLIC_API_URL`. Configurar el origen público de web en `CORS_ORIGINS` de API y HTTPS/cookies Secure en producción. `.env.example` documenta la topología; cambiar el destino del rewrite requiere rebuild, con caché Turbo segmentada por la variable. El normalizador mapea `{ statusCode, error: { code, message } }` y `X-Request-Id` sin exponer mensajes arbitrarios. No hay interceptor que reenvíe mutaciones: auth coordina CSRF y renovación explícitamente. La integración comercial sigue pendiente, con DTOs, paginación y repositorios autorizados propios. Ver [authentication.md](./authentication.md).

## Acceso real y onboarding mock

- Login: email y contraseña de hasta 72 bytes UTF-8, sin transformar la contraseña. Registro: nombre de 1–100 caracteres, negocio de 1–120, contraseña de mínimo 12 caracteres/máximo 72 bytes y confirmación solo local. Emails normalizados con trim/minúsculas. El registro crea User/Business/Membership OWNER reales.
- Formularios con errores traducidos de campo/API, loading y bloqueo de envíos duplicados. No hay `error@example.com` especial ni perfiles demo. Las credenciales solo viven en el formulario y el POST; no se guardan en QueryClient, Zustand o almacenamiento. Se requiere JavaScript; el atributo POST evita un fallback GET con credenciales en URL, pero no hay Server Action de acceso.
- CSRF se obtiene en memoria antes de mutar y después de autenticar. Web Locks serializa operaciones auth incluso entre pestañas; refresh vuelve a comprobar `/me` bajo el lock y no reintenta resultados inciertos. Se conserva únicamente una marca booleana de refresh incierto en localStorage para no reproducirlo tras recarga; sin coordinación/almacenamiento se desactiva autorrenovación. BroadcastChannel notifica cambios sin transportar perfil ni tokens; recuperar visibilidad/foco/conexión fuerza reconciliación aun si se perdió el aviso.
- `AuthenticatedContent` del servidor está bajo `Suspense`, consulta `/me` con cookies access y `cache: "no-store"`. Si hace falta renovar, `SessionRecovery` cliente lo hace y refresca el render servidor; los Server Components no rotan cookies. La API inaccesible muestra error/reintento y no contenido protegido. `SessionGate` protege navegación cliente del workspace/onboarding, sin sustituir al guard API.
- Login abre dashboard y registro onboarding. Header muestra la cuenta real, cierre de sesión actual y cierre de todas. El wizard continúa siendo temporal: no actualiza el negocio ya creado por el registro.
- Pasos: negocio; tienda/moneda/zona horaria/horario; agente/tono/instrucciones; vista previa WhatsApp; resumen editable y finalización.
- Validación por paso, y del esquema completo antes de finalizar. Horario diario con cierre posterior a apertura (sin turnos nocturnos). Número internacional opcional y ficticio; no se verifica ni se envían mensajes.
- La vista previa WhatsApp cambia únicamente un booleano. El resumen permite simular un fallo al finalizar y reintentar sin perder datos. Finalizar marca el borrador como completo en memoria y vuelve al dashboard, donde una tarjeta confirma el negocio configurado y permite revisarlo.

Ver límites y evolución prevista en [authentication.md](./authentication.md).

## Dimensiones y paleta

El sidebar permanece en el borde izquierdo del viewport; el shell y el header no se centran ni tienen ancho máximo. Solo el contenido de páginas del workspace usa `mx-auto w-full max-w-357` (1428px con la escala base). Login, registro y onboarding conservan su límite exterior. Las dimensiones, textos, radios y columnas usan utilidades nativas de Tailwind, sin longitudes arbitrarias en px. El tema oscuro usa fondo negro `#050505`, tarjetas `#101010`, sidebar `#080808` y verde WhatsApp `#25d366`; el claro conserva superficies neutras y verde profundo. Ver [design-system.md](./design-system.md).

Los listados de productos, pedidos y clientes tienen KPIs sobre la colección completa, independientes de búsqueda/paginación. Altas y ediciones usan rutas dedicadas, con RHF/Zod y retorno al listado tras guardar; los diálogos quedan para detalles y confirmaciones. Los reportes tienen filtros propios de periodo/tienda, resumen lateral, ingresos por tienda, distribución por estado y tabla agrupable producto/cliente con exportación CSV local. No reutilizan el dashboard.

## Límites actuales

Workspace y onboarding requieren una sesión real comprobada en servidor/cliente, y la API conserva la autorización efectiva. Gráficos, historial de chat y operaciones de catálogo/clientes/tiendas siguen solo sobre mocks; finalizar el wizard no sustituye fixtures ni actualiza el Business real creado al registrar. Preferencias comerciales no producen conversiones, notificaciones ni cambios de periodos fijos. No hay API comercial, conexión WhatsApp, integración IA ni selección autorizada de otro negocio. El rate limiting por proceso/IP requiere configuración adicional detrás del proxy; no declarar listo para producción sin verificaciones autorizadas. Ver `authentication.md`.

## Verificación

Lint, formato, TypeScript y build de producción. No se implementan ni ejecutan tests, smoke tests ni comprobaciones de navegador durante la restricción vigente. El build no acredita comportamiento visual ni interacciones en navegador.
