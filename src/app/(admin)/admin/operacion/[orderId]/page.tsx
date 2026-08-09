"use client";

import { useParams } from "next/navigation";
import { AdminOrderDetail } from "@/features/admin/components/admin-order-detail";

export default function AdminOperationOrderDetailPage() {
  const params = useParams<{ orderId: string }>();

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-10">
      <AdminOrderDetail orderId={params.orderId} />
    </div>
  );
}
