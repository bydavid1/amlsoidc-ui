import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="border-t border-hairline bg-background px-6 py-16">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="title-md font-bold text-primary">bringo</p>
          <p className="body-sm text-body-text max-w-xs">
            Logística colaborativa entre quienes compran y quienes viajan.
          </p>
        </div>
        <nav className="grid grid-cols-2 gap-x-16 gap-y-2">
          <a href="#como-funciona" className="body-sm text-body-text hover:text-ink">
            Cómo funciona
          </a>
          <a href="#corredores" className="body-sm text-body-text hover:text-ink">
            Rutas disponibles
          </a>
          <Link href="/registro" className="body-sm text-body-text hover:text-ink">
            Crear cuenta
          </Link>
          <Link href="/login" className="body-sm text-body-text hover:text-ink">
            Iniciar sesión
          </Link>
        </nav>
      </div>
      <div className="mx-auto mt-12 max-w-[1200px] border-t border-hairline-soft pt-6">
        <p className="caption text-muted-foreground">
          © {new Date().getFullYear()} Bringo. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
