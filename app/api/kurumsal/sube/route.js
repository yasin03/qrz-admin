import { NextResponse } from "next/server";
import { joseDecrypt } from "@/lib/token";
import { ExecuteQuery } from "@/lib/db";

function sqlStr(value) {
  return `'${String(value ?? "").replace(/'/g, "''")}'`;
}

function sqlNum(value) {
  return `'${Number(value ?? 0)}'`;
}

// Sube_Insert ve Sube_UPDATEByIDSube birebir aynı parametre listesini,
// aynı sırayla alıyor (UPDATE'te başa @IDSube ekleniyor).
function buildSubeParams(p) {
  return [
    sqlNum(p.IDSirket),
    sqlStr(p.SubeAdi),
    sqlStr(p.SubeKodu),
    sqlStr(p.YetkiliKisi),
    sqlStr(p.TcKimlikNo),
    sqlStr(p.Tel),
    sqlStr(p.CepTel),
    sqlStr(p.Fax),
    sqlStr(p.EpostaAdresi),
    sqlStr(p.WebAdresi),
    sqlStr(p.SirketAdresi),
    sqlStr(p.IlKodu),
    sqlStr(p.IlceKodu),
    sqlStr(p.IsyeriSgkSicilNumarasi),
    sqlStr(p.TicaretSicilNumarasi),
    sqlStr(p.SgkMudurlugu),
    sqlStr(p.IsyeriAcilisTarihi),
    sqlStr(p.IsyeriKapanisTarihi),
    sqlStr(p.IskurSubesi),
    sqlStr(p.IskurNumarasi),
    sqlStr(p.IskurSifresi),
    sqlStr(p.BesBaslangicTarihi),
    sqlNum(p.BesKesintiOrani),
    sqlStr(p.SifreKullaniciAdi),
    sqlStr(p.SifreKullaniciKodu),
    sqlStr(p.SifreSistem),
    sqlStr(p.SifreIsyeri),
    sqlStr(p.IsyeriSgkIsKoluKodu),
    sqlStr(p.VergiDairesi),
    sqlStr(p.VergiNo),
    sqlStr(p.IsyeriTehlikeSinifi),
    sqlStr(p.TehlikeDerecesi),
    sqlStr(p.NaceKodu),
    sqlStr(p.NaceKoduAciklama),
    sqlNum(p.Durum),
    sqlStr(p.KodSektor),
    sqlStr(p.KodIsKolu),
    sqlStr(p.KodYSube),
    sqlStr(p.KodESube),
    sqlStr(p.KodSiraNo),
    sqlStr(p.KodIl),
    sqlStr(p.KodIlce),
    sqlStr(p.KodKontrolNo),
    sqlStr(p.KodAraci),
    sqlStr(p.IskurBaslangicTarihi),
    sqlStr(p.IskurBitisTarihi),
    sqlStr(p.Statu),
    sqlNum(p.TesvikVermeDurumu),
    sqlNum(p.StopajDurum),
    sqlStr(p.stIsyeriAdi),
    sqlStr(p.stAd),
    sqlStr(p.stSoyad),
    sqlStr(p.stVergiNo),
    sqlStr(p.stTcKimlikNo),
    sqlStr(p.stUcretTipi),
    sqlNum(p.stUcret),
    sqlStr(p.stAdresKodu),
    sqlStr(p.MulkiyetTuru),
    sqlStr(p.TicaretSicilMudurluk),
    sqlStr(p.IsyeriFaaliyetKodu),
    sqlStr(p.AdresKodu),
    sqlStr(p.Cizelge15),
    sqlStr(p.MuhasebeBirimKodu),
    sqlStr(p.MuhasebeBirimAdi),
    sqlStr(p.KurumKodu),
    sqlStr(p.KurumAdi),
    sqlStr(p.SinifKodu),
    sqlStr(p.DuzenleyenAdSoyad),
    sqlStr(p.DuzenleyenUnvan),
    sqlStr(p.GerceklestirenAdSoyad),
    sqlStr(p.GerceklestirenUnvan),
    sqlStr(p.IsyeriSubeKodu),
    sqlStr(p.IsyeriTuru),
    sqlStr(p.BankaKurumKodu),
    sqlStr(p.BankaSubeKodu),
    sqlStr(p.BankaHesapNo),
    sqlStr(p.BankaIbanNo),
    sqlStr(p.IDBanka),
    sqlNum(p.IDKullanici),
  ].join(",");
}

const queryTypes = {
  GET_SUBELER: (params) =>
    `[KullaniciAlan_SELECT_IDSube] '${params.IDKullanici}', '${params.IDSirket}'`,

  ADD_SUBE: (params) => `[Sube_Insert] ${buildSubeParams(params)}`,

  UPDATE_SUBE: (params) =>
    `[Sube_UPDATEByIDSube] @IDSube=${sqlNum(params.IDSube)},${buildSubeParams(params)}`,

  // DÜZELTME: eskiden yanlışlıkla params.IDGurup kullanılıyordu (Grup
  // route'undan kopyalanmış), silinmesi gereken IDSube olmalı.
  DELETE_SUBE: (params) => `[Sube_DELETEByIDSube] '${params.IDSube}'`,
};

export async function POST(request) {
  try {
    const payload = await request.json();
    const { type } = payload;

    const sid = request.cookies.get("sid")?.value;
    const user = sid ? await joseDecrypt(sid) : null;

    if (!user) {
      return NextResponse.json(
        { message: "Kullanıcı Bilgisi Bulunamadı." },
        { status: 401 },
      );
    }

    const queryFunction = queryTypes[type];
    if (!queryFunction) {
      return NextResponse.json(
        { message: "Geçersiz sorgu tipi" },
        { status: 400 },
      );
    }

    // IDKullanici client'tan gelen değere değil, her zaman session'a göre.
    const queryParams = {
      ...payload,
      IDKullanici: user.IDKullanici,
    };

    const query = queryFunction(queryParams);
    console.log("Executing query:", query);
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