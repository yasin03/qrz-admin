import { NextResponse } from "next/server";
import { ExecuteQuery } from "@/lib/db";
import { ok, fail, withSession } from "@/lib/api-session";

const queryTypes = {
  GET_BOLUMLER: (params) => `[Bolum_SELECTByIDSube] '${params.IDSube}'`,
  ADD_BOLUM: (params) =>
    `[Bolum_INSERT] '${params.IDSube}', '${params.BolumAdi}', '${params.IDKullanici}'`,
  UPDATE_BOLUM: (params) =>
    `[Bolum_UPDATEByIDBolum] '${params.IDBolum}','${params.IDSube}', '${params.BolumAdi}', '${params.IDKullanici}'`,
  DELETE_BOLUM: (params) => `[Bolum_DELETEByIDBolum] '${params.IDBolum}'`,
};

export const POST = withSession(async (request, session) => {
  try {
    const payload = await request.json();
    const { type } = payload;

    // Mobil: mobile-api'nin orijinal davranisiyla ayni - client'in body'de
    // baska bir sube gonderip baska subenin bolumlerini gormesini/duzenle-
    // mesini engellemek icin IDSube her zaman kendi token'indan, payload'i
    // yok sayiyoruz. Web'de mevcut davranis (payload varsa o, yoksa aktif
    // sube) korunuyor.
    const IDSube = session.isMobile
      ? session.user.IDSube
      : payload.IDSube
        ? payload.IDSube
        : session.user.IDSube;

    if (session.isMobile && !IDSube) {
      return fail(
        true,
        "Kullaniciya ait sube bilgisi bulunamadi.",
        400,
        "MISSING_SUBE",
      );
    }

    const queryParams = {
      IDSirket: session.user.IDSirket,
      Yil: session.user.Yil,
      IDKullanici: session.user.IDKullanici,
      IDSube,
      BolumAdi: payload.BolumAdi,
      IDBolum: payload.IDBolum,
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
