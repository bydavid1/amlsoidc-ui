import { z } from "zod";

/** Contrato de TripResponseDto / TripListRow del backend. */
export const tripSchema = z.object({
  id: z.string(),
  originCountryId: z.string(),
  destinationCountryId: z.string(),
  destinationCityId: z.string().nullable(),
  arrivalDate: z.string(),
  status: z.enum(["DRAFT", "OPEN", "IN_PROGRESS", "CLOSED", "CANCELLED"]),
});
export type Trip = z.infer<typeof tripSchema>;

export const tripListRowSchema = tripSchema.extend({
  createdAt: z.string(),
});
export type TripListRow = z.infer<typeof tripListRowSchema>;

/** Formulario de creación — mismas reglas que CreateTripDto del backend. */
export const createTripFormSchema = z.object({
  corridorKey: z.string().min(1, "Elige tu ruta de viaje"),
  destinationCityId: z.string().optional(),
  arrivalDate: z
    .string()
    .min(1, "Indica cuándo llegas")
    .refine((value) => new Date(value).getTime() > Date.now(), {
      message: "La fecha de llegada debe ser futura",
    }),
});
export type CreateTripFormValues = z.infer<typeof createTripFormSchema>;

export const TRIP_STATUS_UI: Record<Trip["status"], { label: string; className: string }> = {
  DRAFT: { label: "Borrador", className: "text-body-text" },
  OPEN: { label: "Publicado", className: "text-primary" },
  IN_PROGRESS: { label: "En curso", className: "text-primary" },
  CLOSED: { label: "Cerrado", className: "text-body-text" },
  CANCELLED: { label: "Cancelado", className: "text-semantic-down" },
};
