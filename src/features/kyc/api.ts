"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { apiGet, apiPost } from "@/lib/api/client";
import { ApiError } from "@/lib/api/types";

export const IDENTITY_DOCUMENT_TYPES = ["DUI", "PASSPORT", "DRIVER_LICENSE", "NATIONAL_ID"] as const;
const identityDocumentTypeSchema = z.enum(IDENTITY_DOCUMENT_TYPES);
export type IdentityDocumentType = z.infer<typeof identityDocumentTypeSchema>;

export const DOCUMENT_TYPE_OPTIONS: { value: IdentityDocumentType; label: string }[] = [
  { value: "DUI", label: "DUI" },
  { value: "PASSPORT", label: "Pasaporte" },
  { value: "DRIVER_LICENSE", label: "Licencia de conducir" },
  { value: "NATIONAL_ID", label: "Documento nacional" },
];

const kycArtifactSchema = z.object({
  id: z.string(),
  type: z.enum(["DOCUMENT_FRONT", "DOCUMENT_BACK", "SELFIE", "OTHER"]),
  mimeType: z.string(),
  sizeBytes: z.coerce.number(),
  uploadedAt: z.string(),
});

const kycDecisionSchema = z.object({
  id: z.string(),
  decision: z.enum(["APPROVE", "REJECT", "REQUEST_RETRY"]),
  reason: z.string(),
  decidedAt: z.string(),
});

export const myKycCaseSchema = z.object({
  id: z.string(),
  status: z.enum(["SUBMITTED", "IN_REVIEW", "APPROVED", "REJECTED", "RETRY_REQUESTED"]),
  documentCountryIso2: z.string(),
  documentType: identityDocumentTypeSchema,
  submittedAt: z.string(),
  reviewedAt: z.string().nullable(),
  artifacts: z.array(kycArtifactSchema),
  manualDecisions: z.array(kycDecisionSchema),
});
export type MyKycCase = z.infer<typeof myKycCaseSchema>;

const ACTIVE_STATUSES = new Set(["SUBMITTED", "IN_REVIEW", "RETRY_REQUESTED"]);

/** Mientras el caso siga activo, refresca solo para reflejar la decisión del admin apenas llegue. */
export function useMyKycCase() {
  return useQuery({
    queryKey: ["kyc", "me"],
    queryFn: async () => {
      const data = await apiGet<unknown>("/kyc/traveler/cases/me");
      return data ? myKycCaseSchema.parse(data) : null;
    },
    refetchInterval: (query) =>
      query.state.data && ACTIVE_STATUSES.has(query.state.data.status) ? 15_000 : false,
  });
}

export interface SubmitKycArtifact {
  type: "DOCUMENT_FRONT" | "SELFIE";
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  checksumSha256: string;
}

export function useSubmitKycCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      document: { countryIso2: string; type: IdentityDocumentType; number: string };
      artifacts: SubmitKycArtifact[];
    }) => apiPost("/kyc/traveler/cases", vars),
    onSuccess: () => {
      toast.success("Verificación enviada. Te avisamos cuando la revisemos.");
      void queryClient.invalidateQueries({ queryKey: ["kyc", "me"] });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === "ACTIVE_KYC_CASE_EXISTS") {
        toast.error("Ya tenés una verificación en curso.");
        void queryClient.invalidateQueries({ queryKey: ["kyc", "me"] });
        return;
      }
      toast.error("No pudimos enviar tu verificación.");
    },
  });
}
