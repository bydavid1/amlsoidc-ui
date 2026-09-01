# Módulos del frontend

Una ficha por feature o capa. Plantilla común: responsabilidad · ficheros ·
endpoints que consume · estado y hooks · componentes · errores manejados ·
deuda y riesgos · pendientes.

## Capas transversales

| Módulo | Responsabilidad | Ficha |
|--------|-----------------|-------|
| App Router | Rutas, grupos, layouts, guards de navegación | [app-router.md](app-router.md) |
| `lib/api` + `lib/auth` | Cliente HTTP, envelope, errores, sesión, refresh | [lib-api-sesion.md](lib-api-sesion.md) |
| `components/ui` + tokens | Design system aplicado | [design-system.md](design-system.md) |
| `components/status` | Traducción de estados del dominio a UX | [components-status.md](components-status.md) |

## Features (espejo de los módulos del backend)

| Feature | Módulo del backend | Ficha |
|---------|--------------------|-------|
| `auth` | `auth` + `identity` | [auth.md](auth.md) |
| `profiles` | `orders` + `trips` (activación de perfil) | [profiles.md](profiles.md) |
| `orders` | `orders` | [orders.md](orders.md) |
| `trips` | `trips` | [trips.md](trips.md) |
| `assignments` | `matching` | [assignments.md](assignments.md) |
| `payments` | `payments` | [payments.md](payments.md) |
| `catalog` | `catalog` | [catalog.md](catalog.md) |
| `geography` | `geography` | [geography.md](geography.md) |
| `notifications` | `notifications` | [notifications.md](notifications.md) |
| `incidents` + `ratings` | `incidents` + `reputation` | [incidents-ratings.md](incidents-ratings.md) |
| `admin` | `admin` (+ los módulos que compone) | [admin.md](admin.md) |

**Sin feature en el frontend:** el módulo `kyc` del backend. Es el hueco
funcional más grande de la aplicación (→ R-17, FE-E3).

---

## Mapa de dependencias

```
                         app/  (rutas)
                           │
        ┌──────────────────┼──────────────────┐
        v                  v                  v
  components/layout   features/<modulo>   components/status
   (shell, guards)     (api + hooks +      (traducción de
        │               componentes)         estados a UX)
        │                  │
        └──────────┬───────┘
                   v
              lib/api/client  ──>  lib/auth/token-store
                   │
                   v
            components/ui  (shadcn) + tokens de globals.css
```

### Reglas de dependencia

1. **Ningún componente llama a la API directamente.** Toda llamada va en
   `features/<modulo>/api.ts` y se consume por un hook.
2. **Ningún `fetch` ni `axios` fuera de `lib/api/client`.** La única excepción
   actual es la página de checkout sandbox, y es parte de R-01.
3. `components/ui/` no conoce el dominio. Si un componente sabe qué es un
   "encargo", va en `features/` o en `components/status/`.
4. `components/status/` es el **único** sitio donde un estado del backend se
   traduce a texto, color o posición del stepper.
5. Una feature puede importar de otra por su API pública (`features/x/api.ts`),
   nunca sus componentes internos. Ejemplos legítimos que ya existen:
   `orders` usa `catalog` y `geography`; `notifications` usa
   `components/status` para etiquetar estados.

---

## Cobertura del backend, de un vistazo

| Módulo del backend | Feature | Cobertura |
|--------------------|---------|-----------|
| `identity`, `auth` | `auth` | ⚠️ registro roto (R-02) |
| `geography` | `geography` | ✅ |
| `orders` | `orders` | ✅ |
| `trips` | `trips` | ✅ |
| `matching` | `assignments` | ✅ |
| `payments` | `payments` | ⚠️ secreto en el bundle (R-01) |
| `catalog` | `catalog` | ✅ lectura; alta y baja vía `admin` |
| `notifications` | `notifications` | ⚠️ sin paginación |
| `reputation` | `ratings` | ✅ |
| `incidents` | `incidents` | ✅ versión mínima |
| `admin` | `admin` | 🚧 12 de 20 endpoints |
| **`kyc`** | — | ❌ **cero cobertura** |
| `audit` | — | (no expone API) |
