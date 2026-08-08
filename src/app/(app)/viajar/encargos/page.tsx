import type { Metadata } from "next";
import { RequireRole } from "@/components/layout/require-role";
import { TravelerTabs } from "@/components/layout/traveler-tabs";
import { AssignmentBoard } from "@/features/assignments/components/assignment-board";

export const metadata: Metadata = { title: "Encargos en curso" };

export default function MyAssignmentsPage() {
  return (
    <RequireRole role="TRAVELER">
      <div className="mx-auto max-w-[900px] space-y-8 px-6 py-12">
        <TravelerTabs />
        <div className="space-y-2">
          <h1 className="display-sm text-ink">Encargos en curso</h1>
          <p className="body-md text-body-text">
            Aquí ves los encargos que ya tomaste. Para ver encargos disponibles, entra a uno de tus viajes publicados.
          </p>
        </div>
        <AssignmentBoard />
      </div>
    </RequireRole>
  );
}
