import { OrderStatus } from "./order-status";

export type FlowType =
  | "TRAVELER_PURCHASES_PRODUCT" // Flujo A
  | "BRINGO_PURCHASES_DIRECT_DELIVERY" // Flujo B
  | "BRINGO_PURCHASES_HUB_DELIVERY"; // Flujo C

export interface FlowStep {
  key: string;
  phrase: string;
}

/** Paso común a los tres flujos antes de que alguien acepte el pedido. */
const SEARCHING_STEP: FlowStep = { key: "PENDING_ASSIGNMENT", phrase: "Buscando viajero para tu pedido" };

/**
 * Narrativa en primera persona (comprador), un array por flujo — NO hay
 * lógica de "si es tal flujo entonces tal texto" desperdigada, todo el
 * vocabulario vive acá.
 */
export const FLOW_STEPS: Record<FlowType, FlowStep[]> = {
  TRAVELER_PURCHASES_PRODUCT: [
    SEARCHING_STEP,
    { key: "AWAITING_PURCHASE", phrase: "Tu viajero va a comprar el producto" },
    { key: "PURCHASED", phrase: "Tu viajero ya lo compró" },
    { key: "IN_TRANSIT", phrase: "Va en camino" },
    { key: "DELIVERED", phrase: "Entregado" },
  ],
  BRINGO_PURCHASES_DIRECT_DELIVERY: [
    SEARCHING_STEP,
    { key: "AWAITING_PURCHASE", phrase: "Bringo está comprando tu producto" },
    { key: "PURCHASED", phrase: "En camino a tu viajero" },
    { key: "RECEIVED_BY_TRAVELER", phrase: "Tu viajero ya lo tiene" },
    { key: "IN_TRANSIT", phrase: "En camino a ti" },
    { key: "DELIVERED", phrase: "Entregado" },
  ],
  BRINGO_PURCHASES_HUB_DELIVERY: [
    SEARCHING_STEP,
    { key: "AWAITING_PURCHASE", phrase: "Bringo está comprando tu producto" },
    { key: "PURCHASED", phrase: "En camino a tu viajero" },
    { key: "RECEIVED_BY_TRAVELER", phrase: "Tu viajero ya lo tiene" },
    { key: "IN_TRANSIT", phrase: "En camino a ti" },
    { key: "HUB_RECEIVED_BY_BRINGO", phrase: "Tu viajero lo entregó en un punto Bringo" },
    { key: "DISPATCHED_TO_BUYER", phrase: "Bringo lo está enviando a tu casa" },
    { key: "DELIVERED", phrase: "Entregado" },
  ],
};

/**
 * Posición actual dentro de FLOW_STEPS[flowType]; -1 si es un estado
 * terminal/excepción (CANCELLED, DISPUTED...) donde no aplica narrativa de
 * pasos — mismo criterio que ya usaba StatusStepper.
 */
export function flowStepIndex(
  flowType: FlowType,
  status: OrderStatus,
  fulfillmentStatus: string | null,
): number {
  if (status === "PENDING_ASSIGNMENT") return 0;

  if (status === "ASSIGNED" || status === "SOURCING") {
    if (fulfillmentStatus === "AWAITING_PURCHASE" || !fulfillmentStatus) return 1;
    if (fulfillmentStatus === "PURCHASED" || fulfillmentStatus === "TRACKING_REGISTERED") {
      return 2;
    }
    if (fulfillmentStatus === "RECEIVED_BY_TRAVELER") {
      return flowType === "TRAVELER_PURCHASES_PRODUCT" ? 2 : 3;
    }
    return 1;
  }

  if (status === "IN_TRANSIT") {
    return flowType === "TRAVELER_PURCHASES_PRODUCT" ? 3 : 4;
  }

  if (status === "READY_FOR_DELIVERY") {
    if (flowType === "BRINGO_PURCHASES_HUB_DELIVERY") {
      return fulfillmentStatus === "DISPATCHED_TO_BUYER" ? 6 : 5;
    }
    // A y B no tienen paso de hub — sigue leyéndose "en camino" hasta que se confirme la entrega
    return flowType === "TRAVELER_PURCHASES_PRODUCT" ? 3 : 4;
  }

  if (status === "DELIVERED" || status === "COMPLETED") {
    return FLOW_STEPS[flowType].length - 1;
  }

  return -1;
}
