import { NextResponse } from "next/server";
import { joseDecrypt } from "@/lib/token";
import { ExecuteQuery, ExecuteQueryDataset } from "@/lib/db";

const queryTypes = {
  SELECT_BORDRO: (params) =>
    `[Bordro_SELECTByIDSube] '${params.IDSube}','${params.IDBolum}','${params.Yil}','${params.Ay}','${params.Adi}','${params.TcKimlikNo}'`,
  HESAPLA_BORDRO: (params) =>
    `[Bordro_Hesapla_V2] '${params.IDSube}','${params.IDSubePersonelList}','${params.Yil}','${params.Ay}'`,
  HESAP_SIL_BORDRO: (params) =>
    `[Bordro_SETByIDSubePersonel] '${params.IDSube}','${params.IDSubePersonelList}','${params.Yil}','${params.Ay}'`,
  ONAYLA_BORDRO: (params) =>
    `[BordroOnay_UpdateByIDSube] '${params.IDSube}','','${params.Yil}','${params.Ay}','${params.IDSubePersonelList}','${params.OnayDurum}'`,
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
      IDSubePersonelList: payload.IDSubePersonel,
      Yil: payload.Yil,
      Ay: payload.Ay,
      Adi: payload.Adi,
      TcKimlikNo: payload.TcKimlikNo,
      OnayDurum: payload.OnayDurum,
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
