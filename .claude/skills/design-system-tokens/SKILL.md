---
name: design-system-tokens
description: >
  Tokens y reglas del design system tal como viven en el código: colores,
  tipografía, radios, elevación, layout y componentes base. Consúltalo antes de
  escribir una sola clase de estilo. La regla dura del proyecto es que NUNCA
  hay un hex inline, y no existe linter que lo detecte.
---

# Tokens del design system

Especificación: `docs/DESIGN-coinbase.md` (vigente y normativo).
Aplicación en código: `docs/proyecto/06-design-system.md`.
Los tokens viven en `src/app/globals.css` como CSS variables, expuestas a Tailwind
4 con `@theme inline`.

---

## La regla dura

> **Nunca un hex inline en un componente.**

**No hay linter que lo detecte.** Depende enteramente de quien escribe y de quien
revisa.

## Colores

### Un solo color de acción

`primary` (`#0052ff`). CTAs, enlaces activos, estados en progreso, wordmark, foco.
**No se inventan colores de acción secundarios**: lo secundario es una superficie
gris.

### Paleta

| Clase Tailwind | Valor | Para qué |
|----------------|-------|----------|
| `bg-background` | `#ffffff` | Canvas |
| `text-ink` | `#0a0b0d` | Texto principal, titulares |
| `text-body-text` | `#5b616e` | Texto de cuerpo |
| `text-muted-soft` | `#a8acb3` | Texto terciario |
| `border-hairline` | `#dee1e6` | Bordes de 1px |
| `border-hairline-soft` | `#eef0f3` | Separadores suaves |
| `bg-surface-soft` | `#f7f7f7` | Bandas de sección |
| `bg-surface-strong` | `#eef0f3` | Pills, chips, botón secundario |
| `bg-surface-dark` | `#0a0b0d` | Bandas oscuras (hero, CTA) |
| `bg-surface-dark-elevated` | `#16181c` | Cards sobre banda oscura |
| `text-on-dark` | `#ffffff` | Texto sobre oscuro |
| `text-on-dark-soft` | `#a8acb3` | Texto secundario sobre oscuro |
| `text-primary` | `#0052ff` | **Único color de acción** |
| `text-semantic-up` | `#05b169` | Positivo |
| `text-semantic-down` | `#cf202f` | Negativo |
| `text-accent-yellow` | `#f4b000` | Advertencia, uso escaso |

### Semánticos: SOLO como texto

`semantic-up` / `semantic-down` van como color de **texto**, nunca como fondo de
bloque. Un error es texto rojo sobre superficie neutra, no una caja roja.

Referencia de cómo se hace bien: `statusTextClass()` en
`components/status/order-status.ts` devuelve **solo** clases `text-*`.

## Tipografía

Utilidades, no combinaciones sueltas de `text-*` / `font-*`:

```
display-mega · display-xl · display-lg · display-md · display-sm
title-lg · title-md · title-sm
body-md · body-sm
caption · caption-strong
number-display        ← cifras, con la fuente mono
```

**Dos reglas que se olvidan:**

1. **El peso del display es 400.** Los titulares grandes no van en negrita: es una
   firma visual del sistema.
2. **Las cifras van con `number-display`.** Es lo que hace que los importes se lean
   alineados y con aire de producto financiero.

Si necesitas un tamaño que no está en la escala, **el problema es el diseño, no la
escala**.

Fuentes: Inter (`--font-sans`) y JetBrains Mono (`--font-mono`) como sustitutas
documentadas de las propietarias. Se cargan desde Google Fonts, así que
`npm run build` falla sin salida a internet.

## Formas

| Elemento | Radio | Clase |
|----------|-------|-------|
| Inputs | 12px | default de `--radius`, o `rounded-[12px]` |
| Cards | **24px** | `rounded-[24px]` |
| CTAs, chips, badges | pill | `rounded-full` |

Los radios `xl`, `2xl`, `3xl` y `4xl` **todos valen 24px** a propósito: es
imposible equivocarse en una card.

## Elevación

Casi no hay sombras: la separación se consigue con **hairlines de 1px** y cambio de
superficie. La mayoría de las cards llevan `shadow-none` explícito para anular el
default de shadcn.

## Layout

- Contenedor: `max-w-[1200px]` con `px-6`
- Ritmo editorial entre bandas: `--spacing-section: 96px`
- Toques táctiles: mínimo **44px** en móvil

## Composiciones firmadas (reutiliza, no reinventes)

| Patrón | Dónde verlo |
|--------|-------------|
| `hero-band-dark` | `app/page.tsx` §hero |
| `product-ui-card-dark` | `app/page.tsx` (mockup) |
| `cta-band-dark` | `app/page.tsx` §CTA final |
| `top-nav-light` (64px, wordmark, switch de espacios) | `components/layout/app-shell.tsx` |
| Banda de sección clara / gris suave | `app/page.tsx` |

## Componentes base

`src/components/ui/` es **shadcn/ui**: `avatar`, `badge`, `button`, `card`,
`dialog`, `dropdown-menu`, `form`, `input`, `label`, `select`, `separator`,
`skeleton`, `sonner`, `textarea`.

- **No los edites** salvo para alinearlos con un token: son código generado y un
  cambio a mano se pierde al regenerar.
- Para variantes: `class-variance-authority` o pasar clases con `cn()`.
- Un componente con conocimiento del dominio **no va aquí**.

### Faltan (los más urgentes primero)

`table` y `pagination` — los necesita **toda** la administración, que hoy usa divs
a mano. Luego: `tabs`, `tooltip`, `alert`, `sheet`/`drawer`, `checkbox`,
`radio-group`, `switch`.

## Tema oscuro

Hay una paleta oscura completa en `.dark` de `globals.css` y `next-themes` está
montado, pero está **inalcanzable**: `defaultTheme="light"`,
`enableSystem={false}`, y ningún control llama a `setTheme`.

Si se activa: **audita el contraste antes**.

## Lista de verificación

- [ ] Cero hex inline
- [ ] Titulares con `display-*` / `title-*`
- [ ] Cifras con `number-display`
- [ ] CTAs `rounded-full`, cards `rounded-[24px]`, inputs 12px
- [ ] Un solo color de acción
- [ ] Semánticos solo como texto
- [ ] `shadow-none` donde shadcn mete sombra
- [ ] `max-w-[1200px]` + `px-6` en páginas de ancho completo
- [ ] Contraste comprobado
- [ ] Toques de 44px en móvil
