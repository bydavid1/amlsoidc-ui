# Capa: `lib/api` + `lib/auth` — cliente HTTP y sesión

La pieza más delicada del frontend: envelope, errores, sesión y rotación de
refresh.

Ficheros: `src/lib/api/client.ts`, `src/lib/api/types.ts`,
`src/lib/auth/token-store.ts`.

---

## Qué resuelve, en tres puntos

1. Adjunta el `Bearer` token a cada petición.
2. Des-envuelve el envelope `{ success, data, meta }` **una sola vez**.
3. Ante `401 UNAUTHENTICATED` hace **un** refresh *single-flight* y reintenta.

## El envelope

La API responde siempre igual:

```json
{ "success": true, "data": <payload>, "meta": { "requestId": "..." } }
```

Los helpers extraen `data`:

| Helper | Cuándo |
|--------|--------|
| `apiGet<T>(url, params)` | Lecturas simples |
| `apiGetWithMeta<T>(url, params)` | Cuando hace falta `meta.nextCursor` |
| `apiPost<T>(url, body)` | Acciones. Tolera respuestas sin cuerpo (204) |
| `apiPatch<T>(url, body)` | Actualizaciones |

**Regla:** ningún componente hace `fetch` ni `axios` directo. La única excepción
actual es la página de checkout sandbox, y es parte de R-01.

## Errores: `ApiError`

Toda respuesta de error se normaliza a un `ApiError` con `code`, `message`,
`status`, `details` y `requestId`. Sin envelope (fallo de red), el `code` es
`NETWORK_ERROR`.

**El código de la aplicación programa contra `error.code`, nunca contra
`error.message`.** El `message` es para logs y soporte.

`details` trae `[{ field, errors[] }]` en los `VALIDATION_ERROR`, y es lo que
permite mapear el error del backend al campo del formulario.

`requestId` es el puente al log del backend. Hoy **no se muestra en ninguna
pantalla ni se envía a ninguna herramienta**, lo cual desperdicia lo mejor que
tiene el contrato de errores.

## Sesión: `tokenStore`

| Token | Dónde | Por qué |
|-------|-------|---------|
| Access (15 min) | Variable de módulo, **solo en memoria** | Que no sobreviva a un XSS persistente ni quede en disco |
| Refresh (7 días) | `localStorage`, clave única | Sin él, cada recarga obliga a volver a iniciar sesión |

Riesgo aceptado y documentado: el refresh es accesible a XSS. Mitigación del
backend: rotación en cada uso + detección de reuso que quema toda la familia.

`getRefresh` y `setRefresh` comprueban `typeof window === "undefined"`, así que el
store es seguro en render de servidor.

## Refresh *single-flight*: por qué es obligatorio

```ts
let refreshInFlight: Promise<boolean> | null = null;

function refreshOnce(): Promise<boolean> {
  refreshInFlight ??= refreshSession().finally(() => { refreshInFlight = null; });
  return refreshInFlight;
}
```

**No es una optimización: es un requisito del contrato.** El backend rota el
refresh en cada uso y detecta reuso revocando toda la familia de la sesión. Dos
refresh concurrentes con el mismo token ⇒ el segundo activa la detección de robo
⇒ **sesión muerta**.

Por eso todas las peticiones que reciben 401 esperan **la misma** promesa.

`refreshSession` usa `axios` "crudo" (sin interceptores) para no recursar.

### El hueco: multi-pestaña (→ R-07)

`refreshInFlight` es una variable de **módulo**, o sea **por pestaña**. El refresh
token vive en `localStorage`, **compartido entre pestañas**.

Con dos pestañas abiertas, ambas pueden hacer `bootstrapSession()` al cargar (o
recibir un 401 a la vez) y rotar el **mismo** token. La segunda dispara la
detección de reuso y **las dos sesiones mueren**, sin explicación para el usuario.

Arreglo: `navigator.locks.request()` donde exista, o un mutex por `localStorage`
con marca de tiempo y reintento corto, más `BroadcastChannel` para propagar el
token nuevo a las demás pestañas en lugar de que cada una rote por su cuenta.

## Reintento del 401

```
401 + code === "UNAUTHENTICATED" + !original._retried
  → refreshOnce()
     → si ok: marcar _retried, borrar el header Authorization
              (para que el interceptor de request ponga el nuevo)
              y reenviar la petición original
     → si falla: tokenStore.clear() + notificar sesión expirada
```

La condición `!original._retried` garantiza **un solo** reintento por petición: no
hay riesgo de bucle.

**Nota:** el reintento solo se dispara con `code === "UNAUTHENTICATED"`. Un 401
con otro código (`REFRESH_TOKEN_REUSED`, `INVALID_CREDENTIALS`) **no** intenta
refresh, que es lo correcto.

## Rehidratación y expiración

`bootstrapSession()` — si hay refresh persistido, lo rota para obtener un access
fresco. Lo llama `AuthProvider` al montar.

`onSessionExpired(listener)` — suscripción para que la UI reaccione a la muerte de
la sesión. `AuthProvider` la usa para pasar a estado anónimo globalmente, lo que
hace que `RequireAuth` redirija a `/login`.

Es un pequeño bus de eventos propio y está bien resuelto: evita que el cliente
HTTP tenga que conocer el router.

## Deuda y riesgos

| Id | Sev | Qué |
|----|-----|-----|
| R-07 | P1 | Sin serialización del refresh entre pestañas |

**Además, no cubierto por un id:**

- El `requestId` se captura y **no se usa**: ni se muestra al usuario en errores
  irrecuperables, ni se envía a ninguna herramienta de errores (→ FE-E6).
- No hay timeout configurado en la instancia de axios: una petición colgada se
  queda colgada.
- No hay cancelación con `AbortSignal`: navegar fuera de una pantalla no cancela
  sus peticiones en vuelo.
- `NEXT_PUBLIC_API_URL` cae a un `localhost` hardcodeado si falta. Es cómodo en
  desarrollo y peligroso en producción: falla silenciosamente en lugar de avisar.
- Sin pruebas. Es la pieza que más se merece unas: refresh *single-flight*,
  reintento único, y mapeo de `ApiError`.

## Pendientes

- [ ] Serializar el refresh entre pestañas (→ R-07)
- [ ] Mostrar el `requestId` en pantallas de error irrecuperable
- [ ] Enviar el `requestId` a una herramienta de captura de errores
- [ ] `timeout` en la instancia de axios
- [ ] Cancelación con `AbortSignal` al desmontar
- [ ] Validar `NEXT_PUBLIC_API_URL` al arrancar en lugar de caer a `localhost`
- [ ] Pruebas unitarias del cliente (→ R-38)
