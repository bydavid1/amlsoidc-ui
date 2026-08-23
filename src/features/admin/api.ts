"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { apiGet, apiPost, apiPut } from "@/lib/api/client";
import { ApiError } from "@/lib/api/types";

// ---------- schemas ----------

export const adminOrderSchema = z.object({
  id: z.string(),
  status: z.string(),
  flowType: z.string(),
  flowStep: z.string(),
  fulfillmentStatus: z.string().nullable(),
  productName: z.string(),
  buyerEmail: z.string(),
  travelerName: z.string().nullable().optional().default(null),
  travelerEmail: z.string().nullable().optional().default(null),
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

export const adminTimelineEntrySchema = z.object({
  fromState: z.string().nullable(),
  toState: z.string(),
  actor: z.string().nullable(),
  occurredAt: z.string(),
});
export type AdminTimelineEntry = z.infer<typeof adminTimelineEntrySchema>;

export const adminOrderDetailSchema = adminOrderSchema.extend({
  timeline: z.array(adminTimelineEntrySchema),
});
export type AdminOrderDetail = z.infer<typeof adminOrderDetailSchema>;

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
  travelerProfileId: z.string().nullable().optional().default(null),
  createdAt: z.string(),
});
export type AdminUser = z.infer<typeof adminUserSchema>;

export const userStatusAuditEntrySchema = z.object({
  id: z.string(),
  action: z.enum(["SUSPENDED", "REACTIVATED"]),
  reason: z.string().nullable(),
  changedByUserId: z.string(),
  createdAt: z.string(),
});
export type UserStatusAuditEntry = z.infer<typeof userStatusAuditEntrySchema>;

export const adminUserDetailSchema = adminUserSchema.extend({
  buyerProfileId: z.string().nullable().optional().default(null),
  statusHistory: z.array(userStatusAuditEntrySchema),
});
export type AdminUserDetail = z.infer<typeof adminUserDetailSchema>;

const identityDocumentTypeSchema = z.enum(["DUI", "PASSPORT", "DRIVER_LICENSE", "NATIONAL_ID"]);
export type IdentityDocumentType = z.infer<typeof identityDocumentTypeSchema>;

export const kycArtifactSchema = z.object({
  id: z.string(),
  caseId: z.string(),
  type: z.enum(["DOCUMENT_FRONT", "DOCUMENT_BACK", "SELFIE", "OTHER"]),
  storageKey: z.string(),
  mimeType: z.string(),
  sizeBytes: z.coerce.number(),
  checksumSha256: z.string().nullable(),
  uploadedAt: z.string(),
});
export type KycArtifact = z.infer<typeof kycArtifactSchema>;

export const kycDecisionSchema = z.object({
  id: z.string(),
  caseId: z.string(),
  decision: z.enum(["APPROVE", "REJECT", "REQUEST_RETRY"]),
  reason: z.string(),
  decidedByUserId: z.string(),
  decidedAt: z.string(),
});
export type KycDecision = z.infer<typeof kycDecisionSchema>;

export const kycCaseSchema = z.object({
  id: z.string(),
  travelerProfileId: z.string(),
  status: z.enum(["SUBMITTED", "IN_REVIEW", "APPROVED", "REJECTED", "RETRY_REQUESTED"]),
  documentCountryIso2: z.string(),
  documentType: identityDocumentTypeSchema,
  documentFingerprint: z.string(),
  submittedAt: z.string(),
  reviewedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
  travelerProfile: z.object({
    id: z.string(),
    user: z.object({
      id: z.string(),
      email: z.string(),
      firstName: z.string().nullable(),
    }),
  }),
  artifacts: z.array(kycArtifactSchema),
  manualDecisions: z.array(kycDecisionSchema),
});
export type KycCase = z.infer<typeof kycCaseSchema>;

export const blocklistEntrySchema = z.object({
  id: z.string(),
  documentCountryIso2: z.string(),
  documentType: identityDocumentTypeSchema,
  documentFingerprint: z.string(),
  reason: z.string(),
  blockedByUserId: z.string(),
  blockedAt: z.string(),
  unblockedByUserId: z.string().nullable(),
  unblockedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type BlocklistEntry = z.infer<typeof blocklistEntrySchema>;

export const travelerRiskProfileSchema = z.object({
  travelerProfileId: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    firstName: z.string().nullable(),
    phone: z.string().nullable(),
  }),
  reputationScore: z.coerce.number(),
  reputationCount: z.coerce.number(),
  assignmentsTotal: z.coerce.number(),
  incidentsTotal: z.coerce.number(),
  successRate: z.coerce.number().nullable(),
  trips: z.array(
    z.object({
      assignmentId: z.string(),
      orderId: z.string(),
      productName: z.string(),
      orderStatus: z.string(),
      claimedAt: z.string(),
    }),
  ),
  limitOverride: z
    .object({
      id: z.string(),
      travelerProfileId: z.string(),
      maxOrderValueAmount: z.coerce.number(),
      currency: z.string(),
      reason: z.string(),
      changedByUserId: z.string(),
      createdAt: z.string(),
      updatedAt: z.string(),
    })
    .nullable(),
  limitAuditLogs: z.array(
    z.object({
      id: z.string(),
      travelerProfileId: z.string(),
      action: z.enum(["CREATED", "UPDATED", "REMOVED"]),
      fromAmount: z.coerce.number().nullable(),
      toAmount: z.coerce.number().nullable(),
      currency: z.string(),
      reason: z.string(),
      changedByUserId: z.string(),
      createdAt: z.string(),
    }),
  ),
});
export type TravelerRiskProfile = z.infer<typeof travelerRiskProfileSchema>;

