# Feature: `auth`

Registro, login, sesión y perfil del usuario. Espejo de los módulos `auth` +
`identity` del backend.

Ficheros: `src/features/auth/**`, `src/app/(auth)/**`.

---

## Piezas

| Fichero | Qué es |
|---------|--------|
| `api.ts` | `register`, `login`, `me`, `logout` — con parseo Zod |
| `schemas.ts` | `authUserSchema`, `authPayloadSchema`, `registerFormSchema`, `loginFormSchema` |
| `auth-provider.tsx` | Contexto de sesión: `status`, `user`, `login`, `register`, `logout`, `refreshUser`, `hasRole` |
| `components/login-form.tsx` | Formulario de login |
| `components/register-form.tsx` | Formulario de registro |
| `components/profile-form.tsx` | Nombre + teléfono |

## Endpoints que consume

| Método | Ruta |
|--------|------|
| POST | `/auth/register` |
| POST | `/auth/login` |
| GET | `/auth/me` |
| POST | `/auth/logout` |
| PATCH | `/users/me` (desde `profile-form`) |

El refresh (`POST /auth/refresh`) lo gestiona el cliente HTTP, no esta feature.

## `AuthProvider`: el ciclo de vida de la sesión

```
Montar
  → bootstrapSession()          rota el refresh persistido
     ├─ sin sesión  → status: "anonymous"
     └─ con sesión  → authApi.me() → status: "authenticated"
                       └─ si falla → clear() + "anonymous"

onSessionExpired  → user = null, status: "anonymous"
                    (RequireAuth reacciona y redirige a /login)
```

Tres estados: `loading` | `authenticated` | `anonymous`. `RequireAuth` muestra
skeleton mientras es `loading`, lo que evita el parpadeo clásico de "veo la app y
me echa a login".

El efecto de montaje usa una bandera `cancelled` para no escribir estado tras el
desmontaje. Correcto.

`refreshUser()` re-lee `/auth/me`: hace falta tras activar un perfil, porque los
**roles cambian** y el token de acceso todavía tiene los viejos.

`hasRole(role)` es la base de `RequireRole` y de la visibilidad del enlace a
administración.

## Errores manejados

### Login (`login-form.tsx`)

| `code` | Tratamiento |
|--------|-------------|
| `INVALID_CREDENTIALS` | Error en el formulario, mismo mensaje exista o no el correo |
| `USER_SUSPENDED` | Aviso de cuenta suspendida |
| `RATE_LIMITED` | "Demasiados intentos, espera unos minutos" |

### Registro (`register-form.tsx`)

| `code` | Tratamiento |
|--------|-------------|
| `EMAIL_ALREADY_REGISTERED` | Error en el campo de correo |
| `VALIDATION_ERROR` | Mapea `details` **solo** de campo `email` o `password` |
| `RATE_LIMITED` | Aviso |
| Cualquier otro | Toast genérico |

---

## ⚠️ El registro está roto (→ R-02, P0)

**`authApi.register` envía solo `{ email, password }`.** El `RegisterDto` del
backend exige además `identityDocument` con `countryIso2`, `type` y `number`, con
`@ValidateNested()` y sin `@IsOptional()`. El `ValidationPipe` global rechaza la
petición.

**Resultado: `POST /auth/register` devuelve `400 VALIDATION_ERROR` en el 100% de
los casos. Nadie puede registrarse desde la web.**

Y como el formulario solo mapea `details` de `email` y `password`, el error real
(`identityDocument`) cae en el toast genérico *"No pudimos crear tu cuenta"*: el
usuario no tiene ninguna pista, y quien depura tampoco.

Una sola prueba e2e del *happy path* del registro lo habría detectado (→ R-38).

**Requiere una decisión de producto antes de arreglarlo:**

- **Opción A (recomendada):** añadir el paso de documento al registro — país
  ISO-2, tipo (`DUI`/`PASSPORT`/`DRIVER_LICENSE`/`NATIONAL_ID`) y número —,
  extender `registerFormSchema` y `authApi.register`, y mapear
  `DOCUMENT_INVALID`, `DOCUMENT_ALREADY_REGISTERED` y `BLOCKED_DOCUMENT`.
- **Opción B:** el registro se queda con correo y contraseña, y el documento se
  pide al activar el perfil de viajero. **Requiere cambio en la API.**

---

## Otra deuda

| Id | Sev | Qué |
|----|-----|-----|
| R-02 | **P0** | El registro falla siempre |
| R-07 | P1 | `bootstrapSession` en dos pestañas mata la sesión |

**Además, no cubierto por un id:**

- **No hay recuperación de contraseña**, ni verificación de correo, ni cambio de
  contraseña autenticado. El backend tampoco los tiene, así que es un hueco de
  producto compartido.
- El esquema de contraseña replica los límites del backend (8–72). El 72 es un
  límite heredado de bcrypt que argon2 no tiene: si el backend lo cambia, hay que
  cambiarlo aquí también.
- `authUserSchema` marca `firstName`, `phone` y `hasCompleteProfile` como
  opcionales con default. Es tolerante, pero significa que un cambio de contrato
  en esos campos **no fallaría ruidoso**, que es justo lo contrario del propósito
  de validar en la frontera.
- No se comprueba si el login consume `?next=` para volver al destino original
  tras autenticarse.
- Sin pruebas.

## Pendientes

- [ ] **Arreglar el registro de punta a punta** (→ R-02)
- [ ] Mapear todos los códigos de error de registro, no solo dos campos
- [ ] Serialización del refresh entre pestañas (→ R-07)
- [ ] Confirmar (o implementar) el uso de `?next=` tras el login
- [ ] Recuperación de contraseña y verificación de correo *(requiere API)*
- [ ] Mostrar el estado del expediente KYC en la cuenta *(requiere pantalla de
      KYC)*
- [ ] e2e de registro y login (→ R-38)
