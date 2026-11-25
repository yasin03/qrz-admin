import { z } from "zod";

import { PARA_BIRIMI_KODLARI } from "@/constants/data";
import {
  faturaNoAlani,
  odemeSekliAlani,
  tutarAlani,
} from "@/modules/crm/schemas/finans.schema";
import {
  genelIskontoGecerli,
  iskontoAlani,
  sayiOku,
  teklifKalemSchema,
} from "@/modules/crm/schemas/teklif.schema";

/** Boş bırakılabilen, en fazla `max` karakterlik metin. */
const metin = (max: number) => z.string().trim().max(max, `En fazla ${max} karakter.`);

/* ------------------------------------------------------------------ */
/* Satış                                                               */
/* ------------------------------------------------------------------ */

/** Kalem satırı teklif ile aynı (kalem tablosu paylaşılır). */
export const satisKalemSchema = teklifKalemSchema;

/**
 * Satış formu. Son adımdaki "Ödeme alındı" (sadece yeni satışta) satış
 * kaydedildikten sonra finans API'sine ayrı bir tahsilat olarak gider;
 * satış SP'si tahsilat yazmaz. Ödeme alanları satışın parçası değildir.
 *
 * Tutarın satış toplamını aşmaması formda kontrol edilmez (toplam
 * lib/teklif.ts → teklifHesapla ile bileşende hesaplanır, şema lib'i
 * import edemez); bileşen kontrol eder, SP de reddeder.
 */
export const satisSchema = z
  .object({
    IDCrmKisi: z.string().min(1, "Kişi seçin."),
    /** "1" Tek seferlik, "2" Aylık abonelik, "3" Yıllık abonelik */
    SatisTipi: z.enum(["1", "2", "3"]),
    Konu: z.string().trim().min(1, "Konu zorunlu.").max(250, "En fazla 250 karakter."),
    /** "yyyy-MM-dd" */
    SatisTarihi: z.string().min(1, "Satış tarihi zorunlu."),
    /** Sadece abonelikte; bitiş tipe göre önerilir, değiştirilebilir. */
    BaslangicTarihi: z.string(),
    BitisTarihi: z.string(),
    ParaBirimi: z.enum(PARA_BIRIMI_KODLARI),
    Kur: z.string().trim(),
    /** "1" Yüzde, "2" Tutar */
    GenelIskontoTipi: z.enum(["1", "2"]),
    GenelIskonto: iskontoAlani,
    Aciklama: metin(2000),
    Kalemler: z.array(satisKalemSchema).min(1, "En az bir kalem ekleyin."),

    // Ödeme alındı (sadece yeni satış)
    OdemeAlindi: z.boolean(),
    /** "yyyy-MM-dd" */
    OdemeTarihi: z.string(),
    OdemeTutari: z.string().trim(),
    OdemeSekli: odemeSekliAlani,
    OdemeFaturaNo: faturaNoAlani,
  })
  // `when: () => true` → başka adımdaki alanlar (ör. kalemler) hatalıyken de
  // çalışır; stepper'ın her adımı ayrı doğrulanırken gerekli.
  .refine(
    (v) => {
      if (v.ParaBirimi === "TRY") return true;
      const kur = sayiOku(v.Kur);
      return Number.isFinite(kur) && kur > 0;
    },
    { path: ["Kur"], message: "Kur girin.", when: () => true },
  )
  .refine(genelIskontoGecerli, { path: ["GenelIskonto"], message: "0-100 arası.", when: () => true })
  .superRefine((v, ctx) => {
    if (v.SatisTipi === "1") return;
    if (!v.BaslangicTarihi) {
      ctx.addIssue({ code: "custom", path: ["BaslangicTarihi"], message: "Başlangıç tarihi zorunlu." });
    }
    if (!v.BitisTarihi) {
      ctx.addIssue({ code: "custom", path: ["BitisTarihi"], message: "Bitiş tarihi zorunlu." });
    } else if (v.BaslangicTarihi && v.BitisTarihi < v.BaslangicTarihi) {
      ctx.addIssue({ code: "custom", path: ["BitisTarihi"], message: "Başlangıçtan önce olamaz." });
    }
  }, { when: () => true })
  .superRefine((v, ctx) => {
    if (!v.OdemeAlindi) return;
    if (!v.OdemeTarihi) {
      ctx.addIssue({ code: "custom", path: ["OdemeTarihi"], message: "Ödeme tarihi zorunlu." });
    }
    const tutar = tutarAlani.safeParse(v.OdemeTutari);
    if (!tutar.success) {
      ctx.addIssue({ code: "custom", path: ["OdemeTutari"], message: tutar.error.issues[0].message });
    }
  }, { when: () => true });

export type SatisForm = z.infer<typeof satisSchema>;

/**
 * Form adımları ve her adımda doğrulanan alanlar.
 * "odeme" adımı sadece yeni satışta gösterilir.
 */
export const SATIS_STEPS = [
  {
    id: "bilgiler",
    label: "Bilgiler",
    fields: [
      "IDCrmKisi",
      "SatisTipi",
      "Konu",
      "SatisTarihi",
      "BaslangicTarihi",
      "BitisTarihi",
      "ParaBirimi",
      "Kur",
      "Aciklama",
    ],
  },
  { id: "kalemler", label: "Kalemler", fields: ["Kalemler", "GenelIskonto"] },
  {
    id: "odeme",
    label: "Ödeme",
    fields: ["OdemeAlindi", "OdemeTarihi", "OdemeTutari", "OdemeSekli", "OdemeFaturaNo"],
  },
] as const satisfies readonly { id: string; label: string; fields: readonly (keyof SatisForm)[] }[];

/* ------------------------------------------------------------------ */
/* İptal                                                               */
/* ------------------------------------------------------------------ */

/**
 * Satış iptali. Tahsilatı olan satışta "iade kaydı aç" önerilir; işaretlenirse
 * iptalden sonra finans API'sine İade (Tip 2) olarak gider. Tutarın net
 * tahsil edileni aşmaması SP'de kontrol edilir.
 */
export const satisIptalSchema = z
  .object({
    IptalNedeni: metin(500),
    IadeAc: z.boolean(),
    /** "yyyy-MM-dd" */
    IadeTarihi: z.string(),
    IadeTutari: z.string().trim(),
    IadeOdemeSekli: odemeSekliAlani,
  })
  .superRefine((v, ctx) => {
    if (!v.IadeAc) return;
    if (!v.IadeTarihi) {
      ctx.addIssue({ code: "custom", path: ["IadeTarihi"], message: "İade tarihi zorunlu." });
    }
    const tutar = tutarAlani.safeParse(v.IadeTutari);
    if (!tutar.success) {
      ctx.addIssue({ code: "custom", path: ["IadeTutari"], message: tutar.error.issues[0].message });
    }
  });

export type SatisIptalForm = z.infer<typeof satisIptalSchema>;

/* ------------------------------------------------------------------ */
/* Yenileme                                                            */
/* ------------------------------------------------------------------ */

/** Abonelik yenileme. Dönem SP'de hesaplanır; sadece satış tarihi sorulur. */
export const satisYenileSchema = z.object({
  /** "yyyy-MM-dd"; boş → bugün. */
  SatisTarihi: z.string(),
});

export type SatisYenileForm = z.infer<typeof satisYenileSchema>;
