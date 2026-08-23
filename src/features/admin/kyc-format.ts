import { IdentityDocumentType } from "@/features/admin/api";

export const DOCUMENT_TYPE_OPTIONS: { value: IdentityDocumentType; label: string }[] = [
  { value: "DUI", label: "DUI" },
  { value: "PASSPORT", label: "Pasaporte" },
  { value: "DRIVER_LICENSE", label: "Licencia de conducir" },
  { value: "NATIONAL_ID", label: "Documento nacional" },
];

export function documentTypeLabel(type: IdentityDocumentType): string {
  return DOCUMENT_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}

const KYC_STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "Enviado",
  IN_REVIEW: "En revisión",
  RETRY_REQUESTED: "Reintento solicitado",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
};

export function kycStatusLabel(status: string): string {
  return KYC_STATUS_LABELS[status] ?? status;
}

const KYC_STATUS_TONE: Record<string, string> = {
  SUBMITTED: "text-body-text",
  IN_REVIEW: "text-primary",
  RETRY_REQUESTED: "text-accent-yellow",
  APPROVED: "text-semantic-up",
  REJECTED: "text-semantic-down",
};

export function kycStatusToneClass(status: string): string {
  return KYC_STATUS_TONE[status] ?? "text-body-text";
}

const KYC_DECISION_LABELS: Record<string, string> = {
  APPROVE: "Aprobado",
  REJECT: "Rechazado",
  REQUEST_RETRY: "Reintento solicitado",
};

export function kycDecisionLabel(decision: string): string {
  return KYC_DECISION_LABELS[decision] ?? decision;
}

const ARTIFACT_TYPE_LABELS: Record<string, string> = {
  DOCUMENT_FRONT: "Documento (frente)",
  DOCUMENT_BACK: "Documento (reverso)",
  SELFIE: "Selfie",
  OTHER: "Otro",
};

export function artifactTypeLabel(type: string): string {
  return ARTIFACT_TYPE_LABELS[type] ?? type;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function shortId(id: string): string {
  return id.slice(0, 8);
}
