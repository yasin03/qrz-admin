import { NextResponse } from "next/server";
import { ExecuteQuery } from "@/lib/db";
import { ok, fail, withSession } from "@/lib/api-session";

const queryTypes = {
  SELECT_KATSAYILAR: (params) =>
    `[SubeTahakkukSaha_SELECT] '${params.IDSirket}', '${params.Yil}'`,
  UPDATE_KATSAYI: (params) =>
    `[SubeTahakkukSaha_UPDATEByIDSubeTahakkukSaha] '${params.IDSubeTahakkukSaha}', '${params.Tipi}', '${params.SahaAciklama}', '${params.MaksimumDeger}', '${params.MinimumDeger}', '${params.OdemeSekli}', '${params.Katsayi}', '${params.NetBrut}', '${params.SskMuafiyeti}', '${params.VergiMuafiyeti}', '${params.SgkUygulamaDurum}', '${params.VergiUygulamaDurum}', '${params.DamgaUygulamaDurum}', '${params.SendikaliOdeme}', '${params.SendikasizOdeme}'`,
};

export const POST = withSession(async (request, session) => {
  try {
    const payload = await request.json();
    const { type } = payload;

    const queryParams = {
      IDSirket: session.user.IDSirket,
      Yil: session.user.Yil,
      ...payload.params,
    };
    const queryFunction = queryTypes[type];

    if (!queryFunction) {
      return fail(session.isMobile, "Geçersiz sorgu tipi", 400);
    }

    const query = queryFunction(queryParams);
    console.log("Executing query:", query); // Log the query for debugging
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
