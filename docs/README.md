# Documentación del frontend (UI)

Índice maestro. Tres capas con propósitos distintos:

```
docs/
├── README.md            ← estás aquí
├── proyecto/            ← ESTADO REAL de la UI: cómo está hoy y cómo trabajarla
├── modulos/             ← una ficha por feature / capa
├── PLAN.md              ← plan de desarrollo original (parcialmente vigente)
└── DESIGN-coinbase.md   ← design system: tokens y componentes (VIGENTE Y NORMATIVO)
```

**Si vas a implementar una pantalla:** `proyecto/` + `modulos/` + el design
system.
**Si dudas de qué expone la API:** `../../docs/01-integracion.md`.
**Si el código y `PLAN.md` discrepan:** manda el código.

---

## Nivel plataforma (workspace, transversal a los dos repos)

| Documento | Contenido |
|-----------|-----------|
| [`docs/plataforma/00-plataforma.md`](https://github.com/bydavid1/amlsoidc/blob/main/docs/plataforma/00-plataforma.md) | Qué es el sistema, actores, modelo de negocio vigente, glosario. **Empieza aquí.** |
| [`docs/plataforma/01-integracion.md`](https://github.com/bydavid1/amlsoidc/blob/main/docs/plataforma/01-integracion.md) | **Contrato con la API**: envelope, auth, paginación, matriz de endpoints, variables de entorno |
| [`docs/plataforma/02-riesgos.md`](https://github.com/bydavid1/amlsoidc/blob/main/docs/plataforma/02-riesgos.md) | Registro consolidado de riesgos (`R-nn`) |
| [`docs/plataforma/03-pendientes.md`](https://github.com/bydavid1/amlsoidc/blob/main/docs/plataforma/03-pendientes.md) | Backlog consolidado |
| [`docs/plataforma/04-historia.md`](https://github.com/bydavid1/amlsoidc/blob/main/docs/plataforma/04-historia.md) | Qué decisión reemplazó a cuál |
| [`docs/plataforma/05-contexto-agentes.md`](https://github.com/bydavid1/amlsoidc/blob/main/docs/plataforma/05-contexto-agentes.md) | Reglas para agentes de IA |

## Nivel proyecto (este frontend)

| Documento | Contenido |
|-----------|-----------|
| [proyecto/00-vision-general.md](proyecto/00-vision-general.md) | Qué hace esta app, stack, decisiones estructurales |
| [proyecto/01-estado-actual.md](proyecto/01-estado-actual.md) | **Qué pantallas existen y qué falta**, pantalla por pantalla |
| [proyecto/02-guia-de-desarrollo.md](proyecto/02-guia-de-desarrollo.md) | Setup, comandos, convenciones, cómo añadir una pantalla |
| [proyecto/03-decisiones.md](proyecto/03-decisiones.md) | Decisiones técnicas con su estado |
| [proyecto/04-riesgos.md](proyecto/04-riesgos.md) | Riesgos específicos del frontend |
| [proyecto/05-pendientes.md](proyecto/05-pendientes.md) | Pendientes del frontend |
| [proyecto/06-design-system.md](proyecto/06-design-system.md) | Cómo se aplica el design system: tokens, reglas, dónde vive cada cosa |
| [proyecto/07-operacion.md](proyecto/07-operacion.md) | Build, despliegue, variables, comprobaciones previas |

## Nivel módulo (una ficha por feature / capa)

| Módulo | Responsabilidad | Ficha |
|--------|-----------------|-------|
| App Router | Rutas, grupos, layouts, guards de navegación | [modulos/app-router.md](modulos/app-router.md) |
| `lib/api` + `lib/auth` | Cliente HTTP, envelope, errores, sesión y refresh | [modulos/lib-api-sesion.md](modulos/lib-api-sesion.md) |
| `components/ui` + tokens | Design system aplicado | [modulos/design-system.md](modulos/design-system.md) |
| `components/status` | Traducción de estados del dominio a UX | [modulos/components-status.md](modulos/components-status.md) |
| `features/auth` | Registro, login, sesión, perfil | [modulos/auth.md](modulos/auth.md) |
| `features/profiles` | Activación de perfiles comprador / viajero | [modulos/profiles.md](modulos/profiles.md) |
| `features/orders` | Crear y seguir encargos | [modulos/orders.md](modulos/orders.md) |
| `features/trips` | Publicar y gestionar viajes | [modulos/trips.md](modulos/trips.md) |
| `features/assignments` | Descubrir y reclamar encargos; avance físico | [modulos/assignments.md](modulos/assignments.md) |
| `features/payments` | Checkout y estado del pago | [modulos/payments.md](modulos/payments.md) |
| `features/catalog` | Productos recomendados | [modulos/catalog.md](modulos/catalog.md) |
| `features/geography` | Catálogos de países, ciudades y corredores | [modulos/geography.md](modulos/geography.md) |
| `features/notifications` | Bandeja y narrativa de notificaciones | [modulos/notifications.md](modulos/notifications.md) |
| `features/incidents` + `features/ratings` | Reportar problema y calificar | [modulos/incidents-ratings.md](modulos/incidents-ratings.md) |
| `features/admin` + `(admin)` | Consola de operación | [modulos/admin.md](modulos/admin.md) |

Mapa de dependencias y espejo con los módulos del backend:
[modulos/README.md](modulos/README.md).

## Documentos originales

| Documento | Estado |
|-----------|--------|
| [PLAN.md](PLAN.md) | ⚠️ **Parcialmente vigente.** Los principios, el contrato y el mapa pantallas ↔ API siguen valiendo. Los hitos F0–F7 ya se ejecutaron en su mayoría; el estado real está en [proyecto/01-estado-actual.md](proyecto/01-estado-actual.md). Excluye explícitamente el panel Admin, que **sí existe** |
| [DESIGN-coinbase.md](DESIGN-coinbase.md) | ✅ **Vigente y normativo.** Es la ley del diseño: tokens de color, tipografía, radios, spacing y componentes. Regla dura: **nunca un hex inline** |
