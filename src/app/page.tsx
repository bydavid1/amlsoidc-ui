import { Check, Package, Plane, Search, Star } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import { MarketingNav } from "@/components/layout/marketing-nav";

interface Corridor {
  origin: { iso2: string; name: string };
  destination: { iso2: string; name: string };
}

async function fetchCorridors(): Promise<Corridor[]> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3006/api/v1";
  try {
    const res = await fetch(`${base}/corridors`, { next: { revalidate: 300 } });
    const body = (await res.json()) as { success: boolean; data: Corridor[] };
    return body.success ? body.data : [];
  } catch {
    return [];
  }
}

const BUYER_STEPS = [
  "Crea tu pedido con el enlace del producto",
  "El sistema asigna automáticamente al mejor viajero",
  "Compra el producto y envíalo a la dirección del viajero",
  "Recíbelo en tu ciudad y confirma la entrega",
];

const TRAVELER_STEPS = [
  "Publica tu viaje: ruta, fecha y capacidad",
  "Explora los encargos disponibles y elige los que te quepan",
  "Recibe los paquetes y viaja como siempre",
  "Entrega, califica y construye tu reputación",
];

export default async function LandingPage() {
  const corridors = await fetchCorridors();

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />

      {/* ===== hero-band-dark (firma del design system) ===== */}
      <section className="bg-surface-dark px-6 pb-24 pt-32 text-on-dark">
        <div className="mx-auto grid max-w-[1200px] gap-14 lg:grid-cols-2 lg:items-center">
          <div className="space-y-7">
            <h1 className="display-mega">
              Trae lo que quieras, con quien ya viene.
            </h1>
            <p className="body-md max-w-md text-on-dark-soft">
              Pide productos de otro país y un viajero verificado que ya regresa
              te los trae. Sin intermediarios de siempre, con seguimiento paso a
              paso.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="h-14 rounded-full px-8 text-base font-semibold">
                <Link href="/registro">Crear mi pedido</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-14 rounded-full border-on-dark/40 bg-transparent px-8 text-base font-semibold text-on-dark hover:bg-on-dark/10 hover:text-on-dark"
              >
                <Link href="/registro">Quiero llevar encargos</Link>
              </Button>
            </div>
          </div>

          {/* product-ui-card-dark: mockup del producto real */}
          <div className="relative">
            <Card className="rounded-[24px] border-0 bg-surface-dark-elevated text-on-dark shadow-none">
              <CardContent className="space-y-4 p-8">
                <div className="flex items-center justify-between">
                  <span className="title-md">iPhone 15 Pro</span>
                  <Badge className="rounded-full bg-surface-dark caption-strong text-primary">
                    EN CAMINO
                  </Badge>
                </div>
                <div className="flex items-baseline justify-between border-b border-on-dark/10 pb-3">
                  <span className="body-sm text-on-dark-soft">Ruta</span>
                  <span className="number-display">US → SV</span>
                </div>
                <div className="flex items-baseline justify-between border-b border-on-dark/10 pb-3">
                  <span className="body-sm text-on-dark-soft">Precio estimado</span>
                  <span className="number-display">$1,099.99</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="body-sm text-on-dark-soft">Viajero</span>
                  <span className="number-display text-semantic-up">
                    <Star className="mr-1 inline size-4 fill-current" />
                    5.00
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className="absolute -bottom-8 -left-4 hidden w-64 rotate-[-3deg] rounded-[24px] border-0 bg-surface-dark-elevated text-on-dark shadow-none lg:block">
              <CardContent className="space-y-1 p-6">
                <p className="caption text-on-dark-soft">Asignación automática</p>
                <p className="title-sm">El sistema eligió a tu viajero ✓</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ===== cómo funciona (banda blanca) ===== */}
      <section id="como-funciona" className="bg-background px-6 py-24">
        <div className="mx-auto max-w-[1200px] space-y-12">
          <div className="max-w-2xl space-y-3">
            <h2 className="display-lg text-ink">Cómo funciona</h2>
            <p className="body-md text-body-text">
              Un solo flujo, dos maneras de participar. Tú no eliges al viajero:
              nuestro sistema encuentra automáticamente al mejor según fecha,
              capacidad y reputación.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-[24px] border-hairline shadow-none">
              <CardContent className="space-y-5 p-8">
                <span className="flex size-12 items-center justify-center rounded-full bg-surface-strong">
                  <Package className="size-6 text-primary" />
                </span>
                <h3 className="title-lg text-ink">Para compradores</h3>
                <ol className="space-y-3">
                  {BUYER_STEPS.map((step, i) => (
                    <li key={step} className="flex gap-3">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-strong caption-strong text-ink">
                        {i + 1}
                      </span>
                      <span className="body-md text-body-text">{step}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
            <Card className="rounded-[24px] border-hairline shadow-none">
              <CardContent className="space-y-5 p-8">
                <span className="flex size-12 items-center justify-center rounded-full bg-surface-strong">
                  <Plane className="size-6 text-primary" />
                </span>
                <h3 className="title-lg text-ink">Para viajeros</h3>
                <ol className="space-y-3">
                  {TRAVELER_STEPS.map((step, i) => (
                    <li key={step} className="flex gap-3">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-strong caption-strong text-ink">
                        {i + 1}
                      </span>
                      <span className="body-md text-body-text">{step}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Search,
                title: "Matching automático",
                body: "Un algoritmo transparente elige al mejor viajero por fecha, capacidad y reputación. Nada de regateos.",
              },
              {
                icon: Check,
                title: "Seguimiento paso a paso",
                body: "Cada pedido tiene un historial verificable: compra, recepción, viaje y entrega.",
              },
              {
                icon: Star,
                title: "Reputación que importa",
                body: "Compradores y viajeros se califican mutuamente en cada entrega completada.",
              },
            ].map((f) => (
              <Card key={f.title} className="rounded-[24px] border-hairline shadow-none">
                <CardContent className="space-y-3 p-8">
                  <f.icon className="size-6 text-primary" />
                  <h3 className="title-md text-ink">{f.title}</h3>
                  <p className="body-md text-body-text">{f.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== corredores (banda gris suave, datos reales) ===== */}
      <section id="corredores" className="bg-surface-soft px-6 py-24">
        <div className="mx-auto max-w-[1200px] space-y-10">
          <div className="max-w-2xl space-y-3">
            <h2 className="display-lg text-ink">Rutas disponibles</h2>
            <p className="body-md text-body-text">
              Empezamos con un corredor y creceremos país por país.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {corridors.map((c) => (
              <Card
                key={`${c.origin.iso2}-${c.destination.iso2}`}
                className="rounded-[24px] border-hairline bg-background shadow-none"
              >
                <CardContent className="space-y-2 p-8">
                  <p className="number-display text-ink">
                    {c.origin.iso2} → {c.destination.iso2}
                  </p>
                  <p className="body-md text-body-text">
                    {c.origin.name} → {c.destination.name}
                  </p>
                  <Badge className="rounded-full bg-surface-strong caption-strong text-semantic-up">
                    ACTIVA
                  </Badge>
                </CardContent>
              </Card>
            ))}
            <Card className="rounded-[24px] border-dashed border-hairline bg-transparent shadow-none">
              <CardContent className="flex h-full flex-col justify-center space-y-2 p-8">
                <p className="title-md text-ink">Más rutas pronto</p>
                <p className="body-md text-body-text">
                  España, México, Canadá y más países están en camino.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ===== cta-band-dark ===== */}
      <section className="bg-surface-dark px-6 py-24 text-center text-on-dark">
        <div className="mx-auto max-w-[720px] space-y-7">
          <h2 className="display-lg">Tu próximo pedido ya tiene quién lo traiga.</h2>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild className="h-14 rounded-full px-8 text-base font-semibold">
              <Link href="/registro">Empezar ahora</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-14 rounded-full border-on-dark/40 bg-transparent px-8 text-base font-semibold text-on-dark hover:bg-on-dark/10 hover:text-on-dark"
            >
              <Link href="/login">Ya tengo cuenta</Link>
            </Button>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
