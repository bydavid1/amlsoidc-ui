"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { apiGet, apiPost } from "@/lib/api/client";

// ---------- schemas ----------

export const adminOrderSchema = z.object({
  id: z.string(),
  status: z.string(),
  fulfillmentStatus: z.string().nullable(),
  productName: z.string(),
  buyerEmail: z.string(),
  originCountryId: z.string(),
  destinationCountryId: z.string(),
  createdAt: z.string(),
  sizeCategory: z.string(),
  estimatedPriceAmount: z.coerce.number(),
  travelerRewardAmount: z.coerce.number(),
  platformFeeAmount: z.coerce.number(),
  buyerTotalAmount: z.coerce.number(),
});
export type AdminOrder = z.infer<typeof adminOrderSchema>;

export const payoutSchema = z.object({
  paymentId: z.string(),
  orderId: z.string(),
  productName: z.string(),
  travelerFirstName: z.string().nullable(),
  travelerPhone: z.string().nullable(),
  rewardAmount: z.coerce.number(),
  payoutStatus: z.enum(["NOT_DUE", "DUE", "PAID_OUT"]),
  paidAt: z.string().nullable(),
  payoutAt: z.string().nullable(),
});
export type Payout = z.infer<typeof payoutSchema>;

export const refundSchema = z.object({
  paymentId: z.string(),
  orderId: z.string(),
  amount: z.coerce.number(),
  currency: z.string(),
});
export type Refund = z.infer<typeof refundSchema>;

export const disputeSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  status: z.enum(["OPEN", "UNDER_REVIEW", "RESOLVED", "REJECTED"]),
  reason: z.string(),
  createdAt: z.string(),
});
export type Dispute = z.infer<typeof disputeSchema>;

export const adminUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string().nullable(),
  phone: z.string().nullable(),
  roles: z.array(z.string()),
  status: z.enum(["ACTIVE", "SUSPENDED"]),
  createdAt: z.string(),
});
export type AdminUser = z.infer<typeof adminUserSchema>;

// ---------- queries ----------

export function useAdminOrders(status?: string) {
  return useQuery({
    queryKey: ["admin", "orders", status ?? "ALL"],
    queryFn: async () =>
      z
        .array(adminOrderSchema)
        .parse(await apiGet("/admin/orders", { limit: 50, ...(status ? { status } : {}) })),
    refetchInterval: 30_000,
  });
}

export function usePayouts(status?: "DUE" | "PAID_OUT") {
  return useQuery({
    queryKey: ["admin", "payouts", status ?? "ALL"],
    queryFn: async () =>
      z
        .array(payoutSchema)
        .parse(await apiGet("/admin/payouts", { limit: 50, ...(status ? { status } : {}) })),
    refetchInterval: 30_000,
  });
}

export function useRefunds() {
  return useQuery({
    queryKey: ["admin", "refunds"],
    queryFn: async () => z.array(refundSchema).parse(await apiGet("/admin/refunds", { limit: 50 })),
    refetchInterval: 30_000,
  });
}

export function useDisputes(status?: string) {
  return useQuery({
    queryKey: ["admin", "disputes", status ?? "ALL"],
    queryFn: async () =>
      z
        .array(disputeSchema)
        .parse(await apiGet("/admin/disputes", { limit: 50, ...(status ? { status } : {}) })),
    refetchInterval: 30_000,
  });
}

export function useAdminUsers(q: string) {
  return useQuery({
    queryKey: ["admin", "users", q],
    queryFn: async () =>
      z
        .array(adminUserSchema)
        .parse(await apiGet("/admin/users", { limit: 50, ...(q ? { q } : {}) })),
  });
}

// ---------- mutations ----------

function adminMutation<TVars>(
  fn: (vars: TVars) => Promise<unknown>,
  successMessage: string,
  invalidate: string[][],
) {
  return function useAdminMutation() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: fn,
      onSuccess: () => {
        toast.success(successMessage);
        for (const key of invalidate) {
          void queryClient.invalidateQueries({ queryKey: key });
        }
      },
      onError: () => toast.error("No pudimos completar la acción."),
    });
  };
}

export const useConfirmHubReception = adminMutation(
  (vars: { orderId: string; travelerScore?: number; note?: string }) =>
    apiPost(`/admin/orders/${vars.orderId}/confirm-hub-reception`, {
      travelerScore: vars.travelerScore,
      note: vars.note,
    }),
  "Recepción en hub confirmada. El payout del viajero quedó liberado.",
  [["admin"]],
);

export const useMarkPayoutPaid = adminMutation(
  (paymentId: string) => apiPost(`/admin/payouts/${paymentId}/mark-paid`),
  "Payout marcado como pagado.",
  [["admin", "payouts"]],
);

export const useMarkRefunded = adminMutation(
  (paymentId: string) => apiPost(`/admin/payments/${paymentId}/mark-refunded`),
  "Reembolso marcado como ejecutado.",
  [["admin", "refunds"]],
);

export const useResolveDispute = adminMutation(
  (vars: { disputeId: string; resolution: "RESOLVED" | "REJECTED"; orderOutcome: "CANCEL_ORDER" | "RESUME_ORDER" }) =>
    apiPost(`/admin/disputes/${vars.disputeId}/resolve`, {
      resolution: vars.resolution,
      orderOutcome: vars.orderOutcome,
    }),
  "Disputa resuelta.",
  [["admin"]],
);

export const useSuspendUser = adminMutation(
  (userId: string) => apiPost(`/admin/users/${userId}/suspend`),
  "Usuario suspendido.",
  [["admin", "users"]],
);

export const useReactivateUser = adminMutation(
  (userId: string) => apiPost(`/admin/users/${userId}/reactivate`),
  "Usuario reactivado.",
  [["admin", "users"]],
);

export const useCreateRecommended = adminMutation(
  (vars: {
    name: string;
    productUrl: string;
    estimatedPriceAmount: number;
    sizeCategory: string;
    originCountryId: string;
  }) => apiPost("/admin/recommended-products", vars),
  "Producto publicado en la curaduría.",
  [["catalog"]],
);

export const useDeactivateRecommended = adminMutation(
  (id: string) => apiPost(`/admin/recommended-products/${id}/deactivate`),
  "Producto retirado de la curaduría.",
  [["catalog"]],
);
