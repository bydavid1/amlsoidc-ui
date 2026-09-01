---
name: nextjs-app-router-conventions
description: >
  Convenciones de este proyecto Next.js 16 con App Router: grupos de rutas,
  layouts, guards, Server vs Client Components, dónde va cada fichero y cómo se
  organiza una feature. Consúltalo antes de crear una ruta, un layout o un
  componente nuevo.
---

# Convenciones de App Router

## Grupos de rutas

Los grupos `(nombre)` no aparecen en la URL: dan a cada superficie su propio
layout y su propio guard.

```
app/
├── layout.tsx              raíz: fuentes, metadatos, <Providers>
├── providers.tsx           QueryClient · Theme · Auth · Toaster
├── globals.css             TOKENS del design system
├── page.tsx                landing (Server Component)
├── (auth)/                 público, layout centrado
├── (app)/                  requiere sesión → RequireAuth + AppShell
└── (admin)/admin/          requiere ADMIN → RequireAuth + comprobación de rol
```

**Al crear una ruta, elige el grupo correcto.** Es lo que determina el guard y el
shell; no los repliques a mano.

## Guards

| Guard | Comportamiento | Dónde se aplica |
|-------|----------------|-----------------|
| `RequireAuth` | Skeleton mientras rehidrata; a `/login?next=` si es anónimo | Layout de `(app)` y de `(admin)` |
| `RequireRole` | Si falta `BUYER`/`TRAVELER`, **ofrece activar el perfil** | Envolviendo el contenido de cada espacio |
| Comprobación de `ADMIN` | Pantalla de acceso restringido | Layout de `(admin)` |

> Son guards de **navegación**, no de autorización. La autoridad es el backend:
> rol por guard, propiedad del recurso por caso de uso. Un usuario que fuerce la
> URL no obtiene datos.

Tras activar un perfil hay que llamar a **`refreshUser()`**: los roles cambian y el
usuario en memoria tiene los viejos.

## Server vs Client Components

Regla: **Server Components por defecto, Client Components donde hay
interacción.**

En la práctica casi todo es cliente, porque toda pantalla autenticada depende del
access token que vive en memoria del navegador.

Necesitas `"use client"` si el componente usa: hooks de React, hooks de TanStack
Query, `useAuth`, manejadores de eventos, `useRouter` / `usePathname` /
`useSearchParams`, o `tokenStore`.

⚠️ **No uses `NEXT_PUBLIC_API_URL` desde un Server Component.** Es una URL de
navegador; en un contenedor `localhost` no es la API. Ya pasa en la landing
(→ R-40).

⚠️ `tokenStore` desde el servidor devuelve `null` por diseño. La lógica que
dependa de ello se rompe **en silencio**.

## Estructura de una feature

```
features/<modulo>/
├── api.ts          llamadas + esquemas Zod  (features pequeñas: también hooks)
├── hooks.ts        hooks de TanStack Query  (features grandes)
├── schemas.ts      esquemas de formulario y de respuesta
└── components/     componentes con lógica de esa feature
```

Un nombre de feature = **un módulo del backend**. El mapa mental es único entre
los dos repos.

Patrón observado y consistente: las features grandes (`orders`, `trips`,
`assignments`) separan `hooks.ts`; las pequeñas (`payments`, `notifications`,
`geography`, `admin`) declaran los hooks dentro de `api.ts`. Sigue el que
corresponda por tamaño.

## Dónde va cada fichero

| Si es… | Va en |
|--------|-------|
| Genérico, sin conocer el dominio | `components/ui/` (shadcn — **no editar**) |
| Estructura de página, navegación, guard | `components/layout/` |
| Traducción de un concepto del dominio a UX | `components/status/` |
| Con conocimiento de un módulo del backend | `features/<modulo>/` |
| Una llamada a la API | `features/<modulo>/api.ts`, **nunca** en un componente |

## Providers

`providers.tsx` monta, en este orden: `QueryClientProvider` → `ThemeProvider` →
`AuthProvider` → `Toaster`.

El `QueryClient` se crea con `useState(() => new QueryClient(...))` para que no se
recree en cada render. **No crees otro en un componente.**

Configuración relevante: `staleTime: 30_000`, y `retry` que **no reintenta los
4xx** (`ApiError.status < 500` ⇒ `false`) y reintenta los 5xx hasta dos veces.

## Rutas dinámicas

`[param]` y se leen con `useParams<{ param: string }>()` en cliente. Un componente
que use `useSearchParams` debe ir envuelto en `<Suspense>` (ver la página de
checkout sandbox como referencia).

## Lo que falta y conviene añadir

- **`error.tsx`** por grupo: hoy un error no capturado cae en la pantalla por
  defecto de Next.
- **`not-found.tsx`**: no hay 404 propia.
- **Metadatos por página**: solo existen los del layout raíz, así que todas las
  páginas heredan el mismo título.
- `sitemap.ts`, `robots.ts`, Open Graph.
- `images.remotePatterns` y cabeceras de seguridad en `next.config.ts`, que está
  prácticamente vacío.

## Fuentes

`layout.tsx` carga Inter y JetBrains Mono con `next/font/google`, como
**sustitutas documentadas** de las tipografías propietarias del design system.

**Consecuencia:** `npm run build` **falla sin salida a internet**. Para verificar
cambios usa `npx tsc --noEmit` y `npm run lint`.
