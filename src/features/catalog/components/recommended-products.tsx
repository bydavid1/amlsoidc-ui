"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SIZE_UI } from "@/features/orders/schemas";
import { useRecommendedProducts, RecommendedProduct } from "../api";

/** "Pedirlo" pre-llena el formulario de nuevo pedido vía query params. */
function prefillHref(p: RecommendedProduct): string {
  const params = new URLSearchParams({
    name: p.name,
    url: p.productUrl,
    price: String(p.estimatedPriceAmount),
    size: p.sizeCategory,
  });
  return `/comprar/nuevo?${params.toString()}`;
}

export function RecommendedProducts() {
  const query = useRecommendedProducts();

  if (query.isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 rounded-[16px]" />
        ))}
      </div>
    );
  }

  const products = query.data ?? [];
  if (products.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="size-5 text-primary" />
        <h2 className="title-lg text-ink">Ideas para tu próximo pedido</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <Card key={p.id} className="rounded-[16px] border-hairline shadow-none">
            <CardContent className="flex h-full flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="title-sm text-ink">{p.name}</p>
                <Badge className="shrink-0 rounded-full bg-surface-strong caption-strong text-ink">
                  {SIZE_UI[p.sizeCategory].label}
                </Badge>
              </div>
              <p className="body-sm flex-1 text-body-text">
                Total aproximado con servicio:{" "}
                <span className="number-display !text-[15px] text-ink">
                  ${p.estimatedTotalAmount.toFixed(2)}
                </span>
              </p>
              <Button asChild size="sm" className="rounded-full font-semibold">
                <Link href={prefillHref(p)}>Pedirlo</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
