import { NextResponse } from "next/server";
import {
  addMonths,
  addYears,
  differenceInCalendarDays,
  differenceInMonths,
  format,
  isValid,
  parseISO,
  startOfYear,
  subMonths,
} from "date-fns";
import { ExecuteQuery } from "@/lib/db";
import { ok, fail, withSession } from "@/lib/api-session";
import { KULLANICI_TIPI } from "@/lib/roles";

// Ana sayfa dashboard'u: mevcut prosedürleri paralel çağırıp tek cevapta özetler.
// Web (cookie) ve mobil (Bearer) aynı endpoint'i kullanır. Cevap tipleri: types/dashboard.ts

// ---- Yardımcılar --------------------------------------------------------

// Sorguya giren ID'ler sadece rakam olabilir (payload'dan gelenler dahil)
const id = (value) => {
  const str = String(value ?? "").trim();
  return /^\d+$/.test(str) ? str : null;
};

const ymd = (date) => format(date, "yyyy-MM-dd");

// Backend boş tarihleri 1900-01-01 olarak dönüyor
const toDate = (value) => {
  if (!value) return null;
  const date =
    value instanceof Date ? value : parseISO(String(value).replace("Z", ""));
  return isValid(date) && date.getFullYear() > 1900 ? date : null;
};

const num = (value) => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

// Prosedür sonucu bazen [[...]] bazen [...] dönebiliyor
const rows = (result) => {
  if (!Array.isArray(result) || result.length === 0) return [];
  return Array.isArray(result[0]) ? result[0] : result;
};

const run = async (query) => rows(await ExecuteQuery(query));

// Bölüm hata verirse tüm dashboard düşmesin, sadece o bölüm null olsun
const section = async (name, fn) => {
  try {
    return await fn();
  } catch (err) {
    console.error(`Dashboard bölümü hatalı (${name}):`, err);
    return null;
  }
};

const kidemText = (start, today) => {
  const months = differenceInMonths(today, start);
  if (months < 0) return null;
  const yil = Math.floor(months / 12);
  const ay = months % 12;
  if (yil === 0 && ay === 0) return "1 aydan az";
  return [yil && `${yil} yıl`, ay && `${ay} ay`].filter(Boolean).join(" ");
};

// Bugünden bir sonraki doğum gününe kalan gün (0 = bugün)
const dogumGunuKalan = (dogum, today) => {
  let next = new Date(today.getFullYear(), dogum.getMonth(), dogum.getDate());
  if (differenceInCalendarDays(next, today) < 0) next = addYears(next, 1);
  return differenceInCalendarDays(next, today);
};

const isPending = (talep) => talep.KabulRed === null || talep.KabulRed === undefined;

// ---- Personel özeti -----------------------------------------------------

