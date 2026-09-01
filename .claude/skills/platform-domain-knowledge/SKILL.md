---
name: platform-domain-knowledge
description: >
  Fuente de verdad del negocio, en la versión que el frontend necesita: actores,
  quién puede hacer qué, estados del pedido y su traducción a UX, flujos de
  cumplimiento, reglas de dinero y visibilidad. Consúltalo SIEMPRE antes de
  diseñar o implementar una pantalla que dependa de reglas de negocio.
---

# Contexto de negocio para la UI

> **Nomenclatura.** La plataforma no tiene nombre asignado: se la llama "la
> Plataforma" o "el Sistema". El nombre-clave heredado aparece en ~40 textos
> visibles de la UI; se barrerá cuando se decida el nombre definitivo.
>
> Versión completa del negocio: `../../../docs/00-plataforma.md`.
> Contrato con la API: `../../../docs/01-integracion.md`.

---

## 1. Qué es

Marketplace de logística colaborativa: conecta a quien quiere comprar un producto
de otro país con viajeros que ya tienen un viaje planificado y pueden traerlo.

El valor no es el transporte: es **quitar la incertidumbre** entre dos
desconocidos. Eso debe notarse en la UI: cada paso visible, cada estado
explicado, cada acción con su consecuencia clara.

Corredor inicial: Estados Unidos → El Salvador. **Multi-corredor por datos**: la
UI **nunca** hardcodea corredores; vienen de `GET /corridors`.

## 2. Actores y qué puede hacer cada uno

| Actor | Rol | Espacio | Puede |
|-------|-----|---------|-------|
| Comprador | `BUYER` | `/comprar` | Crear encargo, pagar el servicio, seguir, confirmar entrega, calificar, abrir disputa |
| Viajero | `TRAVELER` | `/viajar` | Publicar viaje, **explorar y reclamar** encargos, registrar avance físico |
| Operaciones | `ADMIN` | `/admin` | Compras, recepción en el punto, despacho, disputas, usuarios, payouts, curaduría, flujo activo |

**Un usuario puede ser comprador y viajero a la vez.** Un usuario recién
registrado tiene **`roles: []`**: los roles se ganan al activar el perfil
(idempotente). `RequireRole` lo ofrece en el momento.

Para operar hace falta **perfil mínimo**: nombre + teléfono. Sin él, crear un
encargo o publicar un viaje devuelve `403 PROFILE_INCOMPLETE`.

## 3. El comprador no elige viajero; el viajero sí elige encargo

El comprador **nunca** selecciona viajero y **nunca** obtiene su contacto: solo ve
nombre de pila y reputación ("percepción sin contacto").

```
1. El viajero publica su viaje y lo pasa a OPEN
2. Ve los encargos compatibles de su corredor con fecha compatible
3. RECLAMA → el primero gana; el segundo recibe 409 ORDER_ALREADY_TAKEN
```

**La carrera es esperada, no un error.** El mensaje debe explicarla en términos
humanos ("Otro viajero tomó este encargo primero") y refrescar la lista.

### Lo que NO existe

- ❌ Algoritmo que elige "el mejor viajero"
- ❌ Scoring, ventana de aceptación, expiración de ofertas
- ❌ **Capacidad numérica del viaje** (se eliminó del modelo de datos)
- ❌ Calificación mutua comprador ↔ viajero

⚠️ **El copy de la landing sigue prometiendo todo eso** (→ R-27). No lo tomes como
especificación.

## 4. Flujos de cumplimiento: importan para la UI

| Alias | Quién compra | Ruta física |
|-------|--------------|-------------|
| A | El viajero, con su dinero | Viajero → comprador |
| B | Operaciones | Tienda → dirección del viajero → comprador |
| **C** | Operaciones / el comprador | Tienda → dirección del viajero → **hub** → comprador |

**El Flujo C es el activo por defecto.** Se elige por **configuración global**, no
por umbral de monto, y se congela en cada encargo al crearlo.

