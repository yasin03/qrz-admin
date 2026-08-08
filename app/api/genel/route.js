import { NextResponse } from "next/server";
import { joseDecrypt } from "@/lib/token";
import { ExecuteQuery, ExecuteQueryDataset } from "@/lib/db";
import { getCookie } from "cookies-next";

const queryTypes = {
  GET_ILLER: (params) => `[Il_SELECTByIDUlke] '${params.IDUlke}'`,
  GET_ILCELER: (params) => `[Ilce_SELECTByIlKodu] '${params.IlKodu}',''`,
  GET_VERGIDAIRELERI: (params) =>
    `[VergiDairesi_SELECTByIlKodu] '${params.IlKodu}',''`,
  GET_SABIT_TANIMLAR: (params) => `[SabitTanimMadde_SELECTAll]`,
};

export async function POST(request) {
  try {
    const payload = await request.json();
    const { type } = payload;

    const sid = request.cookies.get("sid")?.value;
    const grsisudo = request.cookies.get("grsisudo")?.value;

    const user = await joseDecrypt(sid);
    const gruSisudo = await joseDecrypt(grsisudo);

    if (!user) {
      return NextResponse.json(
        { message: "Kullanıcı Bilgisi Bulunamadı." },
        { status: 401 },
      );
    }

    const queryParams = {
      IDSirket: grsisudo.IDSirket,
      Yil: grsisudo.Yil,
      IDKullanici: user.IDKullanici,
      IDUlke: payload.IDUlke,
      IlKodu: payload.IlKodu,
    };

    const queryFunction = queryTypes[type];

    if (!queryFunction) {
      return NextResponse.json(
        { message: "Geçersiz sorgu tipi" },
        { status: 400 },
      );
    }

    const query = queryFunction(queryParams);
    let result;
    if (type == "GET_SABIT_TANIMLAR") {
      result = await ExecuteQueryDataset(query);
    } else {
      result = await ExecuteQuery(query);
    }

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
