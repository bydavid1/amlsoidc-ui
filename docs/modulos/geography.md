# Feature: `geography`

Catálogos de países, ciudades y corredores habilitados. Espejo del módulo
`geography` del backend.

Ficheros: `src/features/geography/api.ts`.

---

## Endpoints que consume

| Método | Ruta | Acceso | Uso |
|--------|------|--------|-----|
| GET | `/corridors` | Público | Selector de ruta, sección de rutas de la landing |
| GET | `/countries/:id/cities` | Público | Selector de ciudad de entrega (`pageSize: 100`) |

`GET /countries` **no se consume**: los países llegan ya resueltos dentro de cada
corredor, que es más útil (solo se ofrecen países que forman parte de una ruta
habilitada).

## La decisión que hay que respetar

> **La UI nunca hardcodea corredores.**

El sistema es multi-corredor **por datos**: habilitar España → El Salvador es
insertar una fila en el backend, no tocar código. Si la UI cableara "US → SV", ese
diseño se perdería.

Está bien aplicado: `useCorridors()` alimenta tanto el formulario de creación de
encargo como el de publicación de viaje y la sección de rutas de la landing.

## Esquemas

```ts
countrySchema  = { id, iso2, name }
citySchema     = { id, countryId, name }
corridorSchema = { origin: Country, destination: Country }
```

El corredor trae los países **anidados y resueltos**, no ids: la UI puede mostrar
"Estados Unidos → El Salvador" sin una segunda consulta.

## Uso desde otras features

| Quién | Para qué |
|-------|----------|
| `orders/components/create-order-form.tsx` | Corredor + ciudad de entrega |
| `trips/components/create-trip-form.tsx` | Corredor + ciudad de destino |
| `app/page.tsx` | Sección de rutas disponibles (desde el servidor, → R-40) |

## Deuda y riesgos

| Id | Sev | Qué |
|----|-----|-----|
| R-40 | P2 | La landing consulta `/corridors` desde el servidor con una URL de cliente: si falla, la sección aparece **vacía sin ningún error** |
| R-34 | P2 | La ciudad de destino se pide en el viaje, pero el backend no la valida ni la usa en la compatibilidad |

**Además, no cubierto por un id:**

- `listCities` fija `pageSize: 100` y **descarta la paginación**: un país con más
  de 100 ciudades perdería las restantes en silencio. Hoy el seed carga cuatro por
  país, así que no molesta.
- No hay caché de larga duración configurada para estos catálogos. Son datos
  prácticamente inmutables y comparten el `staleTime: 30s` global, así que se
  revalidan mucho más de lo necesario.
- `CORRIDOR_NOT_ENABLED` **no está mapeado**: si un corredor se desactiva entre
  que el usuario carga el formulario y lo envía, ve el toast genérico.
- No hay indicación de qué ciudades tienen cobertura real de entrega: se ofrecen
  todas las del país.
- Sin pruebas.

## Pendientes

- [ ] `staleTime` largo (horas) y `gcTime` amplio para los catálogos
- [ ] Paginar `listCities` de verdad, o documentar el tope como decisión
- [ ] Mapear `CORRIDOR_NOT_ENABLED`
- [ ] URL interna de API para la consulta de la landing (→ R-40) y dejar de
      silenciar el fallo
- [ ] Cuando el backend exponga CRUD de corredores, añadir la pantalla en
      administración
