import type { ComponentProps } from "react";
import { format, startOfMonth, startOfYear, subMonths, endOfMonth } from "date-fns";

import type { Badge } from "@/components/ui/badge";
import type { TahsilatForm } from "@/modules/crm/schemas/finans.schema";
import { sayiOku } from "@/modules/crm/schemas/teklif.schema";
import type {
  CrmFinansSatisRow,
  CrmSatisTahsilatRow,
  CrmTahsilatKaydetParams,
  CrmTahsilatRow,
  EkstreHareket,
  EkstreHesap,
  DbId,
  OdemeDurumu,
  TahsilatOdemeSekli,
  TahsilatTip,
} from "@/modules/crm/types/finans";
import { gunFormat, yuvarla } from "@/modules/crm/lib/teklif";

/* ------------------------------------------------------------------ */
/* Etiketler / seçenekler                                              */
/* ------------------------------------------------------------------ */

type BadgeVariant = NonNullable<ComponentProps<typeof Badge>["variant"]>;

export const TAHSILAT_TIP: Record<TahsilatTip, { label: string; variant: BadgeVariant }> = {
  1: { label: "Tahsilat", variant: "success" },
  2: { label: "İade", variant: "warning" },
};

export const TAHSILAT_TIP_SECENEKLERI: { value: `${TahsilatTip}`; label: string }[] = [
  { value: "1", label: "Tahsilat" },
  { value: "2", label: "İade" },
];

export const ODEME_SEKLI_ETIKET: Record<TahsilatOdemeSekli, string> = {
  1: "Havale / EFT",
  2: "Kredi kartı",
  3: "Nakit",
  4: "Çek",
  5: "Diğer",
};

export const ODEME_SEKLI_SECENEKLERI = (
  Object.entries(ODEME_SEKLI_ETIKET) as [`${TahsilatOdemeSekli}`, string][]
).map(([value, label]) => ({ value, label }));

/** Yeni tahsilatta seçili gelen ödeme şekli (Havale / EFT). */
export const ODEME_SEKLI_VARSAYILAN: `${TahsilatOdemeSekli}` = "1";

export const ODEME_DURUM: Record<OdemeDurumu, { label: string; variant: BadgeVariant }> = {
  0: { label: "Ödenmedi", variant: "danger" },
  1: { label: "Kısmi", variant: "orange" },
  2: { label: "Ödendi", variant: "success" },
  3: { label: "İade bekliyor", variant: "purple" },
};

export const ODEME_DURUM_SECENEKLERI = (
  Object.entries(ODEME_DURUM) as [`${OdemeDurumu}`, { label: string }][]
).map(([value, d]) => ({ value, label: d.label }));

/** Finans sekmesinin alt görünümleri (segment buton, URL'de ?gorunum=). */
export const FINANS_GORUNUMLERI = [
  { value: "alacaklar", label: "Alacaklar" },
  { value: "tahsilatlar", label: "Tahsilatlar" },
  { value: "bakiyeler", label: "Müşteri bakiyeleri" },
] as const;

export type FinansGorunum = (typeof FINANS_GORUNUMLERI)[number]["value"];

/** Tahsilatlar görünümündeki dönem seçenekleri. "ozel" → tarihler elle girilir. */
export const TAHSILAT_DONEMLERI = [
  { value: "buAy", label: "Bu ay" },
  { value: "gecenAy", label: "Geçen ay" },
  { value: "son3Ay", label: "Son 3 ay" },
  { value: "buYil", label: "Bu yıl" },
  { value: "tumu", label: "Tümü" },
  { value: "ozel", label: "Özel aralık" },
] as const;

export type TahsilatDonem = (typeof TAHSILAT_DONEMLERI)[number]["value"];

/** Dönem → "yyyy-MM-dd" aralığı (dahil). "tumu" / "ozel" → boş (ozel'de tarihler formdan). */
export function donemAraligi(d: TahsilatDonem, bugunTarih = new Date()): { Baslangic: string; Bitis: string } {
  const f = (t: Date) => format(t, "yyyy-MM-dd");
  switch (d) {
    case "buAy":
      return { Baslangic: f(startOfMonth(bugunTarih)), Bitis: f(endOfMonth(bugunTarih)) };
    case "gecenAy": {
      const g = subMonths(bugunTarih, 1);
      return { Baslangic: f(startOfMonth(g)), Bitis: f(endOfMonth(g)) };
    }
    case "son3Ay":
      return { Baslangic: f(startOfMonth(subMonths(bugunTarih, 2))), Bitis: f(endOfMonth(bugunTarih)) };
    case "buYil":
      return { Baslangic: f(startOfYear(bugunTarih)), Bitis: `${bugunTarih.getFullYear()}-12-31` };
    default:
      return { Baslangic: "", Bitis: "" };
  }
}

