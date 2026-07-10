"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
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
import { apiPatch } from "@/lib/api/client";
import { ApiError } from "@/lib/api/types";
import { useAuth } from "../auth-provider";

const profileFormSchema = z.object({
  firstName: z.string().min(2, "Mínimo 2 caracteres").max(60),
  phone: z
    .string()
    .regex(/^\+?[0-9\s-]{8,20}$/, "Ingresa un teléfono válido (ej. +503 7777 8888)"),
});
type ProfileFormValues = z.infer<typeof profileFormSchema>;

/**
 * Perfil mínimo del modelo hub: Bringo necesita nombre y teléfono para
 * coordinar contigo. Requerido antes de crear pedidos o publicar viajes.
 */
export function ProfileForm() {
  const { user, refreshUser } = useAuth();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    values: {
      firstName: user?.firstName ?? "",
      phone: user?.phone ?? "",
    },
  });

  async function onSubmit(values: ProfileFormValues) {
    try {
      await apiPatch("/users/me", values);
      await refreshUser();
      toast.success("Perfil actualizado");
    } catch (error) {
      if (error instanceof ApiError && error.code === "VALIDATION_ERROR") {
        for (const d of error.validationDetails) {
          form.setError(d.field as keyof ProfileFormValues, {
            message: d.errors.join(". "),
          });
        }
        return;
      }
      toast.error("No pudimos guardar tu perfil.");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Carlos" className="h-12 rounded-[12px]" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono / WhatsApp</FormLabel>
              <FormControl>
                <Input
                  placeholder="+503 7777 8888"
                  className="h-12 rounded-[12px] font-mono"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Solo Bringo lo usa para coordinar contigo. Nunca se comparte con
                otros usuarios.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="h-12 rounded-full px-8 font-semibold"
        >
          {form.formState.isSubmitting ? "Guardando…" : "Guardar perfil"}
        </Button>
      </form>
    </Form>
  );
}
