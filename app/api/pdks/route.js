import { NextResponse } from "next/server";
import { ExecuteQuery } from "@/lib/db";
import { ok, fail, withSession } from "@/lib/api-session";

const queryTypes = {
  SELECT_PDKS: (params) =>
    `[SubePersonelSaat_SelectByIDSubeBolum] '${params.IDSube}','${params.IDBolum}','${params.Tarih}'`,
  SELECT_PDKS_DETAY: (params) =>
    `[SubePersonelSaatDetay_Select] '${params.IDSubePersonelSaat}'`,
  UPDATE_PDKS: (params) =>
    `[SubePersonelSaat_UPDATEByCell] '${params.IDSubePersonelSaat}', '${params.Yon}','${params.Saat}','${params.IDKullanici}'`,
  DELETE_PDKS: (params) =>
    `[SubePersonelSaat_DELETE] '${params.IDSubePersonelSaat}', '${params.IDKullanici}'`,

  SELECT_PDKS_SUBE: (params) => `[SubeVardiyaSaat_SELECT] '${params.IDSube}'`,
  INSERT_PDKS_SUBE: (params) =>
    `[SubeVardiyaSaat_INSERT] '${params.IDSube}','${params.VardiyaAdi}','${params.BaslamaSaati}','${params.BitisSaati}','${params.Gece}','${params.HaftaTatilGunu}','${params.ToplamMolaSuresi}'`,
  UPDATE_PDKS_SUBE: (params) =>
    `[SubeVardiyaSaat_UPDATEByIDSubeVardiyaSaat] '${params.IDSubeVardiyaSaat}', '${params.IDSube}','${params.VardiyaAdi}','${params.BaslamaSaati}','${params.BitisSaati}','${params.Gece}','${params.HaftaTatilGunu}','${params.ToplamMolaSuresi}'`,
  DELETE_PDKS_SUBE: (params) =>
    `[SubeVardiyaSaat_DELETEByIDSubeVardiyaSaat] '${params.IDSubeVardiyaSaat}'`,

  SELECT_PDKS_BOLUM: (params) =>
    `[BolumVardiyaSaat_SELECT] '${params.IDBolum}'`,
  INSERT_PDKS_BOLUM: (params) =>
    `[BolumVardiyaSaat_INSERT] '${params.IDBolum}','${params.VardiyaAdi}','${params.BaslamaSaati}','${params.BitisSaati}','${params.Gece}','${params.HaftaTatilGunu}','${params.ToplamMolaSuresi}'`,
  UPDATE_PDKS_BOLUM: (params) =>
    `[BolumVardiyaSaat_UPDATEByIDBolumVardiyaSaat] '${params.IDBolumVardiyaSaat}', '${params.IDBolum}','${params.VardiyaAdi}','${params.BaslamaSaati}','${params.BitisSaati}','${params.Gece}','${params.HaftaTatilGunu}','${params.ToplamMolaSuresi}'`,
  DELETE_PDKS_BOLUM: (params) =>
    `[BolumVardiyaSaat_DELETEByIDBolumVardiyaSaat] '${params.IDBolumVardiyaSaat}'`,

  // Mobil: vardiya yonetimiyle karismasin diye ayri isimler - bunlar
  // admin'in SELECT_PDKS/INSERT_PDKS'iyle degil, mobile-api'nin kendi
  // personel giris-cikis kaydiyla (SubePersonelSaat_*Mobil) eslesiyor.
  SELECT_PDKS_KENDI: (params) =>
    `[SubePersonelSaat_SelectByIDSubePersonel] '${params.IDSubePersonel}','${params.Yil}','${params.Ay}'`,
  INSERT_PDKS_KENDI: (params) =>
    `[SubePersonelSaat_InsertMobil] '${params.IDSubePersonel}','${params.Yon}','${params.JsonData}'`,
};

export const POST = withSession(async (request, session) => {
  try {
    const payload = await request.json();
    const { type } = payload;

    const queryParams = {
      IDSirket: session.user.IDSirket,
      IDSube: session.user.IDSube,
      IDBolum: payload.IDBolum,
      IDSubePersonelSaat: payload.IDSubePersonelSaat,
      IDSubeVardiyaSaat: payload.IDSubeVardiyaSaat,
      IDBolumVardiyaSaat: payload.IDBolumVardiyaSaat,
      VardiyaAdi: payload.VardiyaAdi,
      BaslamaSaati: payload.BaslamaSaati,
      BitisSaati: payload.BitisSaati,
      Gece: payload.Gece,
      HaftaTatilGunu: payload.HaftaTatilGunu,
      ToplamMolaSuresi : payload.ToplamMolaSuresi,
      HT: payload.HT,
      HTGun: payload.HTGun,
      Tarih: payload.Tarih,
      Tarih1: payload.Tarih1,
      Tarih2: payload.Tarih2,
      Yil: payload.Yil,
      Ay: payload.Ay,
      
      // Kendi kaydi tipleri icin IDSubePersonel her zaman token'dan -
      // client'in body'de baska bir personel ID'si gondererek baskasinin
      // kaydini okuyup/yazmasini engeller.
      IDSubePersonel: session.user.IDSubePersonel,
      IDKullanici: session.user.IDKullanici,
      Yon: payload.Yon,
      Saat: payload.Saat,
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