async function personelOzet(p, IDSubePersonel) {
  // Şube her zaman personelin kendi kaydından alınır (web'de grsisudo bağlamı personel için boş olabilir)
  const IDSube = id(p.IDSube);

  const today = new Date();
  const bugun = ymd(today);
  const yilBasi = ymd(startOfYear(today));
  const birYilOnce = ymd(addYears(today, -1));
  const birYilSonra = ymd(addYears(today, 1));

  const [
    personel,
    yillikIzin,
    sonrakiIzin,
    bekleyenTalepler,
    avans,
    maas,
    puantaj,
    eklentiKesinti,
    pdksBugun,
  ] = await Promise.all([
    section("personel", async () => {
      const dogum = toDate(p.DogumTarihi);
      const giris = toDate(p.IseSonGirisTarihi);
      const unvan = String(p.UnvanAdi ?? p.GorevAdi ?? "").trim();
      return {
        IDSubePersonel: String(IDSubePersonel),
        AdSoyad: [p.Ad, p.Soyad].filter(Boolean).join(" ").trim(),
        Unvan: unvan && unvan !== "0" ? unvan : null,
        BolumAdi: p.BolumAdi ?? null,
        SicilNo: p.SicilNo ?? null,
        DogumTarihi: dogum ? ymd(dogum) : null,
        DogumGunuKalanGun: dogum ? dogumGunuKalan(dogum, today) : null,
        IseGirisTarihi: giris ? ymd(giris) : null,
        CalistigiGun: giris ? differenceInCalendarDays(today, giris) : null,
        Kidem: giris ? kidemText(giris, today) : null,
      };
    }),

    section("yillikIzin", async () => {
      const [s] = await run(
        `[SubePersonelIzin_HESAPLAByIDSubePersonel] '${IDSubePersonel}','${bugun}'`,
      );
      if (!s) return null;
      return {
        ToplamHak: num(s.ToplamIzinHakki),
        Kullanilan: num(s.ToplamKullanilanIzin),
        Kalan: num(s.ToplamKalanIzin),
      };
    }),

    section("sonrakiIzin", async () => {
      if (!IDSube) return null;
      const izinler = await run(
        `[IzinGenel_SELECTByIDSubePersonel] '${IDSube}','${IDSubePersonel}','${bugun}','${birYilSonra}',''`,
      );
      const sonraki = izinler
        .map((i) => ({ ...i, bas: toDate(i.BaslangicTarihi), bit: toDate(i.BitisTarihi) }))
        .filter((i) => i.bas && differenceInCalendarDays(i.bas, today) >= 0)
        .sort((a, b) => a.bas - b.bas)[0];
      if (!sonraki) return null;
      return {
        BaslangicTarihi: ymd(sonraki.bas),
        BitisTarihi: sonraki.bit ? ymd(sonraki.bit) : ymd(sonraki.bas),
        Tip: String(sonraki.Aciklama ?? ""),
        Gun: num(sonraki.Gun),
        KalanGun: differenceInCalendarDays(sonraki.bas, today),
      };
    }),

    section("bekleyenTalepler", async () => {
      if (!IDSube) return null;
      const [izin, avansTalep] = await Promise.all([
        run(`[SubePersonelIzinTalep_SELECT] '${IDSube}','${IDSubePersonel}','${birYilOnce}','${birYilSonra}'`),
        run(`[SubePersonelAvansTalep_SELECT] '${IDSube}','${IDSubePersonel}','${birYilOnce}','${birYilSonra}'`),
      ]);
      return {
        Izin: izin.filter(isPending).length,
        Avans: avansTalep.filter(isPending).length,
      };
    }),

    section("avans", async () => {
      if (!IDSube) return null;
      // Prosedür şube bazlı dönüyor; personelin kendi kayıtları sunucuda filtrelenir
      const liste = (
        await run(`[SubePersonelAvans_SELECTByIDSube] '${IDSube}','${yilBasi}','${bugun}'`)
      ).filter((a) => String(a.IDSubePersonel) === String(IDSubePersonel));

      const aylikKesinti = liste
        .filter((a) => {
          const bas = toDate(a.OdemeBaslangicTarihi);
          if (!bas) return false;
          const bitis = addMonths(bas, Math.max(1, num(a.TaksitSayisi)));
          return bas <= today && today < bitis;
        })
        .reduce((sum, a) => sum + num(a.BordroKesintiTutari), 0);

      return {
        ToplamTutar: liste.reduce((sum, a) => sum + num(a.Tutar), 0),
        Adet: liste.length,
        AylikKesinti: aylikKesinti,
      };
    }),

    section("maas", async () => {
      // Bu ayın bordrosu hesaplanmadıysa bir önceki aya bakılır
      for (const donem of [today, subMonths(today, 1)]) {
        const Yil = format(donem, "yyyy");
        const Ay = format(donem, "MM");
        const [b] = await run(
          `[Bordro_SELECTByIDSubePersonelToplu] '${IDSubePersonel}','${Yil}','${Ay}'`,
        );
        if (b && (b.HesaplamaTarihi || num(b.NetOdenen) > 0)) {
          return {
            Yil,
            Ay,
            NetOdenen: num(b.NetOdenen),
            OdenecekTutar: num(b.OdenecekTutar),
            Onayli: Boolean(b.OnayTarihi),
          };
        }
      }
      return null;
    }),

    section("puantaj", async () => {
      const Yil = format(today, "yyyy");
      const Ay = format(today, "MM");
      const [p] = await run(
        `[UcretCizelgesi_SELECTByIDSubePersonel] '${IDSubePersonel}','${Yil}','${Ay}'`,
      );
      if (!p) return null;
      return {
        Yil,
        Ay,
        CalisilanGun: num(p.ToplamGun),
        CalisilanSaat: num(p.ToplamSaat),
        FazlaMesai: num(p.ToplamFM),
      };
    }),

    section("eklentiKesinti", async () => {
      if (!IDSube) return null;
      const [eklenti, kesinti] = await Promise.all([
        run(`[SubePersonelYardim_SELECT] '${IDSube}','${IDSubePersonel}','${yilBasi}','${bugun}'`),
        run(
          `[SubePersonelOzelKesinti_SELECTByIDSubePersonel] '${IDSube}','${IDSubePersonel}','${yilBasi}','${bugun}'`,
        ),
      ]);
      return {
        EklentiToplam: eklenti.reduce((sum, e) => sum + num(e.BordroOdemeTutari), 0),
        KesintiToplam: kesinti.reduce((sum, k) => sum + num(k.BordroKesintiTutari), 0),
      };
    }),

    section("pdksBugun", async () => {
      const [k] = await run(
        `[SubePersonelSaat_SelectByIDSubePersonel] '${IDSubePersonel}','${bugun}','${bugun}'`,
      );
      return { Giris: k?.Giris ?? null, Cikis: k?.Cikis ?? null };
    }),
  ]);

  return {
    personel,
    yillikIzin,
    sonrakiIzin,
    bekleyenTalepler,
    avans,
    maas,
    puantaj,
    eklentiKesinti,
    pdksBugun,
  };
}

