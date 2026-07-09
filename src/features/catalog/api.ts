"use client";

import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { apiGet } from "@/lib/api/client";
import { sizeCategorySchema } from "@/features/orders/schemas";

/** Curaduría de Bringo: productos para inspirar al comprador. */
export const recommendedProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  productUrl: z.string(),
  imageUrl: z.string().nullable(),
  estimatedPriceAmount: z.coerce.number(),
  estimatedPriceCurrency: z.string(),
  sizeCategory: sizeCategorySchema,
  originCountryId: z.string(),
  estimatedTotalAmount: z.coerce.number(),
});
export type RecommendedProduct = z.infer<typeof recommendedProductSchema>;

export function useRecommendedProducts() {
  return useQuery({
    queryKey: ["catalog", "recommended"],
    queryFn: async () =>
      z
        .array(recommendedProductSchema)
        .parse(await apiGet<RecommendedProduct[]>("/recommended-products")),
    staleTime: 5 * 60_000,
  });
}
