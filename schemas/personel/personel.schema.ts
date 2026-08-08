// /schemas/kurumsal/sirket.schema.ts
import { z } from "zod";

// NOT: Alanlar burada .optional() DEĞİL — hepsi düz z.string(), çünkü
// CreateSirketRequest/UpdateSirketRequest interface'lerinde bu alanlar
// (YetkiliKisi dahil) `undefined` kabul etmiyor. Boş bırakılabilmeleri
// gereken alanlar için min() validasyonu yok, sadece tip olarak `string`
// (DEFAULT_VALUES'ta zaten hepsine "" veriyoruz, form hiç undefined üretmez).
export const personelSchema = z.object({
  Ad: z.string().min(1, "Ad zorunludur."),
});

export type PersonelForm = z.infer<typeof personelSchema>;

// Eski isimlerle de export (mevcut importları kırmamak için)
export const createPersonelSchema = personelSchema;
export type CreatePersonelForm = PersonelForm;
