import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface-soft">
      <header className="flex h-16 items-center px-6">
        <Link href="/" className="title-md font-bold text-primary">
          bringo
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md rounded-[24px] border border-hairline bg-card p-8 sm:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
