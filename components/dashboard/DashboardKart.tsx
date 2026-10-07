"use client";

import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";

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
}: StatKartProps) {
  const content = (
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

  const base = cn(
    "rounded-xl border border-border bg-card p-4 transition-shadow",
    href && "hover:shadow-md",
    className,
  );

  return href ? (
    <Link href={href} className={cn(base, "block")}>
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
};

export function ListeKart({ title, items }: ListeProps) {
  return (
    <section className="rounded-xl border border-border bg-card">
      <header className="border-b border-border px-4 py-3 text-sm font-semibold">
        {title}
      </header>
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
    </section>
  );
}