**Por qué importa:** las acciones disponibles y los estados que se muestran
cambian según el flujo. Caso ya detectado: `canConfirmPurchase` no comprueba el
flujo, pero el backend exige Flujo A, así que el botón puede aparecer y devolver
`409 PROCUREMENT_MANAGED_BY_BRINGO` (→ R-29).

**Regla:** no mezcles la UI de dos flujos en un componente con muchos `if`.
Separa por flujo y comparte solo lo genuinamente común.

## 5. Estados y su traducción

**Backbone (nivel 1):**

```
PENDING_ASSIGNMENT → ASSIGNED → SOURCING → IN_TRANSIT → READY_FOR_DELIVERY
                                                → DELIVERED → COMPLETED
Excepciones: DISPUTED · CANCELLED · EXPIRED · DELIVERY_FAILED
```

**Sub-flujo (nivel 2):**

```
AWAITING_PURCHASE → PURCHASED → TRACKING_REGISTERED → RECEIVED_BY_TRAVELER
                              → HUB_RECEIVED_BY_BRINGO → DISPATCHED_TO_BUYER
```

`displayStatus` es la proyección aplanada que la API entrega para clientes.

**La traducción vive en un único sitio:** `components/status/order-status.ts`.
Nunca traduzcas un estado en un componente: el mismo estado con tres nombres
distintos deja al usuario sin entender dónde está su pedido.

Estados que en la práctica **no se alcanzan**: `DELIVERY_FAILED` (ningún método
del backend lo produce) y `EXPIRED` (no hay proceso que lo dispare).

`COMPLETED` **solo** se alcanza si el comprador califica. Merece un recordatorio
persistente en `DELIVERED`.

## 6. Dinero y visibilidad

El comprador paga el **producto** en la tienda por su cuenta, y a la Plataforma le
paga el **servicio**.

| Quién | Ve |
|-------|-----|
| Comprador | **Solo** el total (`estimatedTotalAmount`) |
| Viajero | **Solo** su pago (`travelerRewardAmount`) |
| Operaciones (`/admin`) | Desglose completo |

Los DTO del backend ya respetan la regla, así que en el cliente **no hay nada que
ocultar**. Solo hay que:

- no reconstruir el desglose desde otras fuentes
- **no reutilizar componentes de `features/admin/` en pantallas de usuario**

Cobro: `PENDING → PAID → [REFUND_DUE → REFUNDED]`. Sin servicio pagado no se
puede confirmar la compra (`409 PAYMENT_REQUIRED`).

## 7. Confianza: el gate que bloquea el embudo

Un viajero **no puede reclamar su primer encargo sin KYC aprobado**:
`403 KYC_REQUIRED`.

Y hoy: ese código **no está mapeado**, y **no hay ninguna pantalla** para enviar
el expediente ni para aprobarlo. Es el peor error de UX de la aplicación
(→ FE-E4, FE-E3).

## 8. Glosario (usar estos términos exactos)

`Order`/encargo · `Trip`/viaje · `Assignment` · `Fulfillment` · `claim`/reclamar ·
`corridor`/corredor · `travelerReward` · `platformFee` · `estimatedTotal` ·
`sizeCategory` (`SMALL`/`MEDIUM`/`LARGE`) · escrow · hub · KYC · `displayStatus`.

Los estados se traducen **solo** en la capa de presentación; nunca se renombran en
la lógica.

**Conceptos NO implementados** (no los uses como si existieran): `threshold`,
`reputation tier`, subroles operativos, capacidad de viaje.

## 9. Qué NO hacer

- No decidir transiciones de estado en el cliente: la autoridad es el backend.
- No tratar un `409` como bug: es el estado que cambió. Avisa e invalida.
- No mostrar el desglose del dinero a quien no le corresponde.
- No dar contacto de una parte a la otra.
- No hardcodear corredores, tarifas ni umbrales.
- No usar el nombre comercial de la plataforma en documentación.
