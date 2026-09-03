import { NextResponse } from "next/server";
import { joseDecrypt } from "@/lib/token";
import { ExecuteQuery, ExecuteQueryDataset } from "@/lib/db";
import { getCookie } from "cookies-next";

const queryTypes = {
  SELECT_LOKASYON: (params) =>
    `[BolumLokasyon_SELECTByIDSube] '${params.IDSube}','${params.IDBolum}'`,
  INSERT_LOKASYON: (params) =>
    `[BolumLokasyon_INSERT] '${params.IDBolum}','${params.LokasyonAdi}','${params.Enlem}','${params.Boylam}','${params.Aktif}'`,
  UPDATE_LOKASYON: (params) =>
    `[BolumLokasyon_UPDATEByIDBolumLokasyon] '${params.IDBolumLokasyon}','${params.IDBolum}','${params.LokasyonAdi}','${params.Enlem}','${params.Boylam}','${params.Aktif}'`,
  DELETE_LOKASYON: (params) =>
    `[BolumLokasyon_DELETEByIDBolumLokasyon] '${params.IDBolumLokasyon}'`,
};

export async function POST(request) {
  try {
    const payload = await request.json();
    const { type } = payload;

    const sid = request.cookies.get("sid")?.value;
    const grsisudo = request.cookies.get("grsisudo")?.value;
    const user = await joseDecrypt(sid);
    const gruSisudo = await joseDecrypt(grsisudo);

    if (!user) {
      return NextResponse.json(
        { message: "Kullanıcı Bilgisi Bulunamadı." },
        { status: 401 },
      );
    }

    const queryParams = {
      IDSirket: grsisudo.IDSirket,
      IDSube: gruSisudo.IDSube,
      IDBolum: payload.IDBolum ?? "0",
      IDBolumLokasyon: payload.IDBolumLokasyon,
      Yil: grsisudo.Yil,
      IDKullanici: user.IDKullanici,
      IDUlke: payload.IDUlke,
      LokasyonAdi: payload.LokasyonAdi,
      Enlem: payload.Enlem,
      Boylam: payload.Boylam,
      Aktif: payload.Aktif,
    };

    const queryFunction = queryTypes[type];

    if (!queryFunction) {
      return NextResponse.json(
        { message: "Geçersiz sorgu tipi" },
        { status: 400 },
      );
    }

    const query = queryFunction(queryParams);
    let result;
    console.log("query", query);
    result = await ExecuteQuery(query);

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
