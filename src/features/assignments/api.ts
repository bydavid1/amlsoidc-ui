import { z } from "zod";
import { apiGet, apiPost } from "@/lib/api/client";
import { sizeCategorySchema } from "@/features/orders/schemas";

/** Contrato de AssignmentListItemDto: incluye el contexto del pedido. */
export const assignmentSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  tripId: z.string(),
  status: z.enum(["OFFERED", "ACCEPTED", "REJECTED", "EXPIRED", "CANCELLED"]),
  offeredAt: z.string(),
  respondedAt: z.string().nullable(),
  createdAt: z.string(),
  productName: z.string(),
  sizeCategory: z.string(),
  travelerRewardAmount: z.coerce.number(),
  destinationCityId: z.string(),
  orderStatus: z.string(),
  fulfillmentStatus: z.string().nullable(),
  receivingAddressLine: z.string().nullable(),
});
export type Assignment = z.infer<typeof assignmentSchema>;

/** Encargo disponible para reclamar (AvailableOrderDto del backend). */
export const availableOrderSchema = z.object({
  id: z.string(),
  productName: z.string(),
  sizeCategory: sizeCategorySchema,
  estimatedPriceAmount: z.coerce.number(),
  estimatedPriceCurrency: z.string(),
  travelerRewardAmount: z.coerce.number(),
  destinationCityId: z.string(),
  neededBy: z.string().nullable(),
  createdAt: z.string(),
});
export type AvailableOrder = z.infer<typeof availableOrderSchema>;

export const assignmentsApi = {
  async listMine(): Promise<Assignment[]> {
    return z
      .array(assignmentSchema)
      .parse(await apiGet<Assignment[]>("/assignments", { limit: 50 }));
  },
  /** Encargos disponibles compatibles con MI viaje (modelo discovery+claim). */
  async listAvailableOrders(tripId: string): Promise<AvailableOrder[]> {
    return z
      .array(availableOrderSchema)
      .parse(await apiGet<AvailableOrder[]>(`/trips/${tripId}/available-orders`));
  },
  claim(tripId: string, orderId: string): Promise<unknown> {
    return apiPost(`/trips/${tripId}/claim/${orderId}`);
  },
  markReceived(id: string): Promise<unknown> {
    return apiPost(`/assignments/${id}/mark-received`);
  },
  markInTransit(id: string): Promise<unknown> {
    return apiPost(`/assignments/${id}/mark-in-transit`);
  },
  setReceivingAddress(id: string, addressLine: string): Promise<unknown> {
    return apiPost(`/assignments/${id}/set-receiving-address`, { addressLine });
  },
};

/**
 * Qué le toca hacer al Traveler en un encargo reclamado, derivado del estado
 * REAL del pedido (la máquina de estados vive en el backend).
 */
export type TravelerNextAction =
  | { kind: "wait-purchase" }
  | { kind: "mark-received" }
  | { kind: "mark-in-transit" }
  | { kind: "set-address" }
  | { kind: "deliver-to-hub" }
  | { kind: "wait-buyer-confirmation" }
  | { kind: "done" }
  | { kind: "none" };

export function travelerNextAction(a: Assignment): TravelerNextAction {
  if (a.status !== "ACCEPTED") return { kind: "none" };
  switch (a.orderStatus) {
    case "ASSIGNED":
    case "SOURCING":
      if (a.fulfillmentStatus === "AWAITING_PURCHASE") {
        // modelo hub: sin dirección registrada, el comprador no puede comprar
        return a.receivingAddressLine ? { kind: "wait-purchase" } : { kind: "set-address" };
      }
      if (a.fulfillmentStatus === "PURCHASED") return { kind: "mark-received" };
      if (a.fulfillmentStatus === "RECEIVED_BY_TRAVELER") return { kind: "mark-in-transit" };
      return { kind: "none" };
    case "IN_TRANSIT":
      // el viajero entrega en el punto Bringo; la recepción la confirma Bringo
      return { kind: "deliver-to-hub" };
    case "READY_FOR_DELIVERY":
      return { kind: "wait-buyer-confirmation" };
    case "DELIVERED":
    case "COMPLETED":
      return { kind: "done" };
    default:
      return { kind: "none" };
  }
}
