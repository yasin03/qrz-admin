import { NextResponse } from "next/server";
import { ExecuteQuery } from "@/lib/db";
import { ok, fail, withSession } from "@/lib/api-session";

// mobil (Bearer) istekleri sadece okuma yapabilir; personel CRUD'u web-only.
const MOBILE_ALLOWED_TYPES = ["GET_PERSONEL_DETAY", "SELECT_PERSONEL_LIST"];

function sqlStr(value) {
  return `'${String(value ?? "").replace(/'/g, "''")}'`;
}

function sqlNum(value) {
  return `${Number(value ?? 0)}`;
}

function buildPersonelParams(p) {
  return [
    sqlNum(p.IDSube),
    sqlStr(p.IDBolum),
    sqlStr(p.SicilNo),
    sqlStr(p.TcKimlikNo),
    sqlStr(p.Ad),
    sqlStr(p.Soyad),
    sqlStr(p.IlkSoyad),
    sqlStr(p.Cinsiyet),
    sqlStr(p.DogumTarihi),
    sqlStr(p.DogumYeri),
    sqlStr(p.MedeniDurum),
    sqlStr(p.Uyruk),
    sqlStr(p.KanGurubu),
    sqlStr(p.IseIlkGirisTarihi),
    sqlStr(p.IseSonGirisTarihi),
    sqlNum(p.SgkDurumu),
    sqlNum(p.IstihdamDurumu),
    sqlStr(p.PersonelMeslekKodu),
    sqlStr(p.PersonelSgkBelgeTuru),
    sqlStr(p.PersonelKanunNo),
    sqlNum(p.PersonelGorevKodu),
    sqlNum(p.CalismaDurumu),
    sqlNum(p.Ucret),
    sqlNum(p.MaasParaBirimi),
    sqlNum(p.OdemeSekli),
    sqlNum(p.UcretTipi),
    sqlNum(p.OgrenimDurumu),
    sqlStr(p.MezuniyetYili),
    sqlStr(p.MezuniyetBolumu),
    sqlNum(p.IDBanka),
    sqlStr(p.BankaSubeKodu),
    sqlStr(p.BankaHesapNo),
    sqlStr(p.BankaIbanNo),
    sqlStr(p.IDLokasyon),
    sqlStr(p.CikisTarihi),
    sqlStr(p.PersonelAyrilisKodu),
    sqlStr(p.AgiAlmazDurumu),
    sqlStr(p.BesKesilmezDurumu),
    sqlStr(p.EskiHukumluDurumu),
    sqlStr(p.OzurluDurumu),
    sqlStr(p.AzCalismaDurumu),
    sqlNum(p.AgiOrani),
    sqlNum(p.BesOrani),
    sqlNum(p.DevredenSgkMatrahi),
    sqlNum(p.KumulatifSgkMatrahi),
    sqlStr(p.AuKumulatifVergiMatrahi),
    sqlStr(p.Telefon),
    sqlStr(p.Adres),
    sqlStr(p.Aciklama),
    sqlStr(p.CalismaAlani),
    sqlStr(p.Koordinatorluk),
    sqlNum(p.OzurlulukDerecesi),
    sqlStr(p.SendikaDurumu),
    sqlStr(p.GorevAdi),
    sqlStr(p.UnvanAdi),
    sqlStr(p.OzelKod),
    sqlStr(p.OzelKod2),
    sqlStr(p.AzCalismaDurumuGun),
    sqlNum(p.AzCalismaDurumuGunSayisi),
    sqlNum(p.IDPersonelIstisnaDurum),
    sqlStr(p.IstisnaDurumBilgi),
    sqlStr(p.IstisnaDurumTarih),
    sqlStr(p.PersonelSigortaKolu),
    sqlStr(p.IskurKayit),
    sqlStr(p.IskurKayitNo),
    sqlNum(p.Boy),
    sqlNum(p.Kilo),
    sqlNum(p.Yas),
    sqlStr(p.KimlikKartiDuzenlemeTarihi),
    sqlStr(p.KimlikKartiBitisTarihi),
    sqlStr(p.KimlikKartiSeriNo),
    sqlNum(p.GunlukUcret),
    sqlNum(p.SaatlikUcret),
    sqlNum(p.SozlesmeUcret),
    sqlNum(p.SozlesmeOdemeSekli),
    sqlNum(p.SozlesmeUcret2),
    sqlNum(p.SozlesmeOdemeSekli2),
    sqlNum(p.Ucret2),
    sqlNum(p.GunlukUcret2),
    sqlNum(p.SaatlikUcret2),
    sqlStr(p.HastalikRiskPrimDurumu),
    sqlNum(p.TesvikOrani),
    sqlStr(p.VergidenMuaf),
    sqlStr(p.MaliMesuliyet),
    sqlStr(p.BordroIstisnaUygulama),
    sqlNum(p.NetUcret),
    sqlStr(p.YardimHaric),
    sqlStr(p.AgiHaric),
    sqlStr(p.IlKodu),
    sqlStr(p.IlceKodu),
    sqlStr(p.CocukYardimiAlamaz),
    sqlStr(p.AsgeriUcretli),
    sqlStr(p.UcretOtomatikIsle),
    sqlStr(p.UcretOdemeGun),
    sqlNum(p.GecmistenKalanIzinGun),
  ].join(",");
}

