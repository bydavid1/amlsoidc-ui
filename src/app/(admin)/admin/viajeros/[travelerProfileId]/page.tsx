"use client";

import { useParams } from "next/navigation";
import { TravelerRiskProfile } from "@/features/admin/components/traveler-risk-profile";

export default function AdminTravelerRiskProfilePage() {
  const params = useParams<{ travelerProfileId: string }>();

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-10">
      <TravelerRiskProfile travelerProfileId={params.travelerProfileId} />
    </div>
  );
}