export const artifactViewUrlSchema = z.object({
  url: z.string(),
  expiresAt: z.string(),
});
export type ArtifactViewUrl = z.infer<typeof artifactViewUrlSchema>;

export const activeFlowSettingSchema = z.object({
  activeFlowType: z.enum([
    "TRAVELER_PURCHASES_PRODUCT",
    "BRINGO_PURCHASES_DIRECT_DELIVERY",
    "BRINGO_PURCHASES_HUB_DELIVERY",
  ]),
});
export type ActiveFlowSetting = z.infer<typeof activeFlowSettingSchema>;

export const adminOrdersSummarySchema = z.object({
  byFlow: z.array(z.object({ flowType: z.string(), count: z.coerce.number() })),
  byStep: z.array(z.object({ step: z.string(), count: z.coerce.number() })),
  pendingActionCount: z.coerce.number(),
});
export type AdminOrdersSummary = z.infer<typeof adminOrdersSummarySchema>;

export const adminModerationSummarySchema = z.object({
  kycPendingCount: z.coerce.number(),
  blockedDocumentsCount: z.coerce.number(),
  travelersWithLimitOverrideCount: z.coerce.number(),
  suspendedUsersCount: z.coerce.number(),
});
export type AdminModerationSummary = z.infer<typeof adminModerationSummarySchema>;

// ---------- queries ----------

export function useAdminOrdersSummary(enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "dashboard", "orders-summary"],
    queryFn: async () =>
      adminOrdersSummarySchema.parse(await apiGet("/admin/dashboard/orders-summary")),
    enabled,
    refetchInterval: 30_000,
  });
}

export function useAdminModerationSummary(enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "dashboard", "moderation-summary"],
    queryFn: async () =>
      adminModerationSummarySchema.parse(await apiGet("/admin/dashboard/moderation-summary")),
    enabled,
    refetchInterval: 30_000,
  });
}

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

export function useAdminOrder(orderId: string) {
  return useQuery({
    queryKey: ["admin", "orders", "detail", orderId],
    queryFn: async () => {
      try {
        return adminOrderDetailSchema.parse(await apiGet(`/admin/orders/${orderId}`));
      } catch (error) {
        // Compatibilidad: si el backend aún no expone /admin/orders/:id,
        // usamos el listado para mostrar al menos el detalle operativo básico.
        if (error instanceof ApiError && error.status === 404) {
          const rows = z
            .array(adminOrderSchema)
            .parse(await apiGet("/admin/orders", { limit: 200 }));
          const row = rows.find((candidate) => candidate.id === orderId);
          if (row) {
            return { ...row, timeline: [] };
          }
        }
        throw error;
      }
    },
    enabled: Boolean(orderId),
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

export function useAdminUsers(
  q: string,
  document?: { countryIso2?: string; type?: IdentityDocumentType; number?: string },
) {
  return useQuery({
    queryKey: ["admin", "users", q, document],
    queryFn: async () =>
      z
        .array(adminUserSchema)
        .parse(
          await apiGet("/admin/users", { limit: 50, ...(q ? { q } : {}), ...(document ?? {}) }),
        ),
  });
}

export function useAdminUser(userId: string | null) {
  return useQuery({
    queryKey: ["admin", "users", "detail", userId],
    queryFn: async () => adminUserDetailSchema.parse(await apiGet(`/admin/users/${userId}`)),
    enabled: Boolean(userId),
  });
}

export function useActiveFlowSetting() {
  return useQuery({
    queryKey: ["admin", "settings", "fulfillment-flow"],
    queryFn: async () =>
      activeFlowSettingSchema.parse(await apiGet("/admin/settings/fulfillment-flow")),
  });
}

export function useKycCases() {
  return useQuery({
    queryKey: ["admin", "kyc", "cases"],
    queryFn: async () =>
      z.array(kycCaseSchema).parse(await apiGet("/admin/kyc/cases", { limit: 50 })),
    refetchInterval: 30_000,
  });
}

export function useKycCase(caseId: string | null) {
  return useQuery({
    queryKey: ["admin", "kyc", "cases", caseId],
    queryFn: async () => kycCaseSchema.parse(await apiGet(`/admin/kyc/cases/${caseId}`)),
    enabled: Boolean(caseId),
  });
}

/** Link firmado y temporal para ver un documento/selfie; se refresca antes de expirar mientras esté visible. */
export function useKycArtifactViewUrl(caseId: string, artifactId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "kyc", "cases", caseId, "artifacts", artifactId, "view-url"],
    queryFn: async () =>
      artifactViewUrlSchema.parse(
        await apiGet(`/admin/kyc/cases/${caseId}/artifacts/${artifactId}/view-url`),
      ),
    enabled,
    staleTime: 0,
    gcTime: 0,
    refetchInterval: enabled ? 240_000 : false,
  });
}

