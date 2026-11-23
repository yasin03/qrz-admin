import { z } from "zod";

export { SECILMEDI } from "@/modules/core/schemas/ajanda.schema";

const SAAT = /^\d{2}:\d{2}$/;
const EPOSTA = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TCKN = /^\d{11}$/;
const SAYI = /^\d+$/;

/** Boş bırakılabilen, en fazla `max` karakterlik metin. */
const metin = (max: number) => z.string().trim().max(max, `En fazla ${max} karakter.`);

/* ---------------- Kişi ---------------- */

export const kisiSchema = z
  .object({
    /** "1" Gerçek kişi, "2" Tüzel kişi */
    KisiTuru: z.enum(["1", "2"]),

    Kurum: metin(200),
    YetkiliKisi: metin(200),
    YetkiliKisiPozisyonu: metin(100),
    YetkiliKisiTel: metin(50),
    YetkiliKisiEPostaAdresi: metin(200).refine((v) => !v || EPOSTA.test(v), "Geçerli bir e-posta girin."),
    Adres: metin(300),
    /** 3 haneli il kodu ya da SECILMEDI. */
    IlKodu: z.string(),

    VergiNo: metin(50),
    TcKimlikNo: z.string().trim().refine((v) => !v || TCKN.test(v), "11 haneli olmalı."),

    CepTelefon: metin(50),
    Fax: metin(50),
    WebSitesi: metin(200),
    Linkedin: metin(200),
    Facebook: metin(200),
    Twitter: metin(200),
    Instagram: metin(200),

    EmailKabul: z.boolean(),
    SmsKabul: z.boolean(),
    AramaKabul: z.boolean(),
    WhatsappKabul: z.boolean(),

    Notlar: metin(500),
    Durum: z.boolean(),
    Kaynak: metin(100),
  })
  .superRefine((v, ctx) => {
    if (!v.Kurum && !v.YetkiliKisi) {
      ctx.addIssue({
        code: "custom",
        path: [v.KisiTuru === "2" ? "Kurum" : "YetkiliKisi"],
        message: v.KisiTuru === "2" ? "Kurum adı zorunludur." : "Ad soyad zorunludur.",
      });
    }
  });

export type KisiForm = z.infer<typeof kisiSchema>;

/* ---------------- Aktivite (görüşme / randevu) ---------------- */

export const aktiviteSchema = z
  .object({
    /** "1" Görüşme (yapıldı), "0" Randevu (planlandı). Düzenlemede değişmez. */
    Durum: z.enum(["0", "1"]),
    /** "yyyy-MM-dd" */
    Tarih: z.string().min(1, "Tarih zorunludur."),
    /** "HH:mm" */
    Saat: z.string().regex(SAAT, "Saat zorunludur."),
    /** Dakika, boş bırakılabilir. */
    Sure: z.string().trim().refine((v) => !v || SAYI.test(v), "Dakika olarak girin."),
    GorusmeAraci: z.string(),
    Konu: metin(250),
    Aciklama: z.string(),
    /** Dakika ya da SECILMEDI (sadece randevuda). */
    HatirlatmaDakika: z.string(),
    HatirlatmaEposta: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.Durum === "1" && !v.Konu && !v.Aciklama.trim()) {
      ctx.addIssue({ code: "custom", path: ["Aciklama"], message: "Görüşme notu girin." });
    }
  });

export type AktiviteForm = z.infer<typeof aktiviteSchema>;

/** Randevu → görüşme formu. */
export const tamamlaSchema = z.object({
  Aciklama: z.string(),
  Sure: z.string().trim().refine((v) => !v || SAYI.test(v), "Dakika olarak girin."),
});

export type TamamlaForm = z.infer<typeof tamamlaSchema>;
