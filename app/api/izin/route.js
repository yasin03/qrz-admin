import { NextResponse } from "next/server";
import { joseDecrypt } from "@/lib/token";
import { ExecuteQuery, ExecuteQueryDataset } from "@/lib/db";
import { getCookie } from "cookies-next";

const queryTypes = {
  SELECT_IZIN: (params) =>
    `[IzinGenel_SELECTByIDSubePersonel] '${params.IDSube}','${params.IDSubePersonel}','${params.BaslangicTarihi}','${params.BitisTarihi}','${params.Aciklama}'`,
  INSERT_IZIN: (params) =>
    `[IzinGenel_Insert] '${params.IDSubePersonel}','${params.BaslangicTarihi}','${params.BitisTarihi}','${params.Aciklama}','${params.Gun}','${params.AitOlduguYil}','${params.CizelgeDurum}'`,
  DELETE_IZIN: (params) =>
    `[IzinGenel_DELETEByIDIzinGenel] '${params.IDIzinGenel}'`,
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
      IDSube: payload.IDSube ? payload.IDSube : grsisudo.IDSube,
      IDSubePersonel: payload.IDSubePersonel,
      BaslangicTarihi: payload.BaslangicTarihi,
      BitisTarihi: payload.BitisTarihi,
      Aciklama: payload.Aciklama,
      Gun: payload.Gun,
      AitOlduguYil: payload.AitOlduguYil,
      CizelgeDurum: payload.CizelgeDurum,
      IDIzinGenel: payload.IDIzinGenel,
    };

    const queryFunction = queryTypes[type];

    if (!queryFunction) {
      return NextResponse.json(
        { message: "Geçersiz sorgu tipi" },
        { status: 400 },
      );
    }

    const query = queryFunction(queryParams);
    console.log("query : ", query);
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
