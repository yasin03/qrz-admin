import { NextResponse } from "next/server";
import { joseDecrypt } from "@/lib/token";
import { ExecuteQuery } from "@/lib/db";

const queryTypes = {
  GET_PERSONEL: (params) =>
    `[SubePersonel_SELECTByTarih] '${params.IDSube}','${params.IDBolum}','${params.DurumTarihi}','${params.Durum}'`,
  GET_PERSONEL_DETAY: (params) =>
    `[SubePersonel_SELECTByIDSubePersonel] '${params.IDSubePersonel}'`,
};

export async function POST(request) {
  try {
    const payload = await request.json();
    const { type } = payload;

    const sid = request.cookies.get("sid")?.value;
    const grsisudoToken = request.cookies.get("grsisudo")?.value;

    const user = sid ? await joseDecrypt(sid) : null;
    const grsisudo = grsisudoToken ? await joseDecrypt(grsisudoToken) : null;

    if (!user) {
      return NextResponse.json(
        { message: "Kullanıcı Bilgisi Bulunamadı." },
        { status: 401 },
      );
    }

    // DÜZELTME: grsisudo yoksa (kullanıcı hiç şirket/şube seçmemişse)
    // grsisudo.IDSirket satırı öncesi çökerdi — artık net bir hata dönüyor.
    if (!grsisudo) {
      return NextResponse.json(
        { message: "Lütfen önce üstten şirket/şube seçimi yapın." },
        { status: 400 },
      );
    }

    const queryParams = {
      IDSirket: grsisudo.IDSirket,
      Yil: grsisudo.Yil,
      IDKullanici: user.IDKullanici,
      // DÜZELTME: IDSube artık filtreden gelen değeri kullanıyor (kullanıcı
      // farklı bir şubeyi görüntülemek isteyebilir), context'teki değil.
      // Filtre panelinde varsayılan olarak context'teki şube seçili geliyor
      // zaten (PersonelFiltre.tsx buna göre kuruldu).
      IDSubePersonel: payload.IDSubePersonel,
      IDSube: payload.IDSube,
      IDBolum: payload.IDBolum ?? "",
      DurumTarihi: payload.DurumTarihi,
      Durum: payload.Durum ?? "",
    };

    const queryFunction = queryTypes[type];

    if (!queryFunction) {
      return NextResponse.json(
        { message: "Geçersiz sorgu tipi" },
        { status: 400 },
      );
    }

    const query = queryFunction(queryParams);
    console.log("Executing query=========================:", query); // Log the query for debugging
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
