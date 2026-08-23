"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft } from "lucide-react";
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
import { useAdminUser, useReactivateUser, useSuspendUser } from "@/features/admin/api";
import { shortId } from "@/features/admin/kyc-format";

function SuspendDialog({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const suspend = useSuspendUser();

  const trimmed = reason.trim();
  const disabled = suspend.isPending || trimmed.length < 5 || trimmed.length > 500;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setReason("");
      }}
    >
      <DialogTrigger asChild>
        <Button variant="destructive" className="h-11 rounded-full px-5 font-semibold">
          Suspender
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-[24px] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="title-lg text-ink">Suspender usuario</DialogTitle>
          <DialogDescription className="body-md text-body-text">
            Bloqueo inmediato: no podrá iniciar sesión ni operar hasta reactivarlo. El motivo es
            obligatorio (5 a 500 caracteres) y queda en el historial.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Motivo de la suspensión…"
            className="min-h-28 rounded-2xl"
            maxLength={500}
          />
          <p className="caption text-muted-foreground">{trimmed.length}/500</p>
        </div>
        <DialogFooter>
          <Button
            variant="destructive"
            className="h-11 rounded-full px-5 font-semibold"
            disabled={disabled}
            onClick={() =>
              suspend.mutate({ userId, reason: trimmed }, { onSuccess: () => setOpen(false) })
            }
          >
            {suspend.isPending ? "Suspendiendo…" : "Confirmar suspensión"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReactivateDialog({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const reactivate = useReactivateUser();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-11 rounded-full px-5 font-semibold">Reactivar</Button>
      </DialogTrigger>
      <DialogContent className="rounded-[24px] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="title-lg text-ink">Reactivar usuario</DialogTitle>
          <DialogDescription className="body-md text-body-text">
            El motivo es opcional, pero si lo agregás queda en el historial.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Motivo (opcional)…"
          className="min-h-20 rounded-2xl"
          maxLength={500}
        />
        <DialogFooter>
          <Button
            className="h-11 rounded-full px-5 font-semibold"
            disabled={reactivate.isPending}
            onClick={() =>
              reactivate.mutate(
                { userId, reason: reason.trim() || undefined },
                { onSuccess: () => setOpen(false) },
              )
            }
          >
            {reactivate.isPending ? "Reactivando…" : "Confirmar reactivación"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function moderationActionLabel(action: string): string {
  return action === "SUSPENDED" ? "Suspendido" : "Reactivado";
}

export function UserProfile({ userId }: { userId: string }) {
  const query = useAdminUser(userId);
  const user = query.data;

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64 rounded-full" />
        <Skeleton className="h-32 w-full rounded-[24px]" />
        <Skeleton className="h-64 w-full rounded-[24px]" />
      </div>
    );
  }

  if (query.isError || !user) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="body-md text-semantic-down">No encontramos este usuario.</p>
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
          <h1 className="display-sm text-ink">{user.firstName ?? user.email}</h1>
          <div className="flex items-center gap-3">
            <Badge
              className={
                user.status === "ACTIVE"
                  ? "rounded-full bg-surface-strong caption-strong text-semantic-up"
                  : "rounded-full bg-surface-strong caption-strong text-semantic-down"
              }
            >
              {user.status === "ACTIVE" ? "Activo" : "Suspendido"}
            </Badge>
            {user.status === "ACTIVE" ? (
              <SuspendDialog userId={user.id} />
            ) : (
              <ReactivateDialog userId={user.id} />
            )}
          </div>
        </div>

        <p className="body-sm text-body-text">
          {user.email}
          {user.phone && <> · {user.phone}</>}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-[24px] border-hairline shadow-none">
          <CardContent className="space-y-4 p-8">
            <h2 className="title-md text-ink">Datos y roles</h2>
            <Separator className="bg-hairline-soft" />
            <dl className="space-y-3">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="body-sm text-body-text">Roles</dt>
                <dd className="body-sm font-semibold text-ink">
                  {user.roles.length > 0 ? user.roles.join(", ") : "sin roles"}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="body-sm text-body-text">Alta</dt>
                <dd className="body-sm font-semibold text-ink">
                  {format(new Date(user.createdAt), "d MMM yyyy", { locale: es })}
                </dd>
              </div>
            </dl>
            {user.travelerProfileId && (
              <>
                <Separator className="bg-hairline-soft" />
                <Link
                  href={`/admin/viajeros/${user.travelerProfileId}`}
                  className="inline-flex items-center gap-1 caption-strong text-primary"
                >
                  Ver perfil de límites del viajero →
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border-hairline shadow-none">
          <CardContent className="space-y-4 p-8">
            <h2 className="title-md text-ink">Incidentes / disputas</h2>
            <Separator className="bg-hairline-soft" />
            <p className="body-sm text-body-text">
              Aún no hay una vista de disputas por usuario — se construye junto con el resto del
              módulo de disputas.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[24px] border-hairline shadow-none">
        <CardContent className="space-y-4 p-8">
          <h2 className="title-md text-ink">Historial de moderación</h2>
          <Separator className="bg-hairline-soft" />
          {user.statusHistory.length === 0 ? (
            <p className="body-sm text-body-text">Sin acciones de moderación todavía.</p>
          ) : (
            <ul className="space-y-4">
              {user.statusHistory.map((entry) => (
                <li key={entry.id} className="space-y-1">
                  <p className="body-sm font-medium text-ink">
                    {moderationActionLabel(entry.action)}
                  </p>
                  {entry.reason && <p className="body-sm text-body-text">“{entry.reason}”</p>}
                  <p className="caption text-muted-foreground">
                    {shortId(entry.changedByUserId)} ·{" "}
                    {format(new Date(entry.createdAt), "d MMM yyyy, h:mm a", { locale: es })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
