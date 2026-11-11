import { NextResponse } from "next/server";
import { ExecuteQuery } from "@/lib/db";
import { ok, fail, withSession } from "@/lib/api-session";

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

export const POST = withSession(async (request, session) => {
  try {
    const payload = await request.json();
    const { type } = payload;

    const queryParams = {
      IDSirket: session.user.IDSirket,
      Yil: session.user.Yil,
      IDKullanici: session.user.IDKullanici,
      IDSubePersonel: payload.IDSubePersonel,
      GirisTarihi: payload.GirisTarihi,
      CikisTarihi: payload.CikisTarihi,
      PersonelAyrilisKodu: payload.PersonelAyrilisKodu,
      ...payload,
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
