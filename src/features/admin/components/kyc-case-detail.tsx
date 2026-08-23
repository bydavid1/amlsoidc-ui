"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useDecideKycCase, useKycArtifactViewUrl, useKycCase } from "@/features/admin/api";
import {
  artifactTypeLabel,
  documentTypeLabel,
  formatBytes,
  kycDecisionLabel,
  kycStatusLabel,
  kycStatusToneClass,
} from "@/features/admin/kyc-format";
import { cn } from "@/lib/utils";

const ACTIVE_STATUSES = ["SUBMITTED", "IN_REVIEW", "RETRY_REQUESTED"];

function DecisionDialog({
  caseId,
  decision,
  label,
  triggerVariant,
}: {
  caseId: string;
  decision: "APPROVE" | "REJECT" | "REQUEST_RETRY";
  label: string;
  triggerVariant: "default" | "destructive" | "secondary";
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const decide = useDecideKycCase();

  const trimmed = reason.trim();
  const disabled = decide.isPending || trimmed.length < 5 || trimmed.length > 500;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setReason("");
      }}
    >
      <DialogTrigger asChild>
        <Button variant={triggerVariant} className="h-11 rounded-full px-5 font-semibold">
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-[24px] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="title-lg text-ink">{label}</DialogTitle>
          <DialogDescription className="body-md text-body-text">
            El motivo es obligatorio (5 a 500 caracteres) y queda registrado en el expediente.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Motivo de la decisión…"
            className="min-h-28 rounded-2xl"
            maxLength={500}
          />
          <p className="caption text-muted-foreground">{trimmed.length}/500</p>
        </div>
        <DialogFooter>
          <Button
            variant={triggerVariant}
            className="h-11 rounded-full px-5 font-semibold"
            disabled={disabled}
            onClick={() =>
              decide.mutate(
                { caseId, decision, reason: trimmed },
                { onSuccess: () => setOpen(false) },
              )
            }
          >
            {decide.isPending ? "Guardando…" : `Confirmar: ${label.toLowerCase()}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ArtifactCard({
  caseId,
  artifact,
}: {
  caseId: string;
  artifact: {
    id: string;
    type: string;
    mimeType: string;
    sizeBytes: number;
    storageKey: string;
  };
}) {
  const [show, setShow] = useState(false);
  const viewUrl = useKycArtifactViewUrl(caseId, artifact.id, show);

  return (
    <div className="space-y-2 rounded-2xl border border-hairline bg-surface-soft p-4">
      <div className="flex items-center gap-2">
        <FileText className="size-4 text-primary" />
        <p className="body-sm font-semibold text-ink">{artifactTypeLabel(artifact.type)}</p>
      </div>
      <p className="caption text-body-text">{artifact.mimeType}</p>
      <p className="caption text-body-text">{formatBytes(artifact.sizeBytes)}</p>

      {show ? (
        viewUrl.isLoading ? (
          <Skeleton className="h-40 w-full rounded-xl" />
        ) : viewUrl.isError || !viewUrl.data ? (
          <p className="body-sm text-semantic-down">No pudimos cargar la imagen.</p>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- link firmado de corta vida, no sirve como asset de next/image
          <img
            src={viewUrl.data.url}
            alt={artifactTypeLabel(artifact.type)}
            className="max-h-64 w-full rounded-xl border border-hairline object-contain"
          />
        )
      ) : (
        <Button
          size="sm"
          variant="secondary"
          className="rounded-full"
          onClick={() => setShow(true)}
        >
          Ver imagen
        </Button>
      )}
    </div>
  );
}

export function KycCaseDetail({ caseId }: { caseId: string }) {
  const query = useKycCase(caseId);
  const kycCase = query.data;

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64 rounded-full" />
        <Skeleton className="h-32 w-full rounded-[24px]" />
        <Skeleton className="h-80 w-full rounded-[24px]" />
      </div>
    );
  }

  if (query.isError || !kycCase) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="body-md text-semantic-down">No encontramos este expediente.</p>
        <Button asChild variant="secondary" className="rounded-full">
          <Link href="/admin/kyc">Volver a la cola</Link>
        </Button>
      </div>
    );
  }

  const canDecide = ACTIVE_STATUSES.includes(kycCase.status);
  const traveler = kycCase.travelerProfile.user;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Link
          href="/admin/kyc"
          className="inline-flex items-center gap-1 body-sm font-medium text-body-text hover:text-ink"
        >
          <ArrowLeft className="size-4" /> Cola de revisión KYC
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="display-sm text-ink">
            {traveler.firstName ?? traveler.email}
          </h1>
          <Badge
            className={cn(
              "rounded-full bg-surface-strong caption-strong uppercase tracking-wide",
              kycStatusToneClass(kycCase.status),
            )}
          >
            {kycStatusLabel(kycCase.status)}
          </Badge>
        </div>

        <p className="body-sm text-body-text">
          {traveler.email} ·{" "}
          <Link
            href={`/admin/viajeros/${kycCase.travelerProfileId}`}
            className="font-medium text-primary"
          >
            Ver perfil de riesgo del viajero
          </Link>
        </p>
      </div>

      {canDecide && (
        <Card className="rounded-[24px] border-hairline shadow-none">
          <CardContent className="space-y-4 p-8">
            <h2 className="title-md text-ink">Decisión</h2>
            <Separator className="bg-hairline-soft" />
            <div className="flex flex-wrap items-center gap-3">
              <DecisionDialog
                caseId={kycCase.id}
                decision="APPROVE"
                label="Aprobar"
                triggerVariant="default"
              />
              <DecisionDialog
                caseId={kycCase.id}
                decision="REJECT"
                label="Rechazar"
                triggerVariant="destructive"
              />
              <DecisionDialog
                caseId={kycCase.id}
                decision="REQUEST_RETRY"
                label="Pedir reintento"
                triggerVariant="secondary"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-[24px] border-hairline shadow-none">
          <CardContent className="space-y-4 p-8">
            <h2 className="title-md text-ink">Documento</h2>
            <Separator className="bg-hairline-soft" />
            <dl className="space-y-3">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="body-sm text-body-text">País</dt>
                <dd className="body-sm font-semibold text-ink">{kycCase.documentCountryIso2}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="body-sm text-body-text">Tipo</dt>
                <dd className="body-sm font-semibold text-ink">
                  {documentTypeLabel(kycCase.documentType)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="body-sm text-body-text">Huella del documento</dt>
                <dd className="number-display !text-[12px] max-w-[220px] truncate text-ink">
                  {kycCase.documentFingerprint}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="body-sm text-body-text">Enviado</dt>
                <dd className="body-sm font-semibold text-ink">
                  {format(new Date(kycCase.submittedAt), "d MMM yyyy, h:mm a", { locale: es })}
                </dd>
              </div>
              {kycCase.reviewedAt && (
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="body-sm text-body-text">Última revisión</dt>
                  <dd className="body-sm font-semibold text-ink">
                    {format(new Date(kycCase.reviewedAt), "d MMM yyyy, h:mm a", { locale: es })}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border-hairline shadow-none">
          <CardContent className="space-y-4 p-8">
            <h2 className="title-md text-ink">Historial de decisiones</h2>
            <Separator className="bg-hairline-soft" />
            {kycCase.manualDecisions.length === 0 ? (
              <p className="body-sm text-body-text">Sin decisiones registradas todavía.</p>
            ) : (
              <ul className="space-y-4">
                {kycCase.manualDecisions.map((decision) => (
                  <li key={decision.id} className="space-y-1">
                    <p className="body-sm font-medium text-ink">
                      {kycDecisionLabel(decision.decision)}
                    </p>
                    <p className="body-sm text-body-text">“{decision.reason}”</p>
                    <p className="caption text-muted-foreground">
                      {format(new Date(decision.decidedAt), "d MMM yyyy, h:mm a", { locale: es })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[24px] border-hairline shadow-none">
        <CardContent className="space-y-4 p-8">
          <h2 className="title-md text-ink">Documento y selfie</h2>
          <Separator className="bg-hairline-soft" />
          {kycCase.artifacts.length === 0 ? (
            <p className="body-sm text-body-text">Sin archivos adjuntos.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {kycCase.artifacts.map((artifact) => (
                <ArtifactCard key={artifact.id} caseId={kycCase.id} artifact={artifact} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
