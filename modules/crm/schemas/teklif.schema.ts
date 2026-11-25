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

const oranAlani = sayiAlani((n) => n >= 0 && n <= 100, "0-100 arası.", false);

/* ---------------- Kalem ---------------- */

export const teklifKalemSchema = z.object({
  Aciklama: z.string().trim().min(1, "Kalem adı zorunlu.").max(500, "En fazla 500 karakter."),
  Detay: metin(1000),
  Miktar: sayiAlani((n) => n > 0, "0'dan büyük olmalı."),
  Birim: z.string().trim().min(1, "Birim zorunlu.").max(20, "En fazla 20 karakter."),
  BirimFiyat: sayiAlani((n) => n >= 0, "Geçerli bir fiyat girin."),
  IskontoOrani: oranAlani,
  KdvOrani: z.string(),
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
    GenelIskontoOrani: oranAlani,
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
  });

export type TeklifForm = z.infer<typeof teklifSchema>;

/** Form adımları ve her adımda doğrulanan alanlar. */
export const TEKLIF_STEPS = [
  {
    id: "bilgiler",
    label: "Bilgiler",
    fields: ["IDCrmKisi", "Konu", "TeklifTarihi", "GecerlilikTarihi", "ParaBirimi", "Kur", "Aciklama", "Kosullar"],
  },
  { id: "kalemler", label: "Kalemler", fields: ["Kalemler", "GenelIskontoOrani"] },
  // Alan yok: formdan üretilen PDF önizleme + indir / yazdır.
  { id: "onizleme", label: "Önizleme", fields: [] },
] as const satisfies readonly { id: string; label: string; fields: readonly (keyof TeklifForm)[] }[];

/* ---------------- Red ---------------- */

export const teklifRedSchema = z.object({
  RedNedeni: metin(500),
});

export type TeklifRedForm = z.infer<typeof teklifRedSchema>;
