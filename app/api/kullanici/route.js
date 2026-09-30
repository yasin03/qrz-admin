// API Route qrz-admin
import { NextResponse } from "next/server";
import { ExecuteQuery } from "@/lib/db";
import { ok, fail, withSession } from "@/lib/api-session";

const queryTypes = {
  SELECT_KULLANICI: (params) => `[Kullanici_SELECT] '${params.IDKullanici}'`,
  INSERT_KULLANICI: (params) =>
    `[Kullanici_INSERT] '${params.KullaniciAdi}', '${params.Sifre}', '${params.Ad}', '${params.Tel}', '${params.Email}', '${params.Sahibi}', '${params.IDSirket}'`,
  UPDATE_KULLANICI: (params) =>
    `[Kullanici_UPDATEByIDKullanici] '${params.IDKullanici}', '${params.Sifre}', '${params.Ad}', '${params.Durum}','${params.Tel}', '${params.Email}', '${params.YetkiKullanici}', '${params.YetkiGrup}', '${params.YetkiSirket}', '${params.YetkiSube}'`,
  DELETE_KULLANICI: (params) =>
    `[Kullanici_DELETEByIDKullanici] '${params.IDKullanici}'`,

  SELECT_KULLANICI_YETKI: (params) =>
    `[KullaniciAlan_SELECTByIDKullanici] '${params.IDKullanici}'`,
  INSERT_KULLANICI_YETKI: (params) =>
    `[KullaniciAlan_INSERT] '${params.IDKullanici}', '${params.IDGurup}', '${params.IDSirket}','${params.IDSube}', '${params.IDBolum}', '${params.GurupAdi}', '${params.SirketAdi}', '${params.SubeAdi}', '${params.BolumAdi}'`,
  DELETE_KULLANICI_YETKI: (params) =>
    `[KullaniciAlan_DELETEByIDKullaniciAlan] '${params.IDKullaniciAlan}'`,
};

export const POST = withSession(async (request, session) => {
  try {
    const payload = await request.json();
    const { type } = payload;

    const queryParams = {
      IDSirket: session.user.IDSirket,
      IDKullanici: session.user.IDKullanici,
      // Yeni kullanıcının sahibi, işlemi yapan (oturumdaki) kullanıcı.
      Sahibi: session.user.IDKullanici,

      IDSube: payload.IDSube,
      IDBolum: payload.IDBolum,
      IDGurup: payload.IDGurup,
      GurupAdi: payload.GurupAdi,
      SirketAdi: payload.SirketAdi,
      SubeAdi: payload.SubeAdi,
      BolumAdi: payload.BolumAdi,

      IDKullaniciYetki: payload.IDKullaniciYetki,
      IDKullaniciAlan: payload.IDKullaniciAlan,
      KullaniciAdi: payload.KullaniciAdi,
      Sifre: payload.Sifre,
      Ad: payload.Ad,
      Tel: payload.Tel,
      Email: payload.Email,
      Durum: payload.Durum,

      YetkiKullanici: payload.YetkiKullanici,
      YetkiGrup: payload.YetkiGrup,
      YetkiSirket: payload.YetkiSirket,
      YetkiSube: payload.YetkiSube,

      ...payload,
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
