"use client";

import type { ReactNode } from "react";
import { CalendarCheck, CircleAlert, RotateCcw, Wallet } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCrmFinansOzet } from "@/modules/crm/hooks/use-finans";
import { paraFormat } from "@/modules/crm/lib/teklif";

function Kart({
  baslik,
  deger,
  aciklama,
  ikon,
  yukleniyor,
  className,
}: {
  baslik: string;
  deger: string;
  aciklama: string;
  ikon: ReactNode;
  yukleniyor: boolean;
  className?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border bg-card p-4">
      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", className)}>{ikon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{baslik}</p>
        {yukleniyor ? (
          <Skeleton className="mt-1 h-6 w-28" />
        ) : (
          <p className="truncate text-lg font-semibold tabular-nums">{deger}</p>
        )}
        <p className="text-xs text-muted-foreground">{aciklama}</p>
      </div>
    </div>
  );
}

/** Finans sekmesi üstündeki özet: TL karşılıkları (alacak satış kuruyla, tahsilat tahsilat günü kuruyla). */
export function FinansOzetKartlari() {
  const { data, isLoading } = useCrmFinansOzet();

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Kart
        baslik="Toplam Alacak"
        deger={paraFormat(data?.ToplamAlacakTL ?? 0, "TRY")}
        aciklama="Geçerli satışların açık kalanı"
        ikon={<Wallet className="size-5" />}
        className="bg-primary/10 text-primary"
        yukleniyor={isLoading}
      />
      <Kart
        baslik="Bu Ay Tahsilat"
        deger={paraFormat(data?.BuAyTahsilatTL ?? 0, "TRY")}
        aciklama="İadeler düşülmüş"
        ikon={<CalendarCheck className="size-5" />}
        className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
        yukleniyor={isLoading}
      />
      <Kart
        baslik="Ödenmemiş Satış"
        deger={`${data?.OdenmemisSatisSayisi ?? 0} satış`}
        aciklama="Kalanı olan geçerli satışlar"
        ikon={<CircleAlert className="size-5" />}
        className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
        yukleniyor={isLoading}
      />
      <Kart
        baslik="İade Bekleyen"
        deger={`${data?.IadeBekleyenSayisi ?? 0} satış`}
        aciklama="İptal edilmiş, tahsilatı iade edilmemiş"
        ikon={<RotateCcw className="size-5" />}
        className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
        yukleniyor={isLoading}
      />
    </div>
  );
}
