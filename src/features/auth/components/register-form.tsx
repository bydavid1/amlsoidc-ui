"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/types";
import { useAuth } from "../auth-provider";
import { RegisterFormValues, registerFormSchema } from "../schemas";

export function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(values: RegisterFormValues) {
    try {
      await register(values.email, values.password);
      router.replace("/onboarding");
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === "EMAIL_ALREADY_REGISTERED") {
          form.setError("email", { message: "Este correo ya está registrado." });
          return;
        }
        if (error.code === "VALIDATION_ERROR") {
          // detalle por campo directo del backend
          for (const detail of error.validationDetails) {
            if (detail.field === "email" || detail.field === "password") {
              form.setError(detail.field, { message: detail.errors.join(". ") });
            }
          }
          return;
        }
        if (error.code === "RATE_LIMITED") {
          toast.error("Demasiados intentos. Espera unos minutos.");
          return;
        }
      }
      toast.error("No pudimos crear tu cuenta. Intenta de nuevo.");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo electrónico</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="tu@correo.com"
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
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
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
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar contraseña</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  className="h-12 rounded-[12px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="h-12 w-full rounded-full text-base font-semibold"
        >
          {form.formState.isSubmitting ? "Creando cuenta…" : "Crear cuenta"}
        </Button>
        <p className="body-sm text-body-text text-center">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-semibold text-primary">
            Inicia sesión
          </Link>
        </p>
      </form>
    </Form>
  );
}
