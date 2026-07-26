import { NextResponse } from "next/server";
import { joseDecrypt } from "@/lib/token";
import { ExecuteQuery } from "@/lib/db";

function sqlStr(value) {
  return `'${String(value ?? "").replace(/'/g, "''")}'`;
}

function sqlNum(value) {
  return `'${Number(value ?? 0)}'`;
}

function buildSirketParams(p) {
  return [
    p.IDFirma,
    sqlNum(p.IDGurup),
    sqlStr(p.SirketAdi),
    sqlStr(p.YetkiliKisi),
    sqlStr(p.Adi),
    sqlStr(p.Soyadi),
    sqlStr(p.TcKimlikNo),
    sqlStr(p.VergiDairesi),
    sqlStr(p.VergiNo),
    sqlStr(p.Tel),
    sqlStr(p.CepTel),
    sqlStr(p.Fax),
    sqlStr(p.EpostaAdresi),
    sqlStr(p.WebAdresi),
    sqlStr(p.SirketAdresi),
    sqlStr(p.Ulke),
    sqlStr(p.IlKodu),
    sqlStr(p.IlceKodu),
    sqlStr(p.PostaKodu),
    sqlStr(p.IsyeriSgkSicilNumarasi),
    sqlStr(p.IsyeriSgkIsKoluKodu),
    sqlStr(p.TicaretSicilNumarasi),
    sqlStr(p.MersisNumarasi),
    sqlStr(p.IskurSubesi),
    sqlStr(p.IskurNumarasi),
    sqlStr(p.IsyeriAcilisTarihi),
    sqlStr(p.IsyeriKapanisTarihi),
    sqlNum(p.Durum),
    sqlStr(p.MulkiyetTuru),
    sqlStr(p.TicaretSicilMudurluk),
    sqlStr(p.IsyeriFaaliyetKodu),
    sqlStr(p.AdresKodu),
    sqlStr(p.SirketTip),
    sqlStr(p.ServisPassword),
    sqlNum(p.ServisAktif),
    sqlNum(p.IDKullanici),
  ].join(",");
}

const queryTypes = {
  GET_SIRKETLER: (params) =>
    `[KullaniciAlan_SELECT_IDSirket] '${params.IDKullanici}', '${params.IDGurup}'`,

  ADD_SIRKET: (params) => `[Sirket_Insert] ${buildSirketParams(params)}`,

  UPDATE_SIRKET: (params) =>
    `[Sirket_UpdateByIDSirket] @IDSirket=${sqlNum(params.IDSirket)},${buildSirketParams(params)}`,

  // DÜZELTME: eskiden yanlışlıkla params.IDGurup kullanılıyordu, silinmesi
  // gereken IDSirket olmalı.
  DELETE_SIRKET: (params) => `[Sirket_DELETEByIDSirket] '${params.IDSirket}'`,
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

    // Session'dan gelenler (client'ın göndermesine güvenmiyoruz):
    // IDFirma ve IDKullanici her zaman cookie'deki oturumdan alınır.
    const queryParams = {
      ...payload,
      IDFirma: user.IDFirma,
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
