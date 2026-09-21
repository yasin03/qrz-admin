import { NextResponse } from "next/server";
import { ExecuteQuery } from "@/lib/db";
import { ok, fail, withSession } from "@/lib/api-session";

const queryTypes = {
  SELECT_PDKS: (params) =>
    `[SubePersonelSaat_SelectByIDSubeBolum] '${params.IDSube}','${params.IDBolum}','${params.Tarih1}','${params.Tarih2}'`,

  SELECT_PDKS_SUBE: (params) => `[SubeVardiyaSaat_SELECT] '${params.IDSube}'`,
  INSERT_PDKS_SUBE: (params) =>
    `[SubeVardiyaSaat_INSERT] '${params.IDSube}','${params.VardiyaAdi}','${params.BaslamaSaati}','${params.BitisSaati}','${params.Gece}','${params.HT}','${params.HTGun}'`,
  UPDATE_PDKS_SUBE: (params) =>
    `[SubeVardiyaSaat_UPDATEByIDSubeVardiyaSaat] '${params.IDSubeVardiyaSaat}', '${params.IDSube}','${params.VardiyaAdi}','${params.BaslamaSaati}','${params.BitisSaati}','${params.Gece}','${params.HT}','${params.HTGun}'`,
  DELETE_PDKS_SUBE: (params) =>
    `[SubeVardiyaSaat_DELETEByIDSubeVardiyaSaat] '${params.IDSubeVardiyaSaat}'`,

  SELECT_PDKS_BOLUM: (params) => `[BolumVardiyaSaat_SELECT] '${params.IDBolum}'`,
  INSERT_PDKS_BOLUM: (params) =>
    `[BolumVardiyaSaat_INSERT] '${params.IDBolum}','${params.VardiyaAdi}','${params.BaslamaSaati}','${params.BitisSaati}','${params.Gece}','${params.HT}','${params.HTGun}'`,
  UPDATE_PDKS_BOLUM: (params) =>
    `[BolumVardiyaSaat_UPDATEByIDBolumVardiyaSaat] '${params.IDBolumVardiyaSaat}', '${params.IDBolum}','${params.VardiyaAdi}','${params.BaslamaSaati}','${params.BitisSaati}','${params.Gece}','${params.HT}','${params.HTGun}'`,
  DELETE_PDKS_BOLUM: (params) =>
    `[BolumVardiyaSaat_DELETEByIDBolumVardiyaSaat] '${params.IDBolumVardiyaSaat}'`,

  // Mobil: vardiya yonetimiyle karismasin diye ayri isimler - bunlar
  // admin'in SELECT_PDKS/INSERT_PDKS'iyle degil, mobile-api'nin kendi
  // personel giris-cikis kaydiyla (SubePersonelSaat_*Mobil) eslesiyor.
  SELECT_PDKS_KENDI: (params) =>
    `[SubePersonelSaat_SelectByIDSubePersonel] '${params.IDSubePersonel}','${params.Tarih1}','${params.Tarih2}'`,
  INSERT_PDKS_KENDI: (params) =>
    `[SubePersonelSaat_InsertMobil] '${params.IDSubePersonel}','${params.JsonData}'`,
};

const MOBILE_ALLOWED_TYPES = ["SELECT_PDKS_KENDI", "INSERT_PDKS_KENDI"];

export const POST = withSession(async (request, session) => {
  try {
    const payload = await request.json();
    const { type } = payload;

    if (session.isMobile && !MOBILE_ALLOWED_TYPES.includes(type)) {
      return fail(true, "Bu islem mobilde desteklenmiyor.", 403, "FORBIDDEN");
    }

    const queryParams = {
      IDSirket: session.user.IDSirket,
      IDSube: session.user.IDSube,
      IDBolum: payload.IDBolum,
      IDSubeVardiyaSaat: payload.IDSubeVardiyaSaat,
      IDBolumVardiyaSaat: payload.IDBolumVardiyaSaat,
      VardiyaAdi: payload.VardiyaAdi,
      BaslamaSaati: payload.BaslamaSaati,
      BitisSaati: payload.BitisSaati,
      Gece: payload.Gece,
      HT: payload.HT,
      HTGun: payload.HTGun,
      Tarih1: payload.Tarih1,
      Tarih2: payload.Tarih2,
      // Kendi kaydi tipleri icin IDSubePersonel her zaman token'dan -
      // client'in body'de baska bir personel ID'si gondererek baskasinin
      // kaydini okuyup/yazmasini engeller.
      IDSubePersonel: session.user.IDSubePersonel,
      JsonData: payload.JsonData,
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
