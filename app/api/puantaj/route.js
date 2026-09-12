import { NextResponse } from "next/server";
import { joseDecrypt } from "@/lib/token";
import { ExecuteQuery, ExecuteQueryDataset } from "@/lib/db";

const queryTypes = {
  SELECT_PUANTAJ: (params) =>
    `[UcretCizelgesi_SELECTByIDSube] '${params.IDSube}','${params.IDBolum}','${params.Yil}','${params.Ay}','${params.Adi}','${params.TcKimlikNo}'`,
  UPDATE_PUANTAJ: (params) =>
    `[UcretCizelgesi_UPDATEByCell] '${params.IDSubePersonel}','${params.Yil}','${params.Ay}','${params.Gun}','${params.Saat}','${params.Tur}'`,
  DELETE_PUANTAJ: (params) =>
    `[UcretCizelgesiDelete_ByIDSubePersonel] '${params.IDSube}','${params.IDBolum}','${params.Yil}','${params.Ay}','${params.List}'`,
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
      IDSube: payload.IDSube,
      IDBolum: payload.IDBolum,
      IDSubePersonel: payload.IDSubePersonel,
      Yil: payload.Yil,
      Ay: payload.Ay,
      Gun: payload.Gun,
      Saat: payload.Saat,
      Tur: payload.Tur,
      Adi: payload.Adi,
      TcKimlikNo: payload.TcKimlikNo,
      List: payload.List,
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
