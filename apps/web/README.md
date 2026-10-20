# Web

Next.js App Router, React, Tailwind v4 y next-intl es/en. Auth real por cookies HttpOnly; onboarding y módulos comerciales siguen usando mocks en memoria.

Desde la raíz del monorepo:

```sh
cp apps/web/.env.example apps/web/.env.local
pnpm --filter @whatsapp/web dev
```

El workspace requiere API y PostgreSQL configurados. `pnpm dev` inicia ambas aplicaciones; ver la [preparación del repositorio](../../README.md). No hay cuentas precreadas ni seeds.

## Topología

El navegador llama `/api/v1` en el mismo origen de web. Next reenvía al destino privado `API_INTERNAL_URL` (por defecto `http://localhost:8000/api/v1`), también usado por la comprobación SSR sin caché. Cambiarlo exige rebuild. `CORS_ORIGINS` de API debe incluir el origen público exacto de web (`http://localhost:3000` en desarrollo). Producción requiere HTTPS y API en `NODE_ENV=production`; no se soportan hosts públicos separados con este flujo.

No publicar secretos bajo `NEXT_PUBLIC_`, guardar JWT en almacenamiento web ni reintentar refresh con resultado incierto. Los formularios de login/registro crean sesiones reales; el wizard no actualiza los datos del negocio persistido.

## Guías

- [Frontend](../../docs/frontend.md)
- [Autenticación y límites](../../docs/authentication.md)
- [Roadmap](../../docs/roadmap.md)
- [Reglas de aplicación](./AGENTS.md)

Verificar con lint, formato, typecheck y build desde la raíz. Por instrucción vigente no implementar ni ejecutar tests, smoke checks, HTTP de prueba ni navegador.
