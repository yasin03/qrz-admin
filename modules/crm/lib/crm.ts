import { format } from "date-fns";

import { parseYerel } from "@/modules/core/lib/ajanda";
import {
  SECILMEDI,
  type AktiviteForm,
  type KisiForm,
  type TamamlaForm,
} from "@/modules/crm/schemas/crm.schema";
import type {
  CrmAktiviteAlanlari,
  CrmAktiviteDurum,
  CrmAktiviteRow,
  CrmKisiAlanlari,
  CrmKisiRow,
  CrmKisiTip,
  CrmKisiTuru,
} from "@/modules/crm/types/crm";

/* ------------------------------------------------------------------ */
/* Etiketler / seçenekler                                              */
/* ------------------------------------------------------------------ */

export const KISI_TIP_ETIKET: Record<CrmKisiTip, string> = {
  Kontak: "Kontak",
  Musteri: "Müşteri",
};

export const KISI_TURU_SECENEKLERI: { value: `${CrmKisiTuru}`; label: string }[] = [
  { value: "1", label: "Gerçek kişi" },
  { value: "2", label: "Tüzel kişi" },
];

export const AKTIVITE_DURUM_ETIKET: Record<CrmAktiviteDurum, string> = {
  0: "Planlandı",
  1: "Yapıldı",
  2: "İptal",
};

/** DB'de kod olarak saklanır (CrmAktivite.GorusmeAraci). */
export const GORUSME_ARACI_SECENEKLERI = [
  { value: "TELEFON", label: "Telefon" },
  { value: "E-POSTA", label: "E-posta" },
  { value: "YUZYUZE", label: "Yüz yüze" },
  { value: "ONLINE", label: "Online" },
] as const;

export function gorusmeAraciEtiket(kod: string | null | undefined) {
  if (!kod) return "-";
  return GORUSME_ARACI_SECENEKLERI.find((s) => s.value === kod)?.label ?? kod;
}

/** Listede ve başlıklarda gösterilecek ad: kurum, yoksa yetkili kişi. */
export function kisiAdi(k: Pick<CrmKisiRow, "Kurum" | "YetkiliKisi">) {
  return k.Kurum?.trim() || k.YetkiliKisi?.trim() || "-";
}

/** Planlanmış ve zamanı geçmiş randevu. */
export function gecikmisMi(a: Pick<CrmAktiviteRow, "Durum" | "Tarih">, simdi = new Date()) {
  const t = parseYerel(a.Tarih);
  return a.Durum === 0 && t != null && t < simdi;
}

/* ------------------------------------------------------------------ */
/* Kişi formu ↔ API                                                    */
/* ------------------------------------------------------------------ */

/** Yeni kayıt için boş form veya mevcut kaydın form değerleri. */
export function kisiFormVarsayilan(k?: CrmKisiRow | null): KisiForm {
  return {
    KisiTuru: String(k?.KisiTuru ?? 2) as KisiForm["KisiTuru"],
    Kurum: k?.Kurum ?? "",
    YetkiliKisi: k?.YetkiliKisi ?? "",
    YetkiliKisiPozisyonu: k?.YetkiliKisiPozisyonu ?? "",
    YetkiliKisiTel: k?.YetkiliKisiTel ?? "",
    YetkiliKisiEPostaAdresi: k?.YetkiliKisiEPostaAdresi ?? "",
    Adres: k?.Adres ?? "",
    IlKodu: k?.IlKodu || SECILMEDI,
    VergiNo: k?.VergiNo ?? "",
    TcKimlikNo: k?.TcKimlikNo ?? "",
    CepTelefon: k?.CepTelefon ?? "",
    Fax: k?.Fax ?? "",
    WebSitesi: k?.WebSitesi ?? "",
    Linkedin: k?.Linkedin ?? "",
    Facebook: k?.Facebook ?? "",
    Twitter: k?.Twitter ?? "",
    Instagram: k?.Instagram ?? "",
    EmailKabul: k?.EmailKabul ?? true,
    SmsKabul: k?.SmsKabul ?? true,
    AramaKabul: k?.AramaKabul ?? true,
    WhatsappKabul: k?.WhatsappKabul ?? true,
    Notlar: k?.Notlar ?? "",
    Durum: k?.Durum ?? true,
    Kaynak: k?.Kaynak ?? "",
  };
}

/** Form → servis parametreleri (insert ve update ortak). */
export function kisiFormdanParams(f: KisiForm): CrmKisiAlanlari {
  return {
    ...f,
    KisiTuru: Number(f.KisiTuru) as CrmKisiTuru,
    IlKodu: f.IlKodu === SECILMEDI ? null : f.IlKodu,
  };
}

/* ------------------------------------------------------------------ */
/* Aktivite formu ↔ API                                                */
/* ------------------------------------------------------------------ */

/**
 * Yeni kayıt için form (varsayılan: şimdi, görüşme) veya mevcut kaydın
 * form değerleri. `durum` yeni kayıtta görüşme (1) / randevu (0) seçimi.
 */
export function aktiviteFormVarsayilan(
  a?: CrmAktiviteRow | null,
  durum: 0 | 1 = 1,
): AktiviteForm {
  const tarih = parseYerel(a?.Tarih) ?? new Date();
  return {
    Durum: a ? (a.Durum === 1 ? "1" : "0") : (String(durum) as AktiviteForm["Durum"]),
    Tarih: format(tarih, "yyyy-MM-dd"),
    Saat: format(tarih, "HH:mm"),
    Sure: a?.Sure != null ? String(a.Sure) : "",
    GorusmeAraci: a?.GorusmeAraci ?? "TELEFON",
    Konu: a?.Konu ?? "",
    Aciklama: a?.Aciklama ?? "",
    HatirlatmaDakika: a?.HatirlatmaDakika != null ? String(a.HatirlatmaDakika) : SECILMEDI,
    HatirlatmaEposta: a?.HatirlatmaKanal === 2 || a?.HatirlatmaKanal === 3,
  };
}

/** Form → servis parametreleri (insert ve update ortak). Hatırlatma sadece randevuda. */
export function aktiviteFormdanParams(f: AktiviteForm): CrmAktiviteAlanlari {
  const randevu = f.Durum === "0";
  const dakika = randevu && f.HatirlatmaDakika !== SECILMEDI ? Number(f.HatirlatmaDakika) : null;
  return {
    Tarih: parseYerel(`${f.Tarih}T${f.Saat}:00`) ?? new Date(),
    Sure: f.Sure ? Number(f.Sure) : null,
    GorusmeAraci: f.GorusmeAraci || null,
    Konu: f.Konu || null,
    Aciklama: f.Aciklama || null,
    HatirlatmaDakika: dakika,
    HatirlatmaKanal: dakika == null ? null : f.HatirlatmaEposta ? 3 : 1,
  };
}

export function tamamlaFormdanParams(f: TamamlaForm) {
  return {
    Aciklama: f.Aciklama || null,
    Sure: f.Sure ? Number(f.Sure) : null,
  };
}
