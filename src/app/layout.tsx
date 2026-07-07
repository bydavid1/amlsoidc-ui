import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "./providers";

// Sustitutas documentadas del design system (docs/DESIGN-coinbase.md):
// CoinbaseDisplay/Sans → Inter · CoinbaseMono → JetBrains Mono
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Bringo — Trae lo que quieras, con quien ya viene",
    template: "%s · Bringo",
  },
  description:
    "Plataforma logística colaborativa: conecta compradores con viajeros que regresan a tu país.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={cn("h-full antialiased font-sans", inter.variable, jetbrainsMono.variable)}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
