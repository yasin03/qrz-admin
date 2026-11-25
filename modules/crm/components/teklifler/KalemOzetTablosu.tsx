import { kalemIskontoMetni, paraFormat } from "@/modules/crm/lib/teklif";
import type { TeklifKalem, TeklifParaBirimi } from "@/modules/crm/types/teklif";

type Props = {
  /** Kayıtlı kalemler (teklif / satış detayı). */
  kalemler: (TeklifKalem & { key: string })[];
  paraBirimi: TeklifParaBirimi;
};

const miktarFormat = (n: number) => n.toLocaleString("tr-TR", { maximumFractionDigits: 3 });

/** Detay drawer'larındaki salt okunur kalem tablosu (teklif ve satış ortak). */
export function KalemOzetTablosu({ kalemler, paraBirimi }: Props) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-130 text-sm">
        <thead className="bg-muted/50 text-xs text-muted-foreground">
          <tr>
            <th className="px-2 py-2 text-left font-medium">Kalem</th>
            <th className="px-2 py-2 text-right font-medium">Miktar</th>
            <th className="px-2 py-2 text-right font-medium">Birim Fiyat</th>
            <th className="px-2 py-2 text-right font-medium">KDV</th>
            <th className="px-2 py-2 text-right font-medium">Toplam</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {kalemler.map((k) => (
            <tr key={k.key} className="align-top">
              <td className="px-2 py-2">
                <p className="font-medium wrap-break-word">{k.Aciklama}</p>
                {k.Detay && <p className="text-xs whitespace-pre-wrap text-muted-foreground">{k.Detay}</p>}
              </td>
              <td className="px-2 py-2 text-right whitespace-nowrap tabular-nums">
                {miktarFormat(k.Miktar)} {k.Birim}
              </td>
              <td className="px-2 py-2 text-right whitespace-nowrap tabular-nums">
                {paraFormat(k.BirimFiyat, paraBirimi)}
                {kalemIskontoMetni(k, paraBirimi) && (
                  <p className="text-xs text-muted-foreground">isk. {kalemIskontoMetni(k, paraBirimi)}</p>
                )}
              </td>
              <td className="px-2 py-2 text-right tabular-nums">%{k.KdvOrani}</td>
              <td className="px-2 py-2 text-right font-medium whitespace-nowrap tabular-nums">
                {paraFormat(k.ToplamTutar, paraBirimi)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
