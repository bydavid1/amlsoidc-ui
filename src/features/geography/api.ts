import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { apiGet } from "@/lib/api/client";

export const countrySchema = z.object({
  id: z.string(),
  iso2: z.string(),
  name: z.string(),
});
export type Country = z.infer<typeof countrySchema>;

export const citySchema = z.object({
  id: z.string(),
  countryId: z.string(),
  name: z.string(),
});
export type City = z.infer<typeof citySchema>;

export const corridorSchema = z.object({
  origin: countrySchema,
  destination: countrySchema,
});
export type Corridor = z.infer<typeof corridorSchema>;

export const geographyApi = {
  async listCorridors(): Promise<Corridor[]> {
    return z.array(corridorSchema).parse(await apiGet<Corridor[]>("/corridors"));
  },
  async listCities(countryId: string): Promise<City[]> {
    return z
      .array(citySchema)
      .parse(await apiGet<City[]>(`/countries/${countryId}/cities`, { pageSize: 100 }));
  },
};

/** Corredores habilitados (multi-corredor por datos: la UI nunca los hardcodea). */
export function useCorridors() {
  return useQuery({
    queryKey: ["geography", "corridors"],
    queryFn: geographyApi.listCorridors,
    staleTime: 5 * 60_000,
  });
}

export function useCities(countryId: string | null) {
  return useQuery({
    queryKey: ["geography", "cities", countryId],
    queryFn: () => geographyApi.listCities(countryId as string),
    enabled: countryId !== null,
    staleTime: 5 * 60_000,
  });
}
