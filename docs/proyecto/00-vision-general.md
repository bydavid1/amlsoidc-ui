# 00 — Visión general del frontend

## Qué es esta app

El cliente web del sistema. Cubre **tres superficies** en una sola aplicación
Next.js:

| Superficie | Rutas | Quién |
|------------|-------|-------|
| Marketing | `/` | Público |
| Autenticación | `/login`, `/registro` | Público |
| App | `/comprar/*`, `/viajar/*`, `/cuenta`, `/notificaciones`, `/onboarding` | `BUYER` y `TRAVELER` |
| Consola de operación | `/admin/*` | `ADMIN` |

Consume la misma API `/api/v1` que consumirán el cliente móvil y cualquier
integración: **no hay endpoints "solo para la web"**.

Modelo de negocio, actores y glosario:
[`../../../docs/00-plataforma.md`](../../../docs/00-plataforma.md).
Contrato con la API:
[`../../../docs/01-integracion.md`](../../../docs/01-integracion.md).

## Stack

| Capa | Tecnología | Versión |
|------|------------|---------|
| Framework | Next.js (App Router) | 16.2 |
| UI | React | 19.2 |
| Lenguaje | TypeScript | 5 |
| Estilos | Tailwind CSS | 4 (con `@tailwindcss/postcss`) |
| Componentes | shadcn/ui sobre Radix UI | — |
| Estado de servidor | TanStack Query | 5 |
| HTTP | axios | 1.18 |
| Formularios | react-hook-form + `@hookform/resolvers` | 7 |
| Validación | Zod | 4 |
| Iconos | lucide-react, @hugeicons | — |
| Notificaciones UI | sonner | 2 |
| Temas | next-themes | 0.4 |
| Fechas | date-fns | 4 |

**No hay infraestructura de pruebas**: ni Jest, ni Vitest, ni Playwright, ni
Testing Library. Ningún script de test en `package.json`.

## Las cinco decisiones que explican la estructura

### 1. Cero lógica de negocio en el cliente

La máquina de estados vive en el backend. La UI **refleja** estados y **dispara
acciones** (`confirm-purchase`, `claim`, `cancel`), nunca edita estados.

Consecuencia práctica: cuando el backend devuelve `409`, **no es un bug**. Es que
el estado cambió (la otra parte actuó) o la acción no aplicaba. La UI refresca y
explica, no reintenta a ciegas.

Los helpers de `components/status/order-status.ts` (`buyerActions.canCancel`,
`canConfirmPurchase`, …) son un **espejo** de las invariantes del backend para
decidir qué botón mostrar. Son una conveniencia de UX, **no la autoridad**: si
divergen del backend, manda el backend.

### 2. El design system es ley

Todos los colores, tipografías, radios y espaciados salen de las CSS variables de
`src/app/globals.css`, derivadas de `docs/DESIGN-coinbase.md`.

**Prohibido el hex inline.** Un solo color de acción (`primary`), CTAs siempre
pill, cards a 24px, colores semánticos solo como texto (nunca como fondo de
bloque).

Ver [06-design-system.md](06-design-system.md).

### 3. `features/` es el espejo de los módulos del backend

```
src/features/<modulo>/
├── api.ts          llamadas + esquemas Zod (+ hooks en los módulos pequeños)
├── hooks.ts        hooks de TanStack Query (en los módulos grandes)
├── schemas.ts      esquemas de formulario y de respuesta
└── components/     componentes con lógica de esa feature
```

Un nombre de feature = un módulo del backend. Así el mapa mental es único entre
los dos repos y no hay que traducir.

### 4. Los tipos de la API se validan en la frontera

Cada `features/*/api.ts` parsea la respuesta con un esquema de Zod. Si el
contrato de la API cambia, **falla ruidoso ahí** y no tres componentes más abajo
con un `undefined`.

Es la sustitución pragmática de un cliente generado desde OpenAPI: hay que
mantenerlo a mano, pero rompe en el sitio correcto.

### 5. Sesión: access en memoria, refresh en `localStorage`

| Token | Dónde |
|-------|-------|
| Access (15 min) | **Solo en memoria** (variable de módulo) |
| Refresh (7 días) | `localStorage` |

El backend **rota** el refresh en cada uso y **detecta reuso** revocando toda la
familia. Por eso el cliente implementa **refresh *single-flight*** obligatorio:
dos refresh concurrentes con el mismo token matan la sesión.

Riesgo aceptado y documentado: el refresh en `localStorage` es accesible a XSS.
Mitigación: rotación + detección de reuso en el backend.

Hueco conocido: el *single-flight* es **por pestaña**. Dos pestañas abiertas
pueden rotar el mismo token y matar la sesión (→ R-07).

## Server Components vs Client Components

Regla: **Server Components por defecto, Client Components solo donde hay
interacción** (formularios, mutaciones, polling).

En la práctica la mayor parte de la app es cliente, porque toda pantalla
autenticada depende del token que vive en memoria del navegador. Solo la landing
es realmente de servidor — y ahí hay un problema: hace `fetch` a
`NEXT_PUBLIC_API_URL`, una URL pensada para el navegador, desde el servidor
(→ R-40).

## Sin websockets: polling

No hay tiempo real. Las pantallas activas refrescan con `refetchInterval`:

| Consulta | Intervalo |
|----------|-----------|
| Detalle de pedido (activo) | 30 s |
| Encargos del viajero | 30 s |
| Encargos disponibles de un viaje | 30 s |
| Estado del pago | 30 s |
| Notificaciones | 30 s |

Es suficiente para un piloto y evita infraestructura de sockets. Con volumen
habrá que revisarlo: cinco consultas a 30 s por usuario activo es carga
constante.

## Qué NO está aquí

- **Pantalla de KYC del viajero.** El backend acepta expedientes; la UI no tiene
  forma de crear uno. Es el hueco funcional más grande.
- **Registro funcional.** El formulario no envía el documento de identidad que la
  API exige, así que **el registro falla siempre** (→ R-02).
- **Pruebas.** Ninguna.
- **Internacionalización.** Todo el texto está en español, en el código.
- **Accesibilidad revisada.** Se hereda lo que traen Radix y shadcn; no hay
  auditoría.
- **Modo oscuro.** `next-themes` está configurado con `defaultTheme="light"` y
  `enableSystem={false}`: hay infraestructura, no hay paleta oscura.
