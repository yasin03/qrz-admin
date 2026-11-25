import { cn } from "@/lib/utils";
import { paraFormat } from "@/modules/crm/lib/teklif";
import type { TeklifParaBirimi, TeklifToplamlari } from "@/modules/crm/types/teklif";

type Props = TeklifToplamlari & {
  ParaBirimi: TeklifParaBirimi;
  Kur: number;
  /** 0 → genel iskonto tutar olarak girilmiş, etikette oran gösterilmez. */
  GenelIskontoOrani: number;
  /** KDV oranı → tutar (genel iskonto sonrası). Verilmezse tek satır "KDV". */
  kdvDagilimi?: { oran: number; tutar: number }[];
  className?: string;
};

type SatirProps = { label: string; deger: string; not?: string; className?: string };

function Satir({ label, deger, not, className }: SatirProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <span className="text-muted-foreground">
        {label}
        {not && <span className="block text-xs">{not}</span>}
      </span>
      <span className="tabular-nums">{deger}</span>
    </div>
  );
}

/**
 * Teklif toplamları: formda canlı, detayda kayıtlı değerlerle.
 * Satırlar yukarıdan aşağı toplanacak sırada: satır iskontolu net → genel iskonto → matrah → KDV → genel toplam.
 */
export function TeklifToplamPaneli({
  AraToplam,
  GenelIskontoTutari,
  IskontoToplam,
  KdvToplam,
  GenelToplam,
  ParaBirimi,
  Kur,
  GenelIskontoOrani,
  kdvDagilimi,
  className,
}: Props) {
  const para = (v: number) => paraFormat(v, ParaBirimi);
  const satirIskonto = Math.max(IskontoToplam - GenelIskontoTutari, 0);
  const net = AraToplam - satirIskonto;

  return (
    <div className={cn("space-y-1.5 rounded-lg border bg-muted/30 p-4 text-sm", className)}>
      <Satir
        label="Birim Toplamları"
        deger={para(net)}
        not={satirIskonto > 0 ? `Satır iskontosu ${para(satirIskonto)} düşüldü` : undefined}
      />
      {/* Genel iskonto yoksa matrah = birim toplamları; aynı rakamı iki kez göstermemek için. */}
      {GenelIskontoTutari > 0 && (
        <>
          <Satir label={GenelIskontoOrani > 0 ? `Genel İskonto (%${GenelIskontoOrani})` : "Genel İskonto"} deger={`− ${para(GenelIskontoTutari)}`} />
          <Satir label="Ara Toplam (KDV hariç)" deger={para(net - GenelIskontoTutari)} />
        </>
      )}
      {kdvDagilimi?.length
        ? kdvDagilimi.map((k) => <Satir key={k.oran} label={`KDV (%${k.oran})`} deger={para(k.tutar)} />)
        : <Satir label="KDV" deger={para(KdvToplam)} />}

      <div className="mt-2 flex items-center justify-between gap-4 border-t pt-2 text-base font-semibold">
        <span>Genel Toplam</span>
        <span className="tabular-nums">{para(GenelToplam)}</span>
      </div>

      {ParaBirimi !== "TRY" && Kur > 0 && (
        <Satir
          label={`TL karşılığı (kur ${Kur.toLocaleString("tr-TR", { maximumFractionDigits: 6 })})`}
          deger={paraFormat(GenelToplam * Kur, "TRY")}
          className="text-xs"
        />
      )}
    </div>
  );
}