/* ------------------------------------------------------------------ */
/* Ödeme durumu (Satışlar sekmesindeki rozet)                          */
/* ------------------------------------------------------------------ */

export type SatisOdemeOzeti = {
  TahsilEdilen: number;
  Kalan: number;
  /** İptal + tahsilatsız satışta null (rozet gösterilmez). */
  OdemeDurumu: OdemeDurumu | null;
};

/**
 * Satış satırı + rozet sorgusu (useCrmSatisTahsilatlari) → kalan ve ödeme
 * durumu. Kural vCrmFinansSatis.OdemeDurumu ile aynı olmalı:
 * iptal → tahsilat varsa 3, yoksa null; kalan ≤ 0 → 2; tahsilat yok → 0; diğer → 1.
 */
export function satisOdemeOzeti(
  s: { Durum: 0 | 1; GenelToplam: number },
  t: Pick<CrmSatisTahsilatRow, "TahsilEdilen"> | null | undefined,
): SatisOdemeOzeti {
  const TahsilEdilen = t?.TahsilEdilen ?? 0;
  const borc = s.Durum === 1 ? 0 : s.GenelToplam;
  const Kalan = yuvarla(borc - TahsilEdilen);

  let OdemeDurumu: OdemeDurumu | null;
  if (s.Durum === 1) OdemeDurumu = TahsilEdilen > 0 ? 3 : null;
  else if (Kalan <= 0) OdemeDurumu = 2;
  else if (TahsilEdilen <= 0) OdemeDurumu = 0;
  else OdemeDurumu = 1;

  return { TahsilEdilen, Kalan, OdemeDurumu };
}

/* ------------------------------------------------------------------ */
/* Form ↔ API                                                          */
/* ------------------------------------------------------------------ */

const bugun = () => format(new Date(), "yyyy-MM-dd");
const gun = (v: string | null | undefined) => (v ? v.slice(0, 10) : "");
const sayi = (v: string | number | null | undefined) => {
  const n = sayiOku(v);
  return Number.isFinite(n) ? n : 0;
};
const metin = (v: string) => v.trim() || null;
const tutarMetni = (n: number | null | undefined) => (n && n > 0 ? String(n) : "");

/**
 * Yeni tahsilat (bugün, Havale / EFT) veya mevcut kaydın form değerleri.
 * Yeni kayıtta `ek.Tutar` (genelde satışın kalanı) önerilir.
 */
export function tahsilatFormVarsayilan(
  t?: CrmTahsilatRow | null,
  ek: { IDCrmSatis?: DbId | null; Tip?: TahsilatTip; Tutar?: number | null } = {},
): TahsilatForm {
  if (!t) {
    return {
      IDCrmSatis: ek.IDCrmSatis != null ? String(ek.IDCrmSatis) : "",
      Tip: String(ek.Tip ?? 1) as TahsilatForm["Tip"],
      Tarih: bugun(),
      Tutar: tutarMetni(ek.Tutar),
      // Boş → satışın kuru.
      Kur: "",
      OdemeSekli: ODEME_SEKLI_VARSAYILAN,
      FaturaNo: "",
      FaturaTarihi: "",
      Aciklama: "",
    };
  }

  return {
    IDCrmSatis: String(t.IDCrmSatis),
    Tip: String(t.Tip) as TahsilatForm["Tip"],
    Tarih: gun(t.Tarih),
    Tutar: String(t.Tutar),
    Kur: t.ParaBirimi === "TRY" ? "" : String(t.Kur),
    OdemeSekli: String(t.OdemeSekli) as TahsilatForm["OdemeSekli"],
    FaturaNo: t.FaturaNo ?? "",
    FaturaTarihi: gun(t.FaturaTarihi),
    Aciklama: t.Aciklama ?? "",
  };
}

/** Form → servis parametreleri. Güncellemede IDCrmSatis kullanılmaz (satış değişmez). */
export function tahsilatFormdanParams(f: TahsilatForm): CrmTahsilatKaydetParams {
  return {
    IDCrmSatis: f.IDCrmSatis,
    Tip: Number(f.Tip) as TahsilatTip,
    Tarih: f.Tarih,
    Tutar: sayi(f.Tutar),
    Kur: f.Kur ? sayi(f.Kur) : null,
    OdemeSekli: Number(f.OdemeSekli) as TahsilatOdemeSekli,
    FaturaNo: metin(f.FaturaNo),
    FaturaTarihi: f.FaturaTarihi || null,
    Aciklama: metin(f.Aciklama),
  };
}

/* ------------------------------------------------------------------ */
/* Hesap ekstresi                                                      */
/* ------------------------------------------------------------------ */

