import { NextResponse } from "next/server";
import { joseDecrypt } from "@/lib/token";
import { ExecuteQuery, ExecuteQueryDataset } from "@/lib/db";

const queryTypes = {
  SELECT_PDKS: (params) => `[SubePersonelSaat_SelectByIDSubeBolum] '${params.IDSube}','${params.IDBolum}','${params.Tarih1}','${params.Tarih2}'`,
  
  SELECT_PDKS_SUBE: (params) => `[SubeVardiyaSaat_SELECT] '${params.IDSube}'`,
  INSERT_PDKS_SUBE: (params) =>
    `[SubeVardiyaSaat_INSERT] '${params.IDSube}','${params.VardiyaAdi}','${params.BaslamaSaati}','${params.BitisSaati}','${params.Gece}','${params.HT}','${params.HTGun}'`,
  UPDATE_PDKS_SUBE: (params) =>
    `[SubeVardiyaSaat_UPDATEByIDSubeVardiyaSaat] '${params.IDSubeVardiyaSaat}', '${params.IDSube}','${params.VardiyaAdi}','${params.BaslamaSaati}','${params.BitisSaati}','${params.Gece}','${params.HT}','${params.HTGun}'`,
  DELETE_PDKS_SUBE: (params) =>
    `[SubeVardiyaSaat_DELETEByIDSubeVardiyaSaat] '${params.IDSubeVardiyaSaat}'`,

  SELECT_PDKS_BOLUM: (params) => `[BolumVardiyaSaat_SELECT] '${params.IDBolum}'`,
  INSERT_PDKS_BOLUM: (params) =>
    `[BolumVardiyaSaat_INSERT] '${params.IDBolum}','${params.VardiyaAdi}','${params.BaslamaSaati}','${params.BitisSaati}','${params.Gece}','${params.HT}','${params.HTGun}'`,
  UPDATE_PDKS_BOLUM: (params) =>
    `[BolumVardiyaSaat_UPDATEByIDBolumVardiyaSaat] '${params.IDBolumVardiyaSaat}', '${params.IDBolum}','${params.VardiyaAdi}','${params.BaslamaSaati}','${params.BitisSaati}','${params.Gece}','${params.HT}','${params.HTGun}'`,
  DELETE_PDKS_BOLUM: (params) =>
    `[BolumVardiyaSaat_DELETEByIDBolumVardiyaSaat] '${params.IDBolumVardiyaSaat}'`,
};

export async function POST(request) {
  try {
    const payload = await request.json();
    const { type } = payload;

    const user_token = request.cookies.get("sid")?.value;
    const user = await joseDecrypt(user_token);
    const grsisudo_token = request.cookies.get("grsisudo")?.value;
    const grsisudo = await joseDecrypt(grsisudo_token);

    if (!user) {
      return NextResponse.json(
        { message: "Kullanıcı Bilgisi Bulunamadı." },
        { status: 401 },
      );
    }

    const queryParams = {
      IDSirket: grsisudo.IDSirket,
      IDSube: grsisudo.IDSube,
      IDBolum: payload.IDBolum,
      IDSubeVardiyaSaat: payload.IDSubeVardiyaSaat,
      IDBolumVardiyaSaat: payload.IDBolumVardiyaSaat,
      VardiyaAdi: payload.VardiyaAdi,
      BaslamaSaati: payload.BaslamaSaati,
      BitisSaati: payload.BitisSaati,
      Gece: payload.Gece,
      HT: payload.HT,
      HTGun: payload.HTGun,
      Tarih1: payload.Tarih1,
      Tarih2: payload.Tarih2,
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
