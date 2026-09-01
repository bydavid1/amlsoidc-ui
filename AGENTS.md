# AGENTS.md — Frontend / UI

Guía para cualquier agente de IA (Claude Code, GitHub Copilot, otros) que trabaje
en este repositorio. **Léela completa antes de tocar código.**

> Contexto compartido entre los dos repos del workspace:
> [`docs/plataforma/05-contexto-agentes.md`](https://github.com/bydavid1/amlsoidc/blob/main/docs/plataforma/05-contexto-agentes.md).
> Documentación de este frontend: [`docs/README.md`](docs/README.md).

---

## 1. Qué es esta app

El cliente web del sistema: una plataforma de logística colaborativa que conecta
compradores con viajeros que ya tienen un viaje planificado y pueden traer un
producto. Cubre **cuatro superficies** en una sola aplicación Next.js:
marketing (`/`), autenticación, app de comprador y viajero, y **consola de
operación** (`/admin`).

Consume la misma API `/api/v1` que consumirán el móvil y las integraciones.

Modelo de negocio, actores y glosario:
[`docs/plataforma/00-plataforma.md`](https://github.com/bydavid1/amlsoidc/blob/main/docs/plataforma/00-plataforma.md).
Contrato con la API: [`docs/plataforma/01-integracion.md`](https://github.com/bydavid1/amlsoidc/blob/main/docs/plataforma/01-integracion.md).

**Nomenclatura:** la plataforma no tiene nombre asignado. En documentación se la
llama "la Plataforma" o "el Sistema". El nombre-clave heredado aparece en ~40
textos visibles de la UI; se barrerá cuando se decida el nombre definitivo.

## 2. Stack

Next.js 16 (App Router) · React 19 · TypeScript 5 · Tailwind CSS 4 ·
shadcn/ui sobre Radix · TanStack Query 5 · axios · react-hook-form · Zod 4 ·
sonner · next-themes · date-fns.

**No hay infraestructura de pruebas**: ni Jest, ni Vitest, ni Playwright, ni
Testing Library. Ningún script de test.

## 3. Regla no negociable: cero lógica de negocio en el cliente

**La máquina de estados vive en el backend.** La UI **refleja** estados y
**dispara acciones** (`confirm-purchase`, `claim`, `cancel`), nunca edita estados.

Corolario que hay que interiorizar: **un `409` del backend no es un bug.** Es que
el estado cambió (la otra parte actuó) o la acción no aplicaba. La UI avisa,
**invalida** y muestra el estado real. Nunca reintenta a ciegas.

Los helpers de `components/status/order-status.ts` (`buyerActions.canCancel`,
`canConfirmPurchase`, …) son un **espejo** de las invariantes del backend para
decidir qué botón mostrar. Son conveniencia de UX, **no la autoridad**: si
divergen, manda el backend.

Antes de construir una pantalla que dependa de reglas de negocio (estados,
límites, permisos), **confirma cuál es el modelo vigente** en
[`docs/plataforma/00-plataforma.md`](https://github.com/bydavid1/amlsoidc/blob/main/docs/plataforma/00-plataforma.md). No asumas un flujo no
confirmado.

## 4. Lo que más confunde (léelo o perderás media hora)

### 4.1 El viajero elige; no hay asignación automática

El viajero **explora y reclama** los encargos compatibles con su viaje. El primero
que reclama gana; el segundo recibe `409 ORDER_ALREADY_TAKEN`.

**No existe** un algoritmo que elija "el mejor viajero", ni scoring, ni ventana de
aceptación, ni **capacidad numérica del viaje** (se eliminó del modelo de datos),
ni calificación mutua comprador ↔ viajero.

⚠️ **El copy de la landing (`src/app/page.tsx`) sigue prometiendo todo eso.** Está
desactualizado (→ R-27). No lo tomes como especificación.

### 4.2 El flujo de cumplimiento por defecto es el modelo hub (Flujo C)

| Alias | Quién compra | Ruta física |
|-------|--------------|-------------|
| Flujo A | El viajero, con su dinero | Viajero → comprador |
| Flujo B | Operaciones | Tienda → dirección del viajero → comprador |
| **Flujo C** | Operaciones / el comprador | Tienda → dirección del viajero → **hub** → comprador |

El flujo se elige por **configuración global** y se congela en cada encargo al
crearlo. **No por umbral de monto**: el `threshold` es un concepto de diseño no
implementado.

Importa para la UI porque **las acciones disponibles cambian según el flujo**. Hay
un caso concreto ya detectado: `canConfirmPurchase` no comprueba el flujo, pero el
backend exige Flujo A, así que el botón puede aparecer y fallar (→ R-29).

### 4.3 Solo dos listados paginan de verdad

`GET /orders` y `GET /trips` tienen cursor real. **Todos los demás** (encargos del
viajero, notificaciones, y todo `/admin/*`) aceptan el parámetro `cursor` y lo
**ignoran**: siempre devuelven la primera página (→ R-06). No construyas
paginación sobre ellos hasta que el backend la implemente.

### 4.4 Nada de secretos en `NEXT_PUBLIC_*`

Todo lo que empieza por `NEXT_PUBLIC_` **se compila dentro del bundle** y es
visible para cualquier usuario. Ya pasó: `NEXT_PUBLIC_SANDBOX_SECRET` expone el
secreto del webhook de pagos y permite marcar cualquier pago como pagado
(→ R-01, el único P0 del sistema).

## 5. Antes de empezar: lee el estado real

| Documento | Para qué |
|-----------|----------|
| [`docs/plataforma/00-plataforma.md`](https://github.com/bydavid1/amlsoidc/blob/main/docs/plataforma/00-plataforma.md) | Negocio, actores, glosario |
| [`docs/plataforma/01-integracion.md`](https://github.com/bydavid1/amlsoidc/blob/main/docs/plataforma/01-integracion.md) | **Contrato con la API**: envelope, errores, endpoints |
| [`docs/plataforma/02-riesgos.md`](https://github.com/bydavid1/amlsoidc/blob/main/docs/plataforma/02-riesgos.md) | 47 hallazgos abiertos con id estable |
| [`docs/proyecto/01-estado-actual.md`](docs/proyecto/01-estado-actual.md) | Qué pantallas existen y qué falta |
| [`docs/modulos/<modulo>.md`](docs/modulos/) | Ficha del módulo que vas a tocar |
| [`docs/proyecto/06-design-system.md`](docs/proyecto/06-design-system.md) | Tokens y reglas de estilo |

**`docs/PLAN.md` es el plan original, parcialmente vigente** (lleva banner). Excluía
el panel Admin de su alcance, y el panel **existe**.

## 6. Estructura

```
src/
├── app/                    App Router: (auth) / (app) / (admin)
│   ├── globals.css         TOKENS del design system
│   └── providers.tsx       QueryClient · Theme · Auth · Toaster
├── features/<modulo>/      ESPEJO de los módulos del backend
│   ├── api.ts              llamadas + esquemas Zod
│   ├── hooks.ts            hooks de TanStack Query
│   ├── schemas.ts          esquemas de formulario
│   └── components/
├── components/
│   ├── ui/                 shadcn/ui — no editar sin motivo
│   ├── layout/             shell, guards, nav
│   └── status/             traducción de estados del dominio a UX
└── lib/
    ├── api/                cliente axios: envelope, ApiError, refresh
    ├── auth/               token store
    └── utils.ts            cn()
```

Features: `auth`, `profiles`, `orders`, `trips`, `assignments`, `payments`,
`catalog`, `geography`, `notifications`, `incidents`, `ratings`, `admin`.

**Sin feature:** el módulo `kyc` del backend. Es el hueco funcional más grande de
la app (→ FE-E3).

Regla de ubicación:

| Si es… | Va en |
|--------|-------|
| Genérico, sin conocer el dominio | `components/ui/` |
| Estructura de página, navegación, guard | `components/layout/` |
| Traducción de un concepto del dominio a UX | `components/status/` |
| Cualquier cosa con conocimiento de un módulo del backend | `features/<modulo>/` |
| Una llamada a la API | `features/<modulo>/api.ts`, **nunca** en un componente |

## 7. Comandos (verificados contra `package.json`)

```bash
npm run dev        # desarrollo
npm run build      # build de producción
npm run start      # servir el build
npm run lint       # eslint
npx tsc --noEmit   # comprobación de tipos (NO hay script propio)
```

**No hay ningún script de test.**

> `npm run build` **falla sin salida a internet**, porque `layout.tsx` carga Inter
> y JetBrains Mono desde Google Fonts. Para verificar cambios usa
> `npx tsc --noEmit` y `npm run lint`.

## 8. Convenciones

### Contrato con la API
- **Toda** llamada pasa por `apiGet` / `apiPost` / `apiPatch` de `lib/api/client`.
  Nunca `fetch` ni `axios` directo desde un componente.
- **Toda** respuesta se parsea con un esquema de Zod en `features/*/api.ts`. Si el
  contrato cambia, tiene que fallar ahí y no en un componente.
- Los códigos de error se manejan por `error.code`, **nunca** por `error.message`.
- Los nombres de estado del backend **no se renombran** en la lógica: solo se
  traducen en `components/status/order-status.ts`.

### Estado
- El estado de servidor es de TanStack Query. **No lo copies a `useState`.**
- Claves jerárquicas: `["orders", "detail", id]`, `["orders", "list", { status }]`.
- Los 4xx **no se reintentan** (configurado en `providers.tsx`).
- Tras una mutación, invalida **detalle y lista**.

### Formularios
- `react-hook-form` + `zodResolver`.
- **Los límites del esquema deben coincidir con los del DTO del backend.** Si
  divergen, manda el backend.
- Los `VALIDATION_ERROR` traen `details[{field, errors}]`: **mapéalos a los campos
  del formulario.** No mapearlos es lo que hizo invisible R-02.

### Estilos
- **Nunca un hex inline.** Todo sale de los tokens de `globals.css`.
- Un solo color de acción (`primary`). Semánticos (`semantic-up`/`down`) **solo
  como texto**, nunca como fondo de bloque.
- CTAs `rounded-full`, cards `rounded-[24px]`, inputs 12px. Titulares con
  `display-*` / `title-*`; cifras con `number-display`.

### Estados de pantalla (obligatorio los cuatro)
1. **Loading** — skeleton, nunca spinner infinito.
2. **Empty** — con acción sugerida.
3. **Error** — mapeado por `error.code`.
4. **Success**.

## 9. Glosario (usar estos términos exactos)

`Order`/encargo · `Trip`/viaje · `Assignment` · `Fulfillment` · `claim`/reclamar ·
`corridor`/corredor · `travelerReward` · `platformFee` · `estimatedTotal` ·
`sizeCategory` · escrow · hub · KYC · `displayStatus`.

Estados: ver [`docs/plataforma/00-plataforma.md`](https://github.com/bydavid1/amlsoidc/blob/main/docs/plataforma/00-plataforma.md) §8.

**Conceptos NO implementados** (no los uses como si existieran): `threshold`,
`reputation tier`, subroles operativos, capacidad de viaje.

## 10. Regla de visibilidad del dinero

| Quién | Ve |
|-------|-----|
| Comprador | **Solo** el total (`estimatedTotalAmount`) |
| Viajero | **Solo** su pago (`travelerRewardAmount`) |
| Operaciones (`/admin`) | Desglose completo |

Los DTO del backend ya la respetan, así que en el cliente **no hay nada que
ocultar**: solo hay que no reconstruir el desglose desde otras fuentes, y no
reutilizar componentes de administración en pantallas de usuario.

## 11. Testing

Hoy no hay ninguna prueba (→ R-38). Es la razón por la que R-02 —el registro
completamente caído— pasó desapercibido.

Si añades cobertura, prioriza por riesgo:

1. e2e de registro y login
2. e2e de crear encargo y verlo en la lista
3. e2e de publicar viaje → ver disponibles → reclamar
4. unit de `order-status.ts` (`happyPathIndex`, `buyerActions`) — son un espejo de
   reglas ajenas y se desincronizan en silencio
5. unit del cliente HTTP (refresh *single-flight*, reintento único)

Los componentes con lógica condicional por rol o por flujo necesitan al menos una
prueba de cada rama.

## 12. Antes de decir "listo"

```bash
npx tsc --noEmit && npm run lint
```

- [ ] ¿Los cuatro estados de pantalla están cubiertos?
- [ ] ¿Las respuestas se parsean con Zod?
- [ ] ¿Los códigos de error de ese flujo están mapeados a mensajes útiles?
- [ ] ¿Cero hex inline?
- [ ] ¿Los límites del formulario coinciden con el DTO del backend?
- [ ] ¿Se invalidan las consultas correctas tras la mutación?
- [ ] ¿Ningún secreto nuevo en `NEXT_PUBLIC_*`?
- [ ] ¿Se actualizó `docs/modulos/<modulo>.md` y `01-estado-actual.md`?

**No declares algo verificado si no ejecutaste la comprobación.**

## 13. Qué NO hacer

- No poner secretos en `NEXT_PUBLIC_*` (ya pasó, → R-01).
- No llamar a la API sin pasar por `lib/api/client`.
- No tratar un `409` como bug: es el estado que cambió.
- No mostrar al comprador el desglose del servicio, ni al viajero la comisión.
- No dar información de contacto de una parte a la otra.
- No hardcodear corredores, tarifas ni umbrales: vienen de la API.
- No hex inline "solo esta vez".
- No mezclar la UI de dos flujos de cumplimiento en un componente con muchos
  `if`: separa por flujo y comparte solo lo genuinamente común.
- No duplicar la máquina de estados: la autoridad es el backend.
- No commitear ni empujar sin que se te pida.
- No dar por bueno lo que diga otro agente sin verificarlo contra el código.
