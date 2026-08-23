"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, ArrowRight, Gauge } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAdjustTravelerLimit, useTravelerRiskProfile } from "@/features/admin/api";
import { shortId } from "@/features/admin/kyc-format";

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface-soft p-4">
      <p className="caption text-body-text">{label}</p>
      <p className="number-display !text-[22px] text-ink">{value}</p>
    </div>
  );
}

function AdjustLimitDialog({
  travelerProfileId,
  currentAmount,
  currentCurrency,
}: {
  travelerProfileId: string;
  currentAmount: number | null;
  currentCurrency: string;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(currentAmount?.toString() ?? "");
  const [currency, setCurrency] = useState(currentCurrency);
  const [reason, setReason] = useState("");
  const adjust = useAdjustTravelerLimit();

  const parsedAmount = Number(amount);
  const trimmedReason = reason.trim();
  const disabled =
    adjust.isPending ||
    !Number.isFinite(parsedAmount) ||
    parsedAmount < 0 ||
    !/^[A-Za-z]{3}$/.test(currency) ||
    trimmedReason.length < 5 ||
    trimmedReason.length > 500;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setReason("");
      }}
    >
      <DialogTrigger asChild>
        <Button className="h-11 rounded-full px-5 font-semibold">Ajustar límite</Button>
      </DialogTrigger>
      <DialogContent className="rounded-[24px] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="title-lg text-ink">Ajustar límite manual</DialogTitle>
          <DialogDescription className="body-md text-body-text">
            Reemplaza el límite de valor máximo de pedido para este viajero. El motivo es
            obligatorio.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="limit-amount">Monto máximo</Label>
              <Input
                id="limit-amount"
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="h-11 rounded-full"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="limit-currency">Moneda</Label>
              <Input
                id="limit-currency"
                value={currency}
                onChange={(event) => setCurrency(event.target.value.toUpperCase().slice(0, 3))}
                maxLength={3}
                className="h-11 w-24 rounded-full uppercase"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="limit-reason">Motivo</Label>
            <Textarea
              id="limit-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Motivo del ajuste…"
              className="min-h-24 rounded-2xl"
              maxLength={500}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            className="h-11 rounded-full px-5 font-semibold"
            disabled={disabled}
            onClick={() =>
              adjust.mutate(
                {
                  travelerProfileId,
                  maxOrderValueAmount: parsedAmount,
                  currency,
                  reason: trimmedReason,
                },
                { onSuccess: () => setOpen(false) },
              )
            }
          >
            {adjust.isPending ? "Guardando…" : "Confirmar ajuste"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TravelerRiskProfile({ travelerProfileId }: { travelerProfileId: string }) {
  const query = useTravelerRiskProfile(travelerProfileId);
  const profile = query.data;

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64 rounded-full" />
        <Skeleton className="h-32 w-full rounded-[24px]" />
        <Skeleton className="h-80 w-full rounded-[24px]" />
      </div>
    );
  }

  if (query.isError || !profile) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="body-md text-semantic-down">No encontramos este perfil de viajero.</p>
        <Button asChild variant="secondary" className="rounded-full">
          <Link href="/admin/usuarios">Volver a usuarios</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Link
          href="/admin/usuarios"
          className="inline-flex items-center gap-1 body-sm font-medium text-body-text hover:text-ink"
        >
          <ArrowLeft className="size-4" /> Usuarios
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="display-sm text-ink">{profile.user.firstName ?? profile.user.email}</h1>
          <AdjustLimitDialog
            travelerProfileId={profile.travelerProfileId}
            currentAmount={profile.limitOverride?.maxOrderValueAmount ?? null}
            currentCurrency={profile.limitOverride?.currency ?? "USD"}
          />
        </div>

        <p className="body-sm text-body-text">
          {profile.user.email}
          {profile.user.phone && <> · {profile.user.phone}</>}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Reputación" value={profile.reputationScore.toFixed(2)} />
        <Kpi label="Calificaciones" value={String(profile.reputationCount)} />
        <Kpi label="Viajes / asignaciones" value={String(profile.assignmentsTotal)} />
        <Kpi
          label="Tasa de éxito"
          value={profile.successRate === null ? "N/A" : `${profile.successRate}%`}
        />
      </div>

      <Card className="rounded-[24px] border-hairline shadow-none">
        <CardContent className="space-y-4 p-8">
          <div className="flex items-center gap-2">
            <Gauge className="size-4 text-primary" />
            <h2 className="title-md text-ink">Límite vigente</h2>
          </div>
          <Separator className="bg-hairline-soft" />
          {profile.limitOverride ? (
            <div className="space-y-1">
              <p className="number-display !text-[24px] text-ink">
                ${profile.limitOverride.maxOrderValueAmount.toFixed(2)}{" "}
                <span className="body-sm font-normal text-body-text">
                  {profile.limitOverride.currency}
                </span>
              </p>
              <p className="body-sm text-body-text">“{profile.limitOverride.reason}”</p>
              <p className="caption text-muted-foreground">
                Ajustado por {shortId(profile.limitOverride.changedByUserId)} el{" "}
                {format(new Date(profile.limitOverride.updatedAt), "d MMM yyyy, h:mm a", {
                  locale: es,
                })}
              </p>
            </div>
          ) : (
            <p className="body-md text-body-text">
              Sin límite manual configurado — aplica el límite por defecto del sistema.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-[24px] border-hairline shadow-none">
          <CardContent className="space-y-4 p-8">
            <h2 className="title-md text-ink">Historial de viajes</h2>
            <Separator className="bg-hairline-soft" />
            {profile.trips.length === 0 ? (
              <p className="body-sm text-body-text">Sin asignaciones todavía.</p>
            ) : (
              <ul className="space-y-3">
                {profile.trips.map((trip) => (
                  <li key={trip.assignmentId} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="body-sm font-medium text-ink">{trip.productName}</p>
                      <p className="caption text-muted-foreground">
                        {trip.orderStatus} ·{" "}
                        {format(new Date(trip.claimedAt), "d MMM yyyy", { locale: es })}
                      </p>
                    </div>
                    <Link
                      href={`/admin/operacion/${trip.orderId}`}
                      className="inline-flex shrink-0 items-center gap-1 caption-strong text-primary"
                    >
                      Ver <ArrowRight className="size-3.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <p className="caption text-muted-foreground">
              Incidentes registrados: {profile.incidentsTotal}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border-hairline shadow-none">
          <CardContent className="space-y-4 p-8">
            <h2 className="title-md text-ink">Historial de cambios de límite</h2>
            <Separator className="bg-hairline-soft" />
            {profile.limitAuditLogs.length === 0 ? (
              <p className="body-sm text-body-text">Sin cambios registrados.</p>
            ) : (
              <ul className="space-y-4">
                {profile.limitAuditLogs.map((log) => (
                  <li key={log.id} className="space-y-1">
                    <p className="body-sm font-medium text-ink">
                      {log.fromAmount === null ? "Creado" : "Actualizado"}:{" "}
                      {log.fromAmount !== null && (
                        <span className="number-display !text-[13px]">
                          ${log.fromAmount.toFixed(2)} →{" "}
                        </span>
                      )}
                      <span className="number-display !text-[13px]">
                        ${log.toAmount?.toFixed(2) ?? "—"} {log.currency}
                      </span>
                    </p>
                    <p className="body-sm text-body-text">“{log.reason}”</p>
                    <p className="caption text-muted-foreground">
                      {shortId(log.changedByUserId)} ·{" "}
                      {format(new Date(log.createdAt), "d MMM yyyy, h:mm a", { locale: es })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
