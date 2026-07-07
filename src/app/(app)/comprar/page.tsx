import type { Metadata } from "next";
import { RequireRole } from "@/components/layout/require-role";

export const metadata: Metadata = { title: "Mis pedidos" };

/** Placeholder F2 — el hito F4 implementa la lista real con cursor. */
export default function BuyerSpacePage() {
  return (
    <RequireRole role="BUYER">
      <div className="mx-auto max-w-[1200px] space-y-6 px-6 py-12">
        <h1 className="display-sm text-ink">Mis pedidos</h1>
        <p className="body-md text-body-text">
          Próximamente (F4): lista de pedidos, wizard de creación y seguimiento.
        </p>
      </div>
    </RequireRole>
  );
}
