# Feature: `profiles`

Activación de los perfiles de comprador y viajero. Espejo de los casos de uso de
activación de `orders` y `trips` en el backend.

Ficheros: `src/features/profiles/api.ts`,
`src/components/layout/require-role.tsx`, `src/app/(app)/onboarding/`.

---

## Para qué existe

Un usuario recién registrado tiene **`roles: []`**. Los roles no se piden al
registrarse: se ganan al activar el perfil correspondiente.

| Acción | Endpoint | Rol que otorga |
|--------|----------|----------------|
| Activar perfil de comprador | `POST /users/me/buyer-profile` | `BUYER` |
| Activar perfil de viajero | `POST /users/me/traveler-profile` | `TRAVELER` |

Ambas son **idempotentes** en el backend: activar dos veces devuelve el mismo
perfil. Es lo que permite tratarlas como una acción sin coste.

## La secuencia completa

```
Registro
  → /onboarding
     ├─ paso 1: completar perfil (nombre + teléfono)   PATCH /users/me
     └─ paso 2: elegir espacio  → activa el perfil y va a /comprar o /viajar

O bien: el usuario entra directo a /comprar sin rol BUYER
  → RequireRole ofrece "Activar perfil de comprador"
     → activa + refreshUser() + router.refresh()
```

**Tras activar hay que llamar a `refreshUser()`**, porque los roles cambian y el
usuario en memoria tiene los viejos. Está hecho en `RequireRole`; hay que
recordarlo en cualquier flujo nuevo que active un perfil.

## `RequireRole`: convertir un bloqueo en un botón

En lugar de mostrar "acceso denegado", `RequireRole` muestra una pantalla con el
copy del rol y un botón que activa el perfil en el momento.

Es una de las mejores decisiones de UX del proyecto: aprovecha que la activación
es idempotente y sin coste, y elimina un paso del embudo que no aportaba nada.

`COPY` tiene los textos de `BUYER` y `TRAVELER`. `ADMIN` no está aquí a
propósito: ese rol no se autoactiva.

## Por qué el perfil mínimo es obligatorio

Crear un encargo o publicar un viaje exige `hasCompleteProfile` (nombre +
teléfono), o el backend devuelve `403 PROFILE_INCOMPLETE`. La razón de negocio:
en el modelo hub, Operaciones necesita poder contactar a ambas partes.

El onboarding lo pide en el paso 1, antes de elegir espacio. Correcto.

## Deuda

Sin riesgos con id. Deuda menor:

- `PROFILE_INCOMPLETE` **no está mapeado** a un mensaje útil: si un usuario llega
  a crear un encargo sin perfil completo (por ejemplo saltándose el onboarding con
  una URL directa), ve el toast genérico en lugar de "completa tu perfil".
- `TRAVELER_PROFILE_REQUIRED` y `BUYER_PROFILE_REQUIRED` tampoco están mapeados.
- No hay forma de **desactivar** un perfil, ni de ver qué perfiles tiene activos
  el usuario más allá de los roles.
- No hay estado de verificación del viajero visible: el perfil de viajero se
  activa, pero el KYC —que es lo que realmente habilita reclamar— no tiene
  superficie (→ FE-E3).
- `api.ts` no valida la respuesta con Zod, al contrario que el resto de features.
  Es una inconsistencia menor: la respuesta se usa poco, pero rompe la regla.
- Sin pruebas.

## Pendientes

- [ ] Mapear `PROFILE_INCOMPLETE`, `BUYER_PROFILE_REQUIRED` y
      `TRAVELER_PROFILE_REQUIRED`
- [ ] Mostrar en `/cuenta` los perfiles activos y el estado de verificación
- [ ] Añadir parseo Zod a las respuestas de activación, por consistencia
- [ ] Enlazar la activación del perfil de viajero con el envío del expediente KYC
      cuando esa pantalla exista
