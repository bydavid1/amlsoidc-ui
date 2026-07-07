import type { Metadata } from "next";
import { RequireRole } from "@/components/layout/require-role";
import { TravelerTabs } from "@/components/layout/traveler-tabs";
import { TripList } from "@/features/trips/components/trip-list";

export const metadata: Metadata = { title: "Mis viajes" };

export default function TravelerSpacePage() {
  return (
    <RequireRole role="TRAVELER">
      <div className="mx-auto max-w-[900px] space-y-8 px-6 py-12">
        <TravelerTabs />
        <TripList />
      </div>
    </RequireRole>
  );
}
