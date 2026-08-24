import {
  BadgeCheck,
  Check,
  Lock,
  Package,
  Plane,
  ShieldCheck,
  Star,
  Tags,
  UserCheck,
} from "lucide-react";
import Image from "next/image";
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
  "Comparte el link del producto que quieres, de cualquier tienda en Estados Unidos.",
  "Un viajero verificado que ya va hacia tu país lo toma para traerlo.",
  "Sigue cada paso desde tu cuenta: comprado, en camino, contigo.",
  "Confirma que todo llegó bien — recién ahí le pagamos al viajero.",
];

const TRAVELER_STEPS = [
  "Verificamos quién eres (documento y selfie), así los compradores confían en ti.",
  "Publica tu viaje: de dónde sales, a dónde llegas y cuándo.",
  "Elige, entre los pedidos disponibles en tu ruta, los que quieras traer.",
  "Entrega y te pagamos automáticamente — sin negociar, sin esperar.",
];

const TRUST_POINTS = [
  {
    icon: UserCheck,
    title: "Viajeros verificados",
    body: "Antes de llevar su primer encargo, cada viajero pasa por una verificación de identidad con documento y selfie.",
  },
  {
    icon: Lock,
    title: "Tu pago, protegido",
    body: "El viajero no recibe su parte hasta que tú confirmas que el producto llegó en buen estado.",
  },
  {
    icon: ShieldCheck,
    title: "Privacidad primero",
    body: "Comprador y viajero nunca se comparten teléfono ni datos personales. Todo pasa por Bringo.",
  },
  {
    icon: BadgeCheck,
    title: "Soporte si algo falla",
    body: "Si un pedido tiene un problema, lo reportas desde tu cuenta y un equipo real lo revisa.",
  },
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
            <p className="body-md max-w-lg text-on-dark-soft">
              Pide un producto de Estados Unidos y un viajero verificado que ya
              va para tu país te lo trae. Sigues cada paso desde tu cuenta, y
              tu pago queda protegido hasta que confirmas que llegó.
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
                <p className="caption text-on-dark-soft">Identidad verificada</p>
                <p className="title-sm">Viajero verificado ✓</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ===== cómo funciona (banda blanca) ===== */}
      <section id="como-funciona" className="bg-background px-6 py-24">
        <div className="mx-auto max-w-[1200px] space-y-12">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="max-w-lg space-y-3">
              <h2 className="display-lg text-ink">Cómo funciona</h2>
              <p className="body-md text-body-text">
                Dos maneras de participar: pides un producto, o lo traes en un
                viaje que ya tenías planeado. Sin subastas ni negociaciones —
                el precio se calcula solo y es el mismo para todos.
              </p>
            </div>
            <div className="relative aspect-[1344/768] w-full overflow-hidden rounded-[24px] bg-surface-soft">
              <Image
                src="/bringo-traveler.png"
                alt="Viajero con maleta y un paquete Bringo en el aeropuerto"
                fill
                className="object-contain"
                sizes="(min-width: 1024px) 50vw, 100vw"
                priority
              />
            </div>
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
                icon: Tags,
                title: "Sin subastas ni regateo",
                body: "El precio se calcula al momento y es igual para todos. Tú decides si te conviene, nadie negocia aparte.",
              },
              {
                icon: Check,
                title: "Seguimiento paso a paso",
                body: "Cada pedido tiene un historial claro: comprado, en camino, entregado. Nunca te quedas sin saber en qué va.",
              },
              {
                icon: Star,
                title: "Reputación que importa",
                body: "Cada entrega deja una calificación. Los viajeros con mejor reputación consiguen más encargos.",
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

      {/* ===== confianza (banda gris suave) ===== */}
      <section className="bg-surface-soft px-6 py-24">
        <div className="mx-auto max-w-[1200px] space-y-12">
          <div className="max-w-2xl space-y-3">
            <h2 className="display-lg text-ink">Por qué confiar en Bringo</h2>
            <p className="body-md text-body-text">
              No eres el primero en pedirle a un desconocido que te traiga
              algo. Por eso construimos protecciones reales, no solo promesas.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST_POINTS.map((point) => (
              <Card key={point.title} className="rounded-[24px] border-hairline bg-background shadow-none">
                <CardContent className="space-y-3 p-8">
                  <span className="flex size-12 items-center justify-center rounded-full bg-surface-strong">
                    <point.icon className="size-6 text-primary" />
                  </span>
                  <h3 className="title-md text-ink">{point.title}</h3>
                  <p className="body-md text-body-text">{point.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="relative aspect-[1344/768] w-full overflow-hidden rounded-[24px] bg-background">
            <Image
              src="/buyer.png"
              alt="Comprador recibiendo su paquete Bringo en casa"
              fill
              className="object-contain"
              sizes="(min-width: 1024px) 1200px, 100vw"
            />
          </div>
        </div>
      </section>

      {/* ===== corredores (banda blanca, datos reales) ===== */}
      <section id="corredores" className="bg-background px-6 py-24">
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
