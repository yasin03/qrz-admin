import { z } from "zod";

import { sayiOku } from "@/modules/crm/schemas/teklif.schema";

/** Boş bırakılabilen, en fazla `max` karakterlik metin. */
const metin = (max: number) => z.string().trim().max(max, `En fazla ${max} karakter.`);

/* ------------------------------------------------------------------ */
/* Ortak alan kuralları (satış formundaki ödeme / iade blokları da     */
/* kullanır)                                                           */
/* ------------------------------------------------------------------ */

/** "1" Tahsilat, "2" İade */
export const tahsilatTipAlani = z.enum(["1", "2"]);

/** "1" Havale/EFT, "2" Kredi kartı, "3" Nakit, "4" Çek, "5" Diğer */
export const odemeSekliAlani = z.enum(["1", "2", "3", "4", "5"]);

/** 0'dan büyük tutar (string tutulur). Boş → hata. */
export const tutarAlani = z
  .string()
  .trim()
  .refine((v) => {
    const n = sayiOku(v);
    return Number.isFinite(n) && n > 0;
  }, "0'dan büyük bir tutar girin.");

/** Boş bırakılabilir; doluysa 0'dan büyük. */
const kurAlani = z
  .string()
  .trim()
  .refine((v) => {
    if (!v) return true;
    const n = sayiOku(v);
    return Number.isFinite(n) && n > 0;
  }, "Geçerli bir kur girin.");

export const faturaNoAlani = metin(50);

/* ------------------------------------------------------------------ */
/* Tahsilat / iade                                                     */
/* ------------------------------------------------------------------ */

/**
 * Tutarın kalanı / tahsil edileni aşmaması SP'de kontrol edilir (kilitli
 * okumayla, eşzamanlı girişe karşı); formda ayrıca kontrol edilmez, SP
 * mesajı toast'ta gösterilir.
 */
export const tahsilatSchema = z
  .object({
    /** Alacaklar'dan açılınca dolu ve kilitli; Tahsilatlar'dan açılınca seçilir. */
    IDCrmSatis: z.string().min(1, "Satış seçin."),
    Tip: tahsilatTipAlani,
    /** "yyyy-MM-dd" */
    Tarih: z.string().min(1, "Tarih zorunlu."),
    Tutar: tutarAlani,
    /** Boş → satışın kuru (yeni kayıtta) / mevcut kur (düzeltmede). TRY'de gizli. */
    Kur: kurAlani,
    OdemeSekli: odemeSekliAlani,
    FaturaNo: faturaNoAlani,
    FaturaTarihi: z.string(),
    Aciklama: metin(500),
  })
  .refine((v) => !v.FaturaTarihi || v.FaturaNo.length > 0, {
    path: ["FaturaNo"],
    message: "Fatura tarihi girildiyse fatura no zorunlu.",
    when: () => true,
  });

export type TahsilatForm = z.infer<typeof tahsilatSchema>;
