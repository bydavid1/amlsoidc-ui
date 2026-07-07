"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ordersApi } from "@/features/orders/api";
import { ApiError } from "@/lib/api/types";

/** Abre una disputa: el pedido pasa a DISPUTED y lo revisa el equipo de Bringo. */
export function ReportIssueDialog({
  orderId,
  trigger,
}: {
  orderId: string;
  trigger: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (reason.trim().length < 10) {
      toast.error("Describe el problema con al menos 10 caracteres.");
      return;
    }
    setSubmitting(true);
    try {
      await ordersApi.reportIssue(orderId, reason.trim());
      toast.success("Reporte enviado. Nuestro equipo revisará el caso.");
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["assignments"] });
    } catch (error) {
      if (error instanceof ApiError && error.code === "DISPUTE_ALREADY_OPEN") {
        toast.info("Este pedido ya tiene una disputa abierta.");
        setOpen(false);
        return;
      }
      if (error instanceof ApiError && error.status === 409) {
        toast.error("El pedido no admite disputas en su estado actual.");
        return;
      }
      toast.error("No pudimos enviar el reporte.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="rounded-[24px] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="title-lg text-ink">Reportar un problema</DialogTitle>
          <DialogDescription className="body-md text-body-text">
            El pedido quedará en disputa mientras nuestro equipo lo revisa.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Describe qué pasó (mínimo 10 caracteres)"
          maxLength={2000}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="min-h-28 rounded-[12px]"
        />
        <Button
          onClick={submit}
          disabled={submitting}
          variant="secondary"
          className="h-12 w-full rounded-full text-base font-semibold text-semantic-down"
        >
          {submitting ? "Enviando…" : "Enviar reporte"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
