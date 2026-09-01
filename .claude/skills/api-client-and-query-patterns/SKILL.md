---
name: api-client-and-query-patterns
description: >
  Patrones de consumo de la API en este proyecto: cliente HTTP con envelope,
  ApiError, refresh single-flight, esquemas Zod en la frontera, hooks de
  TanStack Query, claves de consulta, invalidación y manejo de errores por
  código. Consúltalo antes de escribir cualquier llamada a la API o cualquier
  hook.
---

# Cliente HTTP y patrones de TanStack Query

## Regla 1: toda llamada pasa por `lib/api/client`

```ts
import { apiGet, apiGetWithMeta, apiPost, apiPatch } from "@/lib/api/client";
```

**Nunca** `fetch` ni `axios` directo desde un componente: te saltas el envelope,
el manejo de errores y el refresh *single-flight*. (La única excepción actual es
la página de checkout sandbox, y es parte del hallazgo R-01.)

| Helper | Cuándo |
|--------|--------|
| `apiGet<T>(url, params)` | Lectura simple |
| `apiGetWithMeta<T>(url, params)` | Cuando hace falta `meta.nextCursor` |
| `apiPost<T>(url, body)` | Acciones; tolera 204 sin cuerpo |
| `apiPatch<T>(url, body)` | Actualizaciones |

## Regla 2: toda respuesta se parsea con Zod

En `features/<modulo>/api.ts`. Si el contrato cambia, tiene que fallar **ahí**.

```ts
export const orderSchema = z.object({
  id: z.string(),
  status: z.string(),
  estimatedTotalAmount: z.coerce.number(),   // llega desde Decimal
  createdAt: z.string(),
});

export const ordersApi = {
  async get(orderId: string): Promise<Order> {
    return orderSchema.parse(await apiGet<Order>(`/orders/${orderId}`));
  },
};
```

**Criterio de tolerancia:** opcional en el esquema **solo** si el DTO del backend
lo declara opcional. Un esquema demasiado permisivo no falla ruidoso, que es lo
contrario del propósito de validar en la frontera.

Usa `z.coerce.number()` en los importes.

## Regla 3: los errores se manejan por `code`

`ApiError` trae `code`, `message`, `status`, `details`, `requestId`.

**El código programa contra `code`, nunca contra `message`.** El `message` es para
logs y soporte.

```ts
onError: (error) => {
  if (error instanceof ApiError && error.code === "PAYMENT_REQUIRED") {
    toast.error("Primero paga el servicio.");
    return;
  }
  if (error instanceof ApiError && error.status === 409) {
    toast.error("El pedido cambió de estado. Actualizamos la información.");
    void queryClient.invalidateQueries({ queryKey: ["orders", "detail", orderId] });
    return;
  }
  toast.error("No pudimos completar la acción. Intenta de nuevo.");
}
```

**Mapea los códigos concretos de ese flujo antes de caer al genérico.** Es lo que
separa un mensaje útil de "algo falló".

### `VALIDATION_ERROR`

Trae `details: [{ field, errors[] }]`. **Mapea todos los campos**, no solo unos
concretos:

```ts
if (error.code === "VALIDATION_ERROR") {
  for (const detail of error.validationDetails) {
    form.setError(detail.field as never, { message: detail.errors.join(". ") });
  }
  return;
}
```

Limitar el mapeo a `email` y `password` es exactamente lo que dejó invisible el
fallo total del registro (R-02).

## El refresh *single-flight*: no lo toques sin entenderlo

El backend **rota** el refresh token en cada uso y **detecta reuso** revocando toda
la familia de la sesión. **Dos refresh concurrentes con el mismo token matan la
sesión.**

Por eso todas las peticiones que reciben `401 UNAUTHENTICATED` esperan **la misma
promesa** de refresh y se reintentan **una vez** (`original._retried`).

No es una optimización: es un requisito del contrato.

Hueco conocido (→ R-07): es *single-flight* **por pestaña**. Dos pestañas pueden
rotar el mismo token y matar ambas sesiones.

## Claves de consulta: jerárquicas siempre

```
["orders", "list", { status }]      ["orders", "detail", orderId]
["trips",  "list", { status }]      ["trips",  "detail", tripId]
["assignments", "mine"]             ["assignments", "available", tripId]
["payments", orderId]               ["notifications", "mine"]
```

Permite invalidar por prefijo: `invalidateQueries({ queryKey: ["orders"] })`
invalida listas y detalles.

## Listados: cursor real vs no

```ts
// SOLO /orders y /trips tienen cursor real
useInfiniteQuery({
  queryKey: ["orders", "list", { status: status ?? "ALL" }],
  queryFn: ({ pageParam }) =>
    ordersApi.list({ limit: 10, cursor: pageParam ?? undefined, status }),
  initialPageParam: null as string | null,
  getNextPageParam: (last) => last.nextCursor,
})
```

| Endpoint | Cursor real |
|----------|-------------|
| `GET /orders`, `GET /trips` | ✅ |
| `GET /assignments`, `GET /notifications`, todo `/admin/*` | ❌ **aceptan `cursor` y lo ignoran** (→ R-06) |
| `GET /countries`, `/countries/:id/cities` | Offset (`page`, `pageSize`) |

**No construyas `useInfiniteQuery` sobre un endpoint sin cursor real:** devolverá
siempre la primera página y el usuario verá un scroll que repite.

## Polling

`refetchInterval: 30_000` en pantallas activas: detalle de pedido, encargos del
viajero, encargos disponibles, pago, notificaciones.

No hay websockets. **Ya son cinco consultas cada 30 s por usuario activo**, sin
pausa en segundo plano: piénsalo dos veces antes de añadir otra (→ FE-E9).

## Mutaciones

```ts
useMutation({
  mutationFn: action,
  onSuccess: () => {
    toast.success("Mensaje que dice LA CONSECUENCIA, no solo que funcionó");
    void queryClient.invalidateQueries({ queryKey: ["orders", "detail", id] });
    void queryClient.invalidateQueries({ queryKey: ["orders", "list"] });
  },
  onError: /* ver arriba */,
});
```

**Invalida detalle y lista.** Y si la mutación afecta a otra entidad, invalídala
también: `useCloseTrip` invalida `["trips"]` **y** `["assignments"]`, porque cerrar
un viaje cambia qué encargos se pueden descubrir.

## Un `409` no es un bug

Es el estado que cambió: la otra parte actuó, o la acción no aplicaba. La UI
**avisa e invalida**. Nunca reintenta a ciegas.

Los 4xx no se reintentan (configurado en `providers.tsx`). No lo pises con un
`retry` local.

## El `requestId`, aprovéchalo

`ApiError.requestId` es el id que la API pone en `meta.requestId` y en el header
`X-Request-Id`. Es el puente al log del backend.

Hoy **no se usa**: ni se muestra en errores irrecuperables ni se envía a ninguna
herramienta. Muéstralo cuando el usuario no pueda recuperarse: es lo que hace útil
un reporte de soporte.