const queryTypes = {
  GET_PERSONEL: (params) =>
    `[SubePersonel_SELECTByTarih] '${params.IDSube}','${params.IDBolum}','${params.DurumTarihi}','${params.Durum}'`,
  GET_AKTIF_PERSONEL: (params) =>
    `[SubePersonel_SELECTByIDSube3] '${params.IDSube}', '${params.TcKimlikNo}','${params.Adi}','${params.Yil}','${params.Ay}'`,
  GET_PERSONEL_DETAY: (params) =>
    `[SubePersonel_SELECTByIDSubePersonel] '${params.IDSubePersonel}'`,
  DELETE_PERSONEL: (params) =>
    `[SubePersonel_DELETEByIDSubePersonel] '${params.IDSubePersonel}'`,
  INSERT_PERSONEL: (params) =>
    `[SubePersonel_INSERT] ${buildPersonelParams(params)}`,
  UPDATE_PERSONEL: (params) =>
    `[SubePersonel_UPDATEByIDSubePersonel] ${sqlNum(params.IDSubePersonel)}, ${buildPersonelParams(params)}`,
  UPDATE_PERSONEL_SETTINGS: (params) =>
    `[SubePersonel_UpdateSifre] ${sqlNum(params.IDSubePersonel)}, '${params.Telefon}', '${params.Sifre}', '${params.KullaniciAktif}'`,
  RESET_PHONE_AKTIVASYON: (params) =>
    `[SubePersonel_CihazAktivasyonResetle] ${sqlNum(params.IDSubePersonel)}`,
  SELECT_PERSONEL_LIST: (params) =>
    `[SubePersonel_SELECTByIDSube3] '${params.IDSube}', '${params.TcKimlikNo}','${params.Adi}','${params.Yil}','${params.Ay}'`,
};

export const POST = withSession(async (request, session) => {
  try {
    const payload = await request.json();
    const { type } = payload;

    if (session.isMobile && !MOBILE_ALLOWED_TYPES.includes(type)) {
      return fail(true, "Bu islem mobilde desteklenmiyor.", 403, "FORBIDDEN");
    }

    if (!session.isMobile && !session.user.IDSirket) {
      return fail(
        false,
        "Lütfen önce üstten şirket/şube seçimi yapın.",
        400,
      );
    }

    // Onceki siralamada '...payload' en sonda oldugu icin client IDSube/Durum
    // gibi alanlari null gonderirse asagidaki fallback/default'lari sessizce
    // eziyordu - payload'i taban alip session/varsayilan degerleri onun
    // ustune yaziyoruz.
    const queryParams = {
      ...payload,
      IDSirket: session.user.IDSirket,
      IDKullanici: session.user.IDKullanici,
      Yil: payload.Yil ? payload.Yil : session.user.Yil,
      Ay: payload.Ay ? payload.Ay : session.user.Ay,
      IDSube: payload.IDSube ? payload.IDSube : session.user.IDSube,
      IDBolum: payload.IDBolum ?? "",
      Durum: payload.Durum ?? "",
      TcKimlikNo: payload.TcKimlikNo ?? "",
      Adi: payload.Adi ?? "",
    };

    const queryFunction = queryTypes[type];

    if (!queryFunction) {
      return fail(session.isMobile, "Geçersiz sorgu tipi", 400);
    }

    const query = queryFunction(queryParams);
    const result = await ExecuteQuery(query);

    return ok(session.isMobile, result);
  } catch (err) {
    console.error("API Error:", err);

    if (session.isMobile) {
      return fail(
        true,
        "Bir hata oluştu. Lütfen tekrar deneyiniz",
        500,
        "SERVER_ERROR",
      );
    }

    return NextResponse.json(
      {
        message: "Bir hata oluştu. Lütfen tekrar deneyiniz",
        error: err.message,
      },
      { status: 500 },
    );
  }
});
