// API Route qrz-admin
import { NextResponse } from "next/server";
import { ExecuteQuery } from "@/lib/db";
import { ok, fail, withSession } from "@/lib/api-session";

const queryTypes = {
  SELECT_AVANS: (params) =>
    `[SubePersonelAvans_SELECTByIDSube] '${params.IDSube}','${params.BaslangicTarihi}','${params.BitisTarihi}'`,
  INSERT_AVANS: (params) =>
    `[AvansGenel_Insert] '${params.IDSubePersonel}','${params.Tutar}','${params.TaksitSayisi}','${params.BordroKesintiTutari}','${params.Mesaj}', '${params.OdemeBaslangicTarihi}'`,
  DELETE_AVANS: (params) =>
    `[AvansGenel_DELETEByIDIzinGenel] '${params.IDIzinGenel}'`,

  SELECT_TALEP: (params) =>
    `[SubePersonelAvansTalep_SELECT] '${params.IDSube}','${params.IDSubePersonel}','${params.BaslangicTarihi}','${params.BitisTarihi}'`,
  INSERT_TALEP: (params) =>
    `[SubePersonelAvansTalep_INSERT] '${params.IDSubePersonel}','${params.Tutar}','${params.TaksitSayisi}','${params.BordroKesintiTutari}','${params.Mesaj}', '${params.OdemeBaslangicTarihi}'`,
  UPDATE_TALEP: (params) =>
    `[SubePersonelAvansTalep_Update] '${params.IDSubePersonelAvansTalep}','${params.IDKullanici}','${params.KabulRed}','${params.RedAciklama}'`,
};

export const POST = withSession(async (request, session) => {
  try {
    const payload = await request.json();
    const { type } = payload;

    const queryParams = {
      IDSirket: session.user.IDSirket,
      IDKullanici: session.user.IDKullanici,
      IDSube: payload.IDSube ? payload.IDSube : session.user.IDSube,
      IDSubePersonel: payload.IDSubePersonel,
      BaslangicTarihi: payload.BaslangicTarihi,
      BitisTarihi: payload.BitisTarihi,
      Aciklama: payload.Aciklama,
      Mesaj: payload.Mesaj,
      Tutar: payload.Tutar,
      TaksitSayisi: payload.TaksitSayisi,
      BordroKesintiTutari: payload.BordroKesintiTutari,
      OdemeBaslangicTarihi: payload.OdemeBaslangicTarihi,
      IDIzinGenel: payload.IDIzinGenel,
      Tarih: payload.Tarih,
      IDSubePersonelAvansTalep: payload.IDSubePersonelAvansTalep,
      KabulRed: payload.KabulRed,
      RedAciklama: payload.RedAciklama,
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
