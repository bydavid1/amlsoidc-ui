import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Página de verificación de F0 (temporal — F3 la reemplaza por la landing):
 * demuestra tokens del design system + conectividad real con la API.
 */

interface Corridor {
  origin: { iso2: string; name: string };
  destination: { iso2: string; name: string };
}

async function fetchCorridors(): Promise<{ ok: boolean; corridors: Corridor[] }> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3006/api/v1";
  try {
    const res = await fetch(`${base}/corridors`, { next: { revalidate: 60 } });
    const body = (await res.json()) as { success: boolean; data: Corridor[] };
    return { ok: body.success, corridors: body.data ?? [] };
  } catch {
    return { ok: false, corridors: [] };
  }
}

export default async function TokensDemoPage() {
  const api = await fetchCorridors();

  return (
    <main className="flex-1">
      {/* hero-band-dark: la firma del design system */}
      <section className="bg-surface-dark text-on-dark px-6 py-24">
        <div className="mx-auto max-w-[1200px] grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <Badge className="rounded-full bg-surface-dark-elevated text-on-dark caption-strong uppercase">
              F0 · Design tokens
            </Badge>
            <h1 className="display-mega">
              Trae lo que quieras, con quien ya viene.
            </h1>
            <p className="body-md text-on-dark-soft max-w-md">
              Bringo conecta compradores con viajeros que regresan a tu país. El
              sistema asigna automáticamente al mejor viajero.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button className="h-14 rounded-full px-8 text-base font-semibold">
                Crear mi pedido
              </Button>
              <Button
                variant="outline"
                className="h-14 rounded-full border-on-dark/40 bg-transparent px-8 text-base font-semibold text-on-dark hover:bg-on-dark/10 hover:text-on-dark"
              >
                Publicar mi viaje
              </Button>
            </div>
          </div>

          {/* product-ui-card-dark flotante */}
          <Card className="rounded-[24px] border-0 bg-surface-dark-elevated text-on-dark shadow-none">
            <CardContent className="space-y-4 p-8">
              <div className="flex items-center justify-between">
                <span className="title-md">Pedido · iPhone 15 Pro</span>
                <Badge className="rounded-full bg-surface-dark text-semantic-up caption-strong">
                  IN_TRANSIT
                </Badge>
              </div>
              <div className="flex items-baseline justify-between border-b border-on-dark/10 pb-3">
                <span className="body-sm text-on-dark-soft">Precio estimado</span>
                <span className="number-display">$1,099.99 USD</span>
              </div>
              <div className="flex items-baseline justify-between border-b border-on-dark/10 pb-3">
                <span className="body-sm text-on-dark-soft">Corredor</span>
                <span className="number-display">US → SV</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="body-sm text-on-dark-soft">Reputación del viajero</span>
                <span className="number-display text-semantic-up">5.00 ★</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* banda clara: verificación de tokens + API */}
      <section className="bg-surface-soft px-6 py-24">
        <div className="mx-auto max-w-[1200px] space-y-10">
          <h2 className="display-lg text-ink">Verificación de F0</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="rounded-[24px] border-hairline shadow-none">
              <CardContent className="space-y-3 p-8">
                <h3 className="title-md text-ink">Tipografía</h3>
                <p className="body-md text-body-text">
                  Inter 400/600 como sustituta documentada; números en{" "}
                  <span className="number-display text-ink">JetBrains Mono</span>.
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-[24px] border-hairline shadow-none">
              <CardContent className="space-y-3 p-8">
                <h3 className="title-md text-ink">Semánticos</h3>
                <p className="body-md">
                  <span className="text-semantic-up">DELIVERED ✓</span>
                  {" · "}
                  <span className="text-semantic-down">CANCELLED ✗</span>
                  {" · "}
                  <span className="text-body-text">solo texto, nunca fondo</span>
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-[24px] border-hairline shadow-none">
              <CardContent className="space-y-3 p-8">
                <h3 className="title-md text-ink">API {api.ok ? "conectada" : "sin conexión"}</h3>
                {api.ok ? (
                  <ul className="space-y-1">
                    {api.corridors.map((c) => (
                      <li key={`${c.origin.iso2}-${c.destination.iso2}`} className="number-display text-ink">
                        {c.origin.iso2} → {c.destination.iso2}
                        <span className="body-sm text-body-text">
                          {"  "}
                          ({c.origin.name} → {c.destination.name})
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="body-md text-semantic-down">
                    No se pudo leer /corridors — ¿backend arriba en :3006?
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
