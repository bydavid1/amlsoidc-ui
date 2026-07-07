import type { Metadata } from "next";
import { RequireRole } from "@/components/layout/require-role";
import { OrderList } from "@/features/orders/components/order-list";

export const metadata: Metadata = { title: "Mis pedidos" };

export default function BuyerSpacePage() {
  return (
    <RequireRole role="BUYER">
      <div className="mx-auto max-w-[900px] px-6 py-12">
        <OrderList />
      </div>
    </RequireRole>
  );
}
