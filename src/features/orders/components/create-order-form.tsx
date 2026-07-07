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
import { ordersApi } from "../api";
import { CreateOrderFormValues, createOrderFormSchema } from "../schemas";

/** corridorKey = "originCountryId|destinationCountryId" (par habilitado por datos). */
function splitCorridor(key: string): { originCountryId: string; destinationCountryId: string } {
  const [originCountryId, destinationCountryId] = key.split("|");
  return { originCountryId, destinationCountryId };
}

export function CreateOrderForm() {
  const router = useRouter();
  const corridors = useCorridors();

  const form = useForm<CreateOrderFormValues>({
    resolver: zodResolver(createOrderFormSchema),
    defaultValues: {
      corridorKey: "",
      destinationCityId: "",
      productName: "",
      productUrl: "",
      neededBy: "",
    },
  });

  const corridorKey = form.watch("corridorKey");
  const destinationCountryId = corridorKey ? splitCorridor(corridorKey).destinationCountryId : null;
  const cities = useCities(destinationCountryId);

  async function onSubmit(values: CreateOrderFormValues) {
    const { originCountryId, destinationCountryId } = splitCorridor(values.corridorKey);
    try {
      const order = await ordersApi.create({
        originCountryId,
        destinationCountryId,
        destinationCityId: values.destinationCityId,
        productName: values.productName,
        productUrl: values.productUrl,
        estimatedPriceAmount: values.estimatedPriceAmount,
        estimatedPriceCurrency: "USD",
        neededBy: values.neededBy ? new Date(values.neededBy).toISOString() : undefined,
      });
      toast.success("Pedido creado. Estamos buscando al mejor viajero.");
      router.replace(`/comprar/${order.id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        switch (error.code) {
          case "CORRIDOR_NOT_ENABLED":
            form.setError("corridorKey", { message: "Aún no operamos esta ruta." });
            return;
          case "CITY_NOT_IN_DESTINATION_COUNTRY":
            form.setError("destinationCityId", {
              message: "La ciudad no pertenece al país de destino.",
            });
            return;
          case "VALIDATION_ERROR":
            for (const d of error.validationDetails) {
              form.setError(d.field as keyof CreateOrderFormValues, {
                message: d.errors.join(". "),
              });
            }
            return;
        }
      }
      toast.error("No pudimos crear el pedido. Intenta de nuevo.");
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
              <FormLabel>Ruta</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  form.setValue("destinationCityId", "");
                }}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger className="h-12 w-full rounded-[12px]">
                    <SelectValue
                      placeholder={
                        corridors.isLoading ? "Cargando rutas…" : "¿Desde dónde hacia dónde?"
                      }
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
              <FormDescription>Solo mostramos rutas habilitadas.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="destinationCityId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ciudad de entrega</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={!destinationCountryId}
              >
                <FormControl>
                  <SelectTrigger className="h-12 w-full rounded-[12px]">
                    <SelectValue
                      placeholder={destinationCountryId ? "Elige la ciudad" : "Primero elige la ruta"}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
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
          name="productName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Producto</FormLabel>
              <FormControl>
                <Input
                  placeholder="iPhone 15 Pro, 256 GB"
                  className="h-12 rounded-[12px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="productUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL del producto</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://www.apple.com/shop/buy-iphone"
                  className="h-12 rounded-[12px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>El enlace exacto de la tienda donde se comprará.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="estimatedPriceAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio estimado (USD)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="1099.99"
                    className="h-12 rounded-[12px] font-mono"
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="neededBy"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lo necesito antes de (opcional)</FormLabel>
                <FormControl>
                  <Input type="date" className="h-12 rounded-[12px] font-mono" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="h-12 w-full rounded-full text-base font-semibold sm:w-auto sm:px-10"
        >
          {form.formState.isSubmitting ? "Creando pedido…" : "Crear pedido"}
        </Button>
      </form>
    </Form>
  );
}
