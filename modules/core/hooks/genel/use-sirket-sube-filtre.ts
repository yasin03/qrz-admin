"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { normalize } from "@/lib/utils";
import { useCurrentContext } from "@/modules/core/hooks/use-context";
import {
  useGruplar,
  useSirketler,
  useSubeler,
} from "@/modules/core/hooks/use-kurumsal-data";

export type SirketSubeFiltreState = {
  grup: string;
  sirket: string;
  /** "0" → tüm şubeler */
  sube: string;
};

const BOS_FILTRE: SirketSubeFiltreState = {
  grup: "",
  sirket: "",
  sube: "0",
};

/**
 * Sayfa içi grup/şirket/şube filtresi. Header'daki şirket seçiminden farklı
 * olarak session'ı değiştirmez; seçim sadece kullanıldığı sayfanın
 * sorgusuna gider. Başlangıç değeri mevcut çalışma bağlamından (session)
 * alınır. UI için `@/modules/core/components/genel/SirketSubeFiltre`.
 */
export function useSirketSubeFiltre() {
  // Session, uygulamanın kullandığı context query key'inden okunur (ek istek yok)
  const { data: context } = useCurrentContext();

  const [filtre, setFiltre] = useState<SirketSubeFiltreState>(BOS_FILTRE);
  const [baslatildi, setBaslatildi] = useState(false);

  const sessionFiltre = useMemo<SirketSubeFiltreState | null>(
    () =>
      context
        ? {
            grup: String(context.IDGurup ?? ""),
            sirket: String(context.IDSirket ?? ""),
            sube: "0",
          }
        : null,
    [context],
  );

  // Session gelince bir kez başlangıç değerlerini ata
  if (!baslatildi && sessionFiltre) {
    setBaslatildi(true);
    setFiltre(sessionFiltre);
  }

  const gruplarQuery = useGruplar();
  const sirketlerQuery = useSirketler(Number(filtre.grup) || 0);
  const subelerQuery = useSubeler(Number(filtre.sirket) || 0);

  const grupList = useMemo(() => gruplarQuery.data ?? [], [gruplarQuery.data]);
  const sirketList = useMemo(
    () => sirketlerQuery.data ?? [],
    [sirketlerQuery.data],
  );
  // "Tümü" seçeneği filtrede ayrıca ("0") sunulduğu için listeden çıkarılır
  const subeList = useMemo(
    () =>
      (subelerQuery.data ?? []).filter(
        (s) => !normalize(s.SubeAdi).includes("tumu"),
      ),
    [subelerQuery.data],
  );

  const listeHatasi =
    gruplarQuery.error ?? sirketlerQuery.error ?? subelerQuery.error;
  useEffect(() => {
    if (listeHatasi) {
      toast.error(listeHatasi.message || "Şirket/şube listesi alınamadı.");
    }
  }, [listeHatasi]);

  const setGrup = (grup: string) => setFiltre({ grup, sirket: "", sube: "0" });
  const setSirket = (sirket: string) =>
    setFiltre((prev) => ({ ...prev, sirket, sube: "0" }));
  const setSube = (sube: string) => setFiltre((prev) => ({ ...prev, sube }));
  const sifirla = () => setFiltre(sessionFiltre ?? BOS_FILTRE);

  const IDSube = filtre.sube || "0";
  const seciliSube =
    IDSube === "0"
      ? "Tüm Şubeler"
      : (subeList.find((s) => String(s.IDSube) === IDSube)?.SubeAdi ?? "");

  return {
    filtre,
    grupList,
    sirketList,
    subeList,
    setGrup,
    setSirket,
    setSube,
    sifirla,
    IDSirket: filtre.sirket,
    IDSube,
    seciliSube,
  };
}

export type SirketSubeFiltreResult = ReturnType<typeof useSirketSubeFiltre>;
