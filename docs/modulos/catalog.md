# Feature: `catalog`

Productos recomendados: la vitrina curada que inspira al comprador. Espejo del
módulo `catalog` del backend.

Ficheros: `src/features/catalog/api.ts`,
`src/features/catalog/components/recommended-products.tsx`.

---

## Para qué existe

Un marketplace vacío no se usa. Si el comprador entra y ve un formulario en blanco
pidiéndole la URL de un producto, no sabe qué pedir. La vitrina resuelve el
arranque en frío: ve "iPhone 15 Pro — $1.181" y lo pide con un clic.

No es inventario: la Plataforma no vende nada. Son **sugerencias con enlace a la
tienda real** y su total estimado ya calculado.

## Endpoint que consume

| Método | Ruta | Acceso |
|--------|------|--------|
| GET | `/recommended-products` | **Público** |

Público a propósito: se usa en la pantalla de creación de encargo, y podría usarse
en la landing sin sesión.

El alta y la desactivación viven en [`admin`](admin.md).

## Qué devuelve

Por producto: `name`, `productUrl`, `imageUrl`, `estimatedPriceAmount`,
`estimatedPriceCurrency`, `sizeCategory`, `originCountryId` y
**`estimatedTotalAmount`**.

El total lo calcula el backend con la configuración de tarifas **vigente** (no una
congelada), lo cual es correcto para una vitrina: el comprador ve el precio de hoy.

Solo el total, nunca el desglose: la regla de visibilidad del dinero se respeta
por construcción.

## Integración con la creación de encargo

`recommended-products.tsx` se muestra dentro de `/comprar/nuevo`. Al elegir un
producto, precarga el formulario (URL, nombre, precio, tamaño), que es exactamente
el atajo que justifica la feature.

Conecta con `product-resolver.ts` de `orders`: el producto recomendado ya trae los
datos, así que se salta la heurística de resolución por URL.

## Deuda

Sin riesgos con id. Deuda de alcance y de robustez:

- **Tope fijo de 24** productos en el backend, sin paginación ni filtro por país.
  Con más de 24, los del final son invisibles.
- **Sin filtro por corredor**: se muestran todos los productos activos, aunque su
  país de compra no coincida con el corredor que el comprador eligió.
- **Los precios se copian a mano** en el backend y no se verifican contra la
  tienda. Un precio obsoleto genera un encargo con un total equivocado, y el
  comprador se lleva la sorpresa al comprar.
- **`imageUrl` apunta a la tienda original**, sin proxy ni `next/image` con
  dominios permitidos (→ FE-E8): la vitrina depende de que la tienda no bloquee el
  hotlinking, y cada imagen es una petición a un tercero desde el navegador del
  usuario.
- Sin estados de fallo por imagen: si una no carga, queda un hueco.
- Sin `alt` verificado en las imágenes (→ FE-E5).
- Sin pruebas.

## Pendientes

- [ ] Filtrar la vitrina por el corredor seleccionado
- [ ] Paginación o "ver más" cuando el backend lo soporte
- [ ] `next/image` con `remotePatterns`, o proxy de imágenes (→ FE-E8)
- [ ] Placeholder y estado de fallo por imagen
- [ ] `alt` descriptivo en cada imagen
- [ ] Mostrar la antigüedad del precio cuando el backend la exponga
