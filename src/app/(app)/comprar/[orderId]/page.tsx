"use client";

import { useParams } from "next/navigation";
import { RequireRole } from "@/components/layout/require-role";
import { OrderDetail } from "@/features/orders/components/order-detail";

export default function OrderDetailPage() {
  const params = useParams<{ orderId: string }>();

  return (
    <RequireRole role="BUYER">
      <div className="mx-auto max-w-[900px] px-6 py-12">
        <OrderDetail orderId={params.orderId} />
      </div>
    </RequireRole>
  );
}
