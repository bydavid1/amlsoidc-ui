# 05 — Pendientes del frontend

Backlog de este repo. El consolidado de los dos proyectos, con el orden de
prioridad global, está en
[`../../../docs/03-pendientes.md`](../../../docs/03-pendientes.md).

Convención: `[ ]` abierto · `[~]` en curso · `[x]` cerrado con fecha.

---

## 1 · Desbloquear

- [ ] **Arreglar el registro** (→ R-02). Requiere decidir primero **dónde** se
      pide el documento de identidad:
      - [ ] Opción A (recomendada): paso de documento en `/registro` — país ISO-2,
            tipo (`DUI`/`PASSPORT`/`DRIVER_LICENSE`/`NATIONAL_ID`) y número
      - [ ] Opción B: el registro se queda con correo y contraseña, y el documento
            se pide al activar el perfil de viajero *(requiere cambio en la API)*
      - [ ] En ambos casos: mapear `DOCUMENT_INVALID`,
            `DOCUMENT_ALREADY_REGISTERED` y `BLOCKED_DOCUMENT` en el formulario
- [ ] **Eliminar `NEXT_PUBLIC_SANDBOX_SECRET`** y la llamada al webhook desde el
      navegador (→ R-01). La aprobación sandbox pasa a ser acción de
      administración.
- [ ] Mapear `KYC_REQUIRED` con un mensaje útil y un enlace a la pantalla de
      verificación (→ FE-E4). Bloqueado por la pantalla de KYC.
- [ ] Alinear `NEXT_PUBLIC_API_URL` del ejemplo con el `PORT` real del backend
      (→ R-09).

## 2 · Pantallas que faltan

### Viajero

- [ ] **Verificación de identidad (KYC)**: subir documento (anverso, reverso) y
      selfie, ver estado del expediente, reintentar si se pidió.
      **Bloqueada por el backend**: no hay endpoint de carga de ficheros
      (→ R-17).
- [ ] Estado del expediente KYC visible en `/cuenta`.
- [ ] Aviso claro en el espacio de viajar cuando falta KYC, antes de que intente
      reclamar.

### Administración

- [ ] **Cola de revisión KYC**: listado por antigüedad, detalle del expediente con
      visor de artefactos, decisión (aprobar / rechazar / pedir reintento) con
      motivo obligatorio. *3 endpoints ya existen.*
- [ ] **Blocklist de documentos**: búsqueda, bloqueo con motivo, desbloqueo.
      *3 endpoints ya existen.* Ojo: la búsqueda actual del backend acepta el
      número por query string (→ R-19); esperar el cambio a cuerpo.
- [ ] **Perfil de riesgo del viajero**: historial, incidentes, tasa de éxito,
      límite vigente e historial de ajustes. *1 endpoint ya existe.*
- [ ] **Ajuste de límite del viajero** con motivo obligatorio. *1 endpoint ya
      existe.* **Advertencia:** el backend no aplica el límite (→ R-05); mientras
      siga así, esta pantalla debe indicar que el control **no está activo** o no
      construirse.
- [ ] Dashboard de KPI *(el backend no lo tiene todavía)*.
- [ ] Consulta de auditoría *(el backend no lo tiene todavía)*.
- [ ] Gestión de corredores *(el backend no lo tiene todavía)*.
- [ ] Curaduría: edición, reactivación y listado de inactivos *(el backend no lo
      tiene todavía)*.
- [ ] Motivo obligatorio al suspender o reactivar usuarios *(requiere cambio en la
      API)*.

## 3 · Contrato y errores

- [ ] Mapear los códigos que hoy caen en el mensaje genérico:
      `KYC_REQUIRED`, `PROFILE_INCOMPLETE`, `BUYER_PROFILE_REQUIRED`,
      `CORRIDOR_NOT_ENABLED`, `BLOCKED_DOCUMENT`, `DOCUMENT_ALREADY_REGISTERED`,
      `TRAVELER_PROFILE_REQUIRED`, `ORDER_NOT_COMPATIBLE`,
      `DISPUTE_ALREADY_OPEN`, `ALREADY_RATED`.
- [ ] Mostrar el `requestId` en las pantallas de error irrecuperable: la API ya
      lo entrega y es lo que hace útil un reporte de soporte.
- [ ] Paginación en los listados en cuanto la API la soporte de verdad (→ R-06):
      encargos del viajero, notificaciones, y todos los de administración.
