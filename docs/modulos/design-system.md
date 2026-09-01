# Capa: design system aplicado

Cómo el design system vive en el código. La especificación es
[`../DESIGN-coinbase.md`](../DESIGN-coinbase.md); la guía de aplicación completa,
con todos los tokens, está en
[`../proyecto/06-design-system.md`](../proyecto/06-design-system.md).

Ficheros: `src/app/globals.css`, `src/components/ui/**`, `components.json`,
`src/lib/utils.ts`.

---

## Dónde vive cada cosa

| Pieza | Fichero |
|-------|---------|
| Tokens (colores, radios, spacing) | `src/app/globals.css` — CSS variables + `@theme inline` |
| Utilidades de tipografía | `src/app/globals.css` — bloques `@utility` |
| Paleta oscura | `src/app/globals.css` — bloque `.dark` |
| Componentes base | `src/components/ui/**` (shadcn/ui) |
| Configuración de shadcn | `components.json` |
| Helper de clases | `src/lib/utils.ts` (`cn` = clsx + tailwind-merge) |
| Fuentes | `src/app/layout.tsx` |

## La regla dura

> **Nunca un hex inline en un componente.**

**No hay linter que lo detecte.** La regla depende de la revisión humana; añadir
la regla de lint está registrado como pendiente.

## Colores: lo esencial

- **Un solo color de acción:** `primary` (`#0052ff`). CTAs, enlaces activos,
  estados en progreso, wordmark, foco. No se inventan colores de acción
  secundarios; lo secundario es una superficie gris.
- **Semánticos solo como texto.** `semantic-up` / `semantic-down` van como color
  de texto, nunca como fondo de bloque. Aplicado con disciplina en
  `components/status/order-status.ts`, cuyo `statusTextClass()` devuelve
  **solo** clases `text-*`.
- Jerarquía de texto: `ink` (principal) → `body-text` (cuerpo) → `muted-soft`
  (terciario).
- Superficies: `background` → `surface-soft` (bandas) → `surface-strong` (pills,
  chips) → `surface-dark` / `surface-dark-elevated` (bandas oscuras).

## Tipografía

Escala como **utilidades**, no como combinaciones sueltas de `text-*`/`font-*`:

```
display-mega · display-xl · display-lg · display-md · display-sm
title-lg · title-md · title-sm
body-md · body-sm
caption · caption-strong
number-display        ← cifras, con la fuente mono
```

Dos reglas que se olvidan:

1. **El peso del display es 400.** Los titulares grandes no van en negrita: es
   una firma visual del sistema. Hay una excepción en `/comprar/nuevo`
   (`font-extrabold`) que conviene revisar.
2. **Las cifras van con `number-display`.** Es lo que hace que los importes se
   lean alineados y con aire de producto financiero.

Fuentes: Inter y JetBrains Mono como **sustitutas documentadas** de las
propietarias del sistema (anotado en `layout.tsx`). Se cargan desde Google Fonts,
así que `npm run build` **falla sin salida a internet**.

## Formas

| Elemento | Radio |
|----------|-------|
| Inputs | 12px |
| Cards | **24px** |
| CTAs, chips, badges | pill (`rounded-full`) |

Los radios `xl`, `2xl`, `3xl` y `4xl` **todos valen 24px** a propósito: es
imposible equivocarse de radio en una card.

## Elevación

Casi no hay sombras: la separación se consigue con **hairlines de 1px** y con
cambio de superficie. La mayoría de las cards llevan `shadow-none` explícito para
anular el default de shadcn.

## Componentes base

`src/components/ui/`: `avatar`, `badge`, `button`, `card`, `dialog`,
`dropdown-menu`, `form`, `input`, `label`, `select`, `separator`, `skeleton`,
`sonner`, `textarea`.

Reglas:

- **No los edites** salvo para alinearlos con un token. Son código generado; un
  cambio a mano se pierde en la siguiente regeneración.
- Para variantes: `class-variance-authority` o pasar clases con `cn()`. No
  bifurques el componente.
- Un componente con conocimiento del dominio **no va aquí**: va a
  `features/<modulo>/components/` o a `components/status/`.

### Lo que falta

| Componente | Se está echando en falta en |
|------------|------------------------------|
| `table` | Todas las colas de administración usan divs a mano |
| `tabs` | `traveler-tabs.tsx` está hecho a medida |
| `tooltip` | Etiquetas y ayudas contextuales |
| `pagination` | Los listados de administración |
| `alert` | Avisos en pantalla (hoy todo es toast) |
| `sheet` / `drawer` | Filtros y detalles en móvil |
| `checkbox`, `radio-group`, `switch` | Formularios de administración |

## Tema oscuro

Hay una **paleta oscura completa** en `.dark` de `globals.css`, y `next-themes`
está montado.

**Pero está inalcanzable:** `defaultTheme="light"`, `enableSystem={false}` y no
hay ningún control que llame a `setTheme` (el único `useTheme` está en
`sonner.tsx`, para que los toasts sigan el tema).

Es infraestructura lista, no una funcionalidad. Si se activa, hay que auditar el
contraste de la paleta oscura antes.

## Deuda y riesgos

- **Sin regla de lint** que prohíba hex inline: la norma más importante del
  sistema depende de la revisión humana.
- **Sin auditoría de contraste** de los tokens (→ FE-E5). `body-text` (`#5b616e`)
  sobre `surface-soft` (`#f7f7f7`) está en el límite de AA para texto pequeño.
- **Sin navegación por teclado revisada** en diálogos, menús y selects (se hereda
  lo que trae Radix, que es bastante, pero sin verificar).
- **Sin `aria-live`** en los toasts: un lector de pantalla no anuncia los avisos.
- Sin catálogo visual de componentes (Storybook o similar): la única forma de ver
  qué existe es leer el código.
- Tema oscuro definido y no auditado.

## Pendientes

- [ ] Regla de lint contra hex inline
- [ ] Auditoría de contraste de los tokens, claro y oscuro
- [ ] Revisión de navegación por teclado y focus visible
- [ ] `aria-live` en los toasts
- [ ] Añadir los componentes que faltan, empezando por `table` y `pagination`
      (los necesita toda la administración)
- [ ] Decidir si se activa el tema oscuro y con qué control
- [ ] Revisar el `font-extrabold` de `/comprar/nuevo`
- [ ] Fuentes locales para que el build no depende de red
