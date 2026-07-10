"use client";

import { MessageCircleQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Único canal de contacto del modelo hub: cualquier consulta va con Bringo.
 * (Sin chat buyer↔traveler por decisión de negocio.)
 */
export function SupportButton({ context }: { context?: string }) {
  const phone = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP;
  if (!phone) return null;

  const text = encodeURIComponent(
    context ? `Hola Bringo, necesito ayuda con: ${context}` : "Hola Bringo, necesito ayuda",
  );

  return (
    <Button
      asChild
      variant="ghost"
      className="h-11 rounded-full px-5 font-semibold text-body-text"
    >
      <a
        href={`https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${text}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <MessageCircleQuestion className="size-4" /> Ayuda de Bringo
      </a>
    </Button>
  );
}