/** Ekstre dönem etiketi: "Tümü", "01.01.2026 – 31.12.2026", "01.01.2026 sonrası". */
export function ekstreDonemMetni(a: { Baslangic: string; Bitis: string }) {
  if (a.Baslangic && a.Bitis) return `${gunFormat(a.Baslangic)} – ${gunFormat(a.Bitis)}`;
  if (a.Baslangic) return `${gunFormat(a.Baslangic)} sonrası`;
  if (a.Bitis) return `${gunFormat(a.Bitis)} öncesi`;
  return "Tümü";
}

type HamHareket = Omit<EkstreHareket, "Bakiye"> & { ParaBirimi: EkstreHesap["ParaBirimi"]; sira: number };

/**
 * Müşterinin satış ve tahsilatlarından para birimi bazında ekstre.
 *  - Satış borç, tahsilat alacak, iade borç yazar (iade ödenen parayı geri verir).
 *  - İptal edilmiş satışlar ve onların tahsilat / iadeleri yazılmaz (kullanıcı kararı).
 *  - Başlangıçtan önceki hareketler devredene, bitişten sonrakiler hiç girmez.
 *  - Aynı gün önce satış, sonra tahsilat / iade sıralanır.
 */
export function hesapEkstresi(
  satislar: CrmFinansSatisRow[],
  tahsilatlar: CrmTahsilatRow[],
  aralik: { Baslangic: string; Bitis: string },
): EkstreHesap[] {
  const gun = (t: string) => t.slice(0, 10);
  const ham: HamHareket[] = [
    ...satislar
      .filter((s) => s.Durum === 0)
      .map((s) => ({
        Tarih: gun(s.SatisTarihi),
        BelgeNo: s.SatisNo,
        Aciklama: s.Konu,
        Borc: s.GenelToplam,
        Alacak: 0,
        ParaBirimi: s.ParaBirimi,
        sira: 0,
      })),
    ...tahsilatlar
      .filter((t) => t.SatisDurum === 0)
      .map((t) => {
        const iade = t.Tip === 2;
        const aciklama = [
          `${iade ? "İade" : "Tahsilat"} (${ODEME_SEKLI_ETIKET[t.OdemeSekli]})`,
          t.FaturaNo && `Fatura ${t.FaturaNo}`,
        ]
          .filter(Boolean)
          .join(" · ");
        return {
          Tarih: gun(t.Tarih),
          BelgeNo: t.SatisNo,
          Aciklama: aciklama,
          Borc: iade ? t.Tutar : 0,
          Alacak: iade ? 0 : t.Tutar,
          ParaBirimi: t.ParaBirimi,
          sira: 1,
        };
      }),
  ].sort((a, b) => a.Tarih.localeCompare(b.Tarih) || a.sira - b.sira || a.BelgeNo.localeCompare(b.BelgeNo));

  const gruplar = new Map<string, HamHareket[]>();
  for (const h of ham) gruplar.set(h.ParaBirimi, [...(gruplar.get(h.ParaBirimi) ?? []), h]);

  const hesaplar: EkstreHesap[] = [];
  for (const [paraBirimi, liste] of gruplar) {
    let Devreden = 0;
    let bakiye = 0;
    let ToplamBorc = 0;
    let ToplamAlacak = 0;
    const Hareketler: EkstreHareket[] = [];
    for (const h of liste) {
      if (aralik.Bitis && h.Tarih > aralik.Bitis) continue;
      if (aralik.Baslangic && h.Tarih < aralik.Baslangic) {
        Devreden = yuvarla(Devreden + h.Borc - h.Alacak);
        bakiye = Devreden;
        continue;
      }
      bakiye = yuvarla(bakiye + h.Borc - h.Alacak);
      ToplamBorc = yuvarla(ToplamBorc + h.Borc);
      ToplamAlacak = yuvarla(ToplamAlacak + h.Alacak);
      Hareketler.push({ Tarih: h.Tarih, BelgeNo: h.BelgeNo, Aciklama: h.Aciklama, Borc: h.Borc, Alacak: h.Alacak, Bakiye: bakiye });
    }
    if (Hareketler.length || Devreden !== 0) {
      hesaplar.push({
        ParaBirimi: paraBirimi as EkstreHesap["ParaBirimi"],
        Devreden,
        Hareketler,
        ToplamBorc,
        ToplamAlacak,
        Bakiye: yuvarla(Devreden + ToplamBorc - ToplamAlacak),
      });
    }
  }
  // TL önce, diğerleri alfabetik.
  return hesaplar.sort((a, b) =>
    a.ParaBirimi === "TRY" ? -1 : b.ParaBirimi === "TRY" ? 1 : a.ParaBirimi.localeCompare(b.ParaBirimi),
  );
}
