import { NextResponse } from "next/server";
import { ExecuteQuery, ExecuteQueryDataset } from "@/lib/db";
import { ok, fail, withSession } from "@/lib/api-session";

const queryTypes = {
  GET_ILLER: (params) => `[Il_SELECTByIDUlke] '${params.IDUlke}'`,
  GET_ILCELER: (params) => `[Ilce_SELECTByIlKodu] '${params.IlKodu}',''`,
  GET_VERGIDAIRELERI: (params) =>
    `[VergiDairesi_SELECTByIlKodu] '${params.IlKodu}',''`,
  GET_IZIN_TIPLERI: (params) => `[PersonelEksikGunNedeni_SELECTAll]`,
  GET_SABIT_TANIMLAR: (params) => `[SabitTanimMadde_SELECTAll]`,
  GET_PERSONEL_SABIT_TANIMLAR: (params) =>
    `[PersonelSgkBelgeTuru_SELECTAllTypes]`,
};

export const POST = withSession(async (request, session) => {
  try {
    const payload = await request.json();
    const { type } = payload;

    const queryParams = {
      IDSirket: session.user.IDSirket,
      IDKullanici: session.user.IDKullanici,
      IDUlke: payload.IDUlke,
      IlKodu: payload.IlKodu,
    };

    const queryFunction = queryTypes[type];

    if (!queryFunction) {
      return fail(session.isMobile, "Geçersiz sorgu tipi", 400);
    }

    const query = queryFunction(queryParams);
    const result =
      type === "GET_SABIT_TANIMLAR" || type === "GET_PERSONEL_SABIT_TANIMLAR"
        ? await ExecuteQueryDataset(query)
        : await ExecuteQuery(query);

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
