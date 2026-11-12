import { cn } from "@/lib/utils";
import type { TakvimGunu } from "@/modules/core/types/takvim";

import { TIP_CHIP, TIP_DOT, TIP_ETIKET } from "./takvim-utils";

type Props = {
  gun: TakvimGunu;
  /** compact: ay grid'indeki tek satırlık çip. */
  compact?: boolean;
};

export function TakvimEtkinlik({ gun, compact }: Props) {
  const label = gun.tahmini ? `${gun.name} (tahmini)` : gun.name;

  if (compact) {
    return (
      <div
        title={`${label} · ${TIP_ETIKET[gun.type]}`}
        className={cn(
          "truncate rounded px-1.5 py-0.5 text-[11px] leading-tight font-medium",
          TIP_CHIP[gun.type],
        )}
      >
        {label}
      </div>
    );
  }

  return (
    <div className={cn("rounded-md px-2.5 py-2 text-xs", TIP_CHIP[gun.type])}>
      <div className="font-medium">{label}</div>
      <div className="mt-0.5 opacity-80">{TIP_ETIKET[gun.type]}</div>
    </div>
  );
}

export function TakvimLejant({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground", className)}>
      {(Object.keys(TIP_ETIKET) as (keyof typeof TIP_ETIKET)[]).map((tip) => (
        <span key={tip} className="inline-flex items-center gap-1.5">
          <span className={cn("size-2 rounded-full", TIP_DOT[tip])} />
          {TIP_ETIKET[tip]}
        </span>
      ))}
    </div>
  );
}
