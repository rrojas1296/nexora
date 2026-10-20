# Frontend

## Base implementada

- Next.js App Router con React Compiler, Cache Components y Tailwind v4.
- `src/app/[locale]/layout.tsx`: documento, fuente Geist, script del tema y providers.
- `src/app/[locale]/(workspace)`: shell a ancho completo con sidebar anclado a la izquierda; solo el contenido de las páginas se centra con `max-w-357`. Dashboard, módulos mock y páginas de alta/edición para productos, clientes, pedidos y tiendas.
- `src/app/[locale]/(access)`: login, registro y onboarding fuera del shell, disponibles en es/en.
- `src/features/auth`: formularios React Hook Form + Zod, servicios mock y perfil temporal.
- `src/features/onboarding`: wizard de cinco pasos, esquema Zod, resumen editable y progreso temporal.
- `src/features/workspace/components`: composición de módulos, títulos traducidos, controles de demo y tarjeta de onboarding. Los componentes de bienvenida anteriores se conservan, pero ya no son la vista principal.
- `src/features/demo`: contratos Zod compartidos, fixtures enlazadas, servicio en memoria, hooks React Query, escenarios y primitivas de listas/formularios/diálogos.
- `src/features/{analytics,conversations,agent,products,orders,clients,settings,stores,help}`: módulos funcionales frontend. Ver [features.md](./features.md).
- `src/components/layout`: sidebar, header, navegación responsive y preferencias.
- `src/components/ui`: botón con CVA y Slot de Radix e input con etiquetas, errores y descripciones asociadas. Configuración `components.json` para futuras incorporaciones shadcn; no es un catálogo completo.
- `src/lib`: utilidades, cliente Axios, configuración validada con Zod, normalización de errores y QueryClient.

## Idiomas

Next-intl usa `es` como idioma por defecto y `en` como alternativa; ambos llevan prefijo en la URL. El proxy redirige entradas sin prefijo y excluye API, internals de Next y archivos. `routing.ts`, `navigation.ts` y `request.ts` centralizan la configuración; los catálogos están en `src/i18n/messages`. La ampliación `src/types/next-intl.d.ts` tipa idioma y claves. Los mensajes comerciales están separados en `src/i18n/messages/commerce/{es,en}.json` y se fusionan con el catálogo base al cargar el locale.

`request.ts` obtiene el idioma del getter `locale()` de `next/root-params`, disponible porque `[locale]/layout.tsx` es el root layout. `validateLocale` rechaza valores no soportados con `notFound()` antes de cargar catálogos: ya no se sustituye silenciosamente un locale inválido por español dentro de la configuración. El idioma por defecto del proxy sigue siendo `es`. Las traducciones implícitas, `getLocale()` y `getMessages()` comparten esta configuración, sin leer headers ni inicializar estado mutable en páginas/layouts. Se han retirado todas las llamadas a la API deprecada `setRequestLocale`; se conserva `generateStaticParams` para es/en y Cache Components.

La configuración respeta un locale explícito (`localeOverride ?? await getRootLocale()`) sin invocar el getter raíz cuando se proporciona. `next/root-params` no está disponible en Server Actions ni Route Handlers: las futuras llamadas de traducción en esos contextos deben pasar `{ locale, namespace }` explícitamente. No hay acciones ni handlers implementados actualmente. Los componentes cliente mantienen `useLocale`, `useTranslations` y `useFormatter` bajo `NextIntlClientProvider`; el layout entrega el locale validado y los mensajes desde las APIs del servidor. La zona horaria por defecto se fija a `UTC`, coherente con los datos demo; las preferencias mock de tienda no la modifican.

