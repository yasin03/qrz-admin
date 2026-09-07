import { NextResponse } from "next/server";
import { joseDecrypt } from "@/lib/token";
import { ExecuteQuery } from "@/lib/db";
import { getCookie } from "cookies-next";

const queryTypes = {
  GET_BOLUMLER: (params) => `[Bolum_SELECTByIDSube] '${params.IDSube}'`,
  ADD_BOLUM: (params) =>
    `[Bolum_INSERT] '${params.IDSube}', '${params.BolumAdi}', '${params.IDKullanici}'`,
  UPDATE_BOLUM: (params) =>
    `[Bolum_UPDATEByIDBolum] '${params.IDBolum}','${params.IDSube}', '${params.BolumAdi}', '${params.IDKullanici}'`,
  DELETE_BOLUM: (params) => `[Bolum_DELETEByIDBolum] '${params.IDBolum}'`,
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
      Yil: grsisudo.Yil,
      IDKullanici: user.IDKullanici,
      IDSube: payload.IDSube,
      BolumAdi: payload.BolumAdi,
      IDBolum: payload.IDBolum,
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
