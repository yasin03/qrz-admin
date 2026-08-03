// /schemas/kurumsal/sube.schema.ts
import { z } from "zod";

// NOT: Sube_Insert/Sube_UPDATEByIDSube proc'u 75 parametre alıyor. Buradaki
// şema sadece formda GÖSTERİLEN alanları kapsıyor — geri kalanlar
// SubeEkle.tsx içindeki ADVANCED_DEFAULTS ile submit anında ekleniyor.
// Tüm alanlar (opsiyonel olanlar dahil) düz z.string() — CreateSubeRequest/
// UpdateSubeRequest tipleri `undefined` kabul etmiyor, DEFAULT_VALUES zaten
// hepsine "" veriyor.
export const subeSchema = z.object({
  SubeAdi: z.string().min(2, "Şube adı en az 2 karakter olmalıdır."),
  SubeKodu: z.string(),

  YetkiliKisi: z.string(),
  TcKimlikNo: z.string(),

  Tel: z.string(),
  CepTel: z.string(),
  Fax: z.string(),
  EpostaAdresi: z
    .string()
    .refine((v) => v === "" || z.string().email().safeParse(v).success, {
      message: "Geçerli bir e-posta adresi girin.",
    }),
  WebAdresi: z.string(),

  SirketAdresi: z.string().min(1, "Adres zorunludur."),
  Ulke: z.string().min(1, "Ülke zorunludur."),
  IlKodu: z.string().min(1, "İl seçiniz."),
  IlceKodu: z.string().min(1, "İlçe seçiniz."),

  VergiDairesi: z.string(),
  VergiNo: z.string(),

  IsyeriSgkSicilNumarasi: z.string(),
  IsyeriSgkIsKoluKodu: z.string(),
  TicaretSicilNumarasi: z.string(),

  IskurSubesi: z.string(),
  IskurNumarasi: z.string(),

  IsyeriAcilisTarihi: z.string().min(1, "İşyeri açılış tarihi zorunludur."),
  IsyeriKapanisTarihi: z.string(),

  Durum: z.boolean(),

  MulkiyetTuru: z.string(),
  TicaretSicilMudurluk: z.string(),
  IsyeriFaaliyetKodu: z.string(),
  AdresKodu: z.string(),
});

export type SubeForm = z.infer<typeof subeSchema>;