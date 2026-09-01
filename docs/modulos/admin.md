# Feature: `admin` — consola de operación

Superficie de Operaciones. Espejo del módulo `admin` del backend (que a su vez
compone `orders`, `incidents`, `identity`, `kyc`, `payments`, `catalog` y
`reputation`).

Ficheros: `src/features/admin/**`, `src/app/(admin)/admin/**`.

> El `PLAN.md` original excluía explícitamente el panel de administración de su
> alcance. **El panel existe** y está a mitad de camino respecto a lo que la API
> ya expone.

---

## Piezas

| Fichero | Qué es |
|---------|--------|
| `api.ts` | Esquemas Zod + llamadas + hooks de todas las áreas de administración |
| `components/admin-order-detail.tsx` | Expediente del pedido |
| `app/(admin)/admin/layout.tsx` | Shell con barra lateral y comprobación de rol |
| 7 páginas | Dinero, Operación (+ detalle), Payouts, Disputas, Usuarios, Configuración, Curaduría |

`api.ts` concentra esquemas y hooks de todas las áreas. Ya es el fichero más
grande de `features/` y va a crecer: conviene dividirlo por área antes de añadir
las pantallas que faltan.

## Pantallas actuales

| Ruta | Qué hace | Estado |
|------|----------|--------|
| `/admin` | Panel "Dinero": totales y desglose completo | ✅ |
| `/admin/operacion` | Cola de pedidos con acciones operativas | ⚠️ sin paginación |
| `/admin/operacion/[orderId]` | Expediente con timeline | ✅ |
| `/admin/payouts` | Payouts y reembolsos, marcar ejecutados | ⚠️ sin paginación |
| `/admin/disputas` | Cola y resolución | ⚠️ mínima |
| `/admin/usuarios` | Búsqueda, suspender, reactivar | ⚠️ sin motivo |
| `/admin/configuracion` | Cambio del flujo de cumplimiento activo | ✅ |
| `/admin/curaduria` | Alta y desactivación de productos | 🚧 |

## Acciones operativas sobre el pedido

Desde `/admin/operacion`, según el flujo y el sub-estado:

| Acción | Endpoint | Efecto |
|--------|----------|--------|
| Registrar compra | `POST /admin/orders/:id/register-procurement` | Sub-flujo → `PURCHASED` |
| Registrar tracking | `POST /admin/orders/:id/register-tracking` | Sub-flujo → `TRACKING_REGISTERED` |
| Confirmar recepción en el punto | `POST /admin/orders/:id/confirm-hub-reception` | Pedido → `READY_FOR_DELIVERY`, **libera el payout**, y opcionalmente puntúa al viajero |
| Despachar al comprador | `POST /admin/orders/:id/dispatch-to-buyer` | Sub-flujo → `DISPATCHED_TO_BUYER` |

`confirm-hub-reception` es la acción con más consecuencias del sistema: cambia el
estado del pedido, libera dinero y afecta la reputación del viajero. La UI debería
reflejar ese peso (confirmación explícita, resumen de lo que va a pasar).

## Esta es la única superficie que ve el dinero completo

`AdminOrder` incluye `estimatedPriceAmount`, `travelerRewardAmount`,
`platformFeeAmount` y `buyerTotalAmount`, además de correo del comprador y del
viajero, y teléfono del viajero en los payouts.

**Es correcto y es deliberado**: Operaciones necesita el desglose para operar y el
contacto para ejecutar pagos. Pero implica dos cosas:

1. Nunca reutilizar un componente de administración en una pantalla de usuario.
2. La comprobación de rol de esta sección es lo único que separa esa información
   del resto de la app en el cliente. (En el servidor la protege
   `@Roles('ADMIN')`, que es la autoridad real.)

## Lo que falta: 8 endpoints sin pantalla

| Área | Endpoints disponibles | Pantalla |
|------|----------------------|----------|
| Cola de revisión KYC | 3 (`listar`, `detalle`, `decidir`) | ❌ |
| Blocklist de documentos | 3 (`listar`, `bloquear`, `desbloquear`) | ❌ |
| Perfil de riesgo del viajero | 1 | ❌ |
| Ajuste de límite del viajero | 1 | ❌ |

**Consecuencia concreta:** un viajero no puede reclamar su primer encargo sin KYC
aprobado, no hay pantalla para enviar el expediente **ni** para aprobarlo. El
embudo de captación de viajeros está bloqueado de punta a punta (→ FE-E3).

> ⚠️ Al construir la pantalla de **ajuste de límite**: el backend guarda y audita
> el límite pero **nunca lo aplica** (→ R-05). Si se construye tal cual, un
> operador creerá que activó un control que no existe. O se espera al arreglo del
> backend, o la pantalla advierte explícitamente que el control no está activo.

## Permisos: un solo rol

Todo el panel se protege con la comprobación de `ADMIN` (cliente) y
`@Roles('ADMIN')` (servidor). **No hay separación de funciones**: quien puede
aprobar un KYC puede también marcar payouts como pagados, suspender usuarios y
cambiar el flujo activo del sistema.

Es el riesgo de control interno más relevante de esta superficie y hay que
plantearlo cada vez que se añada una capacidad.

## Deuda y riesgos

| Id | Sev | Qué |
|----|-----|-----|
| R-06 | P1 | **Todos** los listados de administración aceptan `cursor` y lo ignoran: solo se ve la primera página |
| R-15 | P2 | El filtro `status` de la cola de pedidos no se valida en el backend: un valor inválido devuelve 500 |
| R-05 | P1 | El límite del viajero no se aplica (relevante al construir su pantalla) |

**Además, no cubierto por un id:**

- Sin paginación real, la operación se queda ciega en cuanto haya volumen.
- Sin colas ordenadas por **urgencia** ni señal de holgura crítica frente a la
  fecha de viaje: el operador no sabe qué atender primero.
- Suspender y reactivar **no piden motivo** ni dejan traza de moderación (el
  backend tampoco lo exige).
- La resolución de disputas no tiene evidencia ni resultado estructurado
  (limitación del backend, → R-23).
- Curaduría: sin edición, sin reactivación, sin ver inactivos.
- Sin componente `table` ni `pagination` en el design system: todas las colas son
  divs a mano.
- `api.ts` concentra todas las áreas y va a seguir creciendo.
- Sin exportación a CSV de ninguna cola, que es lo primero que pide una operación
  real.
- Sin pruebas.

## Pendientes

- [ ] Pantalla de **cola KYC** con visor de artefactos y decisión con motivo
- [ ] Pantalla de **blocklist** de documentos
- [ ] Pantalla de **perfil de riesgo** del viajero
- [ ] Pantalla de **ajuste de límite** — solo cuando el backend lo aplique (→ R-05)
- [ ] Paginación en todas las colas (→ R-06)
- [ ] Motivo obligatorio al suspender / reactivar *(requiere API)*
- [ ] Ordenación por urgencia y señal de holgura crítica *(requiere API)*
- [ ] Curaduría: edición, reactivación, listado de inactivos *(requiere API)*
- [ ] Dividir `api.ts` por área
- [ ] Componentes `table` y `pagination` en el design system
- [ ] Confirmación explícita en `confirm-hub-reception`, con resumen de efectos
- [ ] Exportación a CSV de las colas
- [ ] Dashboard de KPI y consulta de auditoría *(requieren API)*
