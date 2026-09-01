# 02 — Guía de desarrollo del frontend

## 1. Puesta en marcha

```bash
# 1) La API tiene que estar arriba (repo hermano ../amlsoidc)
cd ../amlsoidc
docker compose up -d postgres
npm run start:dev

# 2) Este repo
cd ../amlsoidc-ui
npm ci
cp .env.local.example .env.local
npm run dev
```

### Variables de `.env.local`

| Variable | Qué es |
|----------|--------|
| `NEXT_PUBLIC_API_URL` | Base de la API, con `/api/v1`. **Debe coincidir con el `PORT` real del backend** |
| `NEXT_PUBLIC_SUPPORT_WHATSAPP` | Teléfono del botón de soporte |
| `NEXT_PUBLIC_HUB_ADDRESS` | Dirección del hub que se muestra al viajero |
| `NEXT_PUBLIC_SANDBOX_SECRET` | ⚠️ **Secreto expuesto al navegador. No debería existir** (→ R-01) |

> **Todo lo que empieza con `NEXT_PUBLIC_` se compila dentro del bundle** y es
> visible para cualquier usuario. Nunca pongas un secreto ahí.

### Avisos de puertos y CORS

- El backend por defecto usa `PORT=3000` y Next también: **uno de los dos hay que
  moverlo.** Recomendación: `PORT=3006` en el backend.
- El origen real del frontend tiene que estar en `CORS_ORIGINS` del backend, o
  todas las peticiones fallarán por CORS.
- El `.env.local.example` apunta a `3006`; el `.env.example` del backend dice
  `3000`. Es una incoherencia conocida (→ R-09).

## 2. Comandos

```bash
npm run dev        # desarrollo
npm run build      # build de producción
npm run start      # servir el build
npm run lint       # eslint (eslint-config-next)
npx tsc --noEmit   # comprobación de tipos (NO hay script propio)
```

**No hay ningún script de test** ni infraestructura de pruebas (→ R-38).

> `npm run build` puede fallar en entornos sin salida a internet, porque
> `src/app/layout.tsx` carga Inter y JetBrains Mono desde Google Fonts. Para
> verificar cambios usa `npx tsc --noEmit` y `npm run lint`.

## 3. Estructura

```
src/
├── app/                       App Router
│   ├── page.tsx               landing (Server Component)
│   ├── layout.tsx             fuentes + metadatos + Providers
│   ├── providers.tsx          QueryClient + ThemeProvider + AuthProvider + Toaster
│   ├── globals.css            TOKENS del design system (CSS variables)
│   ├── (auth)/                login, registro
│   ├── (app)/                 espacio autenticado: comprar, viajar, cuenta, ...
│   └── (admin)/admin/         consola de operación
├── features/<modulo>/         espejo de los módulos del backend
│   ├── api.ts                 llamadas + esquemas Zod
│   ├── hooks.ts               hooks de TanStack Query
│   ├── schemas.ts             esquemas de formulario
│   └── components/
├── components/
│   ├── ui/                    shadcn/ui (no editar sin motivo)
│   ├── layout/                shell, guards, nav, footer
│   └── status/                traducción de estados del dominio a UX
└── lib/
    ├── api/                   cliente axios: envelope, ApiError, refresh
    ├── auth/                  token store
    └── utils.ts               cn()
```

Regla de ubicación:

| Si es… | Va en |
|--------|-------|
| Un componente genérico sin conocimiento del dominio | `components/ui/` |
| Estructura de página, navegación, guard | `components/layout/` |
| Traducción de un concepto del dominio a UX | `components/status/` |
| Cualquier cosa con conocimiento de un módulo del backend | `features/<modulo>/` |
| Una llamada a la API | `features/<modulo>/api.ts`, nunca en un componente |

## 4. Convenciones no negociables

### Contrato con la API

- **Toda** llamada pasa por `apiGet` / `apiPost` / `apiPatch` de
  `lib/api/client`. Nunca `fetch` ni `axios` directo desde un componente (la
  única excepción actual es la página de checkout sandbox, y es parte de R-01).
- **Toda** respuesta se parsea con un esquema de Zod en `features/*/api.ts`. Si
  el contrato cambia, tiene que fallar ahí.
- Los nombres de estado del backend **no se renombran** en la lógica: solo se
  traducen en la capa de presentación (`components/status/order-status.ts`).
- Los códigos de error se manejan por `error.code`, **nunca** por `error.message`.

### Estado

