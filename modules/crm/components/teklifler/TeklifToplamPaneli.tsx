import { cn } from "@/lib/utils";
import { paraFormat } from "@/modules/crm/lib/teklif";
import type { TeklifParaBirimi, TeklifToplamlari } from "@/modules/crm/types/teklif";

type Props = TeklifToplamlari & {
  ParaBirimi: TeklifParaBirimi;
  Kur: number;
  GenelIskontoOrani: number;
  /** KDV oranı → tutar (genel iskonto sonrası). Verilmezse tek satır "KDV". */
  kdvDagilimi?: { oran: number; tutar: number }[];
  className?: string;
};

function Satir({ label, deger, className }: { label: string; deger: string; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{deger}</span>
    </div>
  );
}

/** Teklif toplamları: formda canlı, detayda kayıtlı değerlerle. */
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

  return (
    <div className={cn("space-y-1.5 rounded-lg border bg-muted/30 p-4 text-sm", className)}>
      <Satir label="Ara Toplam" deger={para(AraToplam)} />
      {satirIskonto > 0 && <Satir label="Satır İskontoları" deger={`− ${para(satirIskonto)}`} />}
      {GenelIskontoTutari > 0 && (
        <Satir label={`Genel İskonto (%${GenelIskontoOrani})`} deger={`− ${para(GenelIskontoTutari)}`} />
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
