@AGENTS.md

---

# Notas específicas para Claude Code

## Índice de documentación

- **Negocio y glosario:** [`docs/plataforma/00-plataforma.md`](https://github.com/bydavid1/amlsoidc/blob/main/docs/plataforma/00-plataforma.md)
- **Contrato con la API:** [`docs/plataforma/01-integracion.md`](https://github.com/bydavid1/amlsoidc/blob/main/docs/plataforma/01-integracion.md) — envelope, errores, endpoints, variables
- **Riesgos abiertos (ids `R-nn`):** [`docs/plataforma/02-riesgos.md`](https://github.com/bydavid1/amlsoidc/blob/main/docs/plataforma/02-riesgos.md)
- **Historia y decisiones revertidas:** [`docs/plataforma/04-historia.md`](https://github.com/bydavid1/amlsoidc/blob/main/docs/plataforma/04-historia.md)
- **Documentación de este repo:** [`docs/README.md`](docs/README.md)
- **Estado real, pantalla por pantalla:** [`docs/proyecto/01-estado-actual.md`](docs/proyecto/01-estado-actual.md)
- **Ficha del módulo que vas a tocar:** [`docs/modulos/`](docs/modulos/)
- **Design system:** [`docs/proyecto/06-design-system.md`](docs/proyecto/06-design-system.md) y [`docs/DESIGN-coinbase.md`](docs/DESIGN-coinbase.md)

## Equipo de agentes de este repo

Definidos en `.claude/agents/`, con sus skills en `.claude/skills/`. Tabla
completa y flujo de trabajo en [`.claude/README.md`](.claude/README.md).

| Situación | Agente |
|-----------|--------|
| Tarea ambigua, que cruza pantallas o toca varias features | `frontend-lead` |
| Implementar una pantalla, una feature, un hook | `nextjs-developer` |
| Colores, tipografía, radios, componentes, layout | `design-system-guardian` |
| Un endpoint nuevo, un esquema Zod, un código de error sin mapear | `api-contract-sync` |
| Accesibilidad, estados de pantalla, copy, flujo de usuario | `ux-a11y-reviewer` |
| Revisar un cambio ya escrito | `frontend-reviewer` |

## Reglas de trabajo en este repo

1. **Cero lógica de negocio en el cliente.** La máquina de estados vive en el
   backend. Un `409` no es un bug: es el estado que cambió.
2. **Lee la ficha del módulo antes de editarlo.** `docs/modulos/<modulo>.md`
   documenta endpoints, hooks, errores manejados y deuda conocida.
3. **Verifica antes de afirmar.** `npx tsc --noEmit && npm run lint`. `npm run
   build` falla sin salida a internet (fuentes remotas), así que no lo uses como
   comprobación. Si no puedes ejecutar nada, **dilo explícitamente**.
4. **Actualiza la documentación en el mismo cambio:** ficha del módulo y
   `01-estado-actual.md`.
5. **Los ids de riesgo son estables.** Si cierras uno, márcalo `Cerrado` con fecha
   en `../docs/02-riesgos.md`; no borres la entrada.
6. **No commitear ni empujar** sin que se te pida.

## Trampas concretas de este código

| Trampa | Detalle |
|--------|---------|
| Secreto en `NEXT_PUBLIC_*` | Acaba en el bundle. Ya pasó (→ R-01) |
| `fetch` o `axios` directo | Te saltas envelope, refresh y manejo de errores. Todo va por `lib/api/client` |
| Tratar un `409` como bug | Avisa e **invalida**; no reintentes |
| Construir paginación sobre un listado que no la soporta | Solo `/orders` y `/trips` (→ R-06) |
| Copiar límites de formulario "a ojo" | Deben ser los del DTO del backend |
| No mapear `details` de `VALIDATION_ERROR` | Es lo que hizo invisible R-02 |
| Hex inline | Rompe el design system y **no hay linter que lo detecte** |
| `NEXT_PUBLIC_API_URL` desde un Server Component | Es una URL de navegador (→ R-40) |
| Duplicar la máquina de estados | `order-status.ts` es un espejo, no la autoridad |
| Seguir el copy de la landing como especificación | Describe un modelo retirado (→ R-27) |
| Seguir `docs/PLAN.md` como especificación | Parcialmente vigente; excluía el Admin, que existe |
| Editar un componente de `components/ui/` | Es código generado de shadcn; se pierde al regenerar |

## Los dos huecos que hay que tener presentes

- **R-02 (P0): el registro está caído.** `authApi.register` no envía el
  `identityDocument` que la API exige, así que `POST /auth/register` devuelve 400
  siempre. Y el formulario solo mapea errores de `email`/`password`, así que el
  usuario ve un mensaje genérico. **Requiere decisión de producto** antes de
  arreglarlo.
- **`kyc` no tiene ninguna pantalla.** El backend acepta expedientes y hay 8
  endpoints de administración sin superficie. Un viajero que intenta reclamar su
  primer encargo recibe `403 KYC_REQUIRED`, ese código **no está mapeado**, y no
  hay dónde enviar el expediente. Es el peor error de UX de la app (→ FE-E4).

## Estado de las pruebas

**No hay ninguna.** Ni Jest, ni Vitest, ni Playwright, ni Testing Library, ni
script de test. Es la razón por la que R-02 pasó desapercibido: una sola prueba
e2e del registro lo habría detectado.

No asumas red de seguridad. Si cambias comportamiento, la única forma de saber que
no rompiste nada es leer los consumidores.
