# 06 — Design system: cómo se aplica

La especificación completa es [`../DESIGN-coinbase.md`](../DESIGN-coinbase.md),
**vigente y normativa**. Este documento explica **dónde vive cada cosa en el
código** y qué reglas hay que respetar al escribir componentes.

---

## 1. La regla dura

> **Nunca un hex inline en un componente.** Todo color, tipografía, radio y
> espaciado sale de un token.

Los tokens viven en `src/app/globals.css` como CSS variables, expuestas a
Tailwind 4 con `@theme inline`.

**No hay linter que detecte una violación.** La regla depende de la revisión
humana, y está registrado como pendiente añadir la regla de lint.

## 2. Colores

### Un solo color de acción

`--primary: #0052ff`. Es el **único** color de acción de todo el producto: CTAs,
enlaces activos, estados en progreso, wordmark, foco.

No se inventan colores de acción secundarios. Lo secundario es una superficie
gris (`--secondary` = `--surface-strong`).

### Paleta

| Token Tailwind | Variable | Valor | Para qué |
|----------------|----------|-------|----------|
| `bg-background` | `--background` | `#ffffff` | Canvas |
| `text-ink` | `--ink` | `#0a0b0d` | Texto principal, titulares |
| `text-body-text` | `--body-text` | `#5b616e` | Texto de cuerpo |
| `text-muted-soft` | `--muted-soft` | `#a8acb3` | Texto terciario |
| `border-hairline` | `--hairline` | `#dee1e6` | Bordes de 1px |
| `border-hairline-soft` | `--hairline-soft` | `#eef0f3` | Separadores suaves |
| `bg-surface-soft` | `--surface-soft` | `#f7f7f7` | Bandas de sección |
| `bg-surface-strong` | `--surface-strong` | `#eef0f3` | Pills, chips, botón secundario |
| `bg-surface-dark` | `--surface-dark` | `#0a0b0d` | Bandas oscuras (hero, CTA) |
| `bg-surface-dark-elevated` | `--surface-dark-elevated` | `#16181c` | Cards sobre banda oscura |
| `text-on-dark` | `--on-dark` | `#ffffff` | Texto sobre oscuro |
| `text-on-dark-soft` | `--on-dark-soft` | `#a8acb3` | Texto secundario sobre oscuro |
| `text-primary` | `--primary` | `#0052ff` | **Único color de acción** |
| `text-semantic-up` | `--semantic-up` | `#05b169` | Positivo |
| `text-semantic-down` | `--semantic-down` | `#cf202f` | Negativo |
| `text-accent-yellow` | `--accent-yellow` | `#f4b000` | Advertencia, uso escaso |

### Colores semánticos: solo como texto

`semantic-up` y `semantic-down` se usan **como color de texto**, nunca como fondo
de bloque. Un estado de error es texto rojo sobre superficie neutra, no una caja
roja.

Está aplicado con disciplina en `components/status/order-status.ts`:
`statusTextClass()` devuelve **solo** clases `text-*`.

## 3. Tipografía

| Especificado | Sustituta en uso | Variable |
|--------------|------------------|----------|
| Display / Sans propietaria | **Inter** | `--font-sans` |
| Mono propietaria | **JetBrains Mono** | `--font-mono` |

Las sustitutas están documentadas en `src/app/layout.tsx:7-14`. Se cargan desde
Google Fonts, así que `npm run build` **falla sin salida a internet**: para
verificar cambios usa `npx tsc --noEmit` y `npm run lint`.

### Escala como utilidades de Tailwind

Definidas con `@utility` en `globals.css`. Se usan como clases, no como
combinaciones de `text-*`/`font-*` sueltas:

```
display-mega · display-xl · display-lg · display-md · display-sm
title-lg · title-md · title-sm
body-md · body-sm
caption · caption-strong
number-display        ← cifras, con la fuente mono
```

**Regla:** un titular usa `display-*` o `title-*`, nunca `text-4xl font-bold` a
mano. Si necesitas un tamaño que no existe en la escala, el problema es el
diseño, no la escala.

**Peso del display: 400.** Los titulares grandes no van en negrita — es una firma
visual del sistema. (Hay una excepción en `/comprar/nuevo` con
`font-extrabold`; conviene revisarla.)

Las cifras van con `number-display` (mono). Es lo que hace que los importes se
lean alineados y con aire de producto financiero.

## 4. Formas

| Elemento | Radio | Clase |
|----------|-------|-------|
| Inputs | 12px | `rounded-[12px]` o el default de `--radius` |
| Cards | **24px** | `rounded-[24px]` |
| CTAs | pill | `rounded-full` |
| Chips y badges | pill | `rounded-full` |

Los radios `xl`, `2xl`, `3xl` y `4xl` de la escala **todos valen 24px** a
propósito: es imposible equivocarse de radio en una card.

## 5. Elevación

Casi no hay sombras: la separación se consigue con **hairlines de 1px** y con
cambio de superficie. La mayoría de las cards llevan `shadow-none` explícito para
anular el default de shadcn.

## 6. Composiciones firmadas

Patrones que el design system define y que conviene reutilizar en vez de
reinventar:

| Patrón | Dónde verlo |
|--------|-------------|
| `hero-band-dark` | `app/page.tsx` §hero |
| `product-ui-card-dark` | `app/page.tsx` (mockup del producto) |
| `cta-band-dark` | `app/page.tsx` §CTA final |
| `top-nav-light` (64px, wordmark, switch de espacios) | `components/layout/app-shell.tsx` |
| Banda de sección clara / gris suave | `app/page.tsx` §cómo funciona, §corredores |

## 7. Componentes

`src/components/ui/` es **shadcn/ui**: `avatar`, `badge`, `button`, `card`,
`dialog`, `dropdown-menu`, `form`, `input`, `label`, `select`, `separator`,
`skeleton`, `sonner`, `textarea`.

Reglas:

- **No los edites** salvo para alinearlos con un token. Son código generado; un
  cambio a mano se pierde en la siguiente regeneración.
- Si necesitas una variante, úsala vía `class-variance-authority` o pasa clases,
  no bifurques el componente.
- Los componentes con conocimiento del dominio **no van aquí**: van a
  `features/<modulo>/components/` o a `components/status/`.

Configuración de shadcn en `components.json`.

## 8. Tema oscuro

Hay una paleta oscura completa definida en `.dark` de `globals.css`, y
`next-themes` está montado en `providers.tsx`.

**Pero está inalcanzable:** `defaultTheme="light"`, `enableSystem={false}` y **no
hay ningún control que llame a `setTheme`** (el único `useTheme` del código está
en `sonner.tsx`, para que los toasts sigan el tema).

Decisión: es infraestructura lista, no una funcionalidad. Si se activa, hay que
auditar el contraste de la paleta oscura antes.

## 9. Lista de verificación de una pantalla nueva

- [ ] Cero hex inline
- [ ] Titulares con `display-*` / `title-*`, no con `text-*` a mano
- [ ] Cifras con `number-display`
- [ ] CTAs `rounded-full`, cards `rounded-[24px]`, inputs 12px
- [ ] Un solo color de acción (`primary`)
- [ ] Semánticos solo como texto
- [ ] `shadow-none` donde el default de shadcn mete sombra
- [ ] Los cuatro estados: loading (skeleton), empty (con acción), error (por
      `code`), success
- [ ] Contenedor `max-w-[1200px]` y `px-6` en las páginas de ancho completo
- [ ] Toques táctiles de al menos 44px en móvil
