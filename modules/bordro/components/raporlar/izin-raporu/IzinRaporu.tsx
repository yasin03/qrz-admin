"use client";

import { useState } from "react";

import { useCurrentContext } from "@/modules/core/hooks/use-context";
import { useSirketSubeFiltre } from "@/modules/core/hooks/genel/use-sirket-sube-filtre";
import { IzinRaporFilters } from "@/modules/bordro/types/rapor";
import { yilAraligi } from "../rapor-utils";
import IzinGenelRaporu from "./IzinGenelRaporu";
import IzinRaporuFiltre from "./IzinRaporuFiltre";
import IzinYillikRaporu from "./IzinYillikRaporu";

const IzinRaporu = () => {
  const { data: context } = useCurrentContext();
  const sirketSube = useSirketSubeFiltre();

  // null → varsayılanlar (genel rapor, session yılının tamamı)
  const [secim, setSecim] = useState<IzinRaporFilters | null>(null);
  const [searchText, setSearchText] = useState("");
  const [filtreAcik, setFiltreAcik] = useState(false);

  const sessionYil = context?.Yil || "";
  const filters: IzinRaporFilters = secim ?? {
    raporTuru: "genel",
    CikisVar: false,
    ...yilAraligi(sessionYil || new Date().getFullYear()),
  };

  const filtre = (
    <IzinRaporuFiltre
      filters={filters}
      sirketSube={sirketSube}
      onChange={setSecim}
      onReset={() => {
        setSecim(null);
        sirketSube.sifirla();
      }}
      open={filtreAcik}
      onOpenChange={setFiltreAcik}
    />
  );

  const ortakProps = {
    IDSirket: sirketSube.IDSirket,
    IDSube: sirketSube.IDSube,
    seciliSube: sirketSube.seciliSube,
    cikisVar: filters.CikisVar,
    searchText,
    onSearchChange: setSearchText,
    filtre,
  };

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">İzin Raporları</h1>
      </div>

      {filters.raporTuru === "genel" ? (
        <IzinGenelRaporu tarih={filters} {...ortakProps} />
      ) : (
        <IzinYillikRaporu
          // Yıl: session yılı; yoksa bitiş tarihinin yılı
          yil={sessionYil || filters.BitisTarihi.slice(0, 4)}
          bitisTarihi={filters.BitisTarihi}
          {...ortakProps}
        />
      )}
    </div>
  );
};

export default IzinRaporu;
