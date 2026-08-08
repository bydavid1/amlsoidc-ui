"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
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

function isoToFlag(iso2: string): string {
  return iso2
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateFromToday(days: number): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
}

export function CreateTripForm() {
  const router = useRouter();
  const corridors = useCorridors();

  const corridorRows = useMemo(() => corridors.data ?? [], [corridors.data]);

  const origins = useMemo(() => {
    const byId = new Map<string, (typeof corridorRows)[number]["origin"]>();
    for (const row of corridorRows) {
      byId.set(row.origin.id, row.origin);
    }
    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [corridorRows]);

  const form = useForm<CreateTripFormValues>({
    resolver: zodResolver(createTripFormSchema),
    defaultValues: { corridorKey: "", destinationCityId: NO_CITY, arrivalDate: "" },
  });

  const corridorKey = useWatch({ control: form.control, name: "corridorKey" });
  const selectedOriginId = corridorKey ? corridorKey.split("|")[0] : "";
  const selectedDestinationId = corridorKey ? corridorKey.split("|")[1] : "";

  const destinationsForOrigin = useMemo(() => {
    if (!selectedOriginId) return [];
    const byId = new Map<string, (typeof corridorRows)[number]["destination"]>();
    for (const row of corridorRows) {
      if (row.origin.id === selectedOriginId) {
        byId.set(row.destination.id, row.destination);
      }
    }
    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [corridorRows, selectedOriginId]);

  const selectedOrigin = origins.find((country) => country.id === selectedOriginId) ?? null;
  const selectedDestination =
    destinationsForOrigin.find((country) => country.id === selectedDestinationId) ?? null;

  const destinationCountryId = selectedDestination?.id ?? null;
  const cities = useCities(destinationCountryId);

  const minArrivalDate = dateFromToday(1);

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
            router.push("/onboarding?next=/viajar/nuevo");
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
              <FormLabel>¿Desde dónde viajas?</FormLabel>
              <Select
                onValueChange={(v) => {
                  const destinations = corridorRows.filter((row) => row.origin.id === v);
                  const defaultDestination = destinations[0]?.destination;
                  if (defaultDestination) {
                    field.onChange(`${v}|${defaultDestination.id}`);
                  } else {
                    field.onChange("");
                  }
                  form.setValue("destinationCityId", NO_CITY);
                }}
                value={selectedOriginId}
              >
                <FormControl>
                  <SelectTrigger className="h-12 w-full rounded-[12px]">
                    <SelectValue
                      placeholder={corridors.isLoading ? "Cargando países..." : "Elige país de origen"}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {origins.map((country) => (
                    <SelectItem key={country.id} value={country.id}>
                      {isoToFlag(country.iso2)} {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedOrigin && selectedDestination && (
          <div className="space-y-3 rounded-[14px] border border-hairline bg-surface-soft p-4">
            <div className="space-y-1">
              <p className="caption-strong text-ink">Destino</p>
              <p className="title-sm text-ink">
                {isoToFlag(selectedDestination.iso2)} {selectedDestination.name}
              </p>
            </div>
            <p className="body-sm text-body-text">
              {isoToFlag(selectedOrigin.iso2)} {selectedOrigin.name} {"->"} {isoToFlag(selectedDestination.iso2)}{" "}
              {selectedDestination.name}
            </p>
          </div>
        )}

        {selectedOrigin && destinationsForOrigin.length > 1 && (
          <FormItem>
            <FormLabel>¿Dónde llegas?</FormLabel>
            <Select
              onValueChange={(destinationId) => {
                form.setValue("corridorKey", `${selectedOrigin.id}|${destinationId}`, {
                  shouldValidate: true,
                });
                form.setValue("destinationCityId", NO_CITY);
              }}
              value={selectedDestinationId}
            >
              <FormControl>
                <SelectTrigger className="h-12 w-full rounded-[12px]">
                  <SelectValue placeholder="Elige país de destino" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {destinationsForOrigin.map((country) => (
                  <SelectItem key={country.id} value={country.id}>
                    {isoToFlag(country.iso2)} {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        )}

        <FormField
          control={form.control}
          name="destinationCityId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>¿Dónde llegas?</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={!destinationCountryId}
              >
                <FormControl>
                  <SelectTrigger className="h-12 w-full rounded-[12px]">
                    <SelectValue placeholder={destinationCountryId ? "Ciudad de llegada (opcional)" : "Primero elige el país de origen"} />
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
              <FormDescription>
                Si aún no sabes dónde llegarás, puedes dejarlo sin especificar.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="arrivalDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>¿Cuándo llegas?</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  min={minArrivalDate}
                  className="h-12 rounded-[12px] font-mono"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Te mostraremos encargos que puedan entregarse dentro de tu fecha de llegada.
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
