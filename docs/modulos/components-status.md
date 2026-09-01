# Capa: `components/status` — estados del dominio a UX

El **único** sitio donde un estado del backend se convierte en texto, color y
posición del stepper.

Ficheros: `src/components/status/order-status.ts`, `order-status-badge.tsx`,
`order-timeline.tsx`, `status-stepper.tsx`.

---

## Por qué existe

Si cada pantalla traduce por su cuenta, el mismo estado acaba con tres nombres
distintos y el usuario no entiende en qué punto está su pedido. Centralizarlo es
lo que hace que la app cuente **una** historia.

## `order-status.ts`

### Traducción de estados

`STATUS_UI` mapea **los dos niveles** de la máquina de estados a `{ label, tone }`:

| Estado del backend | Texto | Tono |
|--------------------|-------|------|
| `PENDING_ASSIGNMENT` | "Buscando viajero" | neutral |
| `ASSIGNED` | "Viajero asignado" | progreso |
| `SOURCING` | "En preparación" | progreso |
| `IN_TRANSIT` | "En camino" | progreso |
| `READY_FOR_DELIVERY` | "En poder de la Plataforma" | progreso |
| `DELIVERED` | "Entregado" | éxito |
| `COMPLETED` | "Completado" | éxito |
| `DELIVERY_FAILED` | "Entrega fallida" | peligro |
| `DISPUTED` | "En disputa" | peligro |
| `CANCELLED` | "Cancelado" | peligro |
| `EXPIRED` | "Expirado" | peligro |
| `AWAITING_PURCHASE` | "Esperando tu compra" | progreso |
| `PURCHASED` | "Producto comprado" | progreso |
| `TRACKING_REGISTERED` | "Tracking registrado" | progreso |
| `RECEIVED_BY_TRAVELER` | "En manos del viajero" | progreso |
| `HUB_RECEIVED_BY_BRINGO` | "Recibido en el punto" | progreso |
| `DISPATCHED_TO_BUYER` | "Despachado al comprador" | progreso |

`statusLabel(status)` cae al propio código si no lo conoce: nunca rompe, pero
muestra un identificador técnico al usuario. Conviene revisarlo cuando el backend
añada un estado.

`statusTextClass(status)` devuelve **solo** clases `text-*`, respetando la regla
del design system de que los colores semánticos no son fondos.

### `HAPPY_PATH_STEPS` y `happyPathIndex`

Ocho pasos del camino feliz, y una función que traduce
`(status, fulfillmentStatus)` a la posición actual. Devuelve `-1` en estados
terminales o de excepción, lo que el stepper usa para no mostrarse.

Mezcla ambos niveles a propósito: durante `SOURCING`, la posición depende del
sub-flujo, porque es donde el usuario quiere ver el detalle.

### `buyerActions` — el espejo de las invariantes

```ts
canCancel(status, fulfillmentStatus)          // PENDING, o (ASSIGNED|SOURCING) + AWAITING_PURCHASE
canConfirmPurchase(status, fulfillmentStatus) // (ASSIGNED|SOURCING) + AWAITING_PURCHASE
canConfirmDelivery(status)                    // READY_FOR_DELIVERY
canRate(status)                               // DELIVERED
canReportIssue(status)                        // ASSIGNED..DELIVERED
```

> ⚠️ **Esto duplica reglas del backend.** Es una conveniencia de UX para decidir
> qué botón mostrar, **no la autoridad**. Si el backend cambia una precondición,
> aquí no falla nada: simplemente se muestra un botón que devolverá 409, o se
> esconde uno que sí funcionaba. **No hay ninguna prueba que ate ambos lados**
> (→ FE-E2).

Divergencia detectada: `canConfirmPurchase` **no comprueba el flujo de
cumplimiento**, pero el backend exige que sea Flujo A
(`PROCUREMENT_MANAGED_BY_BRINGO` si no lo es). Con el Flujo C activo por defecto,
el botón puede aparecer y fallar. Y ese código de error **no está mapeado** a un
mensaje útil.

## Componentes

| Componente | Qué hace |
|------------|----------|
| `order-status-badge.tsx` | Badge con `statusLabel` + `statusTextClass` |
| `status-stepper.tsx` | Stepper del camino feliz usando `happyPathIndex` |
| `order-timeline.tsx` | Historial completo desde `timeline` del detalle |

`order-timeline.tsx` se reutiliza tal cual en el expediente administrativo: buena
señal de que la abstracción está en el sitio correcto.

**Nota sobre el timeline:** las entradas del backend pueden venir con orden
inestable, porque las transiciones de una misma operación comparten timestamp
exacto (→ R-25). El componente muestra lo que recibe, así que un sub-flujo puede
aparecer antes que el cambio de backbone que lo causó.

## Deuda y riesgos

| Id | Qué |
|----|-----|
| R-25 | El orden del timeline puede ser incorrecto (origen en el backend) |

**Además:**

- `buyerActions` y `happyPathIndex` se desincronizan en silencio (→ FE-E2).
- `canConfirmPurchase` no considera el flujo de cumplimiento.
- No hay acciones del **viajero** centralizadas: cada pantalla decide qué botón
  mostrar por su cuenta, con la misma clase de riesgo de desincronización.
- `statusLabel` muestra el código técnico ante un estado desconocido.
- Sin pruebas — y es el fichero del frontend que más las merece: son funciones
  puras y son un espejo de reglas ajenas.

## Pendientes

- [ ] **Pruebas unitarias** de `happyPathIndex` y `buyerActions` con los casos
      documentados del backend (→ FE-E2)
- [ ] Comentario en cada helper citando el método del agregado que espeja
- [ ] Añadir el flujo de cumplimiento a `canConfirmPurchase`
- [ ] Centralizar también las acciones del viajero
- [ ] Fallback amable en `statusLabel` para estados desconocidos
- [ ] Revisar el texto de `HUB_RECEIVED_BY_BRINGO` y `READY_FOR_DELIVERY` cuando
      se decida el nombre del producto
