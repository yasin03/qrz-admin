import Image from "next/image";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { YASAL } from "@/constants/yasal";

// (global) altındaki sayfalar login gerektirmez; her yeni sayfanın yolu proxy.ts ve app-shell.tsx PUBLIC_PATHS listesine eklenmeli
// Arka plan login sayfasıyla aynı: ışık lekeleri + nokta deseni
export default function GlobalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-sidebar-accent dark:bg-background">
      {/* Dekoratif ışık lekeleri */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-info/25 blur-3xl lg:size-96 dark:bg-info/20"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 size-64 rounded-full bg-info/10 blur-3xl lg:size-80 dark:bg-info/5"
      />

      {/* İnce nokta deseni */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.15] dark:opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(currentColor 3px, transparent 1px)",
          backgroundSize: "24px 24px",
          color: "var(--sidebar-foreground)",
        }}
      />

      <main className="relative z-10 flex min-h-0 flex-1 justify-center px-4 pt-6 pb-4 sm:px-6 sm:pt-10">
        {/* Sayfa sabit kalır, yalnızca kartın içeriği kayar */}
        <Card className="max-h-full w-full max-w-4xl gap-0 py-0 text-base shadow-lg dark:shadow-2xl dark:shadow-black/40 dark:ring-white/10">
          <div className="shrink-0 border-b px-6 py-4 sm:px-10">
            {/* Sidebar'daki gibi: açık temada logo-pri, koyu temada logo-sec */}
            <Link
              href="/yasal"
              aria-label="QR Zaman"
              className="relative mx-auto block h-12 w-40 sm:h-14 sm:w-48"
            >
              <Image
                src="/logos/logo-pri.png"
                alt="QR Zaman"
                fill
                sizes="192px"
                className="object-contain dark:hidden"
                priority
              />
              <Image
                src="/logos/logo-sec.png"
                alt="QR Zaman"
                fill
                sizes="192px"
                className="hidden object-contain dark:block"
                priority
              />
            </Link>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-8 sm:px-10">
            {children}
          </div>
        </Card>
      </main>

      <footer className="relative z-10 shrink-0 px-4 pb-4 text-center text-sm text-muted-foreground">
        © {YASAL.SIRKET_UNVANI} · QR Zaman Personel Yönetim Sistemi
      </footer>
    </div>
  );
}
