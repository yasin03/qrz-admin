import { NextResponse } from "next/server";
import { ExecuteQuery } from "@/lib/db";
import { ok, fail, withSession } from "@/lib/api-session";
import { assertPersonelYetki } from "@/lib/per-yetki-server";

const queryTypes = {
  SELECT_PUANTAJ: (params) =>
    `[UcretCizelgesi_SELECTByIDSube] '${params.IDSube}','${params.IDBolum}','${params.Yil}','${params.Ay}','${params.Adi}','${params.TcKimlikNo}'`,
  SELECT_PUANTAJ_BYID: (params) =>
    `[UcretCizelgesi_SELECTByIDSubePersonel] '${params.IDSubePersonel}','${params.Yil}','${params.Ay}'`,
  UPDATE_PUANTAJ: (params) =>
    `[UcretCizelgesi_UPDATEByCell] '${params.IDSubePersonel}','${params.Yil}','${params.Ay}','${params.Gun}','${params.Saat}','${params.Tur}'`,
  DELETE_PUANTAJ: (params) =>
    `[UcretCizelgesiDelete_ByIDSubePersonel] '${params.IDSube}','${params.IDBolum}','${params.Yil}','${params.Ay}','${params.List}'`,
};

// Personelin kendi verisini okuduğu tipler → gereken yetki bayrağı.
const personelYetkiTypes = {
  SELECT_PUANTAJ_BYID: "PersonelPuantajGorur",
};

export const POST = withSession(async (request, session) => {
  try {
    const payload = await request.json();
    const { type } = payload;

    const queryParams = {
      IDSirket: session.user.IDSirket,
      IDSube: payload.IDSube,
      IDBolum: payload.IDBolum,
      IDSubePersonel: payload.IDSubePersonel,
      Yil: payload.Yil,
      Ay: payload.Ay,
      Gun: payload.Gun,
      Saat: payload.Saat,
      Tur: payload.Tur,
      Adi: payload.Adi,
      TcKimlikNo: payload.TcKimlikNo,
      List: payload.List,
    };
    const queryFunction = queryTypes[type];

    if (!queryFunction) {
      return fail(session.isMobile, "Geçersiz sorgu tipi", 400);
    }

    if (personelYetkiTypes[type]) {
      const denied = await assertPersonelYetki(
        session,
        personelYetkiTypes[type],
      );
      if (denied) return denied;
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
