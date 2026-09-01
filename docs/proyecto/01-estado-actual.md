# 01 — Estado actual: qué pantallas existen y qué falta

**Este es el documento de verdad operativa del frontend.** Cuando `PLAN.md` diga
otra cosa, manda esto (y el código).

Fecha de la foto: **2026-08-27**. Leyenda:

| Marca | Significado |
|-------|-------------|
| ✅ | Implementada y funcional |
| ⚠️ | Implementada con una brecha conocida |
| 🚧 | Parcial |
| ❌ | No existe |

---

## Mapa de rutas

### Marketing (`/`)

| Ruta | Estado | Nota |
|------|--------|------|
| `/` | ⚠️ | Landing completa (hero, cómo funciona, corredores reales, CTA). **El copy describe un modelo de asignación que ya no existe** (→ R-27), y la sección de corredores falla en silencio si el `fetch` de servidor no resuelve (→ R-40) |

### Autenticación (`(auth)`)

| Ruta | Estado | Nota |
|------|--------|------|
| `/login` | ✅ | Con manejo de `INVALID_CREDENTIALS`, `USER_SUSPENDED`, `RATE_LIMITED` |
| `/registro` | ❌ **ROTA** | El formulario pide correo y contraseña; la API exige además `identityDocument`. **Devuelve 400 siempre** y el usuario ve un mensaje genérico (→ R-02) |

### App (`(app)`) — requiere sesión

| Ruta | Estado | Nota |
|------|--------|------|
| `/onboarding` | ✅ | Dos pasos: completar perfil (nombre + teléfono) y elegir espacio |
| `/comprar` | ✅ | Lista de encargos con filtro por estado y paginación infinita real |
| `/comprar/nuevo` | ✅ | Formulario con resolución de producto por URL, cotización en vivo y catálogo recomendado |
| `/comprar/[orderId]` | ⚠️ | Detalle con stepper, timeline, viajero, pago y acciones. Muestra la dirección de recepción del viajero (→ R-30) |
| `/comprar/[orderId]/pago-sandbox` | ⚠️ | Checkout simulado. **Contiene el secreto del webhook en el bundle** (→ R-01) |
| `/viajar` | ✅ | Lista de viajes con paginación infinita real |
| `/viajar/nuevo` | ✅ | Publicar viaje (corredor + ciudad + fecha) |
| `/viajar/[tripId]/encargos` | ✅ | Descubrimiento y reclamo de encargos del viaje |
| `/viajar/encargos` | ⚠️ | Encargos en curso del viajero. **Sin paginación** (la API no la soporta, → R-06) |
| `/cuenta` | ✅ | Perfil editable |
| `/notificaciones` | ⚠️ | Bandeja con narrativa por tipo. **Sin paginación**: solo las 50 más recientes |
| **KYC del viajero** | ❌ | **No existe.** El backend acepta expedientes y no hay forma de enviarlos desde la web (→ R-17) |

### Consola de operación (`(admin)`) — requiere rol `ADMIN`

| Ruta | Estado | Nota |
|------|--------|------|
| `/admin` | ✅ | Panel "Dinero": totales y desglose completo |
| `/admin/operacion` | ⚠️ | Cola de pedidos con acciones operativas. **Sin paginación** (→ R-06); filtro `status` sin validar en el backend (→ R-15) |
| `/admin/operacion/[orderId]` | ✅ | Expediente con timeline |
| `/admin/payouts` | ⚠️ | Payouts y reembolsos, marcar ejecutados. Sin paginación |
| `/admin/disputas` | ⚠️ | Cola y resolución. Sin evidencia ni resultado estructurado (limitación del backend) |
| `/admin/usuarios` | ⚠️ | Búsqueda, suspender, reactivar. **Sin motivo obligatorio** |
| `/admin/configuracion` | ✅ | Cambio del flujo de cumplimiento activo |
| `/admin/curaduria` | 🚧 | Alta y desactivación de productos. **Sin edición, sin reactivación, sin ver inactivos** |
| **KYC (cola de revisión)** | ❌ | El backend tiene 3 endpoints; **no hay pantalla** |
| **Blocklist de documentos** | ❌ | El backend tiene 3 endpoints; **no hay pantalla** |
| **Perfil de riesgo y límites del viajero** | ❌ | El backend tiene 2 endpoints; **no hay pantalla** |
| **Dashboard de KPI** | ❌ | El backend tampoco lo tiene |
| **Consulta de auditoría** | ❌ | El backend tampoco lo tiene |
| **Corredores** | ❌ | El backend tampoco lo tiene |

