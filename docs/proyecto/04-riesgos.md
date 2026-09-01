# 04 — Riesgos del frontend

El **detalle completo** de cada hallazgo está en el registro consolidado del
workspace: [`../../../docs/02-riesgos.md`](../../../docs/02-riesgos.md). Los ids
`R-nn` son estables y compartidos entre los dos proyectos.

Este documento es la **vista del frontend**.

---

## Riesgos con id que afectan a este repo

| Id | Sev | Qué | Fichero principal |
|----|-----|-----|-------------------|
| R-01 | **P0** | El secreto del webhook de pagos está en el bundle (`NEXT_PUBLIC_SANDBOX_SECRET`) | `app/(app)/comprar/[orderId]/pago-sandbox/page.tsx:33` |
| R-02 | **P0** | El registro no envía el documento de identidad: falla siempre | `features/auth/api.ts:12`, `schemas.ts:24`, `components/register-form.tsx` |
| R-07 | P1 | Dos pestañas abiertas matan la sesión | `lib/api/client.ts:32-72` |
| R-27 | P1 | El copy de la landing describe un modelo de asignación que ya no existe | `app/page.tsx:25-37,113-175` |
| R-28 | P1 | El `AGENTS.md` contradecía el flujo activo (corregido en esta revisión) | `AGENTS.md` |
| R-30 | P1 | Se muestra al comprador la dirección física del viajero | `features/orders/components/order-detail.tsx` |
| R-40 | P2 | La landing llama a la API con una URL de cliente desde el servidor | `app/page.tsx:14-23` |
| R-06 | P1 | Varios listados no pueden paginar porque la API no lo soporta | `features/assignments/hooks.ts`, `features/notifications/api.ts`, `features/admin/api.ts` |
| R-38 | P1 | No hay ninguna infraestructura de pruebas | `package.json` |
| R-43 | P3 | Referencias al repo hermano como `../amlscs` (corregidas en esta revisión) | `README.md`, `docs/PLAN.md` |

### Detalle de los dos P0 en este repo

**R-01 — el secreto en el bundle.** La página de checkout sandbox llama al
webhook público de la API con `x-sandbox-signature: NEXT_PUBLIC_SANDBOX_SECRET`.
Todo lo que empieza por `NEXT_PUBLIC_` se **compila dentro del JavaScript** que
se sirve al navegador: cualquier usuario puede leer ese valor con las
herramientas de desarrollo y marcar cualquier pago como pagado.

*Arreglo desde este lado:* eliminar la variable y la llamada al webhook. La
aprobación sandbox debe ser una acción de administración autenticada, no algo que
haga el navegador del comprador.

**R-02 — el registro está roto.** `authApi.register` envía solo
`{ email, password }`; `RegisterDto` del backend exige además `identityDocument`
con país ISO-2, tipo y número, y el `ValidationPipe` rechaza la petición. El
formulario, además, solo mapea `details` de campo `email` y `password`, así que el
error real queda invisible bajo un toast genérico.

*Arreglo desde este lado (opción recomendada):* añadir el paso de documento al
formulario, extender `registerFormSchema` y `authApi.register`, y mapear
`DOCUMENT_INVALID`, `DOCUMENT_ALREADY_REGISTERED` y `BLOCKED_DOCUMENT`.
**Requiere una decisión de producto**: ver R-02 en el registro consolidado.

---

## Riesgos estructurales sin id (deuda propia del frontend)

### FE-E1 · Sin ninguna red de seguridad

No hay Jest, Vitest, Testing Library ni Playwright. Ningún script de test.

Es la razón por la que R-02 —un flujo principal completamente caído— pasó
desapercibido. **Una sola prueba e2e del registro lo habría detectado.**

Lo mínimo por valor: (1) e2e de registro y login, (2) e2e de crear encargo y
verlo en la lista, (3) e2e de reclamar un encargo, (4) unitarias de
`order-status.ts` (`happyPathIndex` y `buyerActions`, que son un espejo de las
invariantes del backend y se desincronizan en silencio).

### FE-E2 · El espejo de invariantes se desincroniza en silencio

`components/status/order-status.ts` duplica reglas del backend:
`buyerActions.canCancel`, `canConfirmPurchase`, `canConfirmDelivery`, `canRate`,
`canReportIssue`, y las posiciones de `happyPathIndex`.

Si el backend cambia una precondición, aquí no falla nada: simplemente se muestra
un botón que devolverá 409, o se esconde uno que sí funcionaba. **No hay ninguna
prueba que ate ambos lados.**

Mitigación mínima: pruebas unitarias de estos helpers con los casos que el
backend documenta, y un comentario en cada uno citando el método del agregado que
espeja.

### FE-E3 · Ocho endpoints de administración sin superficie

El backend expone cola de KYC (3 endpoints), blocklist de documentos (3), perfil
de riesgo del viajero y ajuste de límite. **Ninguno tiene pantalla.**

Consecuencia operativa concreta: un viajero no puede reclamar su primer encargo
sin KYC aprobado, no hay pantalla para enviar el expediente **y** no hay pantalla
para aprobarlo. El flujo de captación de viajeros está bloqueado de punta a punta
desde la web.

### FE-E4 · `KYC_REQUIRED` sin mensaje

Un viajero que intenta reclamar su primer encargo recibe *"No pudimos reclamar el
encargo"*. El código real es `403 KYC_REQUIRED` y no está mapeado. El usuario no
sabe qué le falta, y aunque lo supiera no tendría dónde hacerlo (FE-E3).

Es el peor error de UX de la aplicación: bloquea al usuario sin decirle por qué.

### FE-E5 · Sin accesibilidad revisada

Se hereda lo que traen Radix y shadcn (que es bastante), pero no hay auditoría:
sin comprobación de contraste sobre los tokens, sin revisión de navegación por
teclado en los diálogos y menús, sin `aria-live` en los toasts, sin `alt`
verificado en imágenes de productos (que vienen de URLs externas).

### FE-E6 · Sin observabilidad de cliente

No hay captura de errores (Sentry o equivalente), ni métricas de Core Web Vitals,
ni telemetría de embudo. `ApiError` transporta el `requestId` del backend, que es
exactamente lo que haría útil una herramienta de errores — y no se está
aprovechando.

Hoy, si el registro falla para todos los usuarios (que es literalmente el caso,
R-02), **nadie se enteraría** hasta que alguien se queje.

### FE-E7 · Copy y branding dispersos en el código

~40 textos visibles con el nombre-clave del producto, en metadatos, wordmarks,
footer, onboarding, toasts y etiquetas de administración. Sin capa de i18n ni
fichero de textos: cambiar el nombre del producto es un barrido manual.

### FE-E8 · Imágenes externas sin control

`recommended_products.imageUrl` apunta a la tienda original. Sin proxy, sin
caché, sin `next/image` con dominios permitidos: la vitrina depende de que la
tienda no bloquee el hotlinking, y cada imagen es una petición a un tercero desde
el navegador del usuario.

### FE-E9 · Polling constante

Cinco consultas a 30 s por usuario activo, sin pausar cuando la pestaña está en
segundo plano. Con volumen es carga permanente sobre la API y batería del
dispositivo.