export function useBlocklist(params: {
  countryIso2?: string;
  type?: IdentityDocumentType;
  number?: string;
}) {
  return useQuery({
    queryKey: ["admin", "identity", "blocklist", params],
    queryFn: async () =>
      z
        .array(blocklistEntrySchema)
        .parse(await apiGet("/admin/identity/blocklist", { limit: 50, ...params })),
  });
}

export function useTravelerRiskProfile(travelerProfileId: string | null) {
  return useQuery({
    queryKey: ["admin", "travelers", travelerProfileId, "risk-profile"],
    queryFn: async () =>
      travelerRiskProfileSchema.parse(
        await apiGet(`/admin/travelers/${travelerProfileId}/risk-profile`),
      ),
    enabled: Boolean(travelerProfileId),
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
  (vars: { userId: string; reason: string }) =>
    apiPost(`/admin/users/${vars.userId}/suspend`, { reason: vars.reason }),
  "Usuario suspendido.",
  [["admin", "users"]],
);

export const useReactivateUser = adminMutation(
  (vars: { userId: string; reason?: string }) =>
    apiPost(`/admin/users/${vars.userId}/reactivate`, { reason: vars.reason }),
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

export const useSetActiveFlowSetting = adminMutation(
  (vars: {
    activeFlowType:
      | "TRAVELER_PURCHASES_PRODUCT"
      | "BRINGO_PURCHASES_DIRECT_DELIVERY"
      | "BRINGO_PURCHASES_HUB_DELIVERY";
    reason?: string;
  }) => apiPost("/admin/settings/fulfillment-flow", vars),
  "Flujo activo actualizado para nuevas órdenes.",
  [["admin", "settings", "fulfillment-flow"], ["admin", "orders", "ALL"]],
);

export const useRegisterProcurement = adminMutation(
  (orderId: string) => apiPost(`/admin/orders/${orderId}/register-procurement`),
  "Compra registrada para la orden.",
  [["admin", "orders", "ALL"]],
);

export const useRegisterTracking = adminMutation(
  (vars: { orderId: string; trackingNumber: string }) =>
    apiPost(`/admin/orders/${vars.orderId}/register-tracking`, {
      trackingNumber: vars.trackingNumber,
    }),
  "Tracking registrado.",
  [["admin", "orders", "ALL"]],
);

export const useDispatchToBuyer = adminMutation(
  (orderId: string) => apiPost(`/admin/orders/${orderId}/dispatch-to-buyer`),
  "Despacho al comprador registrado.",
  [["admin", "orders", "ALL"]],
);

export const useDecideKycCase = adminMutation(
  (vars: { caseId: string; decision: "APPROVE" | "REJECT" | "REQUEST_RETRY"; reason: string }) =>
    apiPost(`/admin/kyc/cases/${vars.caseId}/decision`, {
      decision: vars.decision,
      reason: vars.reason,
    }),
  "Decisión KYC registrada.",
  [["admin", "kyc"]],
);

export const useBlockDocument = adminMutation(
  (vars: {
    document: { countryIso2: string; type: IdentityDocumentType; number: string };
    reason: string;
  }) => apiPost("/admin/identity/blocklist", vars),
  "Documento bloqueado.",
  [["admin", "identity", "blocklist"]],
);

export const useUnblockDocument = adminMutation(
  (id: string) => apiPost(`/admin/identity/blocklist/${id}/unblock`),
  "Documento desbloqueado.",
  [["admin", "identity", "blocklist"]],
);

export const useSetTeamRoles = adminMutation(
  (vars: { userId: string; roles: string[] }) =>
    apiPut(`/admin/users/${vars.userId}/roles`, { roles: vars.roles }),
  "Roles actualizados.",
  [["admin", "users"]],
);

export const useAdjustTravelerLimit = adminMutation(
  (vars: { travelerProfileId: string; maxOrderValueAmount: number; currency: string; reason: string }) =>
    apiPost(`/admin/travelers/${vars.travelerProfileId}/limit-override`, {
      maxOrderValueAmount: vars.maxOrderValueAmount,
      currency: vars.currency,
      reason: vars.reason,
    }),
  "Límite del viajero actualizado.",
  [["admin", "travelers"], ["admin", "users"]],
);
