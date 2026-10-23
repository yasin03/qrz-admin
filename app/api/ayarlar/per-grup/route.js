import { NextResponse } from "next/server";
import { ExecuteQuery } from "@/lib/db";
import { ok, fail, withSession } from "@/lib/api-session";

const queryTypes = {
  SELECT_PERGRUP: (params) =>
    `[SirketPersonelGrup_SELECT] '${params.IDSirket}'`,
  INSERT_PERGRUP: (params) =>
    `[SirketPersonelGrup_INSERT] '${params.IDSirket}','${params.Kod}','${params.Adi}'`,
  UPDATE_PERGRUP: (params) =>
    `[SirketPersonelGrup_UPDATEByIDSirketPersonelGrup] '${params.IDSirketPersonelGrup}','${params.IDSirket}','${params.Kod}','${params.Adi}'`,
  DELETE_PERGRUP: (params) =>
    `[SirketPersonelGrup_DELETEByIDSirketPersonelGrup] '${params.IDSirketPersonelGrup}'`,
};

export const POST = withSession(async (request, session) => {
  try {
    const payload = await request.json();
    const { type } = payload;

    const queryParams = {
      IDSirket: session.user.IDSirket,
      IDSirketPersonelGrup: payload.IDSirketPersonelGrup,
      Kod: payload.Kod,
      Adi: payload.Adi,
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