> El `PLAN.md` original excluía explícitamente el panel Admin de su alcance. El
> panel **existe** y está a mitad de camino respecto a los endpoints que la API
> ya expone: hay **8 endpoints de administración sin ninguna superficie**.

---

## Guards de navegación

| Guard | Qué hace | Dónde |
|-------|----------|-------|
| `RequireAuth` | Skeleton mientras rehidrata; a `/login?next=...` si es anónimo | `(app)/layout.tsx`, `(admin)/admin/layout.tsx` |
| `RequireRole` | Si falta `BUYER`/`TRAVELER`, ofrece **activar el perfil en el momento** | Espacios de comprar y viajar |
| Comprobación de `ADMIN` | Pantalla de "acceso restringido" | `(admin)/admin/layout.tsx` |

`RequireRole` es una buena decisión de UX: en vez de bloquear, convierte el
obstáculo en un botón, aprovechando que la activación es idempotente en el
backend.

**Recordatorio de seguridad:** estos guards son de **navegación**, no de
autorización. La autoridad es el backend, que valida rol y propiedad del recurso
en cada petición.

---

## Cobertura del contrato de la API

De los **63 endpoints** que expone la API:

| Grupo | Consumidos | Sin consumir |
|-------|-----------|--------------|
| Público (health, catálogos, pricing) | 4 | `/countries` (se usa solo `/countries/:id/cities`), `/health*` |
| Auth | 5 | — |
| Usuario y perfiles | 4 | — |
| Encargos (comprador) | 8 | — |
| Pagos (comprador) | 2 + webhook | — |
| Viajes y reclamos (viajero) | 9 | — |
| KYC (viajero) | 0 | **`POST /kyc/traveler/cases`** |
| Notificaciones | 2 | — |
| Disputas y calificaciones | 2 | — |
| Administración | 12 | **8**: cola KYC (3), blocklist (3), perfil de riesgo, límite de viajero |

---

## Manejo de errores por código

Bien cubierto en general. Códigos con tratamiento explícito:

| `code` | Dónde se maneja |
|--------|-----------------|
| `UNAUTHENTICATED` | Cliente HTTP: refresh *single-flight* + reintento |
| `INVALID_CREDENTIALS`, `USER_SUSPENDED`, `RATE_LIMITED` | Formulario de login |
| `EMAIL_ALREADY_REGISTERED`, `VALIDATION_ERROR` | Formulario de registro |
| `PAYMENT_REQUIRED` | Acción de confirmar compra |
| `RECEIVING_ADDRESS_MISSING` | Acción de confirmar compra |
| `ORDER_ALREADY_TAKEN` | Reclamo de encargo |
| `ALREADY_PAID` | Inicio de checkout |
| Cualquier `409` | Genérico por feature: avisa y **refresca** |

**Sin tratamiento explícito** (caen en el mensaje genérico): `KYC_REQUIRED`,
`PROFILE_INCOMPLETE`, `BUYER_PROFILE_REQUIRED`, `CORRIDOR_NOT_ENABLED`,
`BLOCKED_DOCUMENT`, `DOCUMENT_ALREADY_REGISTERED`, `TRAVELER_PROFILE_REQUIRED`,
`ORDER_NOT_COMPATIBLE`, `DISPUTE_ALREADY_OPEN`, `ALREADY_RATED`.

`KYC_REQUIRED` es el más grave de esa lista: un viajero que intenta reclamar su
primer encargo recibe "No pudimos reclamar el encargo" sin ninguna pista de que
necesita verificar su identidad — y sin pantalla donde hacerlo.

---

## Pruebas

**Ninguna.** No hay dependencias de test, ni ficheros de test, ni script en
`package.json` (→ R-38).

---

## Nomenclatura del producto en la UI

El nombre-clave heredado aparece en **~40 lugares de texto visible**: título y
plantilla de metadatos, wordmark de la cabecera y del panel de operación,
footer, copy de onboarding, mensajes de toast, etiquetas de flujo en la
configuración de administración y comentarios de `globals.css`.

Cuando se decida el nombre definitivo del producto, hay que barrer esos textos.
Registrado como pendiente; no es un bug.
