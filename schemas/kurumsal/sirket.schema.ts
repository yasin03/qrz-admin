// /schemas/kurumsal/sirket.schema.ts
import { z } from "zod";

// NOT: Alanlar burada .optional() DEĞİL — hepsi düz z.string(), çünkü
// CreateSirketRequest/UpdateSirketRequest interface'lerinde bu alanlar
// (YetkiliKisi dahil) `undefined` kabul etmiyor. Boş bırakılabilmeleri
// gereken alanlar için min() validasyonu yok, sadece tip olarak `string`
// (DEFAULT_VALUES'ta zaten hepsine "" veriyoruz, form hiç undefined üretmez).
export const sirketSchema = z.object({
  SirketAdi: z.string().min(2, "Şirket adı en az 2 karakter olmalıdır."),
  YetkiliKisi: z.string(),

  Adi: z.string(),
  Soyadi: z.string(),
  TcKimlikNo: z.string(),

  VergiDairesi: z.string().min(1, "Vergi dairesi zorunludur."),
  VergiNo: z.string().min(1, "Vergi no zorunludur."),

  Tel: z.string(),
  CepTel: z.string(),
  Fax: z.string(),

  EpostaAdresi: z
    .string()
    .refine((v) => v === "" || z.string().email().safeParse(v).success, {
      message: "Geçerli bir e-posta adresi girin.",
    }),
  WebAdresi: z.string(),

  SirketAdresi: z.string().min(1, "Şirket adresi zorunludur."),

  Ulke: z.string().min(1, "Ülke zorunludur."),
  IlKodu: z.string().min(1, "İl seçiniz."),
  IlceKodu: z.string().min(1, "İlçe seçiniz."),
  PostaKodu: z.string(),

  IsyeriSgkSicilNumarasi: z.string(),
  IsyeriSgkIsKoluKodu: z.string(),

  TicaretSicilNumarasi: z.string(),
  MersisNumarasi: z.string(),

  IskurSubesi: z.string(),
  IskurNumarasi: z.string(),

  IsyeriAcilisTarihi: z.string().min(1, "İşyeri açılış tarihi zorunludur."),
  IsyeriKapanisTarihi: z.string(),

  Durum: z.boolean(),

  MulkiyetTuru: z.string(),

  TicaretSicilMudurluk: z.string(),
  IsyeriFaaliyetKodu: z.string(),

  AdresKodu: z.string(),

  SirketTip: z.string().min(1, "Şirket tipi seçiniz."),

  ServisPassword: z.string(),
  ServisAktif: z.boolean(),
});

export type SirketForm = z.infer<typeof sirketSchema>;

// Eski isimlerle de export (mevcut importları kırmamak için)
export const createSirketSchema = sirketSchema;
export type CreateSirketForm = SirketForm;