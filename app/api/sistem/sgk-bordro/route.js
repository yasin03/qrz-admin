import { NextResponse } from "next/server";
import { ExecuteQuery } from "@/lib/db";
import { ok, fail, withSession } from "@/lib/api-session";
import { KULLANICI_TIPI } from "@/lib/roles";

// Açıklama serbest metin olduğu için tek tırnaklar escape ediliyor.
function sqlStr(value) {
  return `'${String(value ?? "").replace(/'/g, "''")}'`;
}

function sqlNum(value) {
  return `'${Number(value ?? 0)}'`;
}

// SGK Bordro Parametreleri sekmelerinin sorguları buraya eklenir.
const queryTypes = {
  SELECT_TATIL: (params) => `[Tatil_SELECT] ${sqlNum(params.Yil)}`,
  INSERT_TATIL: (params) =>
    `[Tatil_INSERT] ${[
      sqlStr(params.Tarih),
      sqlNum(params.KodGun),
      sqlNum(params.HaftaKodu),
      sqlStr(params.Aciklama),
      sqlStr(params.Durum),
      sqlStr(params.ResmiDini),
    ].join(", ")}`,
  UPDATE_TATIL: (params) =>
    `[Tatil_UPDATEByIDTatil] ${[
      sqlNum(params.IDTatil),
      sqlStr(params.Tarih),
      sqlNum(params.KodGun),
      sqlNum(params.HaftaKodu),
      sqlStr(params.Aciklama),
      sqlStr(params.Durum),
      sqlStr(params.ResmiDini),
    ].join(", ")}`,
  DELETE_TATIL: (params) =>
    `[Tatil_DELETEByIDTatil] ${sqlNum(params.IDTatil)}`,

  SELECT_IZINLIMIT: (params) =>
    `[PersonelIzinLimit_SELECT] ${sqlStr(params.Adi)}`,
  INSERT_IZINLIMIT: (params) =>
    `[PersonelIzinLimit_INSERT] ${[
      sqlStr(params.Nitelik),
      sqlNum(params.Baslangic),
      sqlNum(params.Bitis),
      sqlNum(params.Deger),
    ].join(", ")}`,
  UPDATE_IZINLIMIT: (params) =>
    `[PersonelIzinLimit_UPDATEByIDPersonelIzinLimit] ${[
      sqlNum(params.IDPersonelIzinLimit),
      sqlStr(params.Nitelik),
      sqlNum(params.Baslangic),
      sqlNum(params.Bitis),
      sqlNum(params.Deger),
    ].join(", ")}`,
  DELETE_IZINLIMIT: (params) =>
    `[PersonelIzinLimit_DELETEByIDPersonelIzinLimit] ${sqlNum(params.IDPersonelIzinLimit)}`,
};

export const POST = withSession(async (request, session) => {
  try {
    // Sistem parametreleri yalnızca Admin'e açık
    if (session.user.IDKullaniciTip !== KULLANICI_TIPI.ADMIN) {
      return fail(
        session.isMobile,
        "Bu işlem için yetkiniz yok",
        403,
        "FORBIDDEN",
      );
    }

    const payload = await request.json();
    const { type } = payload;

    const queryParams = {
      Yil: session.user.Yil,
      ...payload.params,
    };
    const queryFunction = queryTypes[type];

    if (!queryFunction) {
      return fail(session.isMobile, "Geçersiz sorgu tipi", 400);
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
