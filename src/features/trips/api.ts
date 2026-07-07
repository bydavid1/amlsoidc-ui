import { z } from "zod";
import { apiGetWithMeta, apiPost } from "@/lib/api/client";
import { CursorPage } from "@/lib/api/types";
import { Trip, TripListRow, tripListRowSchema, tripSchema } from "./schemas";

export interface CreateTripInput {
  originCountryId: string;
  destinationCountryId: string;
  destinationCityId?: string;
  arrivalDate: string;
  capacity: number;
}

export const tripsApi = {
  async create(input: CreateTripInput): Promise<Trip> {
    return tripSchema.parse(await apiPost<Trip>("/trips", input));
  },

  async list(params: {
    limit: number;
    cursor?: string;
    status?: string;
  }): Promise<CursorPage<TripListRow>> {
    const { data, meta } = await apiGetWithMeta<TripListRow[]>("/trips", params);
    return {
      items: z.array(tripListRowSchema).parse(data),
      nextCursor: meta.nextCursor ?? null,
    };
  },

  async publish(tripId: string): Promise<Trip> {
    return tripSchema.parse(await apiPost<Trip>(`/trips/${tripId}/publish`));
  },

  /** El backend re-matchea automáticamente los pedidos afectados. */
  cancel(tripId: string): Promise<{ affectedOrderIds: string[] }> {
    return apiPost(`/trips/${tripId}/cancel`);
  },
};
