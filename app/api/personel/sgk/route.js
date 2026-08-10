import { NextResponse } from "next/server";
import { joseDecrypt } from "@/lib/token";
import { ExecuteQuery } from "@/lib/db";

const queryTypes = {
  SGK_GIRIS: (params) =>
    `[SubePersonel_SGKGiris] '${params.IDSubePersonel}', '${params.GirisTarihi}'`,
  SGK_CIKIS: (params) =>
    `[SubePersonel_SGKCikis] '${params.IDSubePersonel}', '${params.GirisTarihi}', '${params.PersonelAyrilisKodu}'`,
  MANUEL_GIRIS: (params) =>
    `[SubePersonel_ManuelGiris] '${params.IDSubePersonel}'`,
  MANUEL_CIKIS: (params) =>
    `[SubePersonel_ManuelCikis] '${params.IDSubePersonel}', '${params.CikisTarihi}', '${params.PersonelAyrilisKodu}'`,
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
      IDSubePersonel: payload.IDSubePersonel,
      GirisTarihi: payload.GirisTarihi,
      CikisTarihi: payload.CikisTarihi,
      PersonelAyrilisKodu: payload.PersonelAyrilisKodu,
      ...payload,
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
