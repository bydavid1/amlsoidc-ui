import type { Metadata } from "next";
import { RequireRole } from "@/components/layout/require-role";
import { TravelerTabs } from "@/components/layout/traveler-tabs";
import { AssignmentBoard } from "@/features/assignments/components/assignment-board";

export const metadata: Metadata = { title: "Mis encargos" };

export default function MyAssignmentsPage() {
  return (
    <RequireRole role="TRAVELER">
      <div className="mx-auto max-w-[900px] space-y-8 px-6 py-12">
        <TravelerTabs />
        <div className="space-y-2">
          <h1 className="display-sm text-ink">Mis encargos</h1>
          <p className="body-md text-body-text">
            Reporta cada paso de tus encargos activos. Se actualiza cada 30 segundos.
          </p>
        </div>
        <AssignmentBoard />
      </div>
    </RequireRole>
  );
}
