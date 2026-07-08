import { z } from "zod";
import { apiGet, apiGetWithMeta, apiPost } from "@/lib/api/client";
import { CursorPage } from "@/lib/api/types";
import {
  Order,
  OrderDetail,
  OrderListRow,
  orderDetailSchema,
  orderListRowSchema,
  orderSchema,
} from "./schemas";

export interface CreateOrderInput {
  originCountryId: string;
  destinationCountryId: string;
  destinationCityId: string;
  productName: string;
  productUrl: string;
  estimatedPriceAmount: number;
  estimatedPriceCurrency: string;
  sizeCategory: string;
  neededBy?: string;
}

export interface PricingQuote {
  total: number;
  breakdown: { baseFee: number; valueComponent: number; sizeComponent: number };
}

export const ordersApi = {
  async create(input: CreateOrderInput): Promise<Order> {
    return orderSchema.parse(await apiPost<Order>("/orders", input));
  },

  /** Cotización pública: misma fórmula que fija la ganancia al crear. */
  quote(price: number, size: string): Promise<PricingQuote> {
    return apiGet<PricingQuote>("/pricing/quote", { price, size });
  },

  async list(params: {
    limit: number;
    cursor?: string;
    status?: string;
  }): Promise<CursorPage<OrderListRow>> {
    const { data, meta } = await apiGetWithMeta<OrderListRow[]>("/orders", params);
    return {
      items: z.array(orderListRowSchema).parse(data),
      nextCursor: meta.nextCursor ?? null,
    };
  },

  async get(orderId: string): Promise<OrderDetail> {
    return orderDetailSchema.parse(await apiGet<OrderDetail>(`/orders/${orderId}`));
  },

  // acciones de negocio — la máquina de estados la valida el backend
  confirmPurchase(orderId: string): Promise<Order> {
    return apiPost(`/orders/${orderId}/confirm-purchase`);
  },
  confirmDelivery(orderId: string): Promise<Order> {
    return apiPost(`/orders/${orderId}/confirm-delivery`);
  },
  cancel(orderId: string): Promise<Order> {
    return apiPost(`/orders/${orderId}/cancel`);
  },
  rate(orderId: string, score: number, comment?: string): Promise<{ completed: boolean }> {
    return apiPost(`/orders/${orderId}/ratings`, { score, comment });
  },
  reportIssue(orderId: string, reason: string): Promise<{ id: string; status: string }> {
    return apiPost(`/orders/${orderId}/report-issue`, { reason });
  },
};
