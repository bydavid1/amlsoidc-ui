import type { Metadata } from "next";
import { Suspense } from "react";
import { RequireRole } from "@/components/layout/require-role";
import { CreateOrderForm } from "@/features/orders/components/create-order-form";

export const metadata: Metadata = { title: "Nuevo pedido" };

export default function NewOrderPage() {
  return (
    <RequireRole role="BUYER">
      <div className="mx-auto max-w-[640px] space-y-8 px-6 py-12">
        <div className="space-y-2">
          <h1 className="display-sm text-ink">Nuevo pedido</h1>
          <p className="body-md text-body-text">
            Cuéntanos qué quieres y el sistema encontrará al mejor viajero. Tú no
            eliges al viajero: la asignación es automática.
          </p>
        </div>
        <Suspense>
          <CreateOrderForm />
        </Suspense>
      </div>
    </RequireRole>
  );
}
