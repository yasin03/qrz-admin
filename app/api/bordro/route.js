import { NextResponse } from "next/server";
import { ExecuteQuery } from "@/lib/db";
import { ok, fail, withSession } from "@/lib/api-session";

const queryTypes = {
  SELECT_BORDRO: (params) =>
    `[Bordro_SELECTByIDSube] '${params.IDSube}','${params.IDBolum}','${params.Yil}','${params.Ay}','${params.Adi}','${params.TcKimlikNo}'`,
  SELECT_BORDRO_BYID: (params) =>
    `[Bordro_SELECTByIDSubePersonelToplu] '${params.IDSubePersonel}','${params.Yil}','${params.Ay}'`,

  HESAPLA_BORDRO: (params) =>
    `[Bordro_Hesapla_V2] '${params.IDSube}','${params.IDSubePersonelList}','${params.Yil}','${params.Ay}'`,
  HESAP_SIL_BORDRO: (params) =>
    `[Bordro_SETByIDSubePersonel] '${params.IDSube}','${params.IDSubePersonelList}','${params.Yil}','${params.Ay}'`,
  ONAYLA_BORDRO: (params) =>
    `[BordroOnay_UpdateByIDSube] '${params.IDSube}','','${params.Yil}','${params.Ay}','${params.IDSubePersonelList}','${params.OnayDurum}'`,
};

export const POST = withSession(async (request, session) => {
  try {
    const payload = await request.json();
    const { type } = payload;

    const queryParams = {
      IDSirket: session.user.IDSirket,
      IDSube: payload.IDSube,
      IDBolum: payload.IDBolum,
      IDSubePersonelList: payload.IDSubePersonelList,
      IDSubePersonel: payload.IDSubePersonel,
      Yil: payload.Yil,
      Ay: payload.Ay,
      Adi: payload.Adi,
      TcKimlikNo: payload.TcKimlikNo,
      OnayDurum: payload.OnayDurum,
    };
    const queryFunction = queryTypes[type];

    if (!queryFunction) {
      return fail(session.isMobile, "Geçersiz sorgu tipi", 400);
    }

    const query = queryFunction(queryParams);
    const result = await ExecuteQuery(query);

    return ok(session.isMobile, result);
  } catch (err) {
    console.error("API Error:", err);

    if (session.isMobile) {
      return fail(
        true,
        "Bir hata oluştu. Lütfen tekrar deneyiniz",
        500,
        "SERVER_ERROR",
      );
    }

    return NextResponse.json(
      {
        message: "Bir hata oluştu. Lütfen tekrar deneyiniz",
        error: err.message,
      },
      { status: 500 },
    );
  }
});

