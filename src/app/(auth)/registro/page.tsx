import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="display-sm text-ink">Crea tu cuenta</h1>
        <p className="body-md text-body-text">
          Una sola cuenta para comprar y para viajar.
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
