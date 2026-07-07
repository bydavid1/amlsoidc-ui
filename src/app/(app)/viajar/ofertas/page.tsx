import type { Metadata } from "next";
import { RequireRole } from "@/components/layout/require-role";
import { TravelerTabs } from "@/components/layout/traveler-tabs";
import { AssignmentBoard } from "@/features/assignments/components/assignment-board";

export const metadata: Metadata = { title: "Ofertas y encargos" };

export default function OffersPage() {
  return (
    <RequireRole role="TRAVELER">
      <div className="mx-auto max-w-[900px] space-y-8 px-6 py-12">
        <TravelerTabs />
        <div className="space-y-2">
          <h1 className="display-sm text-ink">Ofertas y encargos</h1>
          <p className="body-md text-body-text">
            Acepta las ofertas antes de que venzan y reporta cada paso del
            encargo. Se actualiza cada 30 segundos.
          </p>
        </div>
        <AssignmentBoard />
      </div>
    </RequireRole>
  );
}
