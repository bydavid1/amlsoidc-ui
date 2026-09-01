# Feature: `payments`

Checkout y estado del pago del servicio. Espejo del módulo `payments` del backend.

Ficheros: `src/features/payments/**`,
`src/app/(app)/comprar/[orderId]/pago-sandbox/page.tsx`.

> ⚠️ **Esta feature contiene parte del hallazgo P0 del sistema (R-01).** Lee la
> sección de riesgos antes de tocarla.

---

## Piezas

| Fichero | Qué es |
|---------|--------|
| `api.ts` | `paymentsApi.get` / `.checkout`, `usePayment`, `useStartCheckout`, `paymentSchema` |
| `components/payment-card.tsx` | Tarjeta de pago dentro del detalle del encargo |
| `app/(app)/comprar/[orderId]/pago-sandbox/page.tsx` | Checkout simulado |

Esta feature declara sus hooks dentro de `api.ts` en lugar de un `hooks.ts`
aparte. Es el patrón de las features pequeñas del proyecto; consistente con
`notifications`, `geography` y `admin`.

## Endpoints que consume

| Método | Ruta | Nota |
|--------|------|------|
| GET | `/orders/:orderId/payment` | Devuelve `null` si el pago aún no se inició |
| POST | `/orders/:orderId/payment/checkout` | Devuelve `checkoutUrl` |
| POST | `/payments/webhook/sandbox` | ⚠️ **desde el navegador** — parte de R-01 |

## Flujo

```
1. El detalle del encargo muestra la tarjeta de pago (usePayment, polling 30s)
2. "Pagar servicio" → POST /payment/checkout
3. window.location.assign(checkoutUrl)
4. [SANDBOX] la página de checkout llama al webhook con "aprobado" o "rechazado"
5. Vuelta al detalle; el polling detecta el estado nuevo
```

`useStartCheckout` maneja `ALREADY_PAID` con un `toast.info` e invalida: correcto,
porque es un estado, no un error.

El backend **reutiliza** el pago existente si no está pagado, así que reintentar
el checkout es idempotente. Es la salida para un checkout abandonado, porque no
hay reconciliación automática.

## Estados del pago

`paymentSchema` valida `PENDING` | `PAID` | `FAILED` | `REFUND_DUE` | `REFUNDED`,
con `amount`, `currency` y `paidAt`.

El comprador ve **solo el importe del servicio**, sin desglose entre pago al
viajero y comisión. La regla de visibilidad se respeta por construcción: el DTO
del backend no expone el split.

---

## ⚠️ R-01 (P0) — El secreto del webhook está en el bundle

```ts
headers: {
  "x-sandbox-signature": process.env.NEXT_PUBLIC_SANDBOX_SECRET ?? "",
}
```

**Todo lo que empieza por `NEXT_PUBLIC_` se compila dentro del JavaScript que se
sirve al navegador.** Cualquier usuario puede leer ese valor con las herramientas
de desarrollo.

Combinado con el resto de R-01 (el webhook es público, la "firma" es una
comparación literal contra el secreto, y el secreto tiene valor por defecto en el
backend), esto permite a cualquiera:

```
POST /api/v1/payments/webhook/sandbox
x-sandbox-signature: <el secreto, leído del bundle>
{ "providerRef": "sbx_<paymentId>", "approved": true }
```

…y marcar su pago como `PAID` sin haber pagado nada. Si el pedido llega a
`READY_FOR_DELIVERY`, el payout al viajero queda `DUE` con dinero que la
Plataforma nunca cobró.

### Arreglo desde este lado

- [ ] Eliminar `NEXT_PUBLIC_SANDBOX_SECRET` de `.env.local.example` y del código
- [ ] Retirar la llamada al webhook desde el navegador
- [ ] Sustituir la página por una que solo explique el estado, o eliminarla y
      dejar que la aprobación sandbox sea una acción de administración
      autenticada

**Es un arreglo conjunto con el backend:** el endpoint público de webhook y el
valor por defecto del secreto también tienen que cambiar. Ver R-01 en
[`../../../docs/02-riesgos.md`](../../../docs/02-riesgos.md).

Nota adicional: la página de checkout sandbox es la **única** llamada del
proyecto que no pasa por `lib/api/client`. Usa `fetch` directo, así que se salta
el envelope, el manejo de errores y el refresh.

---

## Otra deuda

- **No hay indicador de entorno.** Nada impide que la página de sandbox se sirva
  en producción: no hay `NEXT_PUBLIC_ENV` ni comprobación equivalente.
- **Sin reconciliación:** un checkout abandonado deja el pago en `PENDING` para
  siempre. La UI no distingue "aún no pagaste" de "empezaste y no terminaste".
- El polling de `usePayment` corre cada 30 s en el detalle del encargo, sumándose
  al del propio pedido: dos consultas cada 30 s por pantalla abierta.
- El estado `FAILED` se valida en el esquema y **no tiene tratamiento en la UI**:
  no hay mensaje de "el pago fue rechazado, inténtalo de nuevo".
- `REFUND_DUE` y `REFUNDED` tampoco tienen mensaje: el comprador de un pedido
  cancelado no ve el estado de su reembolso.
- Sin pruebas.

## Pendientes

- [ ] **Cerrar R-01 desde este lado** (bloqueante para producción)
- [ ] Indicador de entorno que impida servir la superficie de sandbox en producción
- [ ] Mensajes para `FAILED`, `REFUND_DUE` y `REFUNDED`
- [ ] Distinguir "no iniciado" de "iniciado y abandonado"
- [ ] Unificar el polling del pago con el del pedido
- [ ] Integrar la pasarela real cuando exista *(requiere API)*