// ---- Yönetici özeti -----------------------------------------------------

async function yoneticiOzet(IDSube, Yil, Ay) {
  const today = new Date();
  const bugun = ymd(today);
  const birYilOnce = ymd(addYears(today, -1));
  const birYilSonra = ymd(addYears(today, 1));

  const personelListesi = await section("personelListesi", () =>
    run(`[SubePersonel_SELECTByIDSube3] '${IDSube}', '','','${Yil}','${Ay}'`),
  );

  const [bugunIzinde, bekleyenTalepler, bordro, pdksGelen] = await Promise.all([
    section("bugunIzinde", async () => {
      const liste = (
        await run(`[IzinGenel_SELECTByIDSubePersonel] '${IDSube}','0','${bugun}','${bugun}',''`)
      ).filter((i) => {
        const bas = toDate(i.BaslangicTarihi);
        const bit = toDate(i.BitisTarihi) ?? bas;
        return bas && differenceInCalendarDays(today, bas) >= 0 && differenceInCalendarDays(bit, today) >= 0;
      });
      return {
        Sayi: liste.length,
        Liste: liste.map((i) => ({
          IDSubePersonel: String(i.IDSubePersonel),
          AdSoyad: [i.Ad, i.Soyad].filter(Boolean).join(" ").trim(),
          Tip: String(i.Aciklama ?? ""),
          BitisTarihi: ymd(toDate(i.BitisTarihi) ?? today),
        })),
      };
    }),

    section("bekleyenTalepler", async () => {
      const [izin, avans] = await Promise.all([
        run(`[SubePersonelIzinTalep_SELECT] '${IDSube}','0','${birYilOnce}','${birYilSonra}'`),
        run(`[SubePersonelAvansTalep_SELECT] '${IDSube}','0','${birYilOnce}','${birYilSonra}'`),
      ]);
      return { Izin: izin.filter(isPending).length, Avans: avans.filter(isPending).length };
    }),

    section("bordro", async () => {
      const liste = await run(`[Bordro_SELECTByIDSube] '${IDSube}','0','${Yil}','${Ay}','',''`);
      return {
        Yil,
        Ay,
        Toplam: liste.length,
        Hesaplanan: liste.filter((b) => b.HesaplamaTarihi).length,
        Onayli: liste.filter((b) => b.OnayTarihi).length,
        OnayBekleyen: liste.filter((b) => b.HesaplamaTarihi && !b.OnayTarihi).length,
        ToplamOdenecek: liste.reduce((sum, b) => sum + num(b.OdenecekTutar), 0),
      };
    }),

    section("pdksBugun", async () => {
      const kayitlar = await run(
        `[SubePersonelSaat_SelectByIDSubeBolum] '${IDSube}','0','${bugun}','${bugun}'`,
      );
      return new Set(kayitlar.filter((k) => k.Giris).map((k) => String(k.IDSubePersonel))).size;
    }),
  ]);

  const personelSayisi = personelListesi ? personelListesi.length : null;

  // Personel listesi doğum tarihi döndürmüyorsa bu bölüm null kalır
  const dogumGunleri =
    personelListesi && personelListesi.some((p) => "DogumTarihi" in p)
      ? personelListesi
          .map((p) => ({ p, dogum: toDate(p.DogumTarihi) }))
          .filter(({ dogum }) => dogum)
          .map(({ p, dogum }) => ({
            IDSubePersonel: String(p.IDSubePersonel),
            AdSoyad: String(p.AdSoyad ?? [p.Ad, p.Soyad].filter(Boolean).join(" ")).trim(),
            Tarih: ymd(dogum),
            KalanGun: dogumGunuKalan(dogum, today),
          }))
          .filter((d) => d.KalanGun <= 30)
          .sort((a, b) => a.KalanGun - b.KalanGun)
      : null;

  const pdksBugun =
    pdksGelen === null
      ? null
      : {
          Gelen: pdksGelen,
          // İzinde olanlar gelmeyen sayılmaz
          Gelmeyen:
            personelSayisi === null
              ? null
              : Math.max(0, personelSayisi - pdksGelen - (bugunIzinde?.Sayi ?? 0)),
        };

  return { personelSayisi, bugunIzinde, bekleyenTalepler, bordro, pdksBugun, dogumGunleri };
}

