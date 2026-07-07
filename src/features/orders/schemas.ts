import { z } from "zod";

/** Contrato de OrderResponseDto del backend. */
export const orderSchema = z.object({
  id: z.string(),
  status: z.string(),
  fulfillmentStatus: z.string().nullable(),
  fulfillmentType: z.string().nullable(),
  displayStatus: z.string(),
  productName: z.string(),
  productUrl: z.string(),
  estimatedPriceAmount: z.coerce.number(),
  estimatedPriceCurrency: z.string(),
  originCountryId: z.string(),
  destinationCountryId: z.string(),
  destinationCityId: z.string(),
  neededBy: z.string().nullable(),
  createdAt: z.string(),
});
export type Order = z.infer<typeof orderSchema>;

export const timelineEntrySchema = z.object({
  fromState: z.string().nullable(),
  toState: z.string(),
  actor: z.string().nullable(),
  occurredAt: z.string(),
});

export const orderDetailSchema = orderSchema.extend({
  timeline: z.array(timelineEntrySchema),
});
export type OrderDetail = z.infer<typeof orderDetailSchema>;

/** Fila del listado (OrderListRow del backend). */
export const orderListRowSchema = z.object({
  id: z.string(),
  productName: z.string(),
  originCountryId: z.string(),
  destinationCountryId: z.string(),
  status: z.string(),
  fulfillmentStatus: z.string().nullable(),
  createdAt: z.string(),
});
export type OrderListRow = z.infer<typeof orderListRowSchema>;

/** Formulario de creación — mismas reglas que CreateOrderDto del backend. */
export const createOrderFormSchema = z.object({
  corridorKey: z.string().min(1, "Elige la ruta de tu pedido"),
  destinationCityId: z.string().min(1, "Elige la ciudad de entrega"),
  productName: z
    .string()
    .min(2, "Mínimo 2 caracteres")
    .max(200, "Máximo 200 caracteres"),
  productUrl: z
    .url("Ingresa la URL del producto (con https://)")
    .max(2000),
  estimatedPriceAmount: z
    .number("Ingresa el precio estimado")
    .min(0, "El precio no puede ser negativo")
    .max(1_000_000, "Precio fuera de rango"),
  neededBy: z.string().optional(),
});
export type CreateOrderFormValues = z.infer<typeof createOrderFormSchema>;
