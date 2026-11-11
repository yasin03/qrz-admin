import { NextResponse } from "next/server";
import { ExecuteQuery } from "@/lib/db";
import { ok, fail, withSession } from "@/lib/api-session";

const queryTypes = {
  SELECT_RAPOR_PDKS: (params) =>
    `[SubePersonelSaat_SelectAll] '${params.IDSube}','${params.IDBolum}','${params.IDSubePersonel}','${params.Tarih1}','${params.Tarih2}','${params.Islem}'`,
};

export const POST = withSession(async (request, session) => {
  try {
    const payload = await request.json();
    const { type } = payload;

    const queryParams = {
      IDSirket: session.user.IDSirket,
      IDSube: payload.IDSube ?? session.user.IDSube,
      IDBolum: payload.IDBolum ?? 0,
      IDSubePersonel: payload.IDSubePersonel ?? 0,
      Tarih1: payload.Tarih1,
      Tarih2: payload.Tarih2,
      Islem: payload.Islem ?? "",
    };
    const queryFunction = queryTypes[type];

    if (!queryFunction) {
      return fail(session.isMobile, "Geçersiz sorgu tipi", 400);
    }

    const query = queryFunction(queryParams);
    const result = await ExecuteQuery(query);

    return ok(session.isMobile, result);
  } catch (err) {
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