// ---- Route --------------------------------------------------------------

export const POST = withSession(async (request, session) => {
  try {
    const payload = await request.json();
    const { type } = payload;
    const user = session.user;
    const isPersonel = String(user.IDKullaniciTip) === KULLANICI_TIPI.PERSONEL;

    if (type === "PERSONEL_OZET") {
      // Personel sadece kendi özetini görür; payload'daki ID'yi yalnızca yönetici/admin kullanabilir
      const IDSubePersonel = id(
        isPersonel ? user.IDSubePersonel : (payload.IDSubePersonel ?? user.IDSubePersonel),
      );
      if (!IDSubePersonel) {
        return fail(session.isMobile, "Hesabınıza bağlı bir personel kaydı bulunamadı.", 400);
      }
      const [personel] = await run(`[SubePersonel_SELECTByIDSubePersonel] '${IDSubePersonel}'`);
      if (!personel) {
        return fail(session.isMobile, "Personel bilgisi bulunamadı.", 404);
      }
      return ok(session.isMobile, await personelOzet(personel, IDSubePersonel));
    }

    if (type === "YONETICI_OZET") {
      if (isPersonel) {
        return fail(session.isMobile, "Bu özeti görüntüleme yetkiniz yok.", 403, "FORBIDDEN");
      }
      const IDSube = id(payload.IDSube ?? user.IDSube);
      if (!IDSube) {
        return fail(session.isMobile, "Lütfen önce şube seçimi yapın.", 400);
      }
      const today = new Date();
      const Yil = id(payload.Yil ?? user.Yil) ?? format(today, "yyyy");
      const Ay = String(id(payload.Ay ?? user.Ay) ?? format(today, "MM")).padStart(2, "0");
      return ok(session.isMobile, await yoneticiOzet(IDSube, Yil, Ay));
    }

    return fail(session.isMobile, "Geçersiz sorgu tipi", 400);
  } catch (err) {
    console.error("API Error:", err);

    if (session.isMobile) {
      return fail(true, "Bir hata oluştu. Lütfen tekrar deneyiniz", 500, "SERVER_ERROR");
    }

    return NextResponse.json(
      { message: "Bir hata oluştu. Lütfen tekrar deneyiniz", error: err.message },
      { status: 500 },
    );
  }
});
