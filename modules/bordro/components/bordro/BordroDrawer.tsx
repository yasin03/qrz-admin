"use client";

import { Calculator } from "lucide-react";

import { SideDrawer, useLastDefined } from "@/components/customs/SideDrawer";
import { Badge } from "@/components/ui/badge";
import { AY_DATA } from "@/constants/data";
import type { BordroResponseType } from "@/modules/bordro/types/bordro";
import { BordroRaporIcerik } from "./rapor/BordroRaporModal";

type Props = {
  kayit: BordroResponseType | null;
  onOpenChange: (open: boolean) => void;
  yil: string;
  ay: string;
};

export default function BordroDrawer({
  kayit: seciliKayit,
  onOpenChange,
  yil,
  ay,
}: Props) {
  const kayit = useLastDefined(seciliKayit);
  if (!kayit) return null;

  const hesaplandi = Boolean(Number(kayit.IDBordro));
  const onayli = kayit.OnayTarihi != null;
  const donem = [AY_DATA.find((a) => a.value === ay)?.label, yil]
    .filter(Boolean)
    .join(" ");

  return (
    <SideDrawer
      open={!!seciliKayit}
      onOpenChange={onOpenChange}
      size="lg"
      title={kayit.AdSoyad ?? "-"}
      badge={
        <Badge variant={!hesaplandi ? "danger" : onayli ? "success" : "gray"}>
          {!hesaplandi ? "Hesaplanmadı" : onayli ? "Onaylı" : "Onaysız"}
        </Badge>
      }
      description={[
        kayit.TcKimlikNo && `TC: ${kayit.TcKimlikNo}`,
        donem,
        hesaplandi && kayit.HesaplamaTarihi2 && `Hesaplama Tarihi: ${kayit.HesaplamaTarihi2}`,
      ]
        .filter(Boolean)
        .join(" · ")}
    >
      {hesaplandi ? (
        <BordroRaporIcerik
          kayit={kayit}
          yil={yil}
          ay={ay}
          enabled={!!seciliKayit}
        />
      ) : (
        // Hesaplanmamış bordronun raporu yok; satır menüsündeki "Hesapla" ile oluşur
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          <Calculator className="size-6" />
          Bu personelin {donem} bordrosu henüz hesaplanmadı.
          <span className="text-xs">
            Satır menüsündeki “Hesapla” ile hesapladıktan sonra rapor burada
            görünür.
          </span>
        </div>
      )}
    </SideDrawer>
  );
}
