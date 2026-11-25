"use client";

import { useCallback, useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTabParam } from "@/hooks/use-tab-param";
import { FINANS_GORUNUMLERI } from "@/modules/crm/lib/finans";
import type { CrmFinansCariRow, DbId } from "@/modules/crm/types/finans";

import { AlacakListesi } from "./AlacakListesi";
import { BakiyeListesi } from "./BakiyeListesi";
import { FinansOzetKartlari } from "./FinansOzetKartlari";
import { TahsilatFormDialog, type TahsilatFormModu } from "./TahsilatFormDialog";
import { TahsilatListesi } from "./TahsilatListesi";

const GORUNUMLER = FINANS_GORUNUMLERI.map((g) => g.value);

type Props = {
  /** Satışlar sekmesine geçip satışın detayını açar. */
  onSatisAc: (IDCrmSatis: DbId) => void;
};

/**
 * Finans sekmesi: özet kartlar + üç görünüm (satırları farklı: satış / ödeme / müşteri).
 * Seçili görünüm adreste (?gorunum=) tutulur.
 */
export function Finans({ onSatisAc }: Props) {
  const [gorunum, setGorunum] = useTabParam(GORUNUMLER, "gorunum");
  const [tahsilatMod, setTahsilatMod] = useState<TahsilatFormModu | null>(null);
  // Müşteri bakiyelerinden seçilen kişi → Alacaklar o kişiye daraltılır.
  const [kisi, setKisi] = useState<{ IDCrmKisi: DbId; KisiAdi: string | null } | null>(null);

  const kisiSec = useCallback(
    (k: CrmFinansCariRow) => {
      setKisi({ IDCrmKisi: k.IDCrmKisi, KisiAdi: k.KisiAdi });
      setGorunum("alacaklar");
    },
    [setGorunum],
  );

  return (
    <div className="space-y-4">
      <FinansOzetKartlari />

      <Tabs value={gorunum} onValueChange={setGorunum}>
        <TabsList variant="line">
          {FINANS_GORUNUMLERI.map((g) => (
            <TabsTrigger key={g.value} value={g.value}>
              {g.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="alacaklar" className="pt-2">
          <AlacakListesi
            kisi={kisi}
            onKisiTemizle={() => setKisi(null)}
            onSatisAc={onSatisAc}
            onTahsilat={setTahsilatMod}
          />
        </TabsContent>
        <TabsContent value="tahsilatlar" className="pt-2">
          <TahsilatListesi onSatisAc={onSatisAc} onTahsilat={setTahsilatMod} />
        </TabsContent>
        <TabsContent value="bakiyeler" className="pt-2">
          <BakiyeListesi onKisiSec={kisiSec} />
        </TabsContent>
      </Tabs>

      <TahsilatFormDialog mod={tahsilatMod} onOpenChange={(v) => !v && setTahsilatMod(null)} />
    </div>
  );
}
