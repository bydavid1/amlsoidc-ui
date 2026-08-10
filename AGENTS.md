# AGENTS.md — Bringo Frontend

Guía para cualquier agente de IA (GitHub Copilot, Claude, etc.) que trabaje en este repo. Léela completa antes de tocar código.

## Qué es Bringo

Marketplace que conecta compradores en El Salvador con viajeros que regresan de USA y pueden traer productos. El match comprador–viajero lo hace la plataforma automáticamente, el usuario no elige. Corredor inicial: USA → El Salvador.

## Stack

- **Framework:** Next.js + React + TypeScript
- **Backend:** API NestJS documentada con Swagger (ver `AGENTS.md` del backend para el modelo de dominio completo)

<!-- AJUSTAR: confirmar librería de estilos (Tailwind, CSS Modules, etc.), manejo de estado (Zustand, Redux, Context, React Query...) y gestor de paquetes (npm/pnpm/yarn) -->

## Regla no negociable: gate antes de código

Antes de construir una pantalla o flujo nuevo que dependa de reglas de negocio (estados de orden, límites, permisos por rol), confirmar con el usuario o revisar `bringo-decisiones-de-negocio.md` cuál es el modelo vigente. No asumir un flujo de negocio no confirmado.

## Modelo de negocio vigente (para no romper el dominio)

Dos flujos de cumplimiento según el monto del producto:

- **Flujo A (traveler-funded):** el viajero compra con su dinero, el comprador confirma entrega y se libera el pago.
- **Flujo B (platform-funded):** para montos altos, un operador de Bringo (`ops_agent`) compra el producto y lo envía directo al viajero. El comprador y el viajero no manejan dinero de la compra en este flujo.

Esto importa para el frontend porque las pantallas de seguimiento de orden, los estados que se muestran al usuario, y las acciones disponibles (ej. "subir recibo") cambian según qué flujo aplica a esa orden.

## Roles a considerar en la UI

- **Buyer:** compra, sigue su pedido, confirma entrega, abre disputas.
- **Traveler:** ve viajes disponibles según match, sube evidencia de compra (Flujo A), confirma recepción (Flujo B).
- **Ops / Admin:** back-office separado — cola de compras pendientes, disputas, verificación de identidad, gestión de usuarios, configuración de corredores. Probablemente vive en una app o sección aparte con su propio control de acceso (RBAC).

<!-- AJUSTAR: confirmar si el back-office de ops es la misma app Next.js con rutas protegidas, o un proyecto aparte -->

## Estructura del código

<!-- AJUSTAR: reemplazar con la estructura real del repo -->

```
app/                     # rutas (App Router de Next.js)
  (buyer)/
  (traveler)/
  (admin)/
components/
  ui/                     # componentes reutilizables genéricos
  <feature>/              # componentes específicos de una funcionalidad
lib/
  api/                    # cliente para consumir la API (idealmente tipado desde Swagger)
  hooks/
types/
```

## Comandos

<!-- AJUSTAR: confirmar que estos scripts existen tal cual en package.json -->

```bash
npm run dev          # levantar en desarrollo
npm run build          # build de producción
npm run lint            # lint
npm run test             # tests
```

## Convenciones de código

- Los tipos de datos que vienen de la API deben salir del contrato de Swagger (generados o mantenidos a mano en sync), no inventados sueltos por componente.
- Los estados de orden que se muestran al usuario deben usar los mismos nombres que el backend (ver glosario abajo), traducidos solo en la capa de presentación (texto visible), nunca renombrados en la lógica.
- Separar componentes de presentación (UI pura) de los que llaman a la API o manejan estado de negocio.
- Las validaciones de formularios deben reflejar las reglas reales del backend (ej. límites de valor por umbral), no duplicarlas con números distintos.

## Glosario de dominio (usar estos términos exactos)

`ops_agent`, Flujo A / Flujo B, `threshold`, `PENDING_PURCHASE`, `SHIPPED_TO_TRAVELER`, `claim`, escrow, `travelerReward`, `platformFee`, corredor (`corridor`), KYC, disputa con evidencia, `reputation tier`.

## Testing

- Componentes con lógica condicional por rol o por flujo (A/B) necesitan al menos un test que cubra ambos casos.
- Las pantallas que consumen la API deben tener un test o mock que confirme que manejan bien los estados de error (KYC rechazado, orden cancelada, etc.), no solo el happy path.

## Qué NO hacer

- No mostrarle al viajero información de fondos o tarjetas prepagadas en Flujo B — en ese flujo el viajero no maneja dinero de la compra.
- No hardcodear el umbral de monto en el frontend — debe venir de la configuración del corredor que expone la API.
- No mezclar la UI de Flujo A y Flujo B en un solo componente con muchos `if` — mejor separar por flujo y compartir solo lo genuinamente común.