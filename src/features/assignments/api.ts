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
  flowType: z.string(),
  fulfillmentStatus: z.string().nullable(),
  receivingAddressLine: z.string().nullable(),
  servicePaid: z.boolean(),
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
  /** Flujo A (traveler-funded): el traveler registra que compró con su dinero. */
  confirmPurchase(id: string): Promise<unknown> {
    return apiPost(`/assignments/${id}/confirm-purchase`);
  },
  /** Flujos A/B (sin hub): el traveler confirma que entregó directo al comprador. */
  confirmDirectDelivery(id: string): Promise<unknown> {
    return apiPost(`/assignments/${id}/confirm-direct-delivery`);
  },
};

/**
 * Qué le toca hacer al Traveler en un encargo reclamado, derivado del estado
 * REAL del pedido (la máquina de estados vive en el backend).
 */
export type TravelerNextAction =
  | { kind: "wait-purchase" }
  | { kind: "wait-payment" }
  | { kind: "confirm-purchase" }
  | { kind: "wait-tracking" }
  | { kind: "mark-received" }
  | { kind: "mark-in-transit" }
  | { kind: "set-address" }
  | { kind: "deliver-to-hub" }
  | { kind: "confirm-direct-delivery" }
  | { kind: "wait-buyer-confirmation" }
  | { kind: "done" }
  | { kind: "none" };

export function travelerNextAction(a: Assignment): TravelerNextAction {
  if (a.status !== "ACCEPTED") return { kind: "none" };
  switch (a.orderStatus) {
    case "ASSIGNED":
    case "SOURCING":
      if (a.fulfillmentStatus === "AWAITING_PURCHASE") {
        // modelo hub: sin dirección registrada, no se puede comprar
        if (!a.receivingAddressLine) return { kind: "set-address" };
        if (a.flowType === "TRAVELER_PURCHASES_PRODUCT") {
          // flujo A: compra el propio traveler, una vez el buyer pagó el servicio
          return a.servicePaid ? { kind: "confirm-purchase" } : { kind: "wait-payment" };
        }
        return { kind: "wait-purchase" };
      }
      if (
        a.fulfillmentStatus === "PURCHASED" &&
        (a.flowType === "BRINGO_PURCHASES_DIRECT_DELIVERY" ||
          a.flowType === "BRINGO_PURCHASES_HUB_DELIVERY")
      ) {
        // Bringo ya compró (flujo B/C); falta que registren el tracking, no le toca nada al traveler todavía
        return { kind: "wait-tracking" };
      }
      if (a.fulfillmentStatus === "PURCHASED") return { kind: "mark-received" };
      if (a.fulfillmentStatus === "TRACKING_REGISTERED") return { kind: "mark-received" };
      if (a.fulfillmentStatus === "RECEIVED_BY_TRAVELER") return { kind: "mark-in-transit" };
      return { kind: "none" };
    case "IN_TRANSIT":
      // flujo C (hub): entrega en el punto Bringo; flujo A/B: directo al comprador
      if (a.flowType === "BRINGO_PURCHASES_HUB_DELIVERY") {
        return { kind: "deliver-to-hub" };
      }
      return { kind: "confirm-direct-delivery" };
    case "READY_FOR_DELIVERY":
      return { kind: "wait-buyer-confirmation" };
    case "DELIVERED":
    case "COMPLETED":
      return { kind: "done" };
    default:
      return { kind: "none" };
  }
}
