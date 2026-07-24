import { joseDecrypt } from "../../../token/token";
import { getCookie } from "cookies-next";
import { ExecuteQuery } from "../../../db/db";

const queryTypes = {
  ADD_GRUP: (params) =>
    `[Gurup_INSERT] '${params.GrupAdi}', '${params.YetkiliKisi}', '${params.IsTel}', '${params.Tel}', '${params.IDKullanici}', '${params.Durum}'`,
  ADD_GRUP: (params) => `[Gurup_UPDATEByIDGurup] '${params.IDKullanici}'`,
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { type } = req.body;

    const user = await joseDecrypt(getCookie("sid", { req, res }));
    const grsisudo = await joseDecrypt(getCookie("grsisudo", { req, res }));

    if (!user) {
      return res.status(401).json({ message: "Kullanıcı Bilgisi Bulunamadı." });
    }

    const queryParams = {
      IDSirket: grsisudo.IDSirket,
      Yil: grsisudo.Yil,
      IDKullanici: user.IDKullanici,
      GrupAdi: req.body.GrupAdi,
      YetkiliKisi: req.body.YetkiliKisi,
      IsTel: req.body.IsTel,
      Tel: req.body.Tel,
      Durum: req.body.Durum,
    };

    const queryFunction = queryTypes[type];

    if (!queryFunction) {
      return res.status(400).json({ message: "Geçersiz sorgu tipi" });
    }

    const query = queryFunction(queryParams);
    const result = await ExecuteQuery(query);

    return res.status(200).json(result);
  } catch (err) {
    console.error("API Error:", err);
    return res.status(500).json({
      message: "Bir hata oluştu. Lütfen tekrar deneyiniz",
      error: err.message,
    });
  }
}
