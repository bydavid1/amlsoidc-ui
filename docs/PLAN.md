# Bringo UI — Plan de desarrollo del frontend público

> Contraparte visual de la **parte pública** del backend de Bringo (landing +
> app de Buyer y Traveler). El panel Admin queda explícitamente **fuera** de
> este plan (será otra superficie que consume la misma API).
>
> Fuentes de verdad:
> - **Negocio y API**: `../amlscs/docs/design/` (00–08) y Swagger en `http://localhost:3006/api/docs`
> - **Design system**: [DESIGN-coinbase.md](DESIGN-coinbase.md) — paleta, tipografía, radios, spacing y componentes

---

## 1. Principios

1. **API First del lado del cliente**: la UI consume exactamente la misma API
   que consumirá Flutter y Admin (`/api/v1`). Nada de lógica de negocio en el
   frontend: la máquina de estados vive en el backend; la UI **refleja**
   estados y ofrece **acciones** (`confirm-purchase`, `accept`, `cancel`...),
   nunca edita estados.
2. **El design system es ley**: todos los colores/tipos/radios salen de los
   tokens de `DESIGN-coinbase.md` mapeados a CSS variables. Prohibido el hex
   inline. Un solo color de acción (`primary #0052ff`), CTAs siempre pill,
   cards a 24px, display weight 400.
3. **Server Components por defecto, Client Components solo donde hay
   interacción** (formularios, mutaciones, polling). El catálogo público
   (countries/corridors) puede renderizarse en server.
4. **Estados honestos**: cada pantalla define loading (skeleton), empty, error
   (mapeado por `error.code`) y success. Nunca un spinner infinito.

---

## 2. Contrato con el backend (lo que la UI debe respetar)

- **Base URL**: `NEXT_PUBLIC_API_URL` (dev: `http://localhost:3006/api/v1`).
- **Envelope**: éxito `{ success: true, data, meta: { requestId, nextCursor? | page/pageSize/totalItems/totalPages } }`;
  error `{ success: false, error: { code, message, details[] }, meta }`.
  El cliente HTTP des-envuelve `data` y normaliza errores **una sola vez**.
- **Auth**: access token JWT (15 min) + refresh token opaco (7 días) **con
  rotación y detección de reuso**: cada refresh devuelve un refresh nuevo; el
  viejo muere. Si llega `REFRESH_TOKEN_REUSED` → logout total.
- **Roles por perfil**: un usuario nace sin roles; `POST /users/me/buyer-profile`
  y `POST /users/me/traveler-profile` activan BUYER/TRAVELER (idempotentes).
  Una misma persona puede ser ambos → la UI ofrece **dos espacios** (Comprar /
  Viajar) y un onboarding de activación.
- **Estado del pedido en dos niveles**: `status` (backbone) +
  `fulfillmentStatus` (sub-flujo) + `displayStatus` (proyección aplanada para
  mostrar). La UI pinta `displayStatus` y usa `status` para decidir qué
  acciones ofrecer.
- **El Buyer no elige Traveler**: no existe pantalla de candidatos. El matching
  es automático; el Buyer solo ve el estado de su pedido.
- **Paginación**: cursor (`limit`, `cursor` → `meta.nextCursor`) en orders/
  trips/assignments; offset (`page`, `pageSize`) en catálogos.

### Códigos de error que la UI debe traducir a UX (no mostrar `message` crudo)

