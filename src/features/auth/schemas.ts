import { z } from "zod";

/** Vista del usuario autenticado tal como la entrega la API (/auth/me). */
export const authUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  roles: z.array(z.enum(["BUYER", "TRAVELER", "ADMIN"])),
  status: z.enum(["ACTIVE", "SUSPENDED"]),
});
export type AuthUser = z.infer<typeof authUserSchema>;
export type Role = AuthUser["roles"][number];

export const authPayloadSchema = z.object({
  user: authUserSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
});
export type AuthPayload = z.infer<typeof authPayloadSchema>;

/** Mismas reglas que los DTOs del backend (RegisterDto / LoginDto). */
export const registerFormSchema = z
  .object({
    email: z.email("Ingresa un correo válido"),
    password: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .max(72, "Máximo 72 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });
export type RegisterFormValues = z.infer<typeof registerFormSchema>;

export const loginFormSchema = z.object({
  email: z.email("Ingresa un correo válido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});
export type LoginFormValues = z.infer<typeof loginFormSchema>;
