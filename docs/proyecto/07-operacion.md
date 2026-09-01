# 07 — Operación del frontend

---

## 1. Variables de entorno

Todas son `NEXT_PUBLIC_*`, es decir **se compilan dentro del bundle** y son
visibles para cualquier usuario.

| Variable | Obligatoria | Qué es |
|----------|-------------|--------|
| `NEXT_PUBLIC_API_URL` | Sí en práctica | Base de la API con `/api/v1`. Sin ella, cae a `http://localhost:3006/api/v1` |
| `NEXT_PUBLIC_SUPPORT_WHATSAPP` | No | Teléfono del botón de soporte; sin ella el botón no se muestra |
| `NEXT_PUBLIC_HUB_ADDRESS` | No | Dirección del hub que se muestra al viajero |
| `NEXT_PUBLIC_SANDBOX_SECRET` | — | ⚠️ **Secreto en el bundle. Hay que eliminarla** (→ R-01) |

> **Ninguna variable se valida al arrancar.** Un `NEXT_PUBLIC_API_URL` mal escrito
> no falla en el build: falla en tiempo de ejecución, con errores de red que el
> usuario ve como "no pudimos completar la acción". Conviene añadir una
> comprobación en `providers.tsx` o en un módulo de configuración.

### Variables que faltan

- Una **URL interna de API** para las llamadas desde el servidor. Hoy la landing
  usa `NEXT_PUBLIC_API_URL` desde un Server Component, y en un contenedor
  `localhost` no es la API (→ R-40).
- Un identificador de entorno (`NEXT_PUBLIC_ENV`) para no mostrar superficies de
  sandbox en producción.

## 2. Build

```bash
npm ci
npm run build     # next build
npm run start     # servir el build
```

**El build carga fuentes desde Google Fonts** (`next/font/google` en
`layout.tsx`). En un entorno sin salida a internet **falla**. Alternativas: usar
`next/font/local` con los ficheros de fuente en el repo, o permitir el acceso a
`fonts.googleapis.com` y `fonts.gstatic.com` en el build.

Para verificar cambios sin depender de red:

```bash
npx tsc --noEmit && npm run lint
```

## 3. Despliegue

**No hay Dockerfile ni configuración de despliegue en este repo.** Opciones:

| Opción | Nota |
|--------|------|
| Plataforma gestionada de Next | Lo más directo; hay que fijar las variables `NEXT_PUBLIC_*` en tiempo de **build**, no de ejecución |
| Contenedor propio | Requiere Dockerfile multi-stage. Ojo con las fuentes remotas en el build |
| Export estático | **No es viable**: hay rutas dinámicas y todo el estado de sesión es de cliente, pero la landing es un Server Component con `fetch` |

Recordatorio crítico: **las variables `NEXT_PUBLIC_*` se congelan en el build.**
Cambiar la URL de la API exige un build nuevo, no un reinicio.

`next.config.ts` está prácticamente vacío. Falta como mínimo:

- `images.remotePatterns` para las imágenes de productos que vienen de tiendas
  externas
- cabeceras de seguridad (CSP, `Referrer-Policy`, `X-Content-Type-Options`)

## 4. Dependencia del backend

La UI **no funciona sin la API**. Antes de desplegar hay que confirmar:

- [ ] La API responde en `NEXT_PUBLIC_API_URL`
- [ ] El origen del frontend está en `CORS_ORIGINS` del backend
- [ ] La API corre con `credentials: true` en CORS (ya lo hace)
- [ ] La versión de la API expone los endpoints que esta versión de la UI consume

Si el origen no está en `CORS_ORIGINS`, **todas** las peticiones fallan por CORS y
el usuario ve errores de red genéricos, sin ninguna pista del motivo real.

## 5. Comportamiento en fallo

| Fallo | Qué ve el usuario |
|-------|-------------------|
| API caída | Toast "No pudimos completar la acción"; los 5xx se reintentan dos veces |
| CORS mal configurado | Igual que API caída, sin pista del motivo |
| Refresh inválido o reusado | Sesión cerrada y redirección a `/login` |
| `fetch` de la landing falla | La sección de corredores aparece **vacía, sin error** (→ R-40) |
| Fuentes no disponibles | Fallback del sistema; el layout se degrada |

## 6. Observabilidad

**No hay ninguna.** Sin captura de errores de cliente, sin Core Web Vitals, sin
telemetría de embudo.

Consecuencia concreta: el registro está caído para el 100% de los usuarios
(→ R-02) y **nadie se enteraría** por instrumentación; solo por una queja.

Lo que ya está listo para aprovecharse: `ApiError` transporta el `requestId` del
backend. Enviarlo a una herramienta de errores permitiría saltar del error del
cliente al log del servidor en un clic.

## 7. Lista de verificación previa a producción

Ninguno de estos puntos está resuelto hoy:

- [ ] `NEXT_PUBLIC_SANDBOX_SECRET` eliminada y la página de checkout sandbox
      retirada o protegida (→ R-01)
- [ ] Registro funcionando de punta a punta (→ R-02)
- [ ] Copy de la landing acorde al modelo vigente (→ R-27)
- [ ] `NEXT_PUBLIC_API_URL` apuntando a la API de producción por HTTPS
- [ ] Origen del frontend en `CORS_ORIGINS` del backend
- [ ] Auditoría de que ninguna `NEXT_PUBLIC_*` contenga algo sensible
- [ ] Cabeceras de seguridad e `images.remotePatterns` en `next.config.ts`
- [ ] Fuentes resueltas sin depender de red en el build
- [ ] Captura de errores de cliente con el `requestId`
- [ ] Pantalla de KYC del viajero, o mensaje claro de por qué no puede reclamar
      (→ FE-E4)
- [ ] Al menos las pruebas e2e de los flujos principales (→ R-38)