| `error.code` | UX |
|---|---|
| `VALIDATION_ERROR` | errores por campo en el form (viene `details[{field, errors}]`) |
| `INVALID_CREDENTIALS` | "Correo o contraseña incorrectos" |
| `EMAIL_ALREADY_REGISTERED` | inline en el campo email |
| `UNAUTHENTICATED` | intentar refresh; si falla → redirigir a login |
| `USER_SUSPENDED` | pantalla de cuenta suspendida (bloqueo total) |
| `REFRESH_TOKEN_REUSED` / `REFRESH_TOKEN_EXPIRED` | logout + aviso de sesión cerrada |
| `CORRIDOR_NOT_ENABLED` | "Aún no operamos esa ruta" + link a corredores disponibles |
| `CITY_NOT_IN_DESTINATION_COUNTRY` | inline en el selector de ciudad |
| `BUYER_PROFILE_REQUIRED` / `TRAVELER_PROFILE_REQUIRED` | redirigir al onboarding de activación |
| `ASSIGNMENT_EXPIRED` | "La oferta venció" + refrescar lista |
| `INVALID_STATE_TRANSITION` / `ORDER_NOT_CANCELLABLE` / `FULFILLMENT_NOT_READY` | toast explicativo + re-fetch del detalle |
| `ALREADY_RATED` / `ORDER_NOT_RATEABLE` | deshabilitar el CTA de calificar |
| `RATE_LIMITED` (429) | toast "Demasiados intentos, espera un momento" |

---

## 3. Theming: DESIGN-coinbase.md → Tailwind + shadcn/ui

- **CSS variables** en `globals.css` (`:root` y `.dark`) generadas 1:1 desde el
  YAML del design file: `--primary: #0052ff`, `--ink`, `--body`, `--muted`,
  `--hairline`, `--surface-soft/strong/dark/dark-elevated`, `--semantic-up`,
  `--semantic-down`, etc. shadcn/ui se configura para leer estas variables
  (mapear a sus slots: `--background`, `--foreground`, `--primary`, `--muted`,
  `--border`, `--destructive`...).
- **Fuentes** (sustitutas documentadas en el design file, vía `next/font`):
  - Display → **Inter** weight 400 con `letter-spacing` negativo (−1 a −2px en display).
  - Body/UI → **Inter** 400/600.
  - Números (precios, capacidad, fechas tabulares) → **JetBrains Mono** 500
    (`font-mono`): todo valor numérico usa `number-display`.
- **Radios**: `--radius` base 12px (inputs); clases utilitarias para
  `rounded-[24px]` (cards) y `rounded-full` (todos los CTAs = pill, avatares,
  badges). **Ningún** botón con esquinas rectas.
- **Tipografía como clases utilitarias** (`display-mega`…`caption-strong`)
  definidas en Tailwind theme para no repetir tamaños a mano.
- **Ritmo de página**: bandas de 96px (`py-24`), rotación blanco → gris suave
  (`surface-soft`) → hero oscuro (`surface-dark #0a0b0d`), contenido a 1200px.
- **Dark mode** con `next-themes`: el design file es light-first; el dark global
  reutiliza `surface-dark`/`surface-dark-elevated` como canvas. (La landing usa
  las bandas oscuras como parte del diseño aunque el tema sea light.)
- **Semánticos de estado** (mapeo Bringo): verde `semantic-up` para estados de
  avance (DELIVERED, COMPLETED), rojo `semantic-down` para CANCELLED/EXPIRED/
  DISPUTED, amarillo `accent-yellow` SOLO ilustrativo. Siempre como **texto o
  puntito**, nunca fondo del badge (regla del design system).

---

## 4. Arquitectura del proyecto

```
amlscs-ui/
  src/
    app/
      (marketing)/                 # rutas públicas sin auth
        page.tsx                   # landing
        como-funciona/page.tsx
        corredores/page.tsx
      (auth)/
        login/page.tsx
        registro/page.tsx
      (app)/                       # autenticado, layout con nav de app
        onboarding/page.tsx        # activar perfil Buyer/Traveler
        comprar/                   # espacio BUYER
          page.tsx                 # mis pedidos (lista)
          nuevo/page.tsx           # wizard crear pedido
          [orderId]/page.tsx       # detalle + timeline + acciones
        viajar/                    # espacio TRAVELER
          page.tsx                 # mis viajes
          nuevo/page.tsx           # crear viaje
          ofertas/page.tsx         # assignments (aceptar/rechazar/avanzar)
        notificaciones/page.tsx
        cuenta/page.tsx
      layout.tsx  providers.tsx
    features/                      # espejo de los módulos del backend
      auth/        # api.ts, hooks.ts (useLogin...), schemas.ts (Zod), components/
      orders/
      trips/
      assignments/
      geography/
      notifications/
      ratings/
      incidents/
    lib/
      api/client.ts                # axios + interceptores (envelope, refresh)
      api/types.ts                 # ApiEnvelope, ApiError, cursor types
      auth/token-store.ts          # access en memoria, refresh persistido
      utils.ts                     # clsx/cn, date-fns helpers
    components/
      ui/                          # shadcn/ui generados
      layout/                      # TopNav, Footer, AppShell, RoleSwitch
      status/                      # OrderStatusBadge, OrderTimeline, StatusStepper
      data/                        # CursorList (infinite), EmptyState, ErrorState, Skeletons
  .env.local.example               # NEXT_PUBLIC_API_URL
```

