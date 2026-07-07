import type { Metadata } from "next";
import { RequireRole } from "@/components/layout/require-role";

export const metadata: Metadata = { title: "Mis viajes" };

/** Placeholder F2 — el hito F5 implementa viajes y ofertas. */
export default function TravelerSpacePage() {
  return (
    <RequireRole role="TRAVELER">
      <div className="mx-auto max-w-[1200px] space-y-6 px-6 py-12">
        <h1 className="display-sm text-ink">Mis viajes</h1>
        <p className="body-md text-body-text">
          Próximamente (F5): publicar viajes y responder ofertas.
        </p>
      </div>
    </RequireRole>
  );
}
