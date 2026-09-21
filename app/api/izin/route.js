import { NextResponse } from "next/server";
import { ExecuteQuery } from "@/lib/db";
import { ok, fail, withSession } from "@/lib/api-session";

const queryTypes = {
  SELECT_IZIN: (params) =>
    `[IzinGenel_SELECTByIDSubePersonel] '${params.IDSube}','${params.IDSubePersonel}','${params.BaslangicTarihi}','${params.BitisTarihi}','${params.Aciklama}'`,
  INSERT_IZIN: (params) =>
    `[IzinGenel_Insert] '${params.IDSubePersonel}','${params.BaslangicTarihi}','${params.BitisTarihi}','${params.Aciklama}','${params.Gun}','${params.AitOlduguYil}','${params.CizelgeDurum}'`,
  DELETE_IZIN: (params) =>
    `[IzinGenel_DELETEByIDIzinGenel] '${params.IDIzinGenel}'`,

  SELECT_TALEP: (params) =>
    `[SubePersonelIzinTalep_SELECT] '${params.IDSube}','${params.IDSubePersonel}','${params.BaslangicTarihi}','${params.BitisTarihi}'`,
  INSERT_TALEP: (params) =>
    `[SubePersonelIzinTalep_INSERT] '${params.IDSubePersonel}','${params.BaslangicTarihi}','${params.BitisTarihi}','${params.Gun}','${params.Aciklama}', '${params.Mesaj}','${params.AitOlduguYil}','${params.Adres}','${params.Dosyalar}'`,
  UPDATE_TALEP: (params) =>
    `[SubePersonelIzinTalep_Update] '${params.IDSubePersonelIzinTalep}','${params.IDKullanici}','${params.KabulRed}','${params.RedAciklama}'`,

  GET_IZINSURE: (params) =>
    `[SubePersonelIzin_HESAPLAByIDSubePersonel] '${params.IDSubePersonel}','${params.Tarih}'`,
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
      Gun: payload.Gun,
      AitOlduguYil: payload.AitOlduguYil,
      CizelgeDurum: payload.CizelgeDurum,
      IDIzinGenel: payload.IDIzinGenel,
      Adres: payload.Adres,
      Dosyalar: payload.Dosyalar,
      Tarih: payload.Tarih,
      IDSubePersonelIzinTalep: payload.IDSubePersonelIzinTalep,
      KabulRed: payload.KabulRed,
      RedAciklama: payload.RedAciklama,
    };

    const queryFunction = queryTypes[type];

    if (!queryFunction) {
      return fail(session.isMobile, "Geçersiz sorgu tipi", 400);
    }

    const query = queryFunction(queryParams);
    console.log("Executing query izin : ", query);
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