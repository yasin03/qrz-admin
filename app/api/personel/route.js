import { NextResponse } from "next/server";
import { joseDecrypt } from "@/lib/token";
import { ExecuteQuery } from "@/lib/db";

function sqlStr(value) {
  return `'${String(value ?? "").replace(/'/g, "''")}'`;
}

function sqlNum(value) {
  return `'${Number(value ?? 0)}'`;
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
    sqlStr(p.SgkDurumu),
    sqlStr(p.IstihdamDurumu),
    sqlStr(p.PersonelMeslekKodu),
    sqlStr(p.PersonelSgkBelgeTuru),
    sqlStr(p.PersonelKanunNo),
    sqlStr(p.PersonelGorevKodu),
    sqlStr(p.CalismaDurumu),
    sqlStr(p.Ucret),
    sqlStr(p.MaasParaBirimi),
    sqlStr(p.OdemeSekli),
    sqlStr(p.UcretTipi),
    sqlStr(p.OgrenimDurumu),
    sqlStr(p.MezuniyetYili),
    sqlStr(p.MezuniyetBolumu),
    sqlStr(p.IDBanka),
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
    sqlStr(p.AgiOrani),
    sqlStr(p.BesOrani),
    sqlStr(p.DevredenSgkMatrahi),
    sqlStr(p.KumulatifSgkMatrahi),
    sqlStr(p.AuKumulatifVergiMatrahi),
    sqlStr(p.Telefon),
    sqlStr(p.Adres),
    sqlStr(p.Aciklama),
    sqlStr(p.CalismaAlani),
    sqlStr(p.Koordinatorluk),
    sqlStr(p.OzurlulukDerecesi),
    sqlStr(p.SendikaDurumu),
    sqlStr(p.GorevAdi),
    sqlStr(p.UnvanAdi),
    sqlStr(p.OzelKod),
    sqlStr(p.OzelKod2),
    sqlStr(p.AzCalismaDurumuGun),
    sqlStr(p.AzCalismaDurumuGunSayisi),
    sqlStr(p.IDPersonelIstisnaDurum),
    sqlStr(p.IstisnaDurumBilgi),
    sqlStr(p.IstisnaDurumTarih),
    sqlStr(p.PersonelSigortaKolu),
    sqlStr(p.IskurKayit),
    sqlStr(p.IskurKayitNo),
    sqlStr(p.Boy),
    sqlStr(p.Kilo),
    sqlStr(p.Yas),
    sqlStr(p.KimlikKartiDuzenlemeTarihi),
    sqlStr(p.KimlikKartiBitisTarihi),
    sqlStr(p.KimlikKartiSeriNo),
    sqlStr(p.GunlukUcret),
    sqlStr(p.SaatlikUcret),
    sqlStr(p.SozlesmeUcret),
    sqlStr(p.SozlesmeOdemeSekli),
    sqlStr(p.SozlesmeUcret2),
    sqlStr(p.SozlesmeOdemeSekli2),
    sqlStr(p.Ucret2),
    sqlStr(p.GunlukUcret2),
    sqlStr(p.SaatlikUcret2),
    sqlStr(p.HastalikRiskPrimDurumu),
    sqlStr(p.TesvikOrani),
    sqlStr(p.VergidenMuaf),
    sqlStr(p.MaliMesuliyet),
    sqlStr(p.BordroIstisnaUygulama),
    sqlStr(p.NetUcret),
    sqlStr(p.YardimHaric),
    sqlStr(p.AgiHaric),
    sqlStr(p.IlKodu),
    sqlStr(p.IlceKodu),
    sqlStr(p.CocukYardimiAlamaz),
    sqlStr(p.AsgeriUcretli),
    sqlStr(p.UcretOtomatikIsle),
    sqlStr(p.UcretOdemeGun),
    sqlStr(p.GecmistenKalanIzinGun),
  ].join(",");
}

const queryTypes = {
  GET_PERSONEL: (params) =>
    `[SubePersonel_SELECTByTarih] '${params.IDSube}','${params.IDBolum}','${params.DurumTarihi}','${params.Durum}'`,
  GET_PERSONEL_DETAY: (params) =>
    `[SubePersonel_SELECTByIDSubePersonel] '${params.IDSubePersonel}'`,
  DELETE_PERSONEL: (params) =>
    `[SubePersonel_DELETEByIDSubePersonel] '${params.IDSubePersonel}'`,
  INSERT_PERSONEL: (params) =>
    `[SubePersonel_INSERT] ${buildPersonelParams(params)}`,
  UPDATE_PERSONEL: (params) =>
    `[SubePersonel_UPDATEByIDSubePersonel] @IDSubePersonel=${sqlNum(params.IDSubePersonel)},${buildPersonelParams(params)}`,
};

export async function POST(request) {
  try {
    const payload = await request.json();
    const { type } = payload;

    const sid = request.cookies.get("sid")?.value;
    const grsisudoToken = request.cookies.get("grsisudo")?.value;

    const user = sid ? await joseDecrypt(sid) : null;
    const grsisudo = grsisudoToken ? await joseDecrypt(grsisudoToken) : null;

    if (!user) {
      return NextResponse.json(
        { message: "Kullanıcı Bilgisi Bulunamadı." },
        { status: 401 },
      );
    }

    if (!grsisudo) {
      return NextResponse.json(
        { message: "Lütfen önce üstten şirket/şube seçimi yapın." },
        { status: 400 },
      );
    }

    const queryParams = {
      IDSirket: grsisudo.IDSirket,
      Yil: grsisudo.Yil,
      IDKullanici: user.IDKullanici,
      // DÜZELTME: IDSube artık filtreden gelen değeri kullanıyor (kullanıcı
      // farklı bir şubeyi görüntülemek isteyebilir), context'teki değil.
      // Filtre panelinde varsayılan olarak context'teki şube seçili geliyor
      // zaten (PersonelFiltre.tsx buna göre kuruldu).
      IDSubePersonel: payload.IDSubePersonel,
      IDSube: payload.IDSube,
      IDBolum: payload.IDBolum ?? "",
      DurumTarihi: payload.DurumTarihi,
      Durum: payload.Durum ?? "",
    };

    const queryFunction = queryTypes[type];

    if (!queryFunction) {
      return NextResponse.json(
        { message: "Geçersiz sorgu tipi" },
        { status: 400 },
      );
    }

    const query = queryFunction(queryParams);
    const result = await ExecuteQuery(query);

    return NextResponse.json(result);
  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json(
      {
        message: "Bir hata oluştu. Lütfen tekrar deneyiniz",
        error: err.message,
      },
      { status: 500 },
    );
  }
}
