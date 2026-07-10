"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateRecommended, useDeactivateRecommended } from "@/features/admin/api";
import { useRecommendedProducts } from "@/features/catalog/api";
import { useCorridors } from "@/features/geography/api";
import { SIZE_UI, SizeCategory } from "@/features/orders/schemas";

export default function AdminCurationPage() {
  const products = useRecommendedProducts();
  const corridors = useCorridors();
  const create = useCreateRecommended();
  const deactivate = useDeactivateRecommended();

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [price, setPrice] = useState("");
  const [size, setSize] = useState<SizeCategory>("MEDIUM");

  const origins = [...new Map((corridors.data ?? []).map((c) => [c.origin.id, c.origin])).values()];
  const [originId, setOriginId] = useState("");

  const canSubmit = name.length >= 2 && url.startsWith("http") && Number(price) > 0 && (originId || origins[0]);

  return (
    <div className="space-y-8">
      <h1 className="display-sm text-ink">Curaduría</h1>

      <Card className="rounded-[24px] border-hairline bg-background shadow-none">
        <CardContent className="space-y-4 p-8">
          <h2 className="title-md text-ink">Publicar producto recomendado</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              placeholder="Nombre (ej. iPhone 15 Pro 256GB)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 rounded-[12px]"
            />
            <Input
              placeholder="URL del producto (https://...)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-12 rounded-[12px]"
            />
            <Input
              type="number"
              placeholder="Precio estimado (USD)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="h-12 rounded-[12px] font-mono"
            />
            <Select value={size} onValueChange={(v) => setSize(v as SizeCategory)}>
              <SelectTrigger className="h-12 w-full rounded-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SIZE_UI) as SizeCategory[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {SIZE_UI[k].label} — {SIZE_UI[k].examples}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={originId || origins[0]?.id} onValueChange={setOriginId}>
              <SelectTrigger className="h-12 w-full rounded-[12px]">
                <SelectValue placeholder="País de compra" />
              </SelectTrigger>
              <SelectContent>
                {origins.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            className="h-12 rounded-full px-8 font-semibold"
            disabled={!canSubmit || create.isPending}
            onClick={() =>
              create.mutate(
                {
                  name,
                  productUrl: url,
                  estimatedPriceAmount: Number(price),
                  sizeCategory: size,
                  originCountryId: originId || origins[0].id,
                },
                {
                  onSuccess: () => {
                    setName("");
                    setUrl("");
                    setPrice("");
                  },
                },
              )
            }
          >
            {create.isPending ? "Publicando…" : "Publicar"}
          </Button>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="title-md text-ink">Activos ({products.data?.length ?? "…"})</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {products.data?.map((p) => (
            <Card key={p.id} className="rounded-[16px] border-hairline bg-background shadow-none">
              <CardContent className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="title-sm truncate text-ink">{p.name}</p>
                  <p className="caption text-body-text">
                    {SIZE_UI[p.sizeCategory].label} ·{" "}
                    <span className="number-display !text-[12px]">
                      ${p.estimatedPriceAmount.toFixed(2)}
                    </span>
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="shrink-0 rounded-full font-semibold text-semantic-down"
                  disabled={deactivate.isPending}
                  onClick={() => deactivate.mutate(p.id)}
                >
                  Retirar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
