import { z } from "zod";

/** Contrato de OrderResponseDto del backend. */
export const sizeCategorySchema = z.enum(["SMALL", "MEDIUM", "LARGE"]);
export type SizeCategory = z.infer<typeof sizeCategorySchema>;

export const SIZE_UI: Record<SizeCategory, { label: string; examples: string }> = {
  SMALL: { label: "Pequeño", examples: "AirPods, perfume, medicinas" },
  MEDIUM: { label: "Mediano", examples: "Teléfono, tablet, Nintendo Switch" },
  LARGE: { label: "Grande", examples: "PlayStation, laptop, dron" },
};

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
  sizeCategory: sizeCategorySchema,
  // el Buyer solo ve el total aproximado; el split del servicio es dato interno
  estimatedTotalAmount: z.coerce.number(),
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

/** Percepción sin contacto: solo nombre de pila + reputación del viajero. */
export const travelerPublicSchema = z.object({
  firstName: z.string().nullable(),
  reputationScore: z.coerce.number(),
  reputationCount: z.coerce.number(),
});
export type TravelerPublic = z.infer<typeof travelerPublicSchema>;

export const orderDetailSchema = orderSchema.extend({
  timeline: z.array(timelineEntrySchema),
  traveler: travelerPublicSchema.nullable(),
  receivingAddress: z.string().nullable(),
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
  sizeCategory: z.string(),
  estimatedTotalAmount: z.coerce.number(),
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
  sizeCategory: sizeCategorySchema,
  neededBy: z.string().optional(),
});
export type CreateOrderFormValues = z.infer<typeof createOrderFormSchema>;
