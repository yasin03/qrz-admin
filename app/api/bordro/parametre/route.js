import { NextResponse } from "next/server";
import { ExecuteQuery } from "@/lib/db";
import { ok, fail, withSession } from "@/lib/api-session";

const queryTypes = {
  SELECT_EKLENTI: (params) =>
    `[SubePersonelYardim_SELECT] '${params.IDSube}','${params.IDSubePersonel}','${params.Tarih1}','${params.Tarih2}'`,
  INSERT_EKLENTI: (params) =>
    `[SubePersonelYardim_INSERT] '${params.IDSube}','${params.IDSubePersonel}','${params.BordroOdemeTutari}','${params.OdemeTarihi}','${params.OdemeTipi}','${params.Net}'`,
  UPDATE_EKLENTI: (params) =>
    `[SubePersonelYardim_UPDATEByIDSubePersonelYardim] '${params.IDSubePersonelYardim}','${params.BordroOdemeTutari}','${params.OdemeTarihi}','${params.OdemeTipi}','${params.Net}'`,
  DELETE_EKLENTI: (params) =>
    `[SubePersonelYardim_DELETEByIDSubePersonelYardim] '${params.IDSubePersonelYardim}'`,

  SELECT_KESINTI: (params) =>
    `[SubePersonelOzelKesinti_SELECTByIDSubePersonel] '${params.IDSube}','${params.IDSubePersonel}','${params.Tarih1}','${params.Tarih2}'`,
  INSERT_KESINTI: (params) =>
    `[SubePersonelOzelKesinti_INSERT] '${params.IDSube}','${params.IDSubePersonel}','${params.BordroKesintiTutari}','${params.KesintiTarihi}','${params.KesintiTipi}'`,
  UPDATE_KESINTI: (params) =>
    `[SubePersonelOzelKesinti_UPDATEByIDSubePersonelOzelKesinti] '${params.IDSubePersonelOzelKesinti}','${params.BordroKesintiTutari}','${params.KesintiTarihi}','${params.KesintiTipi}'`,
  DELETE_KESINTI: (params) =>
    `[SubePersonelOzelKesinti_DELETEByIDSubePersonelOzelKesinti] '${params.IDSubePersonelOzelKesinti}'`,
};

export const POST = withSession(async (request, session) => {
  try {
    const payload = await request.json();
    const { type } = payload;

    const queryParams = {
      IDSirket: session.user.IDSirket,
      IDSube: payload.IDSube,
      IDSubePersonel: payload.IDSubePersonel,
      IDSubePersonelYardim: payload.IDSubePersonelYardim,
      IDSubePersonelOzelKesinti: payload.IDSubePersonelOzelKesinti,

      Tarih1: payload.Tarih1,
      Tarih2: payload.Tarih2,
      BordroOdemeTutari: payload.BordroOdemeTutari,
      OdemeTarihi: payload.OdemeTarihi,
      OdemeTipi: payload.OdemeTipi,
      Net: payload.Net,

      BordroKesintiTutari: payload.BordroKesintiTutari,
      KesintiTarihi: payload.KesintiTarihi,
      KesintiTipi: payload.KesintiTipi,
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