**Convenciones** (espejo de las del backend):
- Un feature = un módulo del backend; dentro: `api.ts` (llamadas puras),
  `schemas.ts` (Zod: parse de responses + forms), `hooks.ts` (TanStack Query),
  `components/`. Las páginas componen features, no llaman axios directo.
- **Zod en la frontera**: cada response se parsea con su schema (fallar ruidoso
  en dev si el contrato cambia). Los mismos schemas alimentan React Hook Form
  (`zodResolver`) para validar ANTES de enviar, con las mismas reglas que los
  DTOs del backend (password ≥ 8, score 1–5, URL válida, capacity 1–50...).
- **Query keys** normalizadas: `['orders', 'list', filters]`,
  `['orders', 'detail', id]`, `['assignments', 'mine']`... Toda mutación
  invalida las keys que toca (accept → orders + assignments + trips).

### Cliente HTTP y sesión (decisión clave)

- `axios` con interceptores: (1) adjunta `Authorization: Bearer`; (2)
  des-envuelve el envelope y lanza `ApiError { code, details, requestId }`;
  (3) ante `401 UNAUTHENTICATED` hace **un** intento de
  `POST /auth/refresh` con **cola de peticiones en vuelo** (single-flight: si
  hay N requests fallando a la vez, solo un refresh; las demás esperan) —
  crítico porque la rotación invalida el refresh anterior: dos refresh
  concurrentes con el mismo token disparan la detección de reuso y matan la
  sesión.
- Access token **en memoria**; refresh token en `localStorage`
  (`bringo.refresh`). Al montar la app: si hay refresh → `refresh()` para
  rehidratar sesión; si falla → estado anónimo. Logout llama
  `POST /auth/logout` (revoca la familia) y limpia todo.
- Guard de rutas `(app)`: sin sesión → `/login?next=...`. Guard de espacio:
  sin rol BUYER → interstitial de activación (misma para TRAVELER).

---

## 5. Mapa de pantallas ↔ API

### Marketing (público, sin auth)
| Pantalla | Contenido | Endpoints |
|---|---|---|
| **Landing** | Hero oscuro (`hero-band-dark` + product-ui-cards flotantes mostrando un pedido real de la UI), "cómo funciona" en 2 carriles (Buyer/Traveler), banda de corredores activos, CTA band | `GET /corridors` (server) |
| **Cómo funciona** | Los 9 pasos del flujo MVP en stepper editorial | — |
| **Corredores** | Corredores habilitados + países/ciudades | `GET /corridors`, `GET /countries` |

### Auth
| Pantalla | Endpoints | Notas |
|---|---|---|
| Registro | `POST /auth/register` | password ≥ 8; al éxito → onboarding |
| Login | `POST /auth/login` | rate-limit: mostrar `RATE_LIMITED` |
| (transversal) | `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` | interceptor |

### Onboarding
| Pantalla | Endpoints |
|---|---|
| "¿Qué quieres hacer en Bringo?" — activa uno o ambos perfiles | `POST /users/me/buyer-profile`, `POST /users/me/traveler-profile`, `GET /users/me` |

