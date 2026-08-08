import type { Metadata } from "next";
import { Suspense } from "react";
import { RequireRole } from "@/components/layout/require-role";
import { CreateOrderForm } from "@/features/orders/components/create-order-form";

export const metadata: Metadata = { title: "Nuevo pedido" };

export default function NewOrderPage() {
  return (
    <RequireRole role="BUYER">
      <div className="mx-auto max-w-[760px] space-y-8 px-6 py-12">
        <div className="space-y-4 rounded-[20px] border border-hairline bg-surface-soft p-6 sm:p-7">
          <div className="space-y-2">
            <p className="caption-strong text-primary">Nuevo pedido</p>
            <h1 className="display-sm font-extrabold tracking-tight text-ink">Dinos que quieres traer</h1>
            <p className="body-md text-body-text">
              Comparte el enlace, indica dónde quieres recibirlo y Bringo se encarga de
              derivar la ruta y encontrar al mejor viajero.
            </p>
          </div>
        </div>
        <Suspense>
          <CreateOrderForm />
        </Suspense>
      </div>
    </RequireRole>
  );
}
