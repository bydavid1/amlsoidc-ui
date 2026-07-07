"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { LoginFormValues, loginFormSchema } from "../schemas";

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    try {
      await login(values.email, values.password);
      router.replace(searchParams.get("next") ?? "/onboarding");
    } catch (error) {
      if (error instanceof ApiError) {
        // la UI programa contra error.code, nunca contra message
        switch (error.code) {
          case "INVALID_CREDENTIALS":
            form.setError("root", { message: "Correo o contraseña incorrectos." });
            return;
          case "USER_SUSPENDED":
            form.setError("root", {
              message: "Tu cuenta está suspendida. Contacta a soporte.",
            });
            return;
          case "RATE_LIMITED":
            toast.error("Demasiados intentos. Espera unos minutos.");
            return;
        }
      }
      toast.error("No pudimos iniciar sesión. Intenta de nuevo.");
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
                  autoComplete="current-password"
                  className="h-12 rounded-[12px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {form.formState.errors.root && (
          <p className="body-sm text-semantic-down" role="alert">
            {form.formState.errors.root.message}
          </p>
        )}
        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="h-12 w-full rounded-full text-base font-semibold"
        >
          {form.formState.isSubmitting ? "Entrando…" : "Iniciar sesión"}
        </Button>
        <p className="body-sm text-body-text text-center">
          ¿Aún no tienes cuenta?{" "}
          <Link href="/registro" className="font-semibold text-primary">
            Regístrate
          </Link>
        </p>
      </form>
    </Form>
  );
}
