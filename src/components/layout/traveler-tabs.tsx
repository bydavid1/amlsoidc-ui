"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/viajar", label: "Mis viajes" },
  { href: "/viajar/ofertas", label: "Ofertas y encargos" },
];

/** Sub-navegación del espacio Traveler (pills). */
export function TravelerTabs() {
  const pathname = usePathname();
  return (
    <div className="flex gap-2">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            "rounded-full px-5 py-2.5 text-sm font-semibold transition-colors",
            pathname === tab.href
              ? "bg-primary text-primary-foreground"
              : "bg-surface-strong text-ink hover:bg-hairline",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
