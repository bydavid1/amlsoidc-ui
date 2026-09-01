# Feature: `assignments`

Descubrimiento y reclamo de encargos, y el avance físico del paquete. Espejo del
módulo `matching` del backend.

Ficheros: `src/features/assignments/**`,
`src/app/(app)/viajar/[tripId]/encargos/`, `src/app/(app)/viajar/encargos/`.

---

## Piezas

| Fichero | Qué es |
|---------|--------|
| `api.ts` | `listAvailableOrders`, `claim`, `listMine`, `markReceived`, `markInTransit`, `setReceivingAddress` |
| `hooks.ts` | `useAvailableOrders`, `useClaimOrder`, `useMyAssignments`, y hooks de acción |
| `components/available-orders.tsx` | Descubrimiento y reclamo |
| `components/assignment-board.tsx` | Encargos en curso del viajero |

## Endpoints que consume

| Método | Ruta | Nota |
|--------|------|------|
| GET | `/trips/:tripId/available-orders` | Tope de 50 en el backend, sin paginación |
| POST | `/trips/:tripId/claim/:orderId` | El primero gana |
| GET | `/assignments` | **Sin cursor real** (→ R-06) |
| POST | `/assignments/:id/mark-received` | |
| POST | `/assignments/:id/mark-in-transit` | |
| POST | `/assignments/:id/set-receiving-address` | |

## El modelo: el viajero elige

```
1. El viaje tiene que estar OPEN
2. Ver los encargos compatibles: mismo corredor, fecha compatible,
   excluyendo los propios
3. Reclamar → el primero gana
```

**No hay asignación automática, ni scoring, ni ventana de aceptación.** Si ves
copy que diga lo contrario, está desactualizado (→ R-27).

## La carrera del reclamo, bien manejada

```ts
onError: (error) => {
  if (code === "ORDER_ALREADY_TAKEN")
    → "Otro viajero tomó este encargo primero." + invalidar
  if (status === 409)
    → "Este encargo ya no está disponible." + invalidar
}
```

Es el manejo correcto: la carrera es **esperada** en este modelo (el backend la
resuelve con un índice único parcial en PostgreSQL), no es un error del sistema.
El mensaje lo explica en términos humanos y la lista se refresca.

## Polling

`useAvailableOrders` y `useMyAssignments` refrescan cada 30 s. Tiene sentido en el
descubrimiento —el viajero quiere ver encargos nuevos sin recargar—, pero es carga
constante sin pausa en segundo plano (→ FE-E9).

## Lo que muestra el board del viajero

Para cada encargo reclamado: producto, tamaño, **su pago** (`travelerReward`,
nunca la comisión), ciudad de destino, estado del pedido y del sub-flujo, señal de
servicio pagado, y la dirección de recepción registrada.

Muestra también `NEXT_PUBLIC_HUB_ADDRESS` cuando está definida: la dirección del
punto de consolidación donde el viajero debe entregar.

La regla de visibilidad se respeta: el viajero **solo** ve su pago.

---

## ⚠️ El gate de KYC sin salida (→ FE-E4)

Un viajero que intenta reclamar su **primer** encargo sin KYC aprobado recibe
`403 KYC_REQUIRED`. Ese código **no está mapeado**, así que el usuario ve
*"No pudimos reclamar el encargo."*

No sabe qué le falta. Y si lo supiera, **no hay ninguna pantalla donde enviar el
expediente** (→ FE-E3, R-17).

**Es el peor error de UX de la aplicación**: bloquea al usuario en el momento
exacto de convertir, sin decirle por qué y sin darle salida.

Arreglo mínimo mientras no exista la pantalla: mapear el código a un mensaje que
explique que hace falta verificar la identidad y cómo hacerlo (aunque sea por
soporte).

---

## Otra deuda

| Id | Sev | Qué |
|----|-----|-----|
| R-06 | P1 | `GET /assignments` acepta `cursor` y lo ignora: `useMyAssignments` usa `useQuery`, no `useInfiniteQuery`, porque no hay nada que paginar |
| R-05 | P1 | El límite de valor del viajero no se aplica en el backend: la UI puede ofrecer encargos que un control de riesgo debería haber filtrado |
| R-34 | P2 | La compatibilidad solo compara países: se ofrecen encargos de otra ciudad del país de destino |

**Además, no cubierto por un id:**

- El descubrimiento tiene un tope de 50 sin paginación ni ordenación
  configurable: con volumen, el viajero verá siempre los mismos encargos.
- Códigos sin mapear: `KYC_REQUIRED`, `TRIP_NOT_OPEN`, `ORDER_NOT_COMPATIBLE`.
- No hay forma de **soltar** un encargo reclamado: el viajero que se arrepiente
  tiene que cancelar el viaje entero (que arrastra todos los demás encargos).
- No hay acciones del viajero centralizadas equivalentes a `buyerActions`: cada
  componente decide qué botón mostrar por su cuenta.
- Sin pruebas.

## Pendientes

- [ ] **Mapear `KYC_REQUIRED`** con un mensaje útil (→ FE-E4)
- [ ] Mapear `TRIP_NOT_OPEN` y `ORDER_NOT_COMPATIBLE`
- [ ] Paginación del descubrimiento y del board en cuanto la API la soporte
      (→ R-06)
- [ ] Centralizar las acciones del viajero como espejo de invariantes, igual que
      `buyerActions`
- [ ] Pausar el polling en segundo plano
- [ ] Acción de soltar un encargo *(requiere API)*
- [ ] e2e: reclamo concurrente que confirma el mensaje de carrera
