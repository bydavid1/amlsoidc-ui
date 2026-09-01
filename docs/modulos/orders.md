# Feature: `orders`

Crear y seguir encargos. Es el espacio del comprador. Espejo del módulo `orders`
del backend.

Ficheros: `src/features/orders/**`, `src/app/(app)/comprar/**`.

---

## Piezas

| Fichero | Qué es |
|---------|--------|
| `api.ts` | `create`, `quote`, `list`, `get`, `confirmPurchase`, `confirmDelivery`, `cancel`, `rate`, `reportIssue` |
| `hooks.ts` | `useMyOrders`, `useOrder`, y los hooks de acción |
| `schemas.ts` | Esquemas de respuesta y del formulario de creación |
| `product-resolver.ts` | Heurística local de resolución de producto por URL |
| `components/create-order-form.tsx` | Formulario de creación |
| `components/order-list.tsx` | Lista con filtro y paginación infinita |
| `components/order-detail.tsx` | Detalle con stepper, timeline, pago y acciones |

## Endpoints que consume

| Método | Ruta | Nota |
|--------|------|------|
| GET | `/pricing/quote?price=&size=` | **Público**; solo devuelve el total |
| POST | `/orders` | |
| GET | `/orders` | **Cursor real** (`limit + 1` en el backend) |
| GET | `/orders/:id` | Detalle + timeline + viajero público |
| POST | `/orders/:id/confirm-purchase` | |
| POST | `/orders/:id/confirm-delivery` | |
| POST | `/orders/:id/cancel` | |
| POST | `/orders/:orderId/ratings` | Cierra el pedido |
| POST | `/orders/:orderId/report-issue` | |

Además consume `catalog` (productos recomendados) y `geography` (países, ciudades,
corredores) desde el formulario de creación.

## Estado y hooks

| Hook | Tipo | Nota |
|------|------|------|
| `useMyOrders(status?)` | `useInfiniteQuery` | Páginas de 10, `getNextPageParam` desde `meta.nextCursor` |
| `useOrder(orderId, { poll })` | `useQuery` | `refetchInterval: 30s` cuando el pedido está activo |
| `useConfirmPurchase`, `useConfirmDelivery`, `useCancelOrder`, … | `useMutation` | Vía el helper común `useOrderAction` |

Claves jerárquicas: `["orders", "list", { status }]` y
`["orders", "detail", orderId]`. Cada mutación invalida **detalle y lista**.

### `useOrderAction`: el patrón de manejo de 409

```ts
onError: (error, orderId) => {
  if (code === "PAYMENT_REQUIRED")            → "Primero paga el servicio"
  if (code === "RECEIVING_ADDRESS_MISSING")   → "El viajero aún no registró su dirección"
  if (status === 409)                          → avisa e INVALIDA el detalle
  otro                                         → toast genérico
}
```

Este patrón es la aplicación correcta de la decisión FE-01: **un 409 no es un bug,
es el estado que cambió.** Se avisa y se refresca en lugar de reintentar a ciegas.

## Flujo de creación de encargo

```
1. El comprador pega la URL del producto
2. LocalProductResolver infiere tienda, país e incluso nombre del path
3. Elige tamaño (SMALL/MEDIUM/LARGE) y ciudad de entrega
4. GET /pricing/quote → total aproximado EN VIVO
5. POST /orders
```

`product-resolver.ts` es una heurística **de cliente**: reconoce ocho dominios
(Amazon en cuatro países, Walmart, Best Buy, eBay, Apple), infiere el nombre
limpiando el path de la URL, y devuelve `confidence: "high" | "low"`. Un dominio
no reconocido devuelve `unsupported_domain`.

Es un truco elegante para que el formulario no esté vacío, pero está en el sitio
equivocado: en el backend podría enriquecerse de verdad (scraping, catálogos,
verificación de precio). Registrado como pendiente de decisión.

## Regla de visibilidad del dinero

El comprador ve **solo** `estimatedTotalAmount`. El DTO del backend no expone
`platformFeeAmount` ni `travelerRewardAmount`, así que la regla se respeta por
construcción: **no hay nada que ocultar en el cliente**.

Al añadir una pantalla nueva, no reconstruyas el desglose desde otras fuentes.

## Deuda y riesgos

| Id | Sev | Qué |
|----|-----|-----|
| R-30 | P1 | El detalle muestra la dirección física del viajero |
| R-29 | P1 | `confirm-purchase` puede aparecer y fallar según el flujo |

**Detalle de R-29 en esta feature:** `buyerActions.canConfirmPurchase` **no
comprueba el flujo de cumplimiento**, pero el backend exige Flujo A. Con el Flujo
C activo por defecto, el botón se muestra y devuelve
`409 PROCUREMENT_MANAGED_BY_BRINGO` — un código que **no está mapeado** a un
mensaje útil, así que el usuario ve el genérico.

**Además, no cubierto por un id:**

- Códigos sin mapear que este flujo puede devolver: `PROFILE_INCOMPLETE`,
  `BUYER_PROFILE_REQUIRED`, `CORRIDOR_NOT_ENABLED`,
  `CITY_NOT_IN_DESTINATION_COUNTRY`, `ORDER_NOT_CANCELLABLE`.
- No se puede **editar** un encargo: ni corregir un precio, ni cambiar la fecha
  límite. El backend tampoco lo permite.
- El detalle hace polling cada 30 s sin pausar en segundo plano (→ FE-E9).
- La resolución de producto vive en el cliente con ocho dominios cableados.
- Sin pruebas del formulario ni del flujo de acciones.

## Pendientes

- [ ] Añadir el flujo de cumplimiento a `canConfirmPurchase` (→ R-29)
- [ ] Mapear los códigos de error que faltan
- [ ] Decidir qué se muestra de la dirección de recepción (→ R-30)
- [ ] Decidir si `LocalProductResolver` pasa al backend
- [ ] Pausar el polling en segundo plano
- [ ] e2e: crear encargo y verlo en la lista
- [ ] Pruebas del formulario de creación con cotización en vivo
