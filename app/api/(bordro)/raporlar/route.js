import { NextResponse } from "next/server";
import { ExecuteQuery } from "@/lib/db";
import { ok, fail, withSession } from "@/lib/api-session";

const queryTypes = {
  SELECT_RAPOR_PDKS: (params) =>
    `[SubePersonelSaat_SelectAll] '${params.IDSube}','${params.IDBolum}','${params.IDSubePersonel}','${params.Tarih1}','${params.Tarih2}','${params.Islem}'`,
  SELECT_AVANS_RAPOR: (params) =>
    `[SubePersonelAvansGenel_SELECTByIDSube] '${params.IDSirket}','${params.IDSube}','${params.BaslangicTarihi}','${params.BitisTarihi}'`,
  // Genel İzin Kullanımları
  SELECT_IZIN_RAPOR_GENEL: (params) =>
    `[IzinGenel_SELECTByIDSube] '${params.IDSirket}','${params.IDSube}','${params.BaslangicTarihi}','${params.BitisTarihi}','${params.Aciklama}','${params.CikisVar}'`,
  // Yıllık Toplam İzin Kullanımları
  SELECT_IZIN_RAPOR_YILLIK: (params) =>
    `[IzinKalan_SELECTByIDSube] '${params.IDSirket}','${params.IDSube}','${params.Yil}','${params.BitisTarihi}','${params.CikisVar}'`,
};

// Bu raporlarda şirket/şube session'dan değil, sayfadaki filtreden gelir.
// IDSube "0" → şirketin tüm şubeleri.
const SIRKET_SUBE_FILTRELI_TIPLER = new Set([
  "SELECT_AVANS_RAPOR",
  "SELECT_IZIN_RAPOR_GENEL",
  "SELECT_IZIN_RAPOR_YILLIK",
]);

const DIGITS = /^\d+$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Filtreden gelen değerler sorguya string olarak gömüldüğü için doğrulanır. */
function buildSirketSubeParams(payload, session) {
  const IDSirket = String(payload.IDSirket || session.user.IDSirket || "");
  const IDSube = String(payload.IDSube || "0");

  if (!DIGITS.test(IDSirket) || !DIGITS.test(IDSube)) return null;
  if (payload.BaslangicTarihi && !ISO_DATE.test(payload.BaslangicTarihi))
    return null;
  if (!ISO_DATE.test(payload.BitisTarihi ?? "")) return null;
  if (payload.Yil && !DIGITS.test(String(payload.Yil))) return null;

  return {
    IDSirket,
    IDSube,
    BaslangicTarihi: payload.BaslangicTarihi,
    BitisTarihi: payload.BitisTarihi,
    Yil: payload.Yil,
    Aciklama: String(payload.Aciklama || "0").replace(/'/g, "''"),
    CikisVar:
      payload.CikisVar === true || payload.CikisVar === "true"
        ? "true"
        : "false",
  };
}

export const POST = withSession(async (request, session) => {
  try {
    const payload = await request.json();
    const { type } = payload;

    const queryParams = SIRKET_SUBE_FILTRELI_TIPLER.has(type)
      ? buildSirketSubeParams(payload, session)
      : {
          IDSirket: session.user.IDSirket,
          IDSube: payload.IDSube ?? session.user.IDSube,
          IDBolum: payload.IDBolum ?? 0,
          IDSubePersonel: payload.IDSubePersonel ?? 0,
          Tarih1: payload.Tarih1,
          Tarih2: payload.Tarih2,
          Islem: payload.Islem ?? "",
        };
    const queryFunction = queryTypes[type];

    if (!queryFunction) {
      return fail(session.isMobile, "Geçersiz sorgu tipi", 400);
    }

    if (!queryParams) {
      return fail(session.isMobile, "Geçersiz rapor parametreleri", 400);
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
