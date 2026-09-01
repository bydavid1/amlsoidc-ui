# 03 — Decisiones técnicas del frontend

| Estado | Significado |
|--------|-------------|
| Vigente | Se aplica hoy y se defiende |
| Vigente con reservas | Se aplica, pero tiene una brecha conocida |
| Pendiente | Decidida, no implementada |

---

## FE-01 · Cero lógica de negocio en el cliente

**Estado:** Vigente

La máquina de estados vive en el backend. La UI refleja estados y dispara
acciones; nunca edita estados.

*Por qué:* la misma API la van a consumir el móvil y las integraciones. Si la
regla vive en el cliente, hay que reimplementarla en cada uno y divergen.

*Corolario:* un `409` del backend **no es un bug de la UI**. Es el estado que
cambió. La UI avisa y refresca. Los helpers de `order-status.ts` son un espejo de
las invariantes para decidir qué botón mostrar, no la autoridad.

## FE-02 · El design system es ley

**Estado:** Vigente

Todos los tokens salen de las CSS variables de `globals.css`, derivadas de
`docs/DESIGN-coinbase.md`. **Prohibido el hex inline.**

*Por qué:* un solo color de acción y una sola escala de radios es lo que hace que
la app se sienta como un producto y no como una suma de pantallas.

*Reserva:* **no hay linter que detecte un hex inline.** La regla depende de la
revisión humana.

## FE-03 · `features/` espeja los módulos del backend

**Estado:** Vigente

Un nombre de feature = un módulo del backend: `auth`, `orders`, `trips`,
`assignments`, `payments`, `notifications`, `catalog`, `geography`, `profiles`,
`incidents`, `ratings`, `admin`.

*Por qué:* el mapa mental es único entre los dos repos. Nadie tiene que traducir
"¿dónde está lo de los pagos?".

## FE-04 · Validación de respuestas con Zod en la frontera

**Estado:** Vigente

Cada `features/*/api.ts` parsea la respuesta con un esquema.

*Por qué:* si el contrato de la API cambia, falla **ruidoso ahí** en lugar de
producir un `undefined` tres componentes más abajo.

*Coste aceptado:* hay que mantener los esquemas a mano. La alternativa —generar
el cliente desde el OpenAPI de Swagger— es mejor a medio plazo y está registrada
como pendiente.

## FE-05 · Access token en memoria, refresh en `localStorage`

**Estado:** Vigente con reservas

*Por qué en memoria el access:* que no sobreviva a un XSS persistente ni quede en
disco.

*Por qué `localStorage` el refresh:* sin él, cada recarga de página obliga a
volver a iniciar sesión. La alternativa (cookie `HttpOnly`) exige protección CSRF
y cambia el modelo del cliente; se descartó para el piloto.

*Riesgo aceptado:* el refresh es accesible a XSS. Mitigación: el backend rota el
token en cada uso y detecta reuso revocando toda la familia, así que un token
robado tiene ventana corta y su uso delata el robo.

## FE-06 · Refresh *single-flight* obligatorio

**Estado:** Vigente con reservas

Todas las peticiones que reciben `401 UNAUTHENTICATED` esperan **la misma
promesa** de refresh, y se reintentan una vez.

*Por qué es obligatorio, no una optimización:* el backend rota el refresh y
detecta reuso. **Dos refresh concurrentes con el mismo token matan la sesión.**

*Reserva (→ R-07):* el *single-flight* es una variable de módulo, o sea **por
pestaña**. Dos pestañas abiertas pueden rotar el mismo token a la vez y activar
la detección de reuso, matando ambas sesiones sin explicación. Falta
serialización entre pestañas (`navigator.locks` o `BroadcastChannel`).

## FE-07 · Polling en vez de websockets

**Estado:** Vigente (decisión de piloto)

`refetchInterval: 30_000` en las consultas de pantallas activas.

*Por qué:* evita infraestructura de sockets para un producto donde los cambios de
estado ocurren en escala de horas, no de segundos.

*Coste:* cinco consultas cada 30 s por usuario activo. Con volumen habrá que
revisarlo o hacer el intervalo adaptativo (más lento cuando la pestaña está en
segundo plano).

## FE-08 · Los 4xx no se reintentan

**Estado:** Vigente

Configurado en `providers.tsx`: `retry` devuelve `false` para `ApiError` con
`status < 500`, y reintenta hasta dos veces el resto.

*Por qué:* un error de negocio no se arregla repitiendo la petición. Reintentar
un 409 o un 403 solo multiplica ruido y consume rate limit.

## FE-09 · `RequireRole` ofrece activar el perfil en lugar de bloquear

**Estado:** Vigente

Si el usuario entra a `/comprar` sin rol `BUYER`, no ve un "acceso denegado": ve
un botón "Activar perfil de comprador".

*Por qué:* la activación es idempotente en el backend y no tiene coste. Convertir
un obstáculo en un botón es la diferencia entre un embudo que convierte y uno que
no.

## FE-10 · Server Components por defecto, cliente donde hay interacción

**Estado:** Vigente con reservas

*Reserva:* en la práctica casi todo es cliente, porque toda pantalla autenticada
depende del access token que vive en memoria del navegador. La única pantalla
realmente de servidor es la landing, y ahí hay un problema: hace `fetch` a
`NEXT_PUBLIC_API_URL` —una URL de navegador— desde el servidor (→ R-40).

## FE-11 · Traducción de estados centralizada

**Estado:** Vigente

`components/status/order-status.ts` es el **único** sitio donde un estado del
backend se convierte en texto, color y posición del stepper.

*Por qué:* si cada pantalla traduce por su cuenta, el mismo estado acaba con tres
nombres distintos y el usuario no entiende en qué punto está su pedido.

## FE-12 · Sustitutas de fuentes documentadas

**Estado:** Vigente

El design system especifica tipografías propietarias; se usan Inter y JetBrains
Mono como sustitutas, y está anotado en `layout.tsx`.

*Consecuencia operativa:* se cargan desde Google Fonts, así que `npm run build`
falla en entornos sin salida a internet. Para verificar cambios: `tsc --noEmit` y
`lint`.

## FE-13 · Un solo tema (claro)

**Estado:** Vigente (por ahora)

`next-themes` está montado con `defaultTheme="light"` y `enableSystem={false}`.

*Por qué:* hay infraestructura para temas, pero el design system no define paleta
oscura todavía. Es mejor un tema bien resuelto que dos a medias.

## FE-14 · Cliente generado desde OpenAPI

**Estado:** Pendiente

Los tipos de la API se mantienen a mano en esquemas de Zod. La API expone OpenAPI
completo en `/api/docs`. Generar los tipos eliminaría una clase entera de
desincronización.

Decisión pendiente: generar solo tipos, o generar cliente completo (perdiendo el
control del envelope y del refresh que hoy está bien resuelto).

---

## Decisiones pendientes (bloquean trabajo)

| Decisión | Qué bloquea | Riesgo |
|----------|-------------|--------|
| Dónde se pide el documento de identidad: registro o activación de perfil de viajero | **El registro entero** | R-02 |
| Qué ve el comprador de la dirección de recepción | Pantalla de detalle de pedido y textos legales | R-30 |
| Copy de la landing acorde al modelo vigente | Credibilidad de la superficie pública | R-27 |
| Infraestructura de pruebas: Vitest + Testing Library, o Playwright | Toda la estrategia de calidad | R-38 |
| Nombre definitivo del producto | ~40 textos visibles | — |
| Estrategia de i18n: ¿se internacionaliza? | Todo el copy está en español en el código | — |
