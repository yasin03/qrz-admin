"use client";

import Link from "next/link";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { ChevronRight, Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type IconType = ComponentType<{ className?: string; style?: React.CSSProperties }>;

type StatKartProps = {
  icon: IconType;
  color: string;
  title: string;
  value: string;
  sub?: string | null;
  href?: string;
  loading?: boolean;
  className?: string;
  right?: ReactNode;
  /**
   * stacked: ikon + başlık üstte, değer altında (varsayılan).
   * inline: büyük ikon solda, başlık/alt metin ortada, büyük değer en sağda.
   */
  layout?: "stacked" | "inline";
};

// Dashboard'daki tekil özet kartı. href verilirse ilgili sayfaya gider.
export function StatKart({
  icon: Icon,
  color,
  title,
  value,
  sub,
  href,
  loading,
  className,
  right,
  layout = "stacked",
}: StatKartProps) {
  const inlineContent = (
    <div className="flex items-center gap-3">
      <div
        className="flex size-12 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color}1A` }}
      >
        <Icon className="size-6" style={{ color }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-muted-foreground">
          {title}
        </div>
        {loading ? (
          <Skeleton className="mt-1.5 h-3 w-3/4" />
        ) : sub ? (
          <div className="mt-0.5 truncate text-xs text-muted-foreground">
            {sub}
          </div>
        ) : null}
      </div>
      {loading ? (
        <Skeleton className="h-8 w-12 shrink-0" />
      ) : (
        <div className="shrink-0 text-3xl font-bold tabular-nums text-foreground">
          {value}
        </div>
      )}
      {right}
    </div>
  );

  const stackedContent = (
    <>
      <div className="flex items-center gap-2">
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}1A` }}
        >
          <Icon className="size-4" style={{ color }} />
        </div>
        <span className="flex-1 truncate text-xs font-medium text-muted-foreground">
          {title}
        </span>
        {right}
      </div>

      {loading ? (
        <div className="mt-3 space-y-1.5">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-3 w-full" />
        </div>
      ) : (
        <>
          <div className="mt-2.5 truncate text-xl font-bold tabular-nums text-foreground">
            {value}
          </div>
          {sub ? (
            <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
              {sub}
            </div>
          ) : null}
        </>
      )}
    </>
  );

  const content = layout === "inline" ? inlineContent : stackedContent;

  const base = cn(
    "rounded-xl border border-border bg-card p-4 transition-shadow",
    href && "hover:shadow-md",
    className,
  );

  return href ? (
    <Link href={href} className={cn("block", base)}>
      {content}
    </Link>
  ) : (
    <div className={base}>{content}</div>
  );
}

export function BolumBaslik({ title }: { title: string }) {
  return <h2 className="text-base font-semibold text-foreground">{title}</h2>;
}

type ListeProps = {
  title: string;
  items: { key: string; title: string; sub?: string | null; right?: string | null; href?: string }[];
  /** Başlığın yanında gösterilen kısa bilgi (örn. toplam sayı) */
  badge?: string | null;
  /** Liste boşken gösterilecek metin */
  bos?: string;
  /** Listenin altında (örn. "+5 kişi daha") */
  footer?: string | null;
  className?: string;
};

export function ListeKart({ title, items, badge, bos, footer, className }: ListeProps) {
  return (
    <section className={cn("rounded-xl border border-border bg-card", className)}>
      <header className="flex items-center gap-2 border-b border-border px-4 py-3 text-sm font-semibold">
        <span className="flex-1 truncate">{title}</span>
        {badge ? (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
            {badge}
          </span>
        ) : null}
      </header>
      {items.length === 0 && bos ? (
        <p className="px-4 py-6 text-center text-xs text-muted-foreground">{bos}</p>
      ) : null}
      <ul>
        {items.map((item) => {
          const inner = (
            <>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{item.title}</div>
                {item.sub ? (
                  <div className="truncate text-xs text-muted-foreground">{item.sub}</div>
                ) : null}
              </div>
              {item.right ? (
                <span className="text-xs font-semibold text-muted-foreground">{item.right}</span>
              ) : null}
              {item.href ? <ChevronRight className="size-4 text-muted-foreground" /> : null}
            </>
          );
          const cls =
            "flex items-center gap-3 border-b border-border/60 px-4 py-2.5 last:border-b-0";
          return (
            <li key={item.key}>
              {item.href ? (
                <Link href={item.href} className={cn(cls, "hover:bg-muted/50")}>
                  {inner}
                </Link>
              ) : (
                <div className={cls}>{inner}</div>
              )}
            </li>
          );
        })}
      </ul>
      {footer ? (
        <p className="border-t border-border/60 px-4 py-2 text-xs text-muted-foreground">{footer}</p>
      ) : null}
    </section>
  );
}

// Sayfa başlığının sağındaki açık tarih ve canlı saat. Saat sunucu/istemci farkı
// yüzünden hydration uyuşmazlığı oluşturmasın diye yalnızca istemcide çizilir.
export function TarihSaat() {
  const [simdi, setSimdi] = useState<Date | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    const guncelle = () => setSimdi(new Date());
    guncelle();
    // Dakika başına hizalanıp her dakika güncellenir
    const timeout = setTimeout(() => {
      guncelle();
      interval = setInterval(guncelle, 60_000);
    }, 60_000 - (Date.now() % 60_000));
    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, []);

  if (!simdi) return <Skeleton className="h-7 w-64" />;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <p className="text-sm font-semibold text-foreground sm:text-base">
        {format(simdi, "d MMMM yyyy", { locale: tr })}
        <span className="font-normal text-muted-foreground">
          {" "}
          · {format(simdi, "EEEE", { locale: tr })}
        </span>
      </p>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-0.5 text-sm font-semibold tabular-nums text-foreground">
        <Clock className="size-3.5 text-muted-foreground" />
        {format(simdi, "HH:mm")}
      </span>
    </div>
  );
}

