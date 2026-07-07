# Bringo UI

Frontend público de Bringo (landing + app de Buyer y Traveler). Next.js App
Router + TypeScript + Tailwind v4 + shadcn/ui + TanStack Query + Zod.

## Fuentes de verdad

- **Plan de desarrollo**: [docs/PLAN.md](docs/PLAN.md) — hitos F0–F7, mapa
  pantallas ↔ API, decisiones técnicas.
- **Design system**: [docs/DESIGN-coinbase.md](docs/DESIGN-coinbase.md) —
  tokens de color/tipografía/radios. Regla: **nunca hex inline**; todo sale de
  las CSS variables de `src/app/globals.css`.
- **Backend y contrato de API**: repo hermano `../amlscs` — diseño en
  `docs/design/`, Swagger en `http://localhost:3006/api/docs`.

## Desarrollo

```bash
# 1. backend arriba (repo ../amlscs): docker compose up -d postgres && node dist/main.js
# 2. variables
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:3006/api/v1
# 3. dev
npm run dev
```

> El puerto 3000 puede estar ocupado por otra app local; si Next arranca en
> otro puerto, añade ese origen a `CORS_ORIGINS` del backend (`../amlscs/.env`).

## Estructura

```
src/
  app/            # rutas (App Router): (marketing) / (auth) / (app)
  features/       # espejo de los módulos del backend: auth, orders, trips...
  lib/api/        # cliente axios: envelope + ApiError + refresh single-flight
  lib/auth/       # token store (access en memoria, refresh en localStorage)
  components/ui/  # shadcn/ui
```
