"use client";

import { useParams } from "next/navigation";
import { KycCaseDetail } from "@/features/admin/components/kyc-case-detail";

export default function AdminKycCaseDetailPage() {
  const params = useParams<{ caseId: string }>();

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-10">
      <KycCaseDetail caseId={params.caseId} />
    </div>
  );
}
