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

  SELECT_VERGIORAN: (params) => `[VergiYuzde_SELECT] ${sqlNum(params.Yil)}`,
  INSERT_VERGIORAN: (params) =>
    `[VergiYuzde_INSERT] ${[
      sqlNum(params.Yil),
      sqlNum(params.Baslangic),
      sqlNum(params.Bitis),
      sqlNum(params.Yuzde),
    ].join(", ")}`,
  UPDATE_VERGIORAN: (params) =>
    `[VergiYuzde_UPDATEByIDVergiYuzde] ${[
      sqlNum(params.IDVergiYuzde),
      sqlNum(params.Yil),
      sqlNum(params.Baslangic),
      sqlNum(params.Bitis),
      sqlNum(params.Yuzde),
    ].join(", ")}`,
  DELETE_VERGIORAN: (params) =>
    `[VergiYuzde_DELETEByIDVergiYuzde] ${sqlNum(params.IDVergiYuzde)}`,
  // Yil: kaynak yıl, Yil2: hedef yıl
  AKTAR_VERGIORAN: (params) =>
    `[VergiYuzde_AKTAR] ${sqlNum(params.Yil)}, ${sqlNum(params.Yil2)}`,

  SELECT_KATSAYI: (params) => `[Gosterge_SELECT] ${sqlNum(params.Yil)}`,
  INSERT_KATSAYI: (params) =>
    `[Gosterge_INSERT] ${[
      sqlNum(params.Yil),
      sqlStr(params.Ay),
      sqlNum(params.DamgaVergisi),
      sqlNum(params.SskGunlukTaban),
      sqlNum(params.SskGunlukTavan),
      sqlNum(params.SskAylikTaban),
      sqlNum(params.SskAylikTavan),
      sqlNum(params.DamgaVergisiIstisnasi),
      sqlNum(params.AuGelirVergisiMatrahi),
      sqlNum(params.GelirVergisiIstisnasi),
      sqlNum(params.SgkIssizIsverenPrimiOran),
      sqlNum(params.EmekliNet),
    ].join(", ")}`,
  UPDATE_KATSAYI: (params) =>
    `[Gosterge_UPDATEByIDGosterge] ${[
      sqlNum(params.IDGosterge),
      sqlNum(params.Yil),
      sqlStr(params.Ay),
      sqlNum(params.DamgaVergisi),
      sqlNum(params.SskGunlukTaban),
      sqlNum(params.SskGunlukTavan),
      sqlNum(params.SskAylikTaban),
      sqlNum(params.SskAylikTavan),
      sqlNum(params.DamgaVergisiIstisnasi),
      sqlNum(params.AuGelirVergisiMatrahi),
      sqlNum(params.GelirVergisiIstisnasi),
      sqlNum(params.SgkIssizIsverenPrimiOran),
      sqlNum(params.EmekliNet),
    ].join(", ")}`,
  DELETE_KATSAYI: (params) =>
    `[Gosterge_DELETEByIDGosterge] ${sqlNum(params.IDGosterge)}`,
  // Yil: kaynak yıl, Yil2: hedef yıl
  AKTAR_KATSAYI: (params) =>
    `[Gosterge_AKTAR] ${sqlNum(params.Yil)}, ${sqlNum(params.Yil2)}`,

  SELECT_ENGELINDIRIM: (params) =>
    `[PersonelEngelliIndirim_SELECT] ${sqlNum(params.Yil)}`,
  INSERT_ENGELINDIRIM: (params) =>
    `[PersonelEngelliIndirim_INSERT] ${[
      sqlNum(params.Yil),
      sqlNum(params.Derece),
      sqlStr(params.Aciklama),
      sqlNum(params.IndirimTutari),
    ].join(", ")}`,
  UPDATE_ENGELINDIRIM: (params) =>
    `[PersonelEngelliIndirim_UPDATEByIDPersonelEngelliIndirim] ${[
      sqlNum(params.IDPersonelEngelliIndirim),
      sqlNum(params.Yil),
      sqlNum(params.Derece),
      sqlStr(params.Aciklama),
      sqlNum(params.IndirimTutari),
    ].join(", ")}`,
  DELETE_ENGELINDIRIM: (params) =>
    `[PersonelEngelliIndirim_DELETEByIDPersonelEngelliIndirim] ${sqlNum(params.IDPersonelEngelliIndirim)}`,
  // Yil: kaynak yıl, Yil2: hedef yıl
  AKTAR_ENGELINDIRIM: (params) =>
    `[PersonelEngelliIndirim_AKTAR] ${sqlNum(params.Yil)}, ${sqlNum(params.Yil2)}`,

  SELECT_MESLEKKODU: (params) =>
    `[PersonelMeslekKodu_SELECT] ${sqlStr(params.Adi)}`,
  INSERT_MESLEKKODU: (params) =>
    `[PersonelMeslekKodu_INSERT] ${[
      sqlStr(params.Kod),
      sqlStr(params.Aciklama),
    ].join(", ")}`,
  UPDATE_MESLEKKODU: (params) =>
    `[PersonelMeslekKodu_UPDATEByIDPersonelMeslekKodu] ${[
      sqlNum(params.IDPersonelMeslekKodu),
      sqlStr(params.Kod),
      sqlStr(params.Aciklama),
    ].join(", ")}`,
  DELETE_MESLEKKODU: (params) =>
    `[PersonelMeslekKodu_DELETEByIDPersonelMeslekKodu] ${sqlNum(params.IDPersonelMeslekKodu)}`,

  SELECT_KIDEMIHBAR: (params) =>
    `[PersonelKidemSure_SELECT] ${sqlNum(params.Yil)}`,
  INSERT_KIDEMIHBAR: (params) =>
    `[PersonelKidemSure_INSERT] ${[
      sqlNum(params.Yil),
      sqlStr(params.Aciklama),
      sqlNum(params.BaslangicGun),
      sqlNum(params.BitisGun),
      sqlNum(params.HesaplanacakGun),
      sqlStr(params.Tip),
      sqlNum(params.MaksimumDeger),
      sqlStr(params.BaslangicAy),
      sqlStr(params.BitisAy),
    ].join(", ")}`,
  UPDATE_KIDEMIHBAR: (params) =>
    `[PersonelKidemSure_UPDATEByIDPersonelKidemSure] ${[
      sqlNum(params.IDPersonelKidemSure),
      sqlNum(params.Yil),
      sqlStr(params.Aciklama),
      sqlNum(params.BaslangicGun),
      sqlNum(params.BitisGun),
      sqlNum(params.HesaplanacakGun),
      sqlStr(params.Tip),
      sqlNum(params.MaksimumDeger),
      sqlStr(params.BaslangicAy),
      sqlStr(params.BitisAy),
    ].join(", ")}`,
  DELETE_KIDEMIHBAR: (params) =>
    `[PersonelKidemSure_DELETEByIDPersonelKidemSure] ${sqlNum(params.IDPersonelKidemSure)}`,
  // Yil: kaynak yıl, Yil2: hedef yıl
  AKTAR_KIDEMIHBAR: (params) =>
    `[PersonelKidemSure_AKTAR] ${sqlNum(params.Yil)}, ${sqlNum(params.Yil2)}`,
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