### Espacio Buyer (`/comprar`)
| Pantalla | Endpoints | Acciones visibles según `status` |
|---|---|---|
| Mis pedidos (lista cursor + filtro estado) | `GET /orders?status=&cursor=` | — |
| Nuevo pedido (wizard: producto → ruta → resumen) | `GET /countries`, `GET /countries/:id/cities`, `GET /corridors`, `POST /orders` | valida corredor ANTES de enviar |
| Detalle del pedido | `GET /orders/:id` (incluye `timeline`) | `PENDING_ASSIGNMENT`: cancelar · `ASSIGNED/SOURCING+AWAITING_PURCHASE`: confirmar compra / cancelar · `SOURCING+PURCHASED→`: solo seguimiento · `READY_FOR_DELIVERY`: **confirmar entrega** (acción estrella del Buyer) · `DELIVERED`: calificar · cualquiera activo: reportar problema |
| Acciones | `POST /orders/:id/confirm-purchase`, `/confirm-delivery`, `/cancel`, `/ratings`, `/report-issue` | |

### Espacio Traveler (`/viajar`)
| Pantalla | Endpoints | Notas |
|---|---|---|
| Mis viajes (lista cursor) | `GET /trips` | badge de capacidad `remaining/total` en mono |
| Nuevo viaje | `POST /trips` → `POST /trips/:id/publish` | crear queda DRAFT; publicar es acción explícita |
| Cancelar viaje | `POST /trips/:id/cancel` | avisar: "tus pedidos asignados se reasignarán" |
| **Ofertas y encargos** | `GET /assignments` | la pantalla operativa del Traveler: ofertas `OFFERED` con **countdown a `expiresAt`** + aceptar/rechazar; encargos `ACCEPTED` con las acciones de avance |
| Acciones | `POST /assignments/:id/accept`, `/reject`, `/mark-received`, `/mark-in-transit`, `/mark-arrived` | tras DELIVERED: calificar al Buyer (`POST /orders/:id/ratings`) |

### Transversales
| Pantalla | Endpoints | Notas |
|---|---|---|
| Notificaciones | `GET /notifications?unreadOnly=`, `POST /notifications/:id/read` | polling con TanStack Query (`refetchInterval` 30s) + badge en TopNav; el detalle de pedido activo también refresca cada 30s (no hay websockets en el MVP) |
| Cuenta | `GET /users/me` | roles, estado, logout |

### Componentes de estado (los más importantes del proyecto)
- **`OrderStatusBadge`**: `displayStatus` → etiqueta ES + color semántico
  (avance = verde texto, terminal malo = rojo texto, resto = ink/muted).
- **`OrderTimeline`**: renderiza `timeline[]` del backend (incluye entradas
  `fulfillment:*` como sub-pasos indentados) con fechas `date-fns` en ES.
- **`StatusStepper`**: los 9 pasos del flujo feliz con el actual resaltado —
  reutilizado en detalle de pedido (Buyer) y encargo (Traveler).
- **`CursorList`**: lista infinita genérica sobre `useInfiniteQuery` +
  `meta.nextCursor`; skeletons y empty states integrados.

---

## 6. Hitos (F0–F7), en orden de dependencias

