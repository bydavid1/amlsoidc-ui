import type { Metadata } from "next";
import { RequireRole } from "@/components/layout/require-role";
import { RecommendedProducts } from "@/features/catalog/components/recommended-products";
import { OrderList } from "@/features/orders/components/order-list";

export const metadata: Metadata = { title: "Mis pedidos" };

export default function BuyerSpacePage() {
  return (
    <RequireRole role="BUYER">
      <div className="mx-auto max-w-[900px] space-y-12 px-6 py-12">
        <OrderList />
        <RecommendedProducts />
      </div>
    </RequireRole>
  );
}
