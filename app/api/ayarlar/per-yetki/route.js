import { NextResponse } from "next/server";
import { ExecuteQuery } from "@/lib/db";
import { ok, fail, withSession } from "@/lib/api-session";

const queryTypes = {
  SELECT_PERYETKI: (params) => `[SirketSabit_SELECT] '${params.IDSirket}'`,
  UPDATE_PERYETKI: (params) =>
    `[SirketSabit_UPDATEByIDSirket] '${params.IDSirket}','${params.PersonelPdksGorur}','${params.PersonelPuantajGorur}','${params.PersonelBordroGorur}','${params.PersonelHerLokasyonuKullanabilir}'`,
};

export const POST = withSession(async (request, session) => {
  try {
    const payload = await request.json();
    const { type } = payload;

    const queryParams = {
      IDSirket: session.user.IDSirket,
      PersonelPdksGorur: payload.PersonelPdksGorur,
      PersonelPuantajGorur: payload.PersonelPuantajGorur,
      PersonelBordroGorur: payload.PersonelBordroGorur,
      PersonelHerLokasyonuKullanabilir:
        payload.PersonelHerLokasyonuKullanabilir,
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
