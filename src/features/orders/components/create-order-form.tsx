"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Check } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { ordersApi } from "../api";
import { CreateOrderFormValues, createOrderFormSchema } from "../schemas";
import { productResolver } from "../product-resolver";

const DEFAULT_SIZE = "MEDIUM" as const;
const MAX_DELIVERY_DAYS = 120;
const DESTINATION_PREFERENCE_KEY = "bringo.buyer.destination.v1";

type UrlAnalysisState = "idle" | "analyzing" | "resolved" | "unresolved" | "invalid";
type FormStep = 0 | 1 | 2;
type DestinationPreference = { countryId: string; cityId: string };

const FORM_STEPS: Array<{ key: FormStep; title: string; description: string }> = [
  { key: 0, title: "Producto", description: "Que quieres traer" },
  { key: 1, title: "Entrega", description: "Donde quieres recibirlo" },
  { key: 2, title: "Resumen", description: "Revisa y confirma" },
];

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

export function CreateOrderForm() {
  const router = useRouter();
  const corridors = useCorridors();

  const searchParams = useSearchParams();
  const prefillPriceRaw = searchParams.get("price");
  const prefillPrice =
    prefillPriceRaw !== null && Number.isFinite(Number(prefillPriceRaw)) && Number(prefillPriceRaw) > 0
      ? Number(prefillPriceRaw)
      : undefined;
  const prefillName = searchParams.get("name") ?? "";
  const prefillUrl = searchParams.get("url") ?? "";

  const [manualOriginCountryId, setManualOriginCountryId] = useState("");
  const [step, setStep] = useState<FormStep>(0);
  const hasRestoredDestinationRef = useRef(false);
  const productNameInputRef = useRef<HTMLInputElement | null>(null);
  const estimatedPriceInputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<CreateOrderFormValues>({
    resolver: zodResolver(createOrderFormSchema),
    defaultValues: {
      destinationCountryId: "",
      destinationCityId: "",
      productName: prefillName,
      productUrl: prefillUrl,
      ...(typeof prefillPrice === "number" && Number.isFinite(prefillPrice) && prefillPrice > 0
        ? { estimatedPriceAmount: prefillPrice }
        : {}),
      neededBy: "",
    },
  });

  const corridorRows = useMemo(() => corridors.data ?? [], [corridors.data]);
  const destinationCountries = useMemo(() => {
    const byId = new Map<string, (typeof corridorRows)[number]["destination"]>();
    for (const corridor of corridorRows) {
      byId.set(corridor.destination.id, corridor.destination);
    }
    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [corridorRows]);

  const destinationCountryId =
    useWatch({ control: form.control, name: "destinationCountryId" }) || null;
  const destinationCityId = useWatch({ control: form.control, name: "destinationCityId" }) || null;
  const destinationCountry =
    destinationCountries.find((country) => country.id === destinationCountryId) ?? null;

  const originOptionsForDestination = useMemo(() => {
    if (!destinationCountryId) return [];
    const byId = new Map<string, (typeof corridorRows)[number]["origin"]>();
    for (const corridor of corridorRows) {
      if (corridor.destination.id === destinationCountryId) {
        byId.set(corridor.origin.id, corridor.origin);
      }
    }
    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [corridorRows, destinationCountryId]);

  const productUrl = useWatch({ control: form.control, name: "productUrl" });
  const productName = useWatch({ control: form.control, name: "productName" });

  const normalizedProductUrl = productUrl?.trim() ?? "";
  const parsedProductUrl = useMemo(() => {
    if (!normalizedProductUrl) return null;
    try {
      const url = new URL(normalizedProductUrl);
      return url.protocol.startsWith("http") ? url : null;
    } catch {
      return null;
    }
  }, [normalizedProductUrl]);

  const resolverQuery = useQuery({
    queryKey: ["orders", "product-resolution", normalizedProductUrl, prefillPrice],
    queryFn: () =>
      productResolver.resolve({
        url: normalizedProductUrl,
        prefillName: productName,
        prefillPrice,
      }),
    enabled: !!parsedProductUrl,
    staleTime: 60_000,
  });

  const resolvedProduct =
    resolverQuery.data?.status === "resolved" ? resolverQuery.data.data : null;

  const detectedOrigin = useMemo(() => {
    if (!resolvedProduct?.purchaseCountryIso2) return null;
    const iso2 = resolvedProduct.purchaseCountryIso2.toUpperCase();
    return (
      originOptionsForDestination.find((country) => country.iso2.toUpperCase() === iso2) ??
      null
    );
  }, [originOptionsForDestination, resolvedProduct]);

  const isDetectedOriginStrict =
    !!resolvedProduct?.purchaseCountryIso2 && resolvedProduct.confidence === "high";

  const selectedOrigin = useMemo(() => {
    if (detectedOrigin) return detectedOrigin;
    if (!manualOriginCountryId) return null;
    return (
      originOptionsForDestination.find((origin) => origin.id === manualOriginCountryId) ?? null
    );
  }, [detectedOrigin, manualOriginCountryId, originOptionsForDestination]);

  const corridorAvailable =
    !!selectedOrigin &&
    !!destinationCountryId &&
    corridorRows.some(
      (corridor) =>
        corridor.origin.id === selectedOrigin.id &&
        corridor.destination.id === destinationCountryId,
    );

  const cities = useCities(destinationCountryId);

  const urlState: UrlAnalysisState = !normalizedProductUrl
    ? "idle"
    : !parsedProductUrl
      ? "invalid"
      : resolverQuery.isFetching
        ? "analyzing"
        : resolvedProduct
          ? "resolved"
          : "unresolved";

  useEffect(() => {
    if (!resolvedProduct) return;
    const nameState = form.getFieldState("productName");
    const priceState = form.getFieldState("estimatedPriceAmount");

    if (resolvedProduct.productName && !nameState.isDirty) {
      form.setValue("productName", resolvedProduct.productName, { shouldValidate: true });
    }
    if (
      typeof resolvedProduct.priceAmount === "number" &&
      Number.isFinite(resolvedProduct.priceAmount) &&
      !priceState.isDirty
    ) {
      form.setValue("estimatedPriceAmount", resolvedProduct.priceAmount, {
        shouldValidate: true,
      });
    }
  }, [form, resolvedProduct]);

  useEffect(() => {
    if (hasRestoredDestinationRef.current) return;
    if (!destinationCountries.length) return;
    if (form.getValues("destinationCountryId")) {
      hasRestoredDestinationRef.current = true;
      return;
    }

    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(DESTINATION_PREFERENCE_KEY);
      if (!raw) {
        hasRestoredDestinationRef.current = true;
        return;
      }

      const parsed = JSON.parse(raw) as Partial<DestinationPreference>;
      if (typeof parsed.countryId !== "string") {
        hasRestoredDestinationRef.current = true;
        return;
      }

      const countryExists = destinationCountries.some((country) => country.id === parsed.countryId);
      if (!countryExists) {
        hasRestoredDestinationRef.current = true;
        return;
      }

      form.setValue("destinationCountryId", parsed.countryId, { shouldValidate: false });
    } catch {
      // Ignore malformed local data and continue with empty defaults.
    } finally {
      hasRestoredDestinationRef.current = true;
    }
  }, [destinationCountries, form]);

  useEffect(() => {
    if (!hasRestoredDestinationRef.current) return;
    if (!destinationCountryId) return;
    if (form.getValues("destinationCityId")) return;
    if (!cities.data?.length) return;
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(DESTINATION_PREFERENCE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<DestinationPreference>;
      if (
        typeof parsed.countryId !== "string" ||
        typeof parsed.cityId !== "string" ||
        parsed.countryId !== destinationCountryId
      ) {
        return;
      }

      const cityExists = cities.data.some((city) => city.id === parsed.cityId);
      if (!cityExists) return;

      form.setValue("destinationCityId", parsed.cityId, { shouldValidate: false });
    } catch {
      // Ignore malformed local data and continue with manual selection.
    }
  }, [cities.data, destinationCountryId, form]);

  useEffect(() => {
    if (!destinationCountryId || !destinationCityId) return;
    if (typeof window === "undefined") return;

    const payload: DestinationPreference = {
      countryId: destinationCountryId,
      cityId: destinationCityId,
    };

    try {
      window.localStorage.setItem(DESTINATION_PREFERENCE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage failures (private mode/full quota) without blocking checkout flow.
    }
  }, [destinationCountryId, destinationCityId]);

  const price = useWatch({ control: form.control, name: "estimatedPriceAmount" });
  const quote = useQuery({
    queryKey: ["pricing", "quote", price, DEFAULT_SIZE],
    queryFn: () => ordersApi.quote(price, DEFAULT_SIZE),
    enabled: typeof price === "number" && Number.isFinite(price) && price >= 0,
    staleTime: 5 * 60_000,
  });

  const serviceAmount =
    quote.data && typeof price === "number"
      ? Math.max(0, quote.data.estimatedTotal - price)
      : null;
  const maxDeliveryDate = dateFromToday(MAX_DELIVERY_DAYS);

  function focusField(
    fieldName: "productName" | "estimatedPriceAmount",
    inputRef: React.RefObject<HTMLInputElement | null>,
  ) {
    form.setFocus(fieldName);

    requestAnimationFrame(() => {
      const input = inputRef.current;
      if (!input) return;
      input.focus({ preventScroll: true });
      input.scrollIntoView({ behavior: "smooth", block: "center" });
      if (fieldName === "estimatedPriceAmount") {
        input.select();
      }
    });
  }

  async function goToNextStep() {
    if (step === 0) {
      if (urlState === "analyzing") {
        toast.info("Estamos analizando el enlace. Espera un momento.");
        return;
      }

      const hasResolvedName = !!resolvedProduct?.productName;
      const hasResolvedPrice =
        typeof resolvedProduct?.priceAmount === "number" &&
        Number.isFinite(resolvedProduct.priceAmount) &&
        resolvedProduct.priceAmount > 0;
      const currentName = (form.getValues("productName") ?? "").trim();
      const currentPrice = form.getValues("estimatedPriceAmount");

      if (!hasResolvedName && currentName.length < 2) {
        focusField("productName", productNameInputRef);
        void form.trigger("productName");
        toast.info("Completa el nombre del producto para continuar.");
        return;
      }

      if (
        !hasResolvedPrice &&
        !(typeof currentPrice === "number" && Number.isFinite(currentPrice) && currentPrice > 0)
      ) {
        focusField("estimatedPriceAmount", estimatedPriceInputRef);
        void form.trigger("estimatedPriceAmount");
        toast.info("Ingresa el precio estimado para continuar.");
        return;
      }

      const valid = await form.trigger(["productUrl", "productName", "estimatedPriceAmount"]);
      if (!valid) return;
      setStep(1);
      return;
    }

    if (step === 1) {
      const valid = await form.trigger(["destinationCountryId", "destinationCityId", "neededBy"]);
      if (!valid) return;
      if (!selectedOrigin) {
        toast.error("Indica el pais de compra para continuar.");
        return;
      }
      if (!corridorAvailable) {
        form.setError("destinationCountryId", {
          message: "No operamos esta combinacion de compra y entrega.",
        });
        return;
      }
      setStep(2);
    }
  }

  function goToPreviousStep() {
    setStep((current) => (current === 0 ? 0 : ((current - 1) as FormStep)));
  }

  async function onSubmit(values: CreateOrderFormValues) {
    const originCountryId = selectedOrigin?.id ?? null;
    if (!originCountryId) {
      const message =
        urlState === "resolved"
          ? "No pudimos derivar la compra automaticamente para este destino."
          : "Indica el pais de compra para continuar.";
      toast.error(message);
      return;
    }

    if (!corridorAvailable) {
      form.setError("destinationCountryId", {
        message: "No operamos esta combinacion de compra y entrega.",
      });
      return;
    }

    try {
      const order = await ordersApi.create({
        originCountryId,
        destinationCountryId: values.destinationCountryId,
        destinationCityId: values.destinationCityId,
        productName: values.productName,
        productUrl: values.productUrl,
        estimatedPriceAmount: values.estimatedPriceAmount,
        estimatedPriceCurrency: "USD",
        sizeCategory: DEFAULT_SIZE,
        neededBy: values.neededBy ? new Date(values.neededBy).toISOString() : undefined,
      });
      toast.success("Pedido creado. Estamos buscando al mejor viajero.");
      router.replace(`/comprar/${order.id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        switch (error.code) {
          case "PROFILE_INCOMPLETE":
            toast.error("Completa tu perfil (nombre y telefono) para continuar.");
            router.push("/onboarding?next=/comprar/nuevo");
            return;
          case "CORRIDOR_NOT_ENABLED":
            form.setError("destinationCountryId", {
              message: "Aun no operamos esta ruta de compra y entrega.",
            });
            return;
          case "CITY_NOT_IN_DESTINATION_COUNTRY":
            form.setError("destinationCityId", {
              message: "La ciudad no pertenece al pais de destino.",
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
        <section className="rounded-[20px] border border-hairline bg-background p-4 sm:p-5">
          <ol className="grid gap-3 sm:grid-cols-3">
            {FORM_STEPS.map((item) => {
              const done = item.key < step;
              const active = item.key === step;
              return (
                <li
                  key={item.key}
                  className={`rounded-[14px] border p-3 transition-colors ${
                    active
                      ? "border-primary bg-primary/5"
                      : done
                        ? "border-semantic-up/40 bg-semantic-up/5"
                        : "border-hairline bg-surface-soft"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex size-7 items-center justify-center rounded-full text-xs font-semibold ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : done
                            ? "bg-semantic-up text-ink"
                            : "bg-background text-body-text"
                      }`}
                    >
                      {done ? <Check className="size-4" /> : item.key + 1}
                    </span>
                    <div>
                      <p className={`caption-strong ${active ? "text-ink" : "text-body-text"}`}>
                        {item.title}
                      </p>
                      <p className="caption text-body-text">{item.description}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {step === 0 && (
          <section className="space-y-4 rounded-[20px] border border-hairline bg-background p-5 sm:p-6">
            <div className="space-y-1">
              <h2 className="title-md text-ink">Que quieres traer</h2>
              <p className="body-sm text-body-text">
                Comparte el enlace del producto. Bringo intentara completar la informacion automaticamente.
              </p>
            </div>

            <FormField
              control={form.control}
              name="productUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Enlace del producto</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://www.apple.com/shop/buy-iphone"
                      className="h-12 rounded-[12px]"
                      {...field}
                    />
                  </FormControl>
                  {urlState === "idle" && (
                    <FormDescription>Comparte el enlace del producto.</FormDescription>
                  )}
                  {urlState === "analyzing" && (
                    <FormDescription>Analizando producto...</FormDescription>
                  )}
                  {urlState === "invalid" && (
                    <FormDescription className="text-semantic-down">Introduce un enlace válido.</FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {urlState === "unresolved" && (
              <div className="flex items-start gap-3 rounded-[12px] border border-semantic-down/30 bg-semantic-down/8 px-4 py-3">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-semantic-down" />
                <div className="space-y-1">
                  <p className="caption-strong text-ink">No pudimos extraer toda la informacion automaticamente</p>
                  <p className="caption text-body-text">
                    Completa manualmente el nombre y el precio estimado para continuar.
                  </p>
                </div>
              </div>
            )}

            {urlState === "resolved" && resolvedProduct && (
              <div className="rounded-[14px] border border-hairline bg-surface-soft p-4">
                <p className="caption-strong text-ink">Producto detectado</p>
                <div className="mt-2 space-y-1">
                  <p className="title-sm text-ink">{resolvedProduct.productName ?? "Nombre no detectado"}</p>
                  <p className="body-sm text-body-text">
                    {resolvedProduct.storeName ?? "Tienda no detectada"}
                  </p>
                  {resolvedProduct.purchaseCountryIso2 && (
                    <p className="body-sm text-body-text">
                      Compra en {isoToFlag(resolvedProduct.purchaseCountryIso2)} {resolvedProduct.purchaseCountryIso2}
                    </p>
                  )}
                  {typeof resolvedProduct.priceAmount === "number" && (
                    <p className="body-sm text-body-text">
                      Precio detectado: ${resolvedProduct.priceAmount.toFixed(2)} USD
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
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
                        name={field.name}
                        ref={(element) => {
                          field.ref(element);
                          productNameInputRef.current = element;
                        }}
                        onBlur={field.onBlur}
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimatedPriceAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio del producto (USD)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="1099.99"
                        className="h-12 rounded-[12px] font-mono"
                        name={field.name}
                        ref={(element) => {
                          field.ref(element);
                          estimatedPriceInputRef.current = element;
                        }}
                        onBlur={field.onBlur}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Si no se detecta automaticamente, ingresa aqui el precio aproximado.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="space-y-4 rounded-[20px] border border-hairline bg-background p-5 sm:p-6">
            <div className="space-y-1">
              <h2 className="title-md text-ink">Donde quieres recibirlo</h2>
              <p className="body-sm text-body-text">Solo indicas destino. La ruta se deriva automaticamente.</p>
            </div>

            <FormField
              control={form.control}
              name="destinationCountryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pais de entrega</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue("destinationCityId", "");
                      setManualOriginCountryId("");
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-12 w-full rounded-[12px]">
                        <SelectValue
                          placeholder={
                            corridors.isLoading
                              ? "Cargando destinos..."
                              : "¿En que pais quieres recibirlo?"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {destinationCountries.map((country) => (
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
                          placeholder={destinationCountryId ? "Elige la ciudad" : "Primero elige el pais"}
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
                  {destinationCountryId && destinationCityId && (
                    <FormDescription>
                      Guardaremos este pais y ciudad para prellenar tus proximos pedidos.
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {destinationCountryId && !detectedOrigin && (
              <FormItem>
                <FormLabel>Pais de compra</FormLabel>
                <Select
                  onValueChange={setManualOriginCountryId}
                  value={manualOriginCountryId}
                  disabled={isDetectedOriginStrict}
                >
                  <FormControl>
                    <SelectTrigger className="h-12 w-full rounded-[12px]">
                      <SelectValue placeholder="No lo detectamos: selecciona pais de compra" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {originOptionsForDestination.map((country) => (
                      <SelectItem key={country.id} value={country.id}>
                        {isoToFlag(country.iso2)} {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Solo aparece cuando no podemos inferir el pais de compra desde el enlace.
                </FormDescription>
              </FormItem>
            )}

            {detectedOrigin && destinationCountry && (
              <div className="rounded-[14px] bg-surface-soft p-4">
                <p className="caption-strong text-ink">Ruta derivada automaticamente</p>
                <p className="body-md mt-1 text-ink">
                  {isoToFlag(detectedOrigin.iso2)} {detectedOrigin.name} {"->"} {isoToFlag(destinationCountry.iso2)} {destinationCountry.name}
                </p>
                <p className="caption mt-1 text-body-text">
                  Detectamos {detectedOrigin.name} como pais de compra desde el enlace.
                </p>
              </div>
            )}

            <FormField
              control={form.control}
              name="neededBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha limite de entrega (opcional)</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="rounded-full"
                      onClick={() => {
                        form.setValue("neededBy", "", { shouldValidate: true });
                      }}
                    >
                      Sin fecha limite
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="rounded-full"
                      onClick={() => {
                        form.setValue("neededBy", dateFromToday(14), { shouldValidate: true });
                      }}
                    >
                      En 2 semanas
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="rounded-full"
                      onClick={() => {
                        form.setValue("neededBy", dateFromToday(30), { shouldValidate: true });
                      }}
                    >
                      En 1 mes
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="rounded-full"
                      onClick={() => {
                        form.setValue("neededBy", dateFromToday(60), { shouldValidate: true });
                      }}
                    >
                      En 2 meses
                    </Button>
                  </div>
                  <FormControl>
                    <Input
                      type="date"
                      min={dateFromToday(0)}
                      max={maxDeliveryDate}
                      className="h-12 rounded-[12px] font-mono"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value
                      ? "Usaremos esta fecha como prioridad de entrega."
                      : "Sin fecha limite. Recomendado: usa las opciones rapidas."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>
        )}

        {step === 2 && (
          <section className="space-y-4 rounded-[20px] border border-hairline bg-surface-strong p-5 sm:p-6">
            <div className="space-y-1">
              <h2 className="title-md text-ink">Resumen del pedido</h2>
              <p className="body-sm text-body-text">Revisa los datos antes de crear tu pedido.</p>
            </div>

            <div className="rounded-[14px] border border-hairline bg-background p-4">
              <p className="caption text-body-text">Producto</p>
              <p className="title-sm text-ink">{form.getValues("productName") || "Sin nombre"}</p>
              <p className="body-sm break-all text-body-text">{form.getValues("productUrl")}</p>
            </div>

            {selectedOrigin && destinationCountry && (
              <p className="body-sm text-body-text">
                Ruta: {isoToFlag(selectedOrigin.iso2)} {selectedOrigin.name} {"->"} {isoToFlag(destinationCountry.iso2)} {destinationCountry.name}
              </p>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="body-sm text-body-text">Producto</span>
                <span className="number-display !text-[18px] text-ink">
                  {typeof price === "number" ? `$${price.toFixed(2)}` : "-"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="body-sm text-body-text">Servicio Bringo</span>
                <span className="number-display !text-[18px] text-ink">
                  {typeof serviceAmount === "number" ? `$${serviceAmount.toFixed(2)}` : "-"}
                </span>
              </div>
              <div className="my-2 border-t border-hairline" />
              <div className="flex items-center justify-between">
                <span className="title-sm text-ink">Total estimado</span>
                <span className="number-display !text-[22px] text-primary">
                  {quote.data ? `$${quote.data.estimatedTotal.toFixed(2)} USD` : "-"}
                </span>
              </div>
            </div>

            <p className="caption text-body-text">
              El total es estimado y el precio final del producto puede cambiar en la tienda.
            </p>
          </section>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {step > 0 && (
            <Button
              type="button"
              variant="secondary"
              onClick={goToPreviousStep}
              className="h-12 rounded-full px-8 font-semibold"
            >
              Atras
            </Button>
          )}

          {step < 2 && (
            <Button
              type="button"
              onClick={goToNextStep}
              className="h-12 rounded-full px-8 font-semibold"
            >
              Continuar
            </Button>
          )}

          {step === 2 && (
            <Button
              type="submit"
              disabled={form.formState.isSubmitting || !corridorAvailable}
              className="h-12 rounded-full px-8 text-base font-semibold"
            >
              {form.formState.isSubmitting ? "Creando pedido..." : "Crear pedido"}
            </Button>
          )}

          <p className="body-sm text-body-text">
            Paso {step + 1} de {FORM_STEPS.length}
          </p>
        </div>

        {!corridorAvailable && step >= 1 && destinationCountryId && (
          <p className="caption text-semantic-down">
            No encontramos una ruta habilitada para este enlace y destino. Prueba con otro pais de entrega o enlace.
          </p>
        )}
      </form>
    </Form>
  );
}
