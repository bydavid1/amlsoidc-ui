# Equipo de agentes del frontend

Agentes (`.claude/agents/*.md`) y skills (`.claude/skills/*/SKILL.md`)
compatibles con Claude Code.

**Creado en la revisión del 2026-08-27.** Este repositorio no tenía ningún agente
registrado, aunque el backend sí (diez). El resultado era que todo el trabajo de
frontend se hacía sin el contexto que el backend tenía documentado.

> **Contexto obligatorio antes de invocar a cualquiera:**
> [`../AGENTS.md`](../AGENTS.md) y [`../CLAUDE.md`](../CLAUDE.md).
> Estado real del frontend:
> [`../docs/proyecto/01-estado-actual.md`](../docs/proyecto/01-estado-actual.md).
> Contrato con la API:
> [`../../docs/01-integracion.md`](../../docs/01-integracion.md).

---

## Agentes

| # | Agente | Modelo | Cuándo usarlo |
|---|--------|--------|---------------|
| 01 | `frontend-lead` | opus | **Punto de entrada** para tareas ambiguas, que cruzan pantallas o tocan varias features; decide a quién delegar y arbitra |
| 02 | `nextjs-developer` | sonnet | Implementar pantallas, features, hooks, formularios, componentes |
| 03 | `design-system-guardian` | sonnet | Colores, tipografía, radios, layout, componentes base. **Siempre que un cambio toque estilos** |
| 04 | `api-contract-sync` | sonnet | Endpoint nuevo, esquema Zod, código de error sin mapear, divergencia de contrato |
| 05 | `ux-a11y-reviewer` | sonnet | Estados de pantalla, copy, consecuencias de las acciones, accesibilidad |
| 06 | `frontend-reviewer` | opus | Revisar un cambio ya escrito |

### Por qué cada uno existe

| Agente | Problema que resuelve |
|--------|----------------------|
| `frontend-lead` | Se construían pantallas contra endpoints sin verificar y sobre reglas de negocio no confirmadas |
| `nextjs-developer` | Las convenciones del proyecto (Zod en la frontera, cuatro estados, mapeo de errores) estaban solo en la cabeza de quien las escribió |
| `design-system-guardian` | **No hay linter que detecte un hex inline.** La regla más importante del sistema no tenía guardián |
| `api-contract-sync` | R-02 (el registro caído) es exactamente una divergencia de contrato que nadie estaba vigilando |
| `ux-a11y-reviewer` | Hay flujos que bloquean al usuario sin decirle por qué, y cero auditoría de accesibilidad |
| `frontend-reviewer` | **No hay ninguna prueba.** La revisión es la única red de seguridad |

## Skills

| Skill | Referencia principal para |
|-------|---------------------------|
| `platform-domain-knowledge` | **Todos** — negocio, actores, estados, reglas de dinero |
| `nextjs-app-router-conventions` | `nextjs-developer`, `frontend-lead` |
| `api-client-and-query-patterns` | `nextjs-developer`, `api-contract-sync`, `frontend-reviewer` |
| `design-system-tokens` | `design-system-guardian`, `nextjs-developer` |

---

## Flujo de trabajo recomendado

```
1. frontend-lead con el requerimiento
2. ¿está claro el modelo de negocio?      si no: PARA y pregunta
3. ¿existe el endpoint?                   api-contract-sync
4. ¿qué pantalla y qué estados?           ux-a11y-reviewer
5. ¿qué tokens y componentes?             design-system-guardian
6. implementar                            nextjs-developer
7. revisar                                frontend-reviewer
8. documentar                             ficha del módulo + 01-estado-actual
```

Sáltate los pasos que la tarea no toque. Pero **nunca** el paso 3: construir
contra un endpoint imaginario es la forma más cara de perder el tiempo aquí.

## Contexto crítico que todos deben conocer

1. **Cero lógica de negocio en el cliente.** La máquina de estados vive en el
   backend. Un `409` **no es un bug**: es el estado que cambió. Avisa e invalida.
2. **El viajero elige los encargos.** No hay asignación automática, ni scoring, ni
   capacidad de viaje, ni calificación mutua. **El copy de la landing sigue
   prometiendo todo eso y está desactualizado** (→ R-27).
3. **El flujo por defecto es el modelo hub (Flujo C)**, elegido por configuración
   global, no por umbral de monto. Las acciones disponibles cambian según el flujo.
4. **Solo `/orders` y `/trips` paginan de verdad** (→ R-06).
5. **Nada de secretos en `NEXT_PUBLIC_*`**: se compilan en el bundle. Ya pasó
   (→ R-01).
6. **No hay ninguna prueba** ni infraestructura de pruebas (→ R-38).

## Los dos huecos que condicionan la planificación

- **R-02 (P0): el registro está caído.** `authApi.register` no envía el
  `identityDocument` que la API exige, así que devuelve 400 siempre. Y el
  formulario solo mapea errores de `email`/`password`, así que el usuario ve un
  mensaje genérico. **Requiere decisión de producto.**
- **`kyc` no tiene ninguna pantalla**, y hay **8 endpoints de administración sin
  superficie**. Un viajero no puede reclamar su primer encargo, `KYC_REQUIRED` no
  está mapeado, y no hay dónde enviar el expediente. El embudo de captación de
  viajeros está bloqueado de punta a punta.

Son lo que más valor desbloquea. Si el trabajo que se pide no toca ninguno de los
dos, conviene decirlo.

## Relación con el equipo del backend

El backend tiene su propio equipo en `../../amlsoidc/.claude/`. Cuando una tarea
de frontend necesite un cambio en la API:

1. `api-contract-sync` escribe la petición en términos del backend: qué endpoint,
   qué DTO, qué código de error, y **por qué el cliente no puede resolverlo por su
   cuenta**.
2. Ese último punto es el que decide si es un cambio legítimo o lógica de negocio
   colándose en el frontend.
3. El cambio lo diseña `api-designer` y, si toca dominio, pasa primero por
   `domain-architect` en el repo del backend.

## Instalación en otro proyecto

```
tu-proyecto/
  .claude/
    agents/     ← contenido de agents/
    skills/     ← contenido de skills/
```

Claude Code reconoce cada agente por su `name` y lo invoca cuando la tarea
coincide con su `description`, o se puede invocar explícitamente.