- El estado de servidor es de TanStack Query. **No lo copies a `useState`.**
- Claves de consulta jerárquicas: `["orders", "detail", orderId]`,
  `["orders", "list", { status }]`. Permite invalidar por prefijo.
- Los 4xx **no se reintentan** (configurado en `providers.tsx`); los 5xx sí, dos
  veces.
- Tras una mutación, invalida detalle **y** lista.
- Un `409` no es un error de la app: avisa al usuario e **invalida** para
  refrescar el estado real.

### Formularios

- `react-hook-form` + `zodResolver`.
- **Los límites del esquema deben coincidir con los del DTO del backend.** Si
  divergen, manda el backend. Divergir "para ser más permisivos" produce errores
  400 que el usuario no entiende.
- Los errores `VALIDATION_ERROR` del backend traen `details[{field, errors}]`:
  mapéalos a los campos del formulario en lugar de mostrar un toast genérico.
  *(El formulario de registro solo mapea `email` y `password`, y por eso R-02 es
  invisible para el usuario.)*

### Estilos

- **Nunca un hex inline.** Todo sale de las CSS variables de `globals.css`.
- Un solo color de acción: `primary`. Los colores semánticos
  (`semantic-up` / `semantic-down`) **solo como texto**, nunca como fondo de
  bloque.
- CTAs siempre pill (`rounded-full`), cards a 24px (`rounded-[24px]`).
- Ver [06-design-system.md](06-design-system.md) para los tokens completos.

### Estados de pantalla (obligatorio los cuatro)

Cada pantalla define:

1. **Loading** — skeleton, nunca un spinner infinito.
2. **Empty** — con una acción sugerida, no solo "no hay nada".
3. **Error** — mapeado por `error.code`, con el `requestId` visible si es
   irrecuperable.
4. **Success**.

## 5. Cómo añadir una pantalla

1. **Comprueba el contrato**: ¿el endpoint existe?
   [`../../../docs/01-integracion.md`](../../../docs/01-integracion.md) §7.
2. **Comprueba las reglas de negocio** que aplican:
   [`../../../docs/00-plataforma.md`](../../../docs/00-plataforma.md). Si no está
   claro cuál es el modelo vigente, **pregunta antes de asumir**.
3. Añade o extiende `features/<modulo>/api.ts` con la llamada y su esquema Zod.
4. Añade el hook en `features/<modulo>/hooks.ts`.
5. Crea el componente en `features/<modulo>/components/`.
6. Crea la ruta en el grupo correcto (`(app)` o `(admin)`), envuelta en el guard
   que corresponda.
7. Cubre los cuatro estados de pantalla.
8. Mapea los códigos de error que ese flujo puede devolver.
9. **Documenta:** actualiza `docs/modulos/<modulo>.md` y
   `docs/proyecto/01-estado-actual.md`.

## 6. Trampas de este código

| Trampa | Detalle |
|--------|---------|
| Poner un secreto en `NEXT_PUBLIC_*` | Acaba en el bundle. Ya pasó (→ R-01) |
| Llamar a la API sin pasar por `lib/api/client` | Te saltas el envelope, el refresh y el manejo de errores |
| Tratar un `409` como bug | Es el estado que cambió: refresca |
| Copiar los límites del formulario "a ojo" | Deben ser los del DTO del backend |
| Asumir que un listado pagina | Solo `/orders` y `/trips` tienen cursor real (→ R-06) |
| Usar `NEXT_PUBLIC_API_URL` desde un Server Component | Es una URL de navegador; en un contenedor `localhost` no es la API (→ R-40) |
| Hex inline "solo esta vez" | Rompe el design system y no hay linter que lo detecte |
| Duplicar la lógica de estados | La autoridad es el backend; `order-status.ts` es un espejo |

## 7. Antes de decir "listo"

```bash
npx tsc --noEmit && npm run lint
```

- [ ] ¿Los cuatro estados de pantalla están cubiertos?
- [ ] ¿Las respuestas se parsean con Zod?
- [ ] ¿Los códigos de error de ese flujo están mapeados a mensajes útiles?
- [ ] ¿Cero hex inline?
- [ ] ¿Los límites del formulario coinciden con el DTO del backend?
- [ ] ¿Se invalidan las consultas correctas tras la mutación?
- [ ] ¿Se actualizó `docs/modulos/<modulo>.md` y `01-estado-actual.md`?
- [ ] ¿Ningún secreto nuevo en `NEXT_PUBLIC_*`?

**No declares algo verificado si no ejecutaste la comprobación.**
