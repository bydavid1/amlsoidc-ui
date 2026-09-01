# Features: `incidents` + `ratings`

Reportar un problema y calificar la experiencia. Espejo de los módulos
`incidents` y `reputation` del backend.

Ficheros: `src/features/incidents/report-issue-dialog.tsx`,
`src/features/ratings/rating-dialog.tsx`.

Ambas son features de un solo componente: un diálogo cada una, invocado desde el
detalle del encargo. Las llamadas viven en `features/orders/api.ts`
(`reportIssue`, `rate`), porque cuelgan de la ruta del pedido.

---

## `incidents` — reportar un problema

| Método | Ruta | Quién |
|--------|------|-------|
| POST | `/orders/:orderId/report-issue` | Comprador **o** viajero asignado |

El backend valida la participación y pone el pedido en `DISPUTED`. Estados desde
los que se puede disputar: `ASSIGNED`, `SOURCING`, `IN_TRANSIT`,
`READY_FOR_DELIVERY`, `DELIVERED`, `DELIVERY_FAILED`.

`buyerActions.canReportIssue` espeja esa lista (sin `DELIVERY_FAILED`, que en la
práctica es inalcanzable).

### Lo que el usuario no sabe

Abrir una disputa **saca el pedido del flujo normal**: se detiene hasta que
Operaciones lo resuelva, y solo puede volver al estado previo o quedar cancelado.

El diálogo pide un motivo y confirma. **No advierte de esa consecuencia.** Para
una acción que congela un pedido, conviene ser explícito.

### Limitaciones que vienen del backend

- **Una disputa por pedido para toda su vida** (→ R-23). Tras una disputa
  resuelta, un problema nuevo devuelve `DISPUTE_ALREADY_OPEN` — un código que
  además miente sobre el motivo, y que **no está mapeado** en la UI.
- **Sin evidencia adjunta**: solo texto libre. No se pueden subir fotos ni
  recibos, que es lo primero que una disputa real necesita.
- **Sin seguimiento**: el usuario no puede ver el estado de su disputa ni la
  resolución. Solo ve que su pedido está "En disputa".

---

## `ratings` — calificar la experiencia

| Método | Ruta | Quién |
|--------|------|-------|
| POST | `/orders/:orderId/ratings` | **Solo el comprador** |

Precondición: el pedido debe estar en `DELIVERED`.
`buyerActions.canRate(status)` lo espeja.

### Esta acción cierra el pedido

**La calificación del comprador es el único camino a `COMPLETED`** (→ R-36). Si el
comprador no califica, el pedido se queda en `DELIVERED` indefinidamente.

La respuesta del backend es `{ completed: true }`. La UI debería aprovecharlo para
explicar que el ciclo se cerró, y —más importante— **insistir en la
calificación**, porque de ella depende que el pedido se cierre y que la reputación
del viajero refleje la realidad.

### No hay calificación mutua

El comprador califica **su experiencia con la entrega**, no a una persona: nunca
conoce al viajero. El operador puntúa al viajero al recibir el paquete en el punto,
desde la administración.

Si ves copy que hable de "compradores y viajeros se califican mutuamente", está
desactualizado (→ R-27: la landing todavía lo dice).

### Limitaciones

- El viajero **no puede calificar** al comprador ni ver las calificaciones que
  recibe.
- **No hay superficie de lectura** de calificaciones: los comentarios se guardan
  y nadie los ve. El comprador solo ve el `reputationScore` numérico del viajero
  asignado.
- `ALREADY_RATED` **no está mapeado**.

---

## Deuda y riesgos

| Id | Sev | Qué |
|----|-----|-----|
| R-23 | P2 | Una disputa por pedido para siempre; `DISPUTE_ALREADY_OPEN` sin mapear |
| R-36 | P2 | El pedido no se cierra si el comprador no califica |
| R-27 | P1 | El copy de la landing habla de calificación mutua, que no existe |

**Además:**

- Códigos sin mapear: `DISPUTE_ALREADY_OPEN`, `ALREADY_RATED`,
  `ORDER_NOT_RATEABLE`.
- El diálogo de disputa no advierte de que congela el pedido.
- Sin adjuntar evidencia en la disputa (limitación del backend).
- Sin seguimiento del estado de la disputa para el usuario.
- Sin recordatorio de calificación pendiente, pese a que de ella depende el cierre
  del pedido.
- Sin pruebas.

## Pendientes

- [ ] Mapear `DISPUTE_ALREADY_OPEN`, `ALREADY_RATED` y `ORDER_NOT_RATEABLE`
- [ ] Advertir en el diálogo de disputa que el pedido se detiene
- [ ] Mostrar al usuario el estado y la resolución de su disputa
      *(requiere API)*
- [ ] Adjuntar evidencia a la disputa *(requiere API)*
- [ ] Recordatorio persistente de calificación pendiente en `DELIVERED`
- [ ] Superficie de lectura de calificaciones *(requiere API)*
- [ ] Corregir el copy de calificación mutua en la landing (→ R-27)
