import { NextResponse } from "next/server";
import { ExecuteQuery } from "@/lib/db";
import { ok, fail, withSession } from "@/lib/api-session";

const queryTypes = {
  SELECT_LOKASYON: (params) =>
    `[BolumLokasyon_SELECTByIDSube] '${params.IDSube}','${params.IDBolum}'`,
  INSERT_LOKASYON: (params) =>
    `[BolumLokasyon_INSERT] '${params.IDBolum}','${params.LokasyonAdi}','${params.Enlem}','${params.Boylam}','${params.Aktif}'`,
  UPDATE_LOKASYON: (params) =>
    `[BolumLokasyon_UPDATEByIDBolumLokasyon] '${params.IDBolumLokasyon}','${params.IDBolum}','${params.LokasyonAdi}','${params.Enlem}','${params.Boylam}','${params.Aktif}'`,
  DELETE_LOKASYON: (params) =>
    `[BolumLokasyon_DELETEByIDBolumLokasyon] '${params.IDBolumLokasyon}'`,
};

export const POST = withSession(async (request, session) => {
  try {
    const payload = await request.json();
    const { type } = payload;

    const queryParams = {
      IDSirket: session.user.IDSirket,
      IDSube: session.user.IDSube,
      IDBolum: payload.IDBolum ?? "0",
      IDBolumLokasyon: payload.IDBolumLokasyon,
      Yil: session.user.Yil,
      IDKullanici: session.user.IDKullanici,
      IDUlke: payload.IDUlke,
      LokasyonAdi: payload.LokasyonAdi,
      Enlem: payload.Enlem,
      Boylam: payload.Boylam,
      Aktif: payload.Aktif,
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
