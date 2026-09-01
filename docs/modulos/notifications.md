# Feature: `notifications`

Bandeja de notificaciones y la **narrativa** del producto. Espejo del módulo
`notifications` del backend.

Ficheros: `src/features/notifications/api.ts`,
`src/app/(app)/notificaciones/`, y la campana de
`src/components/layout/app-shell.tsx`.

---

## Endpoints que consume

| Método | Ruta | Nota |
|--------|------|------|
| GET | `/notifications?limit=50&unreadOnly=` | **Sin cursor real** (→ R-06) |
| POST | `/notifications/:id/read` | El backend filtra por `userId`: imposible marcar la de otro |

## Hooks

| Hook | Qué hace |
|------|----------|
| `useNotifications()` | Lista, `refetchInterval: 30s` |
| `useUnreadCount()` | Deriva el conteo de la misma consulta: **no hace una petición extra** |
| `useMarkNotificationRead()` | Invalida en `onSettled` (tanto en éxito como en error) |

`useUnreadCount` deriva del caché de `useNotifications` en lugar de consultar un
endpoint de conteo. Es la decisión correcta: una consulta menos y el número
siempre coherente con la lista.

## `describeNotification`: la narrativa

La pieza más interesante de esta feature. Traduce `(type, payload)` a
`{ text, href }`, y el texto está escrito para que **el viajero sea el
protagonista**:

| Estado | Con nombre del viajero |
|--------|------------------------|
| `TRAVELER_ASSIGNED` | "¡Carlos aceptó llevar tu pedido!" |
| `SOURCING` | "Carlos está gestionando tu pedido." |
| `fulfillment:RECEIVED_BY_TRAVELER` | "Carlos ya tiene tu paquete." |
| `IN_TRANSIT` | "Carlos va en camino a El Salvador." |
| `READY_FOR_DELIVERY` | "Tu paquete llegó — te lo entregamos." |
| Cualquier otro | "Tu pedido cambió a: {etiqueta}." |

Sin nombre disponible, cae a la versión impersonal. Y siempre devuelve un `href`
al detalle del pedido, así que la notificación es accionable.

Es lo que convierte una lista de cambios de estado en una historia. Merece
mantenerse con cuidado: **el texto es parte del producto, no un detalle técnico.**

Nota: `IN_TRANSIT` dice "a El Salvador" **cableado**. Con un corredor nuevo el
texto sería falso. Debería salir del país de destino del pedido.

## Deuda y riesgos

| Id | Sev | Qué |
|----|-----|-----|
| R-06 | P1 | Solo las 50 más recientes; el `cursor` se acepta y se ignora en el backend |

**Además, no cubierto por un id:**

- **Solo se notifica al comprador.** El viajero no recibe nada: ni cuando el
  comprador paga, ni cuando abre una disputa, ni cuando Operaciones registra la
  compra. Es una limitación del backend, y es el hueco funcional más grande de
  esta feature.
- **Nadie entrega las notificaciones.** Se persisten y se leen en la app: no hay
  correo ni push. Si el usuario no abre la aplicación, no se entera de nada.
- `IN_TRANSIT` tiene el destino cableado ("a El Salvador").
- No hay "marcar todas como leídas".
- No hay agrupación ni deduplicación: cinco transiciones seguidas son cinco
  entradas.
- El `payload` es `Record<string, unknown>` y se comprueba con `typeof` campo a
  campo. Es defensivo y correcto dado que el backend no versiona el esquema, pero
  significa que un cambio de forma **no falla ruidoso**.
- Sin `aria-live` en la campana ni en los toasts (→ FE-E5): un lector de pantalla
  no anuncia una notificación nueva.
- Polling cada 30 s sin pausa en segundo plano (→ FE-E9).
- Sin pruebas — y `describeNotification` es una función pura, fácil de probar y
  con valor de producto.

## Pendientes

- [ ] Paginación en cuanto el backend soporte cursor (→ R-06)
- [ ] Sacar el país de destino del pedido en lugar de cablearlo
- [ ] "Marcar todas como leídas"
- [ ] Agrupar notificaciones del mismo pedido
- [ ] `aria-live` en la campana y los toasts
- [ ] Pausar el polling en segundo plano
- [ ] Pruebas de `describeNotification` con todos los tipos y sin nombre
- [ ] Cuando el backend notifique al viajero, añadir sus tipos a la narrativa
