"use client";

import type { SirketSubeFiltreResult } from "@/modules/core/hooks/genel/use-sirket-sube-filtre";
import { FiltreSelect } from "./FiltreSelect";

/**
 * Grup / Şirket / Şube select'leri. `useSirketSubeFiltre` sonucunu prop
 * olarak alır: `<SirketSubeFiltre {...useSirketSubeFiltre()} />`.
 * Grup select'i sadece birden fazla grup varsa görünür.
 */
const SirketSubeFiltre = ({
  filtre,
  grupList,
  sirketList,
  subeList,
  setGrup,
  setSirket,
  setSube,
}: SirketSubeFiltreResult) => (
  <>
    {grupList.length > 1 && (
      <FiltreSelect
        label="Grup"
        value={filtre.grup}
        onChange={setGrup}
        options={grupList.map((g) => ({
          value: String(g.IDGurup),
          label: g.GurupAdi,
        }))}
      />
    )}

    <FiltreSelect
      label="Şirket"
      value={filtre.sirket}
      onChange={setSirket}
      options={sirketList.map((s) => ({
        value: String(s.IDSirket),
        label: s.SirketAdi,
      }))}
    />

    <FiltreSelect
      label="Şube"
      value={filtre.sube}
      onChange={setSube}
      disabled={!filtre.sirket}
      options={[
        { value: "0", label: "Tümü" },
        ...subeList.map((s) => ({
          value: String(s.IDSube),
          label: s.SubeAdi,
        })),
      ]}
    />
  </>
);

export default SirketSubeFiltre;