- [ ] Decidir y ejecutar la generación de tipos desde el OpenAPI de la API
      (→ FE-14 en [03-decisiones.md](03-decisiones.md)).

## 4 · Sesión y seguridad

- [ ] Serializar el refresh **entre pestañas** con `navigator.locks` o un mutex en
      `localStorage`, y propagar el token nuevo con `BroadcastChannel` (→ R-07).
- [ ] Revisar si el refresh debe pasar a cookie `HttpOnly` (implica CSRF y cambio
      del modelo de sesión; decisión conjunta con el backend).
- [ ] Auditar que ninguna variable `NEXT_PUBLIC_*` contenga algo sensible, y
      dejarlo como comprobación de la lista previa a despliegue.

## 5 · Producto y contenido

- [ ] **Reescribir el copy de la landing** según el modelo vigente (→ R-27):
      - el viajero **elige** los encargos; no hay asignación automática
      - no hay capacidad de viaje
      - solo el comprador califica (más el operador al recibir en hub)
- [ ] Decidir qué se muestra de la dirección de recepción (→ R-30) y ajustar el
      detalle de pedido y los textos legales.
- [ ] Resolver el nombre del producto y barrer los ~40 textos visibles
      (→ FE-E7).
- [ ] Decidir si se internacionaliza; si sí, extraer el copy a ficheros de
      mensajes antes de que crezca más.

## 6 · Calidad

- [ ] **Elegir e instalar infraestructura de pruebas** (→ R-38, FE-E1).
      Recomendación: Vitest + Testing Library para unidades, Playwright para e2e.
- [ ] e2e: registro y login.
- [ ] e2e: crear encargo y verlo en la lista.
- [ ] e2e: publicar viaje, ver encargos disponibles, reclamar.
- [ ] unit: `order-status.ts` (`happyPathIndex` y `buyerActions`) con los casos
      documentados del backend (→ FE-E2).
- [ ] unit: cliente HTTP — refresh *single-flight*, reintento único, mapeo de
      `ApiError`.
- [ ] Pruebas de los componentes con lógica condicional por rol o por flujo.
- [ ] Añadir `typecheck` como script de `package.json` (hoy hay que recordar
      `npx tsc --noEmit`).
- [ ] Pipeline de CI: `lint` + `tsc --noEmit` + pruebas.
- [ ] Regla de lint que prohíba hex inline (→ FE-02: hoy la regla existe solo en
      la cabeza de quien revisa).

## 7 · Accesibilidad y rendimiento

- [ ] Auditoría de contraste de los tokens del design system (→ FE-E5).
- [ ] Navegación por teclado en diálogos, menús y selects.
- [ ] `aria-live` en los toasts.
- [ ] Revisar `alt` en imágenes de productos.
- [ ] Proxy o `next/image` con dominios permitidos para las imágenes externas
      (→ FE-E8).
- [ ] Pausar el polling cuando la pestaña está en segundo plano (→ FE-E9).
- [ ] Presupuesto de bundle y revisión de lo que se carga en la primera pantalla.

## 8 · Observabilidad

- [ ] Captura de errores de cliente, enviando el `requestId` de `ApiError`
      (→ FE-E6).
- [ ] Métricas de Core Web Vitals.
- [ ] Telemetría de embudo: registro → perfil → primer encargo / primer viaje.
      Sin esto no hay forma de saber que un flujo está caído.

## 9 · Higiene

- [ ] Revisar `next.config.ts`: hoy es prácticamente vacío; falta configuración de
      imágenes y cabeceras de seguridad.
- [ ] Decidir si `LocalProductResolver` (resolución de producto por URL con
      heurística de dominio) se mantiene en cliente o pasa al backend, donde
      podría enriquecerse de verdad.

---

## Cerrados en esta revisión

- [x] *2026-08-27* Documentación reestructurada: índice, proyecto y ficha por
      módulo.
- [x] *2026-08-27* `AGENTS.md` reescrito para describir el modelo y la estructura
      reales (→ R-28).
- [x] *2026-08-27* Banners de vigencia en `PLAN.md` y `DESIGN-coinbase.md`.
- [x] *2026-08-27* Corregidas las referencias a `../amlscs` en `docs/PLAN.md` y
      `README.md` (→ R-43).
- [x] *2026-08-27* Alta de `.claude/` con agentes y skills de frontend (no
      existían).
