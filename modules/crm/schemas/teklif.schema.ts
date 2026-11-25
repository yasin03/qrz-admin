import { z } from "zod";

import { PARA_BIRIMI_KODLARI } from "@/constants/data";

/** "1.234,5" / "1234.5" → 1234.5 (boş / geçersiz → NaN). */
export function sayiOku(v: string | number | null | undefined): number {
  if (typeof v === "number") return v;
  const s = String(v ?? "").trim();
  if (!s) return NaN;
  // Hem nokta hem virgül varsa nokta binlik ayracıdır.
  const normal = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s;
  return Number(normal);
}

const metin = (max: number) => z.string().trim().max(max, `En fazla ${max} karakter.`);

/** Sayı alanı (string tutulur). */
const sayiAlani = (kontrol: (n: number) => boolean, mesaj: string, zorunlu = true) =>
  z
    .string()
    .trim()
    .refine((v) => (!v ? !zorunlu : Number.isFinite(sayiOku(v)) && kontrol(sayiOku(v))), mesaj);

/** İskonto değeri (satır / genel): tipine göre oran ya da tutar, boş = iskonto yok. */
export const iskontoAlani = sayiAlani((n) => n >= 0, "Geçerli bir değer girin.", false);

/** Yüzde iskonto 100'ü geçemez (tutar iskontosu hesapta net toplamla sınırlanır). */
export const genelIskontoGecerli = (v: { GenelIskontoTipi: string; GenelIskonto: string }) =>
  v.GenelIskontoTipi !== "1" || !(sayiOku(v.GenelIskonto) > 100);

/* ---------------- Kalem ---------------- */

export const teklifKalemSchema = z
  .object({
    Aciklama: z.string().trim().min(1, "Kalem adı zorunlu.").max(500, "En fazla 500 karakter."),
    Detay: metin(1000),
    Miktar: sayiAlani((n) => n > 0, "0'dan büyük olmalı."),
    Birim: z.string().trim().min(1, "Birim zorunlu.").max(20, "En fazla 20 karakter."),
    BirimFiyat: sayiAlani((n) => n >= 0, "Geçerli bir fiyat girin."),
    /** "1" Yüzde, "2" Tutar */
    IskontoTipi: z.enum(["1", "2"]),
    Iskonto: iskontoAlani,
    KdvOrani: z.string(),
  })
  .superRefine((k, ctx) => {
    const isk = sayiOku(k.Iskonto);
    if (!Number.isFinite(isk) || isk <= 0) return;
    if (k.IskontoTipi === "1") {
      if (isk > 100) ctx.addIssue({ code: "custom", path: ["Iskonto"], message: "0-100 arası." });
      return;
    }
    const tutar = sayiOku(k.Miktar) * sayiOku(k.BirimFiyat);
    if (Number.isFinite(tutar) && isk > tutar) {
      ctx.addIssue({ code: "custom", path: ["Iskonto"], message: "Satır tutarını aşamaz." });
    }
  });

export type TeklifKalemForm = z.infer<typeof teklifKalemSchema>;

/* ---------------- Teklif ---------------- */

export const teklifSchema = z
  .object({
    IDCrmKisi: z.string().min(1, "Kişi seçin."),
    Konu: z.string().trim().min(1, "Konu zorunlu.").max(250, "En fazla 250 karakter."),
    /** "yyyy-MM-dd" */
    TeklifTarihi: z.string().min(1, "Teklif tarihi zorunlu."),
    GecerlilikTarihi: z.string(),
    ParaBirimi: z.enum(PARA_BIRIMI_KODLARI),
    Kur: z.string().trim(),
    /** "1" Yüzde, "2" Tutar */
    GenelIskontoTipi: z.enum(["1", "2"]),
    GenelIskonto: iskontoAlani,
    Aciklama: z.string(),
    Kosullar: z.string(),
    Kalemler: z.array(teklifKalemSchema).min(1, "En az bir kalem ekleyin."),
  })
  // `when: () => true` → başka alanlarda (ör. henüz doldurulmamış kalemler)
  // hata olsa da çalışır; stepper'ın 1. adımı doğrulanırken gerekli.
  .refine(
    (v) => {
      if (v.ParaBirimi === "TRY") return true;
      const kur = sayiOku(v.Kur);
      return Number.isFinite(kur) && kur > 0;
    },
    { path: ["Kur"], message: "Kur girin.", when: () => true },
  )
  .refine((v) => !v.GecerlilikTarihi || !v.TeklifTarihi || v.GecerlilikTarihi >= v.TeklifTarihi, {
    path: ["GecerlilikTarihi"],
    message: "Teklif tarihinden önce olamaz.",
    when: () => true,
  })
  .refine(genelIskontoGecerli, { path: ["GenelIskonto"], message: "0-100 arası.", when: () => true });

export type TeklifForm = z.infer<typeof teklifSchema>;

/** Form adımları ve her adımda doğrulanan alanlar. */
export const TEKLIF_STEPS = [
  {
    id: "bilgiler",
    label: "Bilgiler",
    fields: ["IDCrmKisi", "Konu", "TeklifTarihi", "GecerlilikTarihi", "ParaBirimi", "Kur", "Aciklama", "Kosullar"],
  },
  { id: "kalemler", label: "Kalemler", fields: ["Kalemler", "GenelIskonto"] },
  // Alan yok: formdan üretilen PDF önizleme + indir / yazdır.
  { id: "onizleme", label: "Önizleme", fields: [] },
] as const satisfies readonly { id: string; label: string; fields: readonly (keyof TeklifForm)[] }[];

/* ---------------- Red ---------------- */

export const teklifRedSchema = z.object({
  RedNedeni: metin(500),
});

export type TeklifRedForm = z.infer<typeof teklifRedSchema>;
