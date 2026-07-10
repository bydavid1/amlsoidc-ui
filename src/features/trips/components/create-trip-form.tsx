"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCities, useCorridors } from "@/features/geography/api";
import { ApiError } from "@/lib/api/types";
import { tripsApi } from "../api";
import { CreateTripFormValues, createTripFormSchema } from "../schemas";

const NO_CITY = "__none__";

export function CreateTripForm() {
  const router = useRouter();
  const corridors = useCorridors();

  const form = useForm<CreateTripFormValues>({
    resolver: zodResolver(createTripFormSchema),
    defaultValues: { corridorKey: "", destinationCityId: NO_CITY, arrivalDate: "" },
  });

  const corridorKey = form.watch("corridorKey");
  const destinationCountryId = corridorKey ? corridorKey.split("|")[1] : null;
  const cities = useCities(destinationCountryId);

  async function onSubmit(values: CreateTripFormValues) {
    const [originCountryId, destCountryId] = values.corridorKey.split("|");
    try {
      const trip = await tripsApi.create({
        originCountryId,
        destinationCountryId: destCountryId,
        destinationCityId:
          values.destinationCityId && values.destinationCityId !== NO_CITY
            ? values.destinationCityId
            : undefined,
        arrivalDate: new Date(values.arrivalDate).toISOString(),
      });
      await tripsApi.publish(trip.id);
      toast.success("Viaje publicado. Te avisaremos cuando haya pedidos compatibles.");
      router.replace("/viajar");
    } catch (error) {
      if (error instanceof ApiError) {
        switch (error.code) {
          case "PROFILE_INCOMPLETE":
            toast.error("Completa tu perfil (nombre y teléfono) para continuar.");
            router.push("/cuenta");
            return;
          case "CORRIDOR_NOT_ENABLED":
            form.setError("corridorKey", { message: "Aún no operamos esta ruta." });
            return;
          case "TRIP_ARRIVAL_IN_PAST":
            form.setError("arrivalDate", { message: "La fecha debe ser futura." });
            return;
          case "VALIDATION_ERROR":
            for (const d of error.validationDetails) {
              form.setError(d.field as keyof CreateTripFormValues, {
                message: d.errors.join(". "),
              });
            }
            return;
        }
      }
      toast.error("No pudimos crear el viaje. Intenta de nuevo.");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="corridorKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ruta del viaje</FormLabel>
              <Select
                onValueChange={(v) => {
                  field.onChange(v);
                  form.setValue("destinationCityId", NO_CITY);
                }}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger className="h-12 w-full rounded-[12px]">
                    <SelectValue
                      placeholder={corridors.isLoading ? "Cargando rutas…" : "¿Desde dónde regresas?"}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {corridors.data?.map((c) => (
                    <SelectItem
                      key={`${c.origin.id}|${c.destination.id}`}
                      value={`${c.origin.id}|${c.destination.id}`}
                    >
                      {c.origin.name} → {c.destination.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="destinationCityId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ciudad de llegada (opcional)</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={!destinationCountryId}
              >
                <FormControl>
                  <SelectTrigger className="h-12 w-full rounded-[12px]">
                    <SelectValue placeholder="Elige la ciudad" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={NO_CITY}>Sin especificar</SelectItem>
                  {cities.data?.map((city) => (
                    <SelectItem key={city.id} value={city.id}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="arrivalDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha de llegada</FormLabel>
              <FormControl>
                <Input type="date" className="h-12 rounded-[12px] font-mono" {...field} />
              </FormControl>
              <FormDescription>
                Después de publicar verás los encargos disponibles y eliges cuáles llevar
                según el espacio que tengas.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="h-12 w-full rounded-full text-base font-semibold sm:w-auto sm:px-10"
        >
          {form.formState.isSubmitting ? "Publicando…" : "Publicar viaje"}
        </Button>
      </form>
    </Form>
  );
}
