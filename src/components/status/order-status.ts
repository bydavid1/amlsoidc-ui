/**
 * Traducción de los estados del pedido (backbone + sub-flujo del Fulfillment)
 * a UX. Colores semánticos SOLO como texto (regla del design system).
 * La UI nunca decide transiciones: solo refleja `status`/`displayStatus`.
 */

export type OrderStatus =
  | "PENDING_ASSIGNMENT"
  | "ASSIGNED"
  | "SOURCING"
  | "IN_TRANSIT"
  | "READY_FOR_DELIVERY"
  | "DELIVERED"
  | "COMPLETED"
  | "DELIVERY_FAILED"
  | "DISPUTED"
  | "CANCELLED"
  | "EXPIRED";

export type FulfillmentStatus = "AWAITING_PURCHASE" | "PURCHASED" | "RECEIVED_BY_TRAVELER";

type Tone = "neutral" | "progress" | "success" | "danger";

const STATUS_UI: Record<string, { label: string; tone: Tone }> = {
  PENDING_ASSIGNMENT: { label: "Buscando viajero", tone: "neutral" },
  ASSIGNED: { label: "Viajero asignado", tone: "progress" },
  SOURCING: { label: "En preparación", tone: "progress" },
  IN_TRANSIT: { label: "En camino", tone: "progress" },
  READY_FOR_DELIVERY: { label: "Listo para entrega", tone: "progress" },
  DELIVERED: { label: "Entregado", tone: "success" },
  COMPLETED: { label: "Completado", tone: "success" },
  DELIVERY_FAILED: { label: "Entrega fallida", tone: "danger" },
  DISPUTED: { label: "En disputa", tone: "danger" },
  CANCELLED: { label: "Cancelado", tone: "danger" },
  EXPIRED: { label: "Expirado", tone: "danger" },
  // sub-flujo (nivel 2) — aparece como displayStatus durante SOURCING
  AWAITING_PURCHASE: { label: "Esperando tu compra", tone: "progress" },
  PURCHASED: { label: "Producto comprado", tone: "progress" },
  RECEIVED_BY_TRAVELER: { label: "En manos del viajero", tone: "progress" },
};

export function statusLabel(status: string): string {
  return STATUS_UI[status]?.label ?? status;
}

export function statusTextClass(status: string): string {
  switch (STATUS_UI[status]?.tone) {
    case "success":
      return "text-semantic-up";
    case "danger":
      return "text-semantic-down";
    case "progress":
      return "text-primary";
    default:
      return "text-body-text";
  }
}

/** Pasos del flujo feliz para el stepper (espejo de la máquina de estados). */
export const HAPPY_PATH_STEPS = [
  { key: "PENDING_ASSIGNMENT", label: "Buscando viajero" },
  { key: "ASSIGNED", label: "Asignado" },
  { key: "PURCHASED", label: "Comprado" },
  { key: "RECEIVED_BY_TRAVELER", label: "Con el viajero" },
  { key: "IN_TRANSIT", label: "En camino" },
  { key: "READY_FOR_DELIVERY", label: "Por entregar" },
  { key: "DELIVERED", label: "Entregado" },
  { key: "COMPLETED", label: "Completado" },
] as const;

/** Posición actual en el flujo feliz; -1 si el pedido está en estado terminal/excepción. */
export function happyPathIndex(
  status: OrderStatus,
  fulfillmentStatus: string | null,
): number {
  switch (status) {
    case "PENDING_ASSIGNMENT":
      return 0;
    case "ASSIGNED":
      return 1;
    case "SOURCING":
      if (fulfillmentStatus === "RECEIVED_BY_TRAVELER") return 3;
      if (fulfillmentStatus === "PURCHASED") return 2;
      return 1;
    case "IN_TRANSIT":
      return 4;
    case "READY_FOR_DELIVERY":
      return 5;
    case "DELIVERED":
      return 6;
    case "COMPLETED":
      return 7;
    default:
      return -1;
  }
}

/** Reglas de qué acción del Buyer aplica (espejo de las invariantes del backend). */
export const buyerActions = {
  canCancel(status: OrderStatus, fulfillmentStatus: string | null): boolean {
    if (status === "PENDING_ASSIGNMENT") return true;
    return (
      (status === "ASSIGNED" || status === "SOURCING") &&
      fulfillmentStatus === "AWAITING_PURCHASE"
    );
  },
  canConfirmPurchase(status: OrderStatus, fulfillmentStatus: string | null): boolean {
    return (
      (status === "ASSIGNED" || status === "SOURCING") &&
      fulfillmentStatus === "AWAITING_PURCHASE"
    );
  },
  canConfirmDelivery(status: OrderStatus): boolean {
    return status === "READY_FOR_DELIVERY";
  },
  canRate(status: OrderStatus): boolean {
    return status === "DELIVERED";
  },
  canReportIssue(status: OrderStatus): boolean {
    return ["ASSIGNED", "SOURCING", "IN_TRANSIT", "READY_FOR_DELIVERY", "DELIVERED"].includes(
      status,
    );
  },
};
