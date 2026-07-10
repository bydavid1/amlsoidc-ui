"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
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
import { cn } from "@/lib/utils";

/**
 * Calificación mutua tras DELIVERED. Cuando ambas partes califican, el
 * backend cierra el pedido a COMPLETED automáticamente.
 */
export function RatingDialog({
  orderId,
  title = "Califica tu experiencia",
  trigger,
}: {
  orderId: string;
  title?: string;
  trigger: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (score < 1) {
      toast.error("Elige de 1 a 5 estrellas.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await ordersApi.rate(orderId, score, comment.trim() || undefined);
      toast.success(
        result.completed
          ? "¡Pedido completado! Gracias por calificar."
          : "Gracias por tu calificación.",
      );
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["assignments"] });
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === "ALREADY_RATED") {
          toast.info("Ya calificaste este pedido.");
          setOpen(false);
          return;
        }
        if (error.code === "ORDER_NOT_RATEABLE") {
          toast.error("Este pedido aún no se puede calificar.");
          return;
        }
      }
      toast.error("No pudimos guardar tu calificación.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="rounded-[24px] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="title-lg text-ink">{title}</DialogTitle>
          <DialogDescription className="body-md text-body-text">
            Tu calificación nos ayuda a mejorar el servicio y reconocer a los mejores viajeros.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-2 py-4">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              aria-label={`${value} estrellas`}
              onMouseEnter={() => setHovered(value)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setScore(value)}
              className="rounded-full p-1 transition-transform hover:scale-110"
            >
              <Star
                className={cn(
                  "size-9",
                  (hovered || score) >= value
                    ? "fill-accent-yellow text-accent-yellow"
                    : "text-hairline",
                )}
              />
            </button>
          ))}
        </div>

        <Textarea
          placeholder="Cuéntanos cómo fue la experiencia (opcional)"
          maxLength={1000}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="min-h-24 rounded-[12px]"
        />

        <Button
          onClick={submit}
          disabled={submitting}
          className="h-12 w-full rounded-full text-base font-semibold"
        >
          {submitting ? "Enviando…" : "Enviar calificación"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
