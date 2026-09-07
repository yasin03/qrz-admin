import { NextResponse } from "next/server";
import { joseDecrypt } from "@/lib/token";
import { ExecuteQuery } from "@/lib/db";
import { getCookie } from "cookies-next";

const queryTypes = {
  GET_GRUPLAR: (params) =>
    `[KullaniciAlan_SELECT_IDGurup] '${params.IDKullanici}'`,
  ADD_GRUP: (params) =>
    `[Gurup_INSERT] '${params.GurupAdi}', '${params.YetkiliKisi}', '${params.IsTel}', '${params.Tel}', '${params.IDKullanici}', '${params.Durum}'`,
  UPDATE_GRUP: (params) =>
    `[Gurup_UPDATEByIDGurup] '${params.IDGurup}','${params.GurupAdi}', '${params.YetkiliKisi}', '${params.IsTel}', '${params.Tel}', '${params.IDKullanici}', '${params.Durum}'`,
  DELETE_GRUP: (params) => `[Gurup_DELETEByIDGurup] '${params.IDGurup}'`,
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
      IDSirket: grsisudo?.IDSirket,
      Yil: grsisudo?.Yil,
      IDKullanici: user.IDKullanici,
      IDGurup: payload.IDGurup,
      GurupAdi: payload.GurupAdi,
      YetkiliKisi: payload.YetkiliKisi,
      IsTel: payload.IsTel,
      Tel: payload.Tel,
      Durum: payload.Durum,
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