Referencias: [migración de next-intl a root params](https://next-intl.dev/blog/nextjs-root-params), [configuración de routing](https://next-intl.dev/docs/routing/setup) y [API de Next.js](https://nextjs.org/docs/app/api-reference/functions/next-root-params).

Con `partialPrefetching`, los parámetros de URL que no son root params (como `module`) también deben resolverse bajo `Suspense`, incluso si están enumerados en `generateStaticParams`. `[module]/loading.tsx` proporciona ese límite alrededor de la página y sus rutas hijas, con un skeleton independiente de traducciones y sin incluir el shell del workspace. El `await params` de la página queda dentro del límite; añadir `Suspense` solo en su JSX después del `await` no lo cubre. La validación del shell compartido puede mostrar avisos en desarrollo que no bloquean el build. El selector conserva pathname, query y hash; las rutas desconocidas no se convierten en módulos válidos.

## Estado y API

React Query tiene un QueryClient por render de servidor y una instancia estable en navegador. Configuración: `staleTime` 60 segundos, un reintento en queries, ninguno en mutations y sin refetch al recuperar foco. Los módulos comerciales usan un snapshot compartido `demo-workspace` segmentado por escenario. Sus lecturas son cancelables con AbortSignal y no reintentan automáticamente los errores simulados. Las mutaciones invalidan ese prefijo y esperan el refetch de las vistas activas; no hay polling ni llamadas HTTP de negocio.

Zustand mantiene tema, sidebar, perfil demo, progreso del onboarding y escenario/revisión de la demo comercial. Solo el tema se persiste; nunca tokens, credenciales o datos de clientes. El sidebar vuelve expandido al recargar. El perfil y el onboarding permanecen únicamente en memoria, incluidos cambios de idioma mediante navegación interna. Recargar borra ambos y las colecciones comerciales; salir de la demo o iniciar otro perfil también limpia el progreso, el escenario, el repositorio mock y la caché de React Query. No existe aislamiento multi-tenant real.

Axios usa `NEXT_PUBLIC_API_URL`, `withCredentials: true` y timeout de 15 segundos. Si la variable falta, usa `http://localhost:8000/api/v1`. Es configuración pública validada como URL HTTP(S). Todavía no realiza llamadas. El normalizador de errores prepara el formato `{ code, message, requestId? }`, compatible con la propuesta futura de [backend.md](./backend.md); los DTOs definitivos y paginación aún requieren implementación y acuerdo de integración. No hay interceptor de autenticación ni refresh ficticio. La demo usa un snapshot y comandos locales, no los endpoints REST propuestos: sustituir el adaptador de servicio y mapear DTOs (UUID, Decimal como string, estados y fechas), conservando hooks/componentes cuando sea posible. Ver [authentication.md](./authentication.md) antes de incorporar cookies, CSRF y refresh.

## Acceso y onboarding mock

- Login: email válido y contraseña ficticia de 8–128 caracteres. Registro: añade nombre de 2–80 caracteres y confirmación coincidente. Emails normalizados con trim y minúsculas.
- Las credenciales válidas solo simulan el acceso. `error@example.com` produce rechazo en login o email ocupado en registro; otra dirección permite continuar. No hay base de cuentas ni se puede autenticar posteriormente un registro real.
- Servicios locales desacoplados con latencia fija; formularios con errores de campo, loading y bloqueo de envíos durante la operación. Se cancelan las esperas al abandonar el formulario para que no cambien el perfil, el progreso o la ruta después de navegar.
- En el flujo JavaScript, las credenciales no pasan por el QueryClient, Zustand, almacenamiento persistente de la aplicación ni la red. Los formularios declaran POST para evitar incluirlas en la URL si JavaScript aún no está disponible; ese fallback enviaría el cuerpo al servidor pero no existe un endpoint POST de acceso. El flujo demo requiere JavaScript. Usar siempre datos ficticios.
- Al entrar o registrarse se abre `/[locale]/onboarding`. También es accesible directamente desde el dashboard: no hay un guard de seguridad simulado.
- Pasos: negocio; tienda/moneda/zona horaria/horario; agente/tono/instrucciones; vista previa WhatsApp; resumen editable y finalización.
- Validación por paso, y del esquema completo antes de finalizar. Horario diario con cierre posterior a apertura (sin turnos nocturnos). Número internacional opcional y ficticio; no se verifica ni se envían mensajes.
- La vista previa WhatsApp cambia únicamente un booleano. El resumen permite simular un fallo al finalizar y reintentar sin perder datos. Finalizar marca el borrador como completo en memoria y vuelve al dashboard, donde una tarjeta confirma el negocio configurado y permite revisarlo.

Ver límites y evolución prevista en [authentication.md](./authentication.md).

## Dimensiones y paleta

El sidebar permanece en el borde izquierdo del viewport; el shell y el header no se centran ni tienen ancho máximo. Solo el contenido de páginas del workspace usa `mx-auto w-full max-w-357` (1428px con la escala base). Login, registro y onboarding conservan su límite exterior. Las dimensiones, textos, radios y columnas usan utilidades nativas de Tailwind, sin longitudes arbitrarias en px. El tema oscuro usa fondo negro `#050505`, tarjetas `#101010`, sidebar `#080808` y verde WhatsApp `#25d366`; el claro conserva superficies neutras y verde profundo. Ver [design-system.md](./design-system.md).

Los listados de productos, pedidos y clientes tienen KPIs sobre la colección completa, independientes de búsqueda/paginación. Altas y ediciones usan rutas dedicadas, con RHF/Zod y retorno al listado tras guardar; los diálogos quedan para detalles y confirmaciones. Los reportes tienen filtros propios de periodo/tienda, resumen lateral, ingresos por tienda, distribución por estado y tabla agrupable producto/cliente con exportación CSV local. No reutilizan el dashboard.

## Límites actuales

El shell no protege rutas ni constituye autenticación. Gráficos, historial de chat y operaciones de catálogo/clientes/tiendas funcionan solo sobre mocks. El onboarding y la configuración comercial son demostraciones independientes: finalizar el wizard no sustituye las fixtures. Las preferencias de moneda, zona horaria, inicio de semana y notificaciones se guardan como datos, sin conversión, notificaciones reales ni alteración de los periodos fijos. No hay usuarios reales, JWT, cookies de sesión, API de negocio, tenants provisionados, conexión WhatsApp ni integración de IA.

## Verificación

Lint, formato, TypeScript y build de producción. No se implementan ni ejecutan tests, smoke tests ni comprobaciones de navegador durante la restricción vigente. El build no acredita comportamiento visual ni interacciones en navegador.