| Hito | Alcance | Criterio de aceptación (verificable) |
|---|---|---|
| **F0 — Fundaciones** | Scaffold Next.js App Router + TS estricto; Tailwind + shadcn/ui; tokens del design file como CSS vars + fuentes Inter/JetBrains Mono; ESLint/Prettier; `lib/api/client.ts` con envelope + errores tipados; providers (Query, themes); `.env.local.example` | `npm run build` y `lint` limpios; página demo renderiza tokens (botón pill azul, card 24px, número en mono) |
| **F1 — Auth + sesión** | Registro, login, token-store, interceptor de refresh **single-flight**, logout, guards, pantalla USER_SUSPENDED | Ciclo completo contra la API real: registro → sesión persistida tras F5 → refresh automático al vencer el access → logout revoca. Reuso de refresh = logout limpio |
| **F2 — Onboarding + shell de app** | AppShell (TopNav estilo `top-nav-light`, switch Comprar/Viajar, badge de notificaciones), onboarding de perfiles, cuenta | Usuario nuevo activa Buyer y/o Traveler y ve los espacios correctos según roles |
| **F3 — Landing pública** | Hero dark con product-ui-cards, cómo funciona, corredores desde la API, CTA band, footer | Lighthouse ≥ 90 en performance/a11y; corredores reales renderizados en server |
| **F4 — Espacio Buyer** | Wizard de pedido con catálogos dependientes (país→ciudad), lista con cursor, detalle con StatusStepper + OrderTimeline, acciones por estado, cancelación | Flujo E2E manual contra el backend: crear pedido → verlo PENDING → (con un trip publicado) verlo ASSIGNED → confirm-purchase → confirm-delivery, con la UI reaccionando solo a `status` |
| **F5 — Espacio Traveler** | Crear/publicar/cancelar viaje, pantalla de ofertas con countdown, aceptar/rechazar, acciones de avance del paquete | El mismo flujo E2E del backend ejecutado 100% desde la UI con dos navegadores (Buyer y Traveler) en paralelo |
| **F6 — Cierre del ciclo** | Ratings (modal 1–5 + comentario, ambos roles), report-issue, notificaciones con polling y marcar leída | Pedido llega a COMPLETED calificando desde ambas sesiones; disputa abre y el pedido muestra DISPUTED |
| **F7 — Calidad y pulido** | Mapeo exhaustivo de códigos de error, skeletons/empty/error en toda lista, responsive (tabla de breakpoints del design file: hero 80→40px, grids 3→1, nav hamburguesa), a11y (focus rings azules, targets 44px), dark mode | Revisión pantalla por pantalla contra los Do's/Don'ts del design file; sin hex inline (`grep` en CI) |

Paralelización: F3 (landing) es independiente y puede ir en paralelo con F1–F2.
F4 y F5 comparten los componentes de estado (construirlos al inicio de F4).

---

## 7. Riesgos y decisiones abiertas

| # | Riesgo / decisión | Mitigación propuesta |
|---|---|---|
| R1 | **Refresh token en `localStorage`** es vulnerable a XSS (el backend hoy lo entrega en el body, no como cookie httpOnly) | Mitigado por rotación + detección de reuso del backend. **Decisión futura recomendada**: endpoint de refresh con cookie httpOnly `SameSite=Strict` (cambio de backend) — anotado como mejora, no bloquea el MVP |
| R2 | Sin tiempo real: la oferta al Traveler puede vencer (30 min) sin que la vea | Polling de 30s + countdown visible + notificación; push/websockets = fase futura |
| R3 | Drift del contrato API ↔ UI | Zod parsea toda response en dev; opcional: generar types desde el OpenAPI (`/api/docs-json`) en CI |
| R4 | Un usuario con ambos roles puede confundir contextos | Espacios separados `/comprar` y `/viajar` con switch explícito en el TopNav, nunca mezclar acciones de ambos roles en una pantalla |
| R5 | CORS | El backend ya permite `http://localhost:5173,4200`; **añadir `http://localhost:3000` (o el puerto del Next dev) a `CORS_ORIGINS` del backend** antes de F1 |
| R6 | Fuentes licenciadas Coinbase | Se usan las sustitutas documentadas (Inter / JetBrains Mono) desde el día 1 |

---

## 8. Definición de "hecho" (por pantalla)

1. Consume la API real (no mocks) respetando envelope y códigos de error.
2. Estados loading / empty / error / success implementados.
3. Solo tokens del design system (sin hex ni px mágicos inline).
4. Responsive según la tabla de breakpoints del design file.
5. Acciones deshabilitadas/ocultas según `status` real del recurso (la UI nunca
   asume que una transición es válida: si el backend devuelve 409, re-fetch y
   toast).
6. Textos en español; fechas con `date-fns` y locale `es`.
