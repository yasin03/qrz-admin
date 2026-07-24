import { NextResponse } from "next/server";
import { joseDecrypt } from "@/lib/token";
import { ExecuteQuery } from "@/lib/db";

const queryTypes = {
  GETGRUPLAR: (params) =>
    `[KullaniciAlan_SELECT_IDGurup] '${params.IDKullanici}'`,
  GETSIRKETLER: (params) =>
    `[KullaniciAlan_SELECT_IDSirket] '${params.IDKullanici}', '${params.IDGurup}'`,
  GETSUBELER: (params) =>
    `[KullaniciAlan_SELECT_IDSube] '${params.IDKullanici}', '${params.IDSirket}'`,
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
      Yil: gruSisudo?.Yil,
      IDKullanici: user.IDKullanici,
      IDGurup: payload.IDGurup,
      IDSirket: payload.IDSirket ?? gruSisudo?.IDSirket,
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
