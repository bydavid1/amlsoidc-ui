# Capa: App Router

Rutas, grupos, layouts y guards de navegación.

Ficheros: `src/app/**`.

---

## Grupos de rutas

Los grupos `(nombre)` de Next no aparecen en la URL: sirven para dar a cada
superficie su propio layout y su propio guard.

```
app/
├── layout.tsx              raíz: fuentes, metadatos, <Providers>
├── providers.tsx           QueryClient · ThemeProvider · AuthProvider · Toaster
├── globals.css             TOKENS del design system
├── page.tsx                landing (Server Component)
│
├── (auth)/                 público, layout centrado
│   ├── login/
│   └── registro/
│
├── (app)/                  requiere sesión → RequireAuth + AppShell
│   ├── onboarding/
│   ├── comprar/                          espacio BUYER → RequireRole
│   │   ├── nuevo/
│   │   └── [orderId]/
│   │       └── pago-sandbox/
│   ├── viajar/                           espacio TRAVELER → RequireRole
│   │   ├── nuevo/
│   │   ├── encargos/
│   │   └── [tripId]/encargos/
│   ├── cuenta/
│   └── notificaciones/
│
└── (admin)/admin/          requiere rol ADMIN → RequireAuth + comprobación
    ├── page.tsx            "Dinero"
    ├── operacion/[orderId]/
    ├── payouts/
    ├── disputas/
    ├── usuarios/
    ├── configuracion/
    └── curaduria/
```

## Layout raíz

`layout.tsx` fija `lang="es"`, carga Inter y JetBrains Mono con `next/font/google`
(sustitutas documentadas del design system) y envuelve todo en `<Providers>`.

`providers.tsx` monta, en este orden:

1. `QueryClientProvider` — `staleTime: 30s`, y **los 4xx no se reintentan**
   (`ApiError.status < 500` ⇒ `retry: false`); los 5xx, hasta dos veces.
2. `ThemeProvider` — `attribute="class"`, `defaultTheme="light"`,
   `enableSystem={false}`.
3. `AuthProvider` — rehidrata la sesión al montar y escucha el evento de sesión
   expirada.
4. `Toaster` de sonner, arriba y centrado, con `richColors`.

El `QueryClient` se crea con `useState(() => ...)` para que no se recree en cada
render. Es el patrón correcto en App Router.

## Guards

| Guard | Comportamiento | Dónde |
|-------|----------------|-------|
| `RequireAuth` | Skeleton mientras `status === "loading"`; redirige a `/login?next=<ruta>` si es anónimo | `(app)/layout.tsx`, `(admin)/admin/layout.tsx` |
| `RequireRole` | Si falta `BUYER`/`TRAVELER`, muestra una pantalla que **ofrece activar el perfil** en el momento | Espacios de comprar y viajar |
| Comprobación de `ADMIN` | Pantalla de "acceso restringido" con enlace de vuelta | `(admin)/admin/layout.tsx` |

`RequireAuth` preserva el destino en `?next=`, lo cual es correcto — pero conviene
verificar que el formulario de login lo consuma de verdad al redirigir después de
entrar.

`RequireRole` convierte un bloqueo en un botón, aprovechando que la activación de
perfil es idempotente en el backend. Es una de las mejores decisiones de UX de la
app.

> **Recordatorio de seguridad:** estos guards son de **navegación**. La
> autorización real la aplica el backend en cada petición (rol por guard,
> propiedad del recurso por caso de uso). Un usuario que fuerce la URL de
> `/admin` no obtiene datos: la API responde 403.

## Shells

| Shell | Qué trae |
|-------|----------|
| `AppShell` | Cabecera de 64px, wordmark, switch de espacios (Comprar / Viajar), enlace a administración si el usuario es `ADMIN`, campana con contador de no leídas, menú de usuario |
| `AdminShell` | Barra lateral de 240px con 7 secciones, wordmark de operación, logout |
| Marketing | `MarketingNav` + `MarketingFooter` en la landing |

`SupportButton` es un botón flotante de WhatsApp que solo se renderiza si
`NEXT_PUBLIC_SUPPORT_WHATSAPP` está definida.

## Rutas dinámicas

| Ruta | Parámetro |
|------|-----------|
| `/comprar/[orderId]` | Detalle del encargo del comprador |
| `/comprar/[orderId]/pago-sandbox` | Checkout simulado |
| `/viajar/[tripId]/encargos` | Descubrimiento y reclamo del viaje |
| `/admin/operacion/[orderId]` | Expediente administrativo |

## Server vs Client Components

La única página realmente de servidor es la **landing**. Todo lo demás es cliente,
porque depende del access token que vive en memoria del navegador.

**Problema en la landing:** hace `fetch` a `NEXT_PUBLIC_API_URL` desde el
servidor. Esa variable es una URL de navegador; en un contenedor `localhost` no
es la API. El `catch` devuelve `[]`, así que la sección de corredores aparece
**vacía sin ningún error visible** (→ R-40).

## Metadatos y SEO

`layout.tsx` define `title` con plantilla (`%s · <producto>`) y `description`.
**Ninguna página define sus propios metadatos**, así que todas heredan el título
por defecto. Para la landing y las páginas públicas conviene ponerlos.

No hay `sitemap.ts`, ni `robots.ts`, ni Open Graph, ni datos estructurados.

## Deuda y riesgos

| Id | Qué |
|----|-----|
| R-40 | La landing llama a la API con una URL de cliente desde el servidor |
| R-27 | El copy de la landing describe un modelo que ya no existe |

**Además:**

- No hay `error.tsx` ni `not-found.tsx` en ningún grupo: un error no capturado
  cae en la pantalla de error por defecto de Next.
- No hay `loading.tsx`: cada página gestiona su propio skeleton.
- Sin metadatos por página.
- `next.config.ts` está prácticamente vacío: falta `images.remotePatterns` y
  cabeceras de seguridad.

## Pendientes

- [ ] `error.tsx` y `not-found.tsx` por grupo de rutas
- [ ] Metadatos por página en las públicas; Open Graph
- [ ] Ruta de verificación de identidad del viajero (→ FE-E3)
- [ ] Rutas de administración que faltan: KYC, blocklist, riesgo de viajero
- [ ] `images.remotePatterns` y cabeceras de seguridad en `next.config.ts`
- [ ] Confirmar que el login consume `?next=` al redirigir
- [ ] URL interna de API para las llamadas de servidor (→ R-40)
