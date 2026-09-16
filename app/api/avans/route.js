import { NextResponse } from "next/server";
import { joseDecrypt } from "@/lib/token";
import { ExecuteQuery, ExecuteQueryDataset } from "@/lib/db";
import { getCookie } from "cookies-next";

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

export async function POST(request) {
  try {
    const payload = await request.json();
    const { type } = payload;

    const user_token = request.cookies.get("sid")?.value;
    const user = await joseDecrypt(user_token);
    const grsisudo_token = request.cookies.get("grsisudo")?.value;
    const grsisudo = await joseDecrypt(grsisudo_token);

    if (!user) {
      return NextResponse.json(
        { message: "Kullanıcı Bilgisi Bulunamadı." },
        { status: 401 },
      );
    }

    const queryParams = {
      IDSirket: grsisudo.IDSirket,
      IDSube: payload.IDSube ? payload.IDSube : grsisudo.IDSube,
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
      IDKullanici: user.IDKullanici,
      KabulRed: payload.KabulRed,
      RedAciklama: payload.RedAciklama,
    };

    const queryFunction = queryTypes[type];

    if (!queryFunction) {
      return NextResponse.json(
        { message: "Geçersiz sorgu tipi" },
        { status: 400 },
      );
    }

    const query = queryFunction(queryParams);
    console.log("Executing query:", query); // Log the query for debugging
    const result = await ExecuteQuery(query);

    return NextResponse.json(result);
  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json(
      {
        message: "Bir hata oluştu. Lütfen tekrar deneyiniz",
        error: err.message,
      },
      { status: 500 },
    );
  }
}
