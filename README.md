# Frontend / UI

Cliente web de la plataforma: landing pública, autenticación, app de comprador y
viajero, y consola de operación.

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui ·
TanStack Query · Zod.

> La plataforma aún no tiene nombre asignado; la documentación la nombra
> genéricamente. Ver [`../docs/00-plataforma.md`](../docs/00-plataforma.md)
> §Nomenclatura.

## Documentación

**Empieza aquí:** [docs/README.md](docs/README.md) — índice maestro.

| Documento | Para qué |
|-----------|----------|
| [`../docs/00-plataforma.md`](../docs/00-plataforma.md) | Negocio, actores, modelo vigente, glosario |
| [`../docs/01-integracion.md`](../docs/01-integracion.md) | **Contrato con la API**: envelope, auth, errores, endpoints, variables |
| [`../docs/02-riesgos.md`](../docs/02-riesgos.md) | Riesgos abiertos del workspace (ids `R-nn`) |
| [docs/proyecto/01-estado-actual.md](docs/proyecto/01-estado-actual.md) | **Qué pantallas existen y qué falta** |
| [docs/proyecto/02-guia-de-desarrollo.md](docs/proyecto/02-guia-de-desarrollo.md) | Setup, comandos, convenciones |
| [docs/proyecto/06-design-system.md](docs/proyecto/06-design-system.md) | Tokens y reglas de estilo |
| [docs/modulos/](docs/modulos/) | Una ficha por feature y por capa |
| [docs/DESIGN-coinbase.md](docs/DESIGN-coinbase.md) | Design system (**vigente y normativo**) |
| [docs/PLAN.md](docs/PLAN.md) | Plan original (parcialmente vigente) |
| [AGENTS.md](AGENTS.md) · [CLAUDE.md](CLAUDE.md) | Guía para agentes de IA |

## Desarrollo

```bash
# 1) La API tiene que estar arriba (repo hermano ../amlsoidc)
cd ../amlsoidc
docker compose up -d postgres     # OJO: publica 5433 en el host, no 5432
npm run start:dev

# 2) Este repo
cd ../amlsoidc-ui
npm ci
cp .env.local.example .env.local
npm run dev
```

### Avisos importantes antes de arrancar

- **Puertos:** la API y Next pelean por el 3000 con la configuración de ejemplo.
  Fija un `PORT` distinto en el backend (por ejemplo 3006) y ajusta
  `NEXT_PUBLIC_API_URL` para que coincida.
- **CORS:** añade el origen real del frontend a `CORS_ORIGINS` del backend
  (`../amlsoidc/.env`), o **todas** las peticiones fallarán por CORS con errores
  de red genéricos.
- **`npm run build` falla sin salida a internet**, porque las fuentes se cargan
  desde Google Fonts. Para verificar cambios: `npx tsc --noEmit && npm run lint`.
- **El registro de usuarios está caído** (→ R-02): el formulario no envía el
  documento de identidad que la API exige. Léelo antes de probar el flujo
  completo.

## Comandos

```bash
npm run dev        # desarrollo
npm run build      # build de producción
npm run start      # servir el build
npm run lint       # eslint
npx tsc --noEmit   # comprobación de tipos (no hay script propio)
```

**No hay ningún script de test** ni infraestructura de pruebas (→ R-38).

## Estructura

```
src/
├── app/            rutas (App Router): (auth) / (app) / (admin) + landing
│   ├── globals.css TOKENS del design system
│   └── providers.tsx
├── features/       espejo de los módulos del backend: auth, orders, trips, ...
├── components/     ui (shadcn) · layout (shell, guards) · status (estados a UX)
└── lib/            api (cliente axios) · auth (token store)
```

## Reglas del proyecto

1. **Cero lógica de negocio en el cliente.** La máquina de estados vive en el
   backend; la UI refleja estados y dispara acciones. Un `409` no es un bug: es el
   estado que cambió.
2. **El design system es ley.** Nunca un hex inline: todo sale de los tokens de
   `globals.css`.
3. **Toda llamada a la API pasa por `lib/api/client`** y toda respuesta se parsea
   con Zod en `features/*/api.ts`.
4. **Nunca un secreto en `NEXT_PUBLIC_*`**: se compila en el bundle.
