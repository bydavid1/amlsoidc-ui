"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { BadgeCheck, Clock, RotateCcw, XCircle } from "lucide-react";
import { useState } from "react";
import { SupportButton } from "@/components/layout/support-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DOCUMENT_TYPE_OPTIONS,
  IdentityDocumentType,
  useMyKycCase,
  useSubmitKycCase,
} from "@/features/kyc/api";
import { UploadedFile } from "@/features/uploads/api";
import { DocumentUploadField } from "./document-upload-field";

function StatusBanner({
  icon: Icon,
  tone,
  title,
  description,
}: {
  icon: typeof Clock;
  tone: "progress" | "success" | "danger";
  title: string;
  description: string;
}) {
  const toneClass = {
    progress: "border-primary/25 bg-primary/5 text-primary",
    success: "border-semantic-up/25 bg-semantic-up/5 text-semantic-up",
    danger: "border-semantic-down/25 bg-semantic-down/5 text-semantic-down",
  }[tone];

  return (
    <Card className={`rounded-[24px] shadow-none ${toneClass}`}>
      <CardContent className="flex items-start gap-4 px-8 py-6">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-background">
          <Icon className="size-5" />
        </span>
        <div>
          <p className="title-md text-ink">{title}</p>
          <p className="body-sm text-body-text">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function SubmissionForm({ afterRejection }: { afterRejection: boolean }) {
  const [countryIso2, setCountryIso2] = useState("");
  const [type, setType] = useState<IdentityDocumentType | "">("");
  const [number, setNumber] = useState("");
  const [documentFront, setDocumentFront] = useState<UploadedFile | null>(null);
  const [selfie, setSelfie] = useState<UploadedFile | null>(null);
  const submit = useSubmitKycCase();

  const canSubmit =
    countryIso2.trim().length === 2 &&
    type !== "" &&
    number.trim().length >= 3 &&
    documentFront !== null &&
    selfie !== null;

  return (
    <Card className="rounded-[24px] border-hairline shadow-none">
      <CardContent className="space-y-6 p-8">
        <div>
          <h2 className="title-md text-ink">
            {afterRejection ? "Enviar de nuevo tu verificación" : "Verificá tu identidad"}
          </h2>
          <p className="body-sm text-body-text">
            Necesitamos tu documento y una selfie para que puedas aceptar tu primer encargo.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="kyc-country">País del documento (ISO-2)</Label>
            <Input
              id="kyc-country"
              value={countryIso2}
              onChange={(e) => setCountryIso2(e.target.value.toUpperCase().slice(0, 2))}
              placeholder="SV"
              maxLength={2}
              className="h-11 rounded-full uppercase"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="kyc-type">Tipo de documento</Label>
            <Select value={type} onValueChange={(v) => setType(v as IdentityDocumentType)}>
              <SelectTrigger id="kyc-type" className="h-11 w-full rounded-full">
                <SelectValue placeholder="Elegí un tipo" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="kyc-number">Número de documento</Label>
          <Input
            id="kyc-number"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="Número tal como aparece en el documento"
            className="h-11 rounded-full"
          />
        </div>

        <DocumentUploadField
          label="Foto del documento"
          hint="El frente, que se lea bien el número."
          capture="environment"
          value={documentFront}
          onChange={setDocumentFront}
        />

        <DocumentUploadField
          label="Selfie"
          hint="Una foto tuya, con buena luz, mirando a la cámara."
          capture="user"
          value={selfie}
          onChange={setSelfie}
        />

        <Button
          className="h-12 w-full rounded-full font-semibold"
          disabled={!canSubmit || submit.isPending}
          onClick={() => {
            if (!documentFront || !selfie || type === "") return;
            submit.mutate({
              document: { countryIso2, type, number: number.trim() },
              artifacts: [
                {
                  type: "DOCUMENT_FRONT",
                  storageKey: documentFront.storageKey,
                  mimeType: documentFront.mimeType,
                  sizeBytes: documentFront.sizeBytes,
                  checksumSha256: documentFront.checksumSha256,
                },
                {
                  type: "SELFIE",
                  storageKey: selfie.storageKey,
                  mimeType: selfie.mimeType,
                  sizeBytes: selfie.sizeBytes,
                  checksumSha256: selfie.checksumSha256,
                },
              ],
            });
          }}
        >
          {submit.isPending ? "Enviando…" : "Enviar verificación"}
        </Button>
      </CardContent>
    </Card>
  );
}

export function KycVerification() {
  const query = useMyKycCase();

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64 rounded-full" />
        <Skeleton className="h-40 w-full rounded-[24px]" />
      </div>
    );
  }

  const kycCase = query.data ?? null;
  const lastDecision = kycCase?.manualDecisions[0] ?? null;

  return (
    <div className="space-y-6">
      <h1 className="display-sm text-ink">Verificación de identidad</h1>

      {kycCase?.status === "SUBMITTED" || kycCase?.status === "IN_REVIEW" ? (
        <StatusBanner
          icon={Clock}
          tone="progress"
          title="Tu verificación ya está en revisión"
          description={`La enviaste el ${format(new Date(kycCase.submittedAt), "d 'de' MMMM", { locale: es })}. Te avisamos apenas la revisemos — normalmente toma poco.`}
        />
      ) : kycCase?.status === "APPROVED" ? (
        <StatusBanner
          icon={BadgeCheck}
          tone="success"
          title="¡Verificación aprobada!"
          description="Ya podés aceptar encargos sin restricciones."
        />
      ) : kycCase?.status === "RETRY_REQUESTED" ? (
        <div className="space-y-4">
          <StatusBanner
            icon={RotateCcw}
            tone="danger"
            title="Te pedimos que envíes tu verificación de nuevo"
            description={lastDecision?.reason ?? "Necesitamos que vuelvas a enviar tu documento."}
          />
          <div className="flex items-center justify-between rounded-2xl border border-hairline bg-surface-soft px-6 py-4">
            <p className="body-sm text-body-text">
              Por ahora no podés reenviarla vos mismo desde acá — escribinos y te ayudamos.
            </p>
            <SupportButton context="reintento de verificación de identidad" />
          </div>
        </div>
      ) : (
        <>
          {kycCase?.status === "REJECTED" && (
            <StatusBanner
              icon={XCircle}
              tone="danger"
              title="Tu verificación fue rechazada"
              description={lastDecision?.reason ?? "Podés enviarla de nuevo con datos correctos."}
            />
          )}
          <SubmissionForm afterRejection={kycCase?.status === "REJECTED"} />
        </>
      )}
    </div>
  );
}
