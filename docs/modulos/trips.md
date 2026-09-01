# Feature: `trips`

Publicar y gestionar viajes. Espejo del módulo `trips` del backend.

Ficheros: `src/features/trips/**`, `src/app/(app)/viajar/**` (excepto los
encargos, que son de [`assignments`](assignments.md)).

---

## Piezas

| Fichero | Qué es |
|---------|--------|
| `api.ts` | `create`, `list`, `get`, `publish`, `close`, `cancel` |
| `hooks.ts` | `useMyTrips`, `useTrip`, `usePublishTrip`, `useCloseTrip`, `useCancelTrip`, `useCreateTrip` |
| `schemas.ts` | Esquemas de respuesta y del formulario |
| `components/create-trip-form.tsx` | Publicar viaje |
| `components/trip-list.tsx` | Lista con paginación infinita |

## Endpoints que consume

| Método | Ruta | Nota |
|--------|------|------|
| POST | `/trips` | |
| GET | `/trips` | **Cursor real** |
| GET | `/trips/:id` | |
| POST | `/trips/:id/publish` | `DRAFT` → `OPEN` |
| POST | `/trips/:id/close` | `OPEN` → `CLOSED` |
| POST | `/trips/:id/cancel` | Cancela los claims activos |

Consume `geography` para el selector de corredor y ciudad.

## El modelo es mínimo a propósito

Un viaje es **ruta + fecha**. Nada más.

> **La capacidad numérica se eliminó del modelo** en el cambio al modelo de
> reclamo. "Si cabe o no" lo juzga el viajero encargo por encargo. Si ves copy o
> documentación que hable de "capacidad disponible", está desactualizado
> (→ R-27: el copy de la landing todavía dice *"Publica tu viaje: ruta, fecha y
> capacidad"*).

## Cerrar ≠ cancelar

La distinción es una decisión de dominio importante que la UI debe reflejar con
claridad:

| Acción | Qué pasa | Mensaje actual |
|--------|----------|----------------|
| **Cerrar** | Deja de recibir claims nuevos. **Los encargos activos siguen su curso** | "Viaje cerrado. Ya no verás encargos disponibles para este viaje." |
| **Cancelar** | Cancela los claims activos: los encargos vuelven a pendiente, o pasan a disputa si ya se compró | — |

El mensaje de cierre es bueno: explica la consecuencia, no solo confirma la
acción. El de cancelación debería advertir del efecto sobre los encargos ya
reclamados **antes** de ejecutarlo.

## Manejo de errores

Cada hook mapea el `409` a un mensaje concreto del estado:

| Acción | Mensaje ante 409 |
|--------|------------------|
| `publish` | "El viaje ya no está en borrador" |
| `close` | "El viaje ya no está publicado" |

Es el nivel de detalle correcto: en vez de "algo falló", dice **qué** estado
impidió la acción.

`useCloseTrip` invalida `["trips"]` **y** `["assignments"]`, porque cerrar un
viaje cambia qué encargos se pueden descubrir. Bien visto.

## Deuda y riesgos

Sin riesgos con id propios. Lo que hay es deuda de alcance:

- **Códigos sin mapear** que este flujo puede devolver: `PROFILE_INCOMPLETE`,
  `TRAVELER_PROFILE_REQUIRED`, `CORRIDOR_NOT_ENABLED`, `TRIP_ARRIVAL_IN_PAST`.
- **No hay confirmación al cancelar** un viaje con encargos reclamados, ni aviso
  del efecto sobre esos encargos.
- **No hay edición de viaje**: corregir una fecha obliga a cancelar y crear otro
  (el backend tampoco lo permite).
- `IN_PROGRESS` existe en el enum del backend y nada lo produce: si algún día se
  implementa, hay que añadir su traducción.
- La ciudad de destino se envía y el backend **no la valida** ni la usa en la
  compatibilidad (→ R-34). La UI la pide como si importara.
- Sin tope superior de fecha: se puede publicar un viaje a diez años vista.
- Sin pruebas.

## Pendientes

- [ ] Mapear los códigos de error que faltan
- [ ] Diálogo de confirmación al cancelar, con el número de encargos afectados
- [ ] Aclarar en la UI si la ciudad de destino importa (depende de → R-34)
- [ ] Edición de viaje *(requiere API)*
- [ ] Corregir el copy de la landing que menciona capacidad (→ R-27)
- [ ] e2e: publicar viaje → ver encargos disponibles → reclamar
