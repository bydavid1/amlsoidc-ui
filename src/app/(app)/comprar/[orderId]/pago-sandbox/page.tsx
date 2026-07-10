"use client";

import { CircleDollarSign } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Checkout SANDBOX (solo desarrollo/piloto sin pasarela): simula la página
 * de pago del proveedor. La pasarela real reemplaza esta URL sin tocar nada más.
 */
function SandboxCheckout() {
  const params = useParams<{ orderId: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const ref = search.get("ref");
  const amount = search.get("amount");
  const currency = search.get("currency") ?? "USD";

  async function resolve(approved: boolean) {
    setBusy(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/payments/webhook/sandbox`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-sandbox-signature": process.env.NEXT_PUBLIC_SANDBOX_SECRET ?? "",
          },
          body: JSON.stringify({ providerRef: ref, approved }),
        },
      );
      if (!res.ok) throw new Error("webhook failed");
      toast[approved ? "success" : "error"](
        approved ? "Pago aprobado (sandbox)" : "Pago rechazado (sandbox)",
      );
      router.replace(`/comprar/${params.orderId}`);
    } catch {
      toast.error("El sandbox no pudo procesar el pago.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md items-center px-6">
      <Card className="w-full rounded-[24px] border-hairline shadow-none">
        <CardContent className="space-y-6 p-8 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-surface-strong">
            <CircleDollarSign className="size-7 text-primary" />
          </span>
          <div className="space-y-1">
            <p className="caption-strong uppercase tracking-wide text-muted-foreground">
              Checkout de prueba (sandbox)
            </p>
            <p className="display-sm text-ink">
              ${Number(amount ?? 0).toFixed(2)} {currency}
            </p>
            <p className="body-sm text-body-text">Servicio de traída Bringo</p>
          </div>
          <div className="space-y-3">
            <Button
              className="h-12 w-full rounded-full font-semibold"
              disabled={busy || !ref}
              onClick={() => resolve(true)}
            >
              Aprobar pago
            </Button>
            <Button
              variant="secondary"
              className="h-12 w-full rounded-full font-semibold text-semantic-down"
              disabled={busy || !ref}
              onClick={() => resolve(false)}
            >
              Rechazar pago
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SandboxCheckoutPage() {
  return (
    <Suspense>
      <SandboxCheckout />
    </Suspense>
  );
}
