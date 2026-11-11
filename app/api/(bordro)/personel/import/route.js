import { NextResponse } from "next/server";
import { ExecuteQuery } from "@/lib/db";
import { ok, fail, withSession } from "@/lib/api-session";

function sqlStr(value) {
  return `'${String(value ?? "").replace(/'/g, "''")}'`;
}

function sqlNum(value) {
  return `${Number(value ?? 0)}`;
}

function buildPersonelParams(p) {
  return [
    sqlNum(p.SubeKodu),
    sqlStr(p.IDBolum),
    sqlStr(p.SubeAdi),
    sqlStr(p.Ad),
    sqlStr(p.Soyad),
    sqlStr(p.IlkSoyad),
    sqlStr(p.MedeniDurum),
    sqlStr(p.TcKimlikNo),
    sqlStr(p.Cinsiyet),
    sqlStr(p.IseIlkGirisTarihi),
    sqlStr(p.IseSonGirisTarihi),
    sqlStr(p.CikisTarihi),
    sqlStr(p.PersonelAyrilisKodu),
    sqlStr(p.PersonelMeslekKodu),
    sqlStr(p.OzelKod),
    sqlStr(p.SgkDurumu),
    sqlStr(p.OzurlulukDerecesi),
    sqlStr(p.PersonelSigortaKolu),
    sqlStr(p.PersonelKanunNo),
    sqlStr(p.PersonelSgkBelgeTuru),
    sqlStr(p.CalismaDurumu),
    sqlStr(p.IstihdamDurumu),
    sqlStr(p.MaasParaBirimi),
    sqlStr(p.Ucret),
    sqlStr(p.Ucret2),
    sqlStr(p.OdemeSekli),
    sqlStr(p.UcretTipi),
    sqlStr(p.Statu),
    sqlStr(p.DogumTarihi),
    sqlStr(p.BesOrani),
    sqlStr(p.KumulatifSgkMatrahi),
    sqlStr(p.AgiAlmaz),
    sqlStr(p.BankaKodu),
    sqlStr(p.IbanNo),
    sqlStr(p.TesvikOrani),
    sqlStr(p.VergidenMuaf),
    sqlStr(p.PersonelGorevKodu),
    sqlStr(p.AzCalismaDurumuGun),
    sqlStr(p.AzCalismaDurumuGunSayisi),
    sqlStr(p.Unvan),
  ].join(",");
}

const queryTypes = {
  IMPORT_EXCEL: (params) =>
    `[SubePersonel_Aktar] ${sqlNum(params.IDKullanici)}, ${sqlNum(params.IDSirket)}, ${buildPersonelParams(params)}`,
};

export const POST = withSession(async (request, session) => {
  try {
    const payload = await request.json();
    const { type, jsonData } = payload;

    if (session.isMobile && !MOBILE_ALLOWED_TYPES.includes(type)) {
      return fail(true, "Bu islem mobilde desteklenmiyor.", 403, "FORBIDDEN");
    }

    if (!session.isMobile && !session.user) {
      return fail(false, "Lütfen önce üstten şirket/şube seçimi yapın.", 400);
    }

    const queryParams = {
      IDSirket: session.user.IDSirket,
      IDKullanici: session.user.IDKullanici,
      ...payload,
    };

    const queryFunction = queryTypes[type];

    const query = queryFunction(queryParams);
    console.log("Executing query:", query);
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
