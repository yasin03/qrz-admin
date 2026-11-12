import { NextResponse } from "next/server";
import { ExecuteQuery } from "@/lib/db";
import { ok, fail, withSession } from "@/lib/api-session";
import { KULLANICI_TIPI } from "@/lib/roles";

// Başlık / mesaj serbest metin olduğu için tek tırnaklar escape ediliyor.
function sqlStr(value) {
  return `'${String(value ?? "").replace(/'/g, "''")}'`;
}

// Serbest metin (başlık / mesaj) için: N'' öneki olmadan SQL Server
// literal'i varchar'a çevirir ve emoji gibi unicode karakterler "??" olur.
function sqlNStr(value) {
  return `N${sqlStr(value)}`;
}

// Yalnızca Admin'in çalıştırabileceği sorgular.
const ADMIN_ONLY_TYPES = ["CHANGE_DESTEKTALEP_DURUMU", "DELETE_DESTEKTALEP"];
const DURUM_DEGERLERI = ["AÇIK", "KAPALI"];
// Belirli bir talebe ait mesaj sorguları (talep sahipliği kontrol edilir).
const MESAJ_TYPES = ["SELECT_MESAJ", "INSERT_MESAJ"];

// Yardım & Destek (destek talepleri ve mesajları) sorguları.
const queryTypes = {
  SELECT_DESTEKTALEP: (params) =>
    `[DestekTakip_SELECTByIDSirket] ${sqlStr(params.IDSirket)}`,
  SELECT_DESTEKTALEP_KONU: (params) =>
    `[DestekTakipKonu_SELECT] ${sqlStr(params.IDAnaUygulama)}`,
  INSERT_DESTEKTALEP: (params) =>
    `[DestekTakip_INSERT] ${[
      sqlStr(params.DestekTakipBirimi),
      sqlStr(params.IDAnaUygulama),
      sqlStr(params.IDSirket),
      sqlStr(params.IDDestekTakipKonu),
      sqlStr(params.Oncelik),
      sqlNStr(params.Baslik),
      sqlNStr(params.Mesaj),
      sqlStr(params.IDKullanici),
      sqlStr(params.Dosya),
    ].join(",")}`,
  DELETE_DESTEKTALEP: (params) =>
    `[DestekTakip_DELETE] ${sqlStr(params.IDDestekTakip)}`,
  CHANGE_DESTEKTALEP_DURUMU: (params) =>
    `[DestekTakip_Kapat] ${sqlStr(params.IDDestekTakip)},${sqlStr(params.Durumu)}`,

  SELECT_MESAJ: (params) =>
    `[DestekTakipMesaj_SELECTByIDDestekTakip] ${sqlStr(params.IDDestekTakip)},${sqlStr(params.IDKullanici)}`,
  INSERT_MESAJ: (params) =>
    `[DestekTakipMesaj_INSERT] ${[
      sqlStr(params.IDDestekTakip),
      sqlNStr(params.Mesaj),
      sqlStr(params.IDKullanici),
      sqlStr(params.Dosya),
    ].join(",")}`,
  KONTROL_MESAJ: (params) =>
    `[DestekTakipMesaj_Kontrol] ${sqlStr(params.IDSirket)},${sqlStr(params.IDKullanici)}`,
};

export const POST = withSession(async (request, session) => {
  try {
    const payload = await request.json();
    const { type } = payload;

    const params = payload.params ?? {};
    const isAdmin = session.user.IDKullaniciTip === KULLANICI_TIPI.ADMIN;

    // Yardım & Destek Personel'e kapalı.
    if (session.user.IDKullaniciTip === KULLANICI_TIPI.PERSONEL) {
      return fail(
        session.isMobile,
        "Bu işlem için yetkiniz yok",
        403,
        "FORBIDDEN",
      );
    }

    // IDSirket ve IDKullanici oturumdan alınır; client başka şirketin /
    // kullanıcının taleplerine erişemesin diye payload'dakiler ezilir.
    // Rol de session'dan okunuyor, client "0" gönderip tüm talepleri
    // çekemesin.
    const queryParams = {
      IDAnaUygulama: "1",
      ...params,
      IDSirket: session.user.IDSirket,
      IDKullanici: session.user.IDKullanici,
    };

    if (isAdmin) {
      // Admin tüm şirketlerin taleplerini görür (IDSirket "0").
      if (type === "SELECT_DESTEKTALEP") queryParams.IDSirket = "0";
      // Admin talebi seçtiği şirket adına açar.
      if (type === "INSERT_DESTEKTALEP" && params.IDSirket) {
        queryParams.IDSirket = params.IDSirket;
      }
    }

    if (ADMIN_ONLY_TYPES.includes(type) && !isAdmin) {
      return fail(
        session.isMobile,
        "Bu işlem için yetkiniz yok",
        403,
        "FORBIDDEN",
      );
    }

    if (
      type === "CHANGE_DESTEKTALEP_DURUMU" &&
      !DURUM_DEGERLERI.includes(params.Durumu)
    ) {
      return fail(session.isMobile, "Geçersiz durum değeri", 400);
    }

    // Admin olmayan kullanıcı yalnızca kendi şirketine ait taleplerin
    // mesajlarını görebilir / yazabilir; kapalı talebe mesaj yazamaz.
    // (Client'tan gelen IDDestekTakip değiştirilerek başka şirketin
    // mesajlarına erişilmesin.)
    if (MESAJ_TYPES.includes(type) && !isAdmin) {
      const talepler = await ExecuteQuery(
        queryTypes.SELECT_DESTEKTALEP({ IDSirket: session.user.IDSirket }),
      );
      const talep = (talepler ?? []).find(
        (t) => String(t.IDDestekTakip) === String(params.IDDestekTakip),
      );

      if (!talep) {
        return fail(
          session.isMobile,
          "Destek talebi bulunamadı",
          404,
          "NOT_FOUND",
        );
      }

      if (type === "INSERT_MESAJ" && talep.Durumu === "KAPALI") {
        return fail(
          session.isMobile,
          "Kapalı talebe mesaj gönderilemez",
          400,
          "TALEP_KAPALI",
        );
      }
    }

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
