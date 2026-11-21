import { NextResponse } from "next/server";
import {
  addDays,
  addMonths,
  addYears,
  differenceInCalendarDays,
  differenceInMonths,
  format,
  isValid,
  parse,
  parseISO,
  startOfMonth,
  startOfYear,
  subDays,
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

// Backend boş tarihleri 1900-01-01 olarak dönüyor. Bazı prosedürler tarihi
// ISO yerine "06.08.2004" (dd.MM.yyyy) biçiminde döndürüyor.
const toDate = (value) => {
  if (!value) return null;
  const str = String(value);
  const date =
    value instanceof Date
      ? value
      : /^\d{2}\.\d{2}\.\d{4}$/.test(str)
        ? parse(str, "dd.MM.yyyy", new Date())
        : parseISO(str.replace("Z", ""));
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

// Talep listeleri KabulRed döndürmüyor; durum OnayDurum/RedDurum ile belli
// (izin/avans talep listesi sayfalarıyla aynı kural).
const isPending = (talep) => !talep.OnayDurum && !talep.RedDurum;

const isAktif = (p) => p.Durum === true || p.Durum === 1 || p.Durum === "1";

// "1-İdari Personeller" -> "İdari Personeller"
// Grubu olmayan personel "Diğer" altında toplanır: harf içermeyen her değer
// (null, "", "0", "-", "–", "0 -" vb.) grup adı sayılmaz.
const grupAdi = (value) => {
  const str = String(value ?? "")
    .trim()
    .replace(/^\d+\s*[-–]\s*/, "")
    .trim();
  return /\p{L}/u.test(str) ? str : "Diğer";
};

const cinsiyetAnahtari = (value) => {
  const str = String(value ?? "")
    .trim()
    .toLocaleUpperCase("tr-TR");
  if (str === "ERKEK") return "Erkek";
  if (str === "KADIN") return "Kadin";
  return "Belirtilmemis";
};

// Aktif personelin cinsiyet ve personel grubu dağılımı
function personelDagilimi(liste) {
  const toplam = { Erkek: 0, Kadin: 0, Belirtilmemis: 0 };
  const gruplar = new Map();

  for (const p of liste) {
    const cinsiyet = cinsiyetAnahtari(p.Cinsiyet);
    toplam[cinsiyet] += 1;

    const ad = grupAdi(p.PersonelGrubu);
    const grup = gruplar.get(ad) ?? {
      Grup: ad,
      Erkek: 0,
      Kadin: 0,
      Belirtilmemis: 0,
      Toplam: 0,
    };
    grup[cinsiyet] += 1;
    grup.Toplam += 1;
    gruplar.set(ad, grup);
  }

  return {
    Toplam: liste.length,
    ...toplam,
    // Kalabalıktan aza; "Diğer" her zaman en sonda
    Gruplar: [...gruplar.values()].sort(
      (a, b) =>
        (a.Grup === "Diğer") - (b.Grup === "Diğer") || b.Toplam - a.Toplam,
    ),
  };
}

const isOnayli = (kayit) => !kayit.RedDurum && Boolean(kayit.OnayDurum);

const adSoyad = (k) =>
  String(k.AdSoyad ?? [k.Ad, k.Soyad].filter(Boolean).join(" ")).trim();

const metin = (value) => {
  const str = String(value ?? "").trim();
  return str && str !== "0" && str !== "-" ? str : "Belirtilmemiş";
};

// Etiket -> sayı; büyükten küçüğe, "Belirtilmemiş"/"Diğer" en sonda
function say(liste, anahtar) {
  const map = new Map();
  for (const item of liste) {
    const key = anahtar(item);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  const sonda = (e) => e === "Belirtilmemiş" || e === "Diğer";
  return [...map.entries()]
    .map(([Etiket, Sayi]) => ({ Etiket, Sayi }))
    .sort((a, b) => sonda(a.Etiket) - sonda(b.Etiket) || b.Sayi - a.Sayi);
}

// Sabit sıralı aralıklar (yaş, kıdem): boş aralıklar da gösterilir
function aralikSay(liste, deger, araliklar) {
  const sayilar = araliklar.map(([Etiket]) => ({ Etiket, Sayi: 0 }));
  let belirsiz = 0;
  for (const item of liste) {
    const v = deger(item);
    if (v === null) {
      belirsiz += 1;
      continue;
    }
    const idx = araliklar.findIndex(([, max]) => v < max);
    sayilar[idx === -1 ? araliklar.length - 1 : idx].Sayi += 1;
  }
  if (belirsiz > 0) sayilar.push({ Etiket: "Belirtilmemiş", Sayi: belirsiz });
  return sayilar;
}

const YAS_ARALIKLARI = [
  ["25 altı", 25],
  ["25-34", 35],
  ["35-44", 45],
  ["45-54", 55],
  ["55+", Infinity],
];

const KIDEM_ARALIKLARI = [
  ["1 yıldan az", 1],
  ["1-3 yıl", 3],
  ["3-5 yıl", 5],
  ["5-10 yıl", 10],
  ["10+ yıl", Infinity],
];

const yilFarki = (from, to) => differenceInMonths(to, from) / 12;

function demografi(liste, today) {
  // İlk 8 bölüm ayrı, kalanlar "Diğer"
  const bolumler = say(liste, (p) => metin(p.BolumAdi));
  const ilk = bolumler.slice(0, 8);
  const kalan = bolumler.slice(8).reduce((s, b) => s + b.Sayi, 0);
  if (kalan > 0) ilk.push({ Etiket: "Diğer", Sayi: kalan });

  return {
    Yas: aralikSay(
      liste,
      (p) => {
        const d = toDate(p.DogumTarihi);
        return d ? yilFarki(d, today) : null;
      },
      YAS_ARALIKLARI,
    ),
    Kidem: aralikSay(
      liste,
      (p) => {
        const d = toDate(p.IseSonGirisTarihi);
        return d ? Math.max(0, yilFarki(d, today)) : null;
      },
      KIDEM_ARALIKLARI,
    ),
    Bolum: ilk,
    UcretTipi: say(liste, (p) => metin(p.UcretTipi).toLocaleUpperCase("tr-TR")),
    CalismaDurumu: say(liste, (p) => metin(p.CalismaDurumu)),
    MedeniDurum: say(liste, (p) =>
      metin(p.MedeniDurum).toLocaleUpperCase("tr-TR"),
    ),
  };
}

function ucretOzeti(liste) {
  let BrutToplam = 0;
  let BrutSayi = 0;
  let NetToplam = 0;
  let NetSayi = 0;
  for (const p of liste) {
    const ucret = num(p.Ucret);
    if (ucret <= 0) continue;
    const tip = String(p.UcretTipi ?? "").toLocaleUpperCase("tr-TR");
    if (tip.startsWith("NET")) {
      NetToplam += ucret;
      NetSayi += 1;
    } else {
      BrutToplam += ucret;
      BrutSayi += 1;
    }
  }
  return { BrutToplam, BrutSayi, NetToplam, NetSayi };
}

// Seçili dönemde (Yil/Ay) işe girenler ve çıkanlar; tüm (aktif + pasif) listeden
function personelHareketi(liste, Yil, Ay) {
  const donemde = (d) =>
    d && d.getFullYear() === Number(Yil) && d.getMonth() + 1 === Number(Ay);
  const kayit = (p, d) => ({
    IDSubePersonel: String(p.IDSubePersonel),
    AdSoyad: adSoyad(p),
    Tarih: ymd(d),
  });
  const giren = [];
  const cikan = [];
  for (const p of liste) {
    const g = toDate(p.IseSonGirisTarihi);
    const c = toDate(p.CikisTarihi);
    if (donemde(g)) giren.push(kayit(p, g));
    if (donemde(c)) cikan.push(kayit(p, c));
  }
  const tarihSira = (a, b) => a.Tarih.localeCompare(b.Tarih);
  return {
    Giren: giren.length,
    Cikan: cikan.length,
    GirenListe: giren.sort(tarihSira),
    CikanListe: cikan.sort(tarihSira),
  };
}

// Önümüzdeki 30 gündeki iş yıldönümleri (en az 1 yıl dolduracaklar)
function isYildonumleri(liste, today) {
  return liste
    .map((p) => ({ p, giris: toDate(p.IseSonGirisTarihi) }))
    .filter(({ giris }) => giris)
    .map(({ p, giris }) => {
      // Doğum günüyle aynı hesap: bir sonraki yıldönümüne kalan gün
      const KalanGun = dogumGunuKalan(giris, today);
      return {
        IDSubePersonel: String(p.IDSubePersonel),
        AdSoyad: adSoyad(p),
        Tarih: ymd(giris),
        KalanGun,
        Yil: addDays(today, KalanGun).getFullYear() - giris.getFullYear(),
      };
    })
    .filter((d) => d.KalanGun <= 30 && d.Yil >= 1)
    .sort((a, b) => a.KalanGun - b.KalanGun);
}

const sum = (liste, alan) => liste.reduce((s, b) => s + num(b[alan]), 0);

// Hesaplanmış bordroların bölüm bazında toplam maliyeti. Bordro satırında bölüm
// adı yoksa personel listesinden bulunur.
function bolumMaliyeti(liste, bolumMap) {
  const map = new Map();
  for (const b of liste) {
    const bolum = metin(b.BolumAdi ?? bolumMap.get(String(b.IDSubePersonel)));
    const x = map.get(bolum) ?? { Etiket: bolum, Tutar: 0, Sayi: 0 };
    x.Tutar += num(b.ToplamMaliyet);
    x.Sayi += 1;
    map.set(bolum, x);
  }
  return ilkN(
    [...map.values()]
      .filter((x) => x.Tutar > 0)
      .sort((a, b) => b.Tutar - a.Tutar),
    8,
    ["Tutar", "Sayi"],
  );
}

// PDKS süreleri metin döner: "08:30", "08:30:00", "8,5" veya sayı -> saat
const sureSaat = (value) => {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const str = String(value).trim();
  const m = str.match(/^(\d{1,3}):(\d{2})(?::(\d{2}))?$/);
  if (m) return Number(m[1]) + Number(m[2]) / 60 + Number(m[3] ?? 0) / 3600;
  const n = Number(str.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

const yuvarla = (n, basamak = 1) =>
  Math.round(n * 10 ** basamak) / 10 ** basamak;

const AY_KISA = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara",
];

// Bugünün ayı dahil geriye doğru n ay: [{ anahtar: "2026-11", Etiket: "Kas 26" }]
const sonAylar = (today, n) =>
  Array.from({ length: n }, (_, i) => {
    const d = subMonths(startOfMonth(today), n - 1 - i);
    return {
      anahtar: format(d, "yyyy-MM"),
      Etiket: `${AY_KISA[d.getMonth()]} ${format(d, "yy")}`,
    };
  });

// İlk n etiket ayrı, kalanı "Diğer"
function ilkN(liste, n, alanlar) {
  const ilk = liste.slice(0, n);
  const kalan = liste.slice(n);
  if (kalan.length === 0) return ilk;
  const diger = { Etiket: "Diğer" };
  for (const alan of alanlar)
    diger[alan] = kalan.reduce((s, x) => s + x[alan], 0);
  return [...ilk, diger];
}

// Son 12 ay işe giriş / çıkış sayıları (pasifler dahil tüm liste)
function personelHareketTrendi(liste, today) {
  const aylar = sonAylar(today, 12).map((a) => ({ ...a, Giren: 0, Cikan: 0 }));
  const idx = new Map(aylar.map((a, i) => [a.anahtar, i]));
  for (const p of liste) {
    const g = toDate(p.IseSonGirisTarihi);
    const c = toDate(p.CikisTarihi);
    if (g && idx.has(format(g, "yyyy-MM")))
      aylar[idx.get(format(g, "yyyy-MM"))].Giren += 1;
    if (c && idx.has(format(c, "yyyy-MM")))
      aylar[idx.get(format(c, "yyyy-MM"))].Cikan += 1;
  }
  return aylar.map(({ Etiket, Giren, Cikan }) => ({ Etiket, Giren, Cikan }));
}

// İzin listesinden (son 1 yıl + önümüzdeki 7 gün) türler, aylık trend ve yaklaşanlar
function izinOzeti(liste, today) {
  const kayitlar = liste
    .map((i) => {
      const bas = toDate(i.BaslangicTarihi);
      const bit = toDate(i.BitisTarihi) ?? bas;
      return bas ? { i, bas, bit: bit < bas ? bas : bit } : null;
    })
    .filter(Boolean);

  const gecmis = kayitlar.filter(
    ({ bas }) => differenceInCalendarDays(today, bas) >= 0,
  );

  // Tür bazında toplam gün (son 12 ay)
  const turler = new Map();
  for (const { i } of gecmis) {
    const tur = metin(i.Aciklama);
    turler.set(tur, (turler.get(tur) ?? 0) + num(i.Gun));
  }
  const Turler = ilkN(
    [...turler.entries()]
      .map(([Etiket, Gun]) => ({ Etiket, Gun: yuvarla(Gun) }))
      .filter((t) => t.Gun > 0)
      .sort((a, b) => b.Gun - a.Gun),
    5,
    ["Gun"],
  );

  // Aylık izin günü: izin günü (Gun) aylara takvim günü oranında dağıtılır
  const aylar = sonAylar(today, 12).map((a) => ({
    ...a,
    Gun: 0,
    Kisi: new Set(),
  }));
  const idx = new Map(aylar.map((a, k) => [a.anahtar, k]));
  for (const { i, bas, bit } of gecmis) {
    const takvim = differenceInCalendarDays(bit, bas) + 1;
    const gunBasi = num(i.Gun) / takvim;
    for (let d = bas; d <= bit; d = addDays(d, 1)) {
      const k = idx.get(format(d, "yyyy-MM"));
      if (k === undefined) continue;
      aylar[k].Gun += gunBasi;
      aylar[k].Kisi.add(String(i.IDSubePersonel));
    }
  }

  const Yaklasan = kayitlar
    .filter(({ bas }) => {
      const fark = differenceInCalendarDays(bas, today);
      return fark > 0 && fark <= 7;
    })
    .sort((a, b) => a.bas - b.bas)
    .map(({ i, bas, bit }) => ({
      IDSubePersonel: String(i.IDSubePersonel),
      AdSoyad: adSoyad(i),
      Tip: String(i.Aciklama ?? ""),
      BaslangicTarihi: ymd(bas),
      BitisTarihi: ymd(bit),
      Gun: num(i.Gun),
      KalanGun: differenceInCalendarDays(bas, today),
    }));

  return {
    Turler,
    Aylik: aylar.map(({ Etiket, Gun, Kisi }) => ({
      Etiket,
      Gun: yuvarla(Gun),
      Kisi: Kisi.size,
    })),
    Yaklasan,
  };
}

// Son 7 gün: günlük gelen (PDKS girişi olan), izinli ve gelmeyen sayısı.
// Gelmeyen bugünkü aktif personel sayısına göre yaklaşık hesaplanır.
function devamTrendi(pdks, izinler, aktifSayi, today) {
  const gunler = Array.from({ length: 7 }, (_, k) => subDays(today, 6 - k));
  const gelen = new Map(gunler.map((d) => [ymd(d), new Set()]));
  for (const k of pdks) {
    const d = toDate(k.Tarih);
    if (!k.Giris || !d) continue;
    gelen.get(ymd(d))?.add(String(k.IDSubePersonel));
  }
  return gunler.map((d) => {
    const key = ymd(d);
    const izinli = new Set(
      izinler
        .filter((i) => {
          const bas = toDate(i.BaslangicTarihi);
          const bit = toDate(i.BitisTarihi) ?? bas;
          return (
            bas &&
            differenceInCalendarDays(d, bas) >= 0 &&
            differenceInCalendarDays(bit, d) >= 0
          );
        })
        .map((i) => String(i.IDSubePersonel)),
    );
    const Gelen = gelen.get(key).size;
    const Izinli = izinli.size;
    return {
      Tarih: key,
      Etiket: `${format(d, "d")} ${AY_KISA[d.getMonth()]}`,
      HaftaSonu: d.getDay() === 0 || d.getDay() === 6,
      Gelen,
      Izinli,
      Gelmeyen:
        aktifSayi === null ? 0 : Math.max(0, aktifSayi - Gelen - Izinli),
    };
  });
}

function bordroOzeti(liste, Yil, Ay, bolumMap = new Map()) {
  const Hesaplanan = liste.filter((b) => b.HesaplamaTarihi).length;
  const Onayli = liste.filter((b) => b.OnayTarihi).length;
  const hesaplanmis = liste.filter((b) => b.HesaplamaTarihi);
  const Tesvik5510 = sum(hesaplanmis, "Tesvik5510");
  const Tesvik4447 = sum(hesaplanmis, "Tesvik4447");
  return {
    Yil,
    Ay,
    Toplam: liste.length,
    Hesaplanan,
    Onayli,
    OnayBekleyen: liste.filter((b) => b.HesaplamaTarihi && !b.OnayTarihi)
      .length,
    Hesaplanmadi: liste.length - Hesaplanan,
    ToplamOdenecek: sum(liste, "OdenecekTutar"),
    ToplamMaliyet: sum(hesaplanmis, "ToplamMaliyet"),
    NetOdenen: sum(hesaplanmis, "NetOdenen"),
    SgkIsciPrimi:
      sum(hesaplanmis, "SgkIsciPrimi") + sum(hesaplanmis, "SgkIssizIsciPrimi"),
    SgkIsverenPrimi:
      sum(hesaplanmis, "SgkIsverenPrimi") +
      sum(hesaplanmis, "SgkIssizIsverenPrimi"),
    GelirVergisi: sum(hesaplanmis, "GelirVergisi"),
    DamgaVergisi: sum(hesaplanmis, "DamgaVergisi"),
    DigerKesinti: Math.max(
      0,
      sum(hesaplanmis, "KesintilerToplami") -
        sum(hesaplanmis, "YasalKesintilerToplami"),
    ),
    Tesvik5510,
    Tesvik4447,
    TesvikToplam: Tesvik5510 + Tesvik4447,
    BolumMaliyet: bolumMaliyeti(hesaplanmis, bolumMap),
    Negatif: hesaplanmis
      .filter((b) => num(b.OdenecekTutar) < 0)
      .map((b) => ({
        IDSubePersonel: String(b.IDSubePersonel),
        AdSoyad: adSoyad(b),
        OdenecekTutar: num(b.OdenecekTutar),
      })),
  };
}

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
    pdksAy,
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
        .map((i) => ({
          ...i,
          bas: toDate(i.BaslangicTarihi),
          bit: toDate(i.BitisTarihi),
        }))
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
        run(
          `[SubePersonelIzinTalep_SELECT] '${IDSube}','${IDSubePersonel}','${birYilOnce}','${birYilSonra}'`,
        ),
        run(
          `[SubePersonelAvansTalep_SELECT] '${IDSube}','${IDSubePersonel}','${birYilOnce}','${birYilSonra}'`,
        ),
      ]);
      return {
        Izin: izin.filter(isPending).length,
        Avans: avansTalep.filter(isPending).length,
      };
    }),

    section("avans", async () => {
      if (!IDSube) return null;
      // Prosedür şube bazlı dönüyor; personelin kendi kayıtları sunucuda filtrelenir.
      // Liste talepleri de içeriyor, sadece onaylılar sayılır. Geçen yıl verilip
      // taksiti süren avanslar aylık kesintiye girsin diye bir yıl geriye bakılır.
      const onayli = (
        await run(
          `[SubePersonelAvans_SELECTByIDSube] '${IDSube}','${birYilOnce}','${bugun}'`,
        )
      ).filter(
        (a) =>
          String(a.IDSubePersonel) === String(IDSubePersonel) && isOnayli(a),
      );

      const yilBasiTarih = startOfYear(today);
      const liste = onayli.filter((a) => {
        const tarih = toDate(a.Tarih) ?? toDate(a.OdemeBaslangicTarihi);
        return tarih && tarih >= yilBasiTarih;
      });

      const aylikKesinti = onayli
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
        run(
          `[SubePersonelYardim_SELECT] '${IDSube}','${IDSubePersonel}','${yilBasi}','${bugun}'`,
        ),
        run(
          `[SubePersonelOzelKesinti_SELECTByIDSubePersonel] '${IDSube}','${IDSubePersonel}','${yilBasi}','${bugun}'`,
        ),
      ]);
      return {
        EklentiToplam: eklenti.reduce(
          (sum, e) => sum + num(e.BordroOdemeTutari),
          0,
        ),
        KesintiToplam: kesinti.reduce(
          (sum, k) => sum + num(k.BordroKesintiTutari),
          0,
        ),
      };
    }),

    section("pdksBugun", async () => {
      const [k] = await run(
        `[SubePersonelSaat_SelectByIDSubePersonel] '${IDSubePersonel}','${bugun}','${bugun}'`,
      );
      return { Giris: k?.Giris ?? null, Cikis: k?.Cikis ?? null };
    }),

    section("pdksAy", async () => {
      const kayitlar = await run(
        `[SubePersonelSaat_SelectByIDSubePersonel] '${IDSubePersonel}','${ymd(startOfMonth(today))}','${bugun}'`,
      );
      // Gün bazında topla (aynı güne birden fazla satır gelebilir)
      const gunler = new Map();
      for (const k of kayitlar) {
        const d = toDate(k.Tarih);
        if (!d) continue;
        const key = ymd(d);
        const x = gunler.get(key) ?? {
          Tarih: key,
          Gun: d.getDate(),
          Calisma: 0,
          Mesai: 0,
          Giris: false,
        };
        x.Calisma += sureSaat(k.ToplamSure);
        x.Mesai += sureSaat(k.MesaiSure);
        x.Giris = x.Giris || Boolean(k.Giris);
        gunler.set(key, x);
      }
      const liste = [...gunler.values()].sort((a, b) =>
        a.Tarih.localeCompare(b.Tarih),
      );
      const calisilan = liste.filter((g) => g.Calisma > 0);
      const toplam = calisilan.reduce((s, g) => s + g.Calisma, 0);
      return {
        GirisYapilanGun: liste.filter((g) => g.Giris).length,
        ToplamCalisma: yuvarla(toplam),
        OrtalamaCalisma: calisilan.length
          ? yuvarla(toplam / calisilan.length)
          : null,
        ToplamMesai: yuvarla(liste.reduce((s, g) => s + g.Mesai, 0)),
        Gunler: liste.map((g) => ({
          Tarih: g.Tarih,
          Gun: g.Gun,
          Calisma: yuvarla(g.Calisma),
          Mesai: yuvarla(g.Mesai),
        })),
      };
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
    pdksAy,
  };
}

// ---- Yönetici özeti -----------------------------------------------------

// Bugünü kapsayan izinler (kişi sayısı tekil)
function bugunIzindekiler(izinListesi, today) {
  const liste = izinListesi.filter((i) => {
    const bas = toDate(i.BaslangicTarihi);
    const bit = toDate(i.BitisTarihi) ?? bas;
    return (
      bas &&
      differenceInCalendarDays(today, bas) >= 0 &&
      differenceInCalendarDays(bit, today) >= 0
    );
  });
  return {
    Sayi: new Set(liste.map((i) => String(i.IDSubePersonel))).size,
    Liste: liste.map((i) => ({
      IDSubePersonel: String(i.IDSubePersonel),
      AdSoyad: adSoyad(i),
      Tip: String(i.Aciklama ?? ""),
      BitisTarihi: ymd(toDate(i.BitisTarihi) ?? today),
    })),
  };
}

async function yoneticiOzet(IDSube, Yil, Ay) {
  const today = new Date();
  const bugun = ymd(today);
  const birYilOnce = ymd(addYears(today, -1));
  const birYilSonra = ymd(addYears(today, 1));
  const haftaSonra = ymd(addDays(today, 7));
  const altiGunOnce = ymd(subDays(today, 6));

  // Tüm sorgular birbirinden bağımsız; hepsi aynı anda başlatılır. Birbirine bağlı
  // hesaplar (bölüm eşleme, bugün izinde, gelmeyenler) sorgulardan sonra yapılır.
  const [
    tumPersonel,
    izinListesi,
    bordroSatirlari,
    bekleyenTalepler,
    pdksKayitlari,
    pdksHafta,
  ] = await Promise.all([
    // Personel sayfasıyla aynı liste. Ham liste (pasifler dahil) giriş/çıkış
    // hareketi için tutulur; diğer tüm sayılar sadece aktif (Durum = true) personelden.
    section("personelListesi", () =>
      run(`[SubePersonel_SELECTByTarih] '${IDSube}','','',''`),
    ),

    // Prosedür başlangıç tarihi aralıkta olan izinleri döndürüyor; bugünden önce
    // başlayıp devam edenleri ve son 12 ayın istatistiğini almak için bir yıl
    // geriye, yaklaşan izinler için bir hafta ileriye bakılır.
    section("izinListesi", () =>
      run(
        `[IzinGenel_SELECTByIDSubePersonel] '${IDSube}','0','${birYilOnce}','${haftaSonra}',''`,
      ),
    ),

    section("bordro", () =>
      run(`[Bordro_SELECTByIDSube] '${IDSube}','0','${Yil}','${Ay}','',''`),
    ),

    section("bekleyenTalepler", async () => {
      const [izin, avans] = await Promise.all([
        run(
          `[SubePersonelIzinTalep_SELECT] '${IDSube}','0','${birYilOnce}','${birYilSonra}'`,
        ),
        run(
          `[SubePersonelAvansTalep_SELECT] '${IDSube}','0','${birYilOnce}','${birYilSonra}'`,
        ),
      ]);
      const bekleyenIzin = izin.filter(isPending);
      const bekleyenAvans = avans.filter(isPending);
      const tarih = (t) => {
        const d =
          toDate(t.Tarih) ??
          toDate(t.BaslangicTarihi) ??
          toDate(t.OdemeBaslangicTarihi);
        return d ? ymd(d) : null;
      };
      const Liste = [
        ...bekleyenIzin.map((t) => ({
          Tip: "izin",
          IDSubePersonel: String(t.IDSubePersonel),
          AdSoyad: adSoyad(t),
          Tarih: tarih(t),
          IzinTipi: String(t.Aciklama ?? "") || null,
          Gun: num(t.Gun),
          Tutar: null,
        })),
        ...bekleyenAvans.map((t) => ({
          Tip: "avans",
          IDSubePersonel: String(t.IDSubePersonel),
          AdSoyad: adSoyad(t),
          Tarih: tarih(t),
          IzinTipi: null,
          Gun: null,
          Tutar: num(t.Tutar),
        })),
      ]
        // Yeniden eskiye; tarihsizler sonda
        .sort((a, b) => (b.Tarih ?? "").localeCompare(a.Tarih ?? ""))
        .slice(0, 10);
      return { Izin: bekleyenIzin.length, Avans: bekleyenAvans.length, Liste };
    }),

    section("pdksBugun", () =>
      run(`[SubePersonelSaat_SelectByIDSubeBolum] '${IDSube}','0','${bugun}'`),
    ),

    // PDKS raporuyla aynı prosedür: son 7 günün tüm kayıtları
    section("pdksHafta", () =>
      run(
        `[SubePersonelSaat_SelectAll] '${IDSube}','0','0','${altiGunOnce}','${bugun}',''`,
      ),
    ),
  ]);

  const personelListesi = tumPersonel ? tumPersonel.filter(isAktif) : null;
  const personelSayisi = personelListesi ? personelListesi.length : null;

  const bolumMap = new Map(
    (tumPersonel ?? []).map((p) => [String(p.IDSubePersonel), p.BolumAdi]),
  );
  const bordro = bordroSatirlari
    ? bordroOzeti(bordroSatirlari, Yil, Ay, bolumMap)
    : null;
  const bugunIzinde = izinListesi ? bugunIzindekiler(izinListesi, today) : null;

  // Personel listesi doğum tarihi döndürmüyorsa bu bölüm null kalır
  const dogumGunleri =
    personelListesi && personelListesi.some((p) => "DogumTarihi" in p)
      ? personelListesi
          .map((p) => ({ p, dogum: toDate(p.DogumTarihi) }))
          .filter(({ dogum }) => dogum)
          .map(({ p, dogum }) => ({
            IDSubePersonel: String(p.IDSubePersonel),
            AdSoyad: adSoyad(p),
            Tarih: ymd(dogum),
            KalanGun: dogumGunuKalan(dogum, today),
          }))
          .filter((d) => d.KalanGun <= 30)
          .sort((a, b) => a.KalanGun - b.KalanGun)
      : null;

  let pdksBugun = null;
  if (pdksKayitlari) {
    // Aynı kişinin birden fazla satırı olabilir; kişi bazında tekilleştirilir
    const kisiler = new Map();
    // Kişi bazında bugünkü çalışma ve mesai saatleri
    const sureler = new Map();
    for (const k of pdksKayitlari) {
      const key0 = String(k.IDSubePersonel);
      const onceki0 = sureler.get(key0) ?? { calisma: 0, mesai: 0 };
      sureler.set(key0, {
        calisma: onceki0.calisma + sureSaat(k.ToplamSure),
        mesai: onceki0.mesai + sureSaat(k.MesaiSure),
      });
    }
    for (const k of pdksKayitlari) {
      if (!k.Giris) continue;
      const key = String(k.IDSubePersonel);
      const onceki = kisiler.get(key);
      kisiler.set(key, {
        IDSubePersonel: key,
        AdSoyad: adSoyad(k),
        Giris: onceki?.Giris ?? String(k.Giris),
        Cikis: onceki?.Cikis || k.Cikis || null,
        KonumDisi: Boolean(onceki?.KonumDisi || k.KonumDisi === true),
      });
    }
    const gelenler = [...kisiler.values()];
    const izindeIdler = new Set(
      (bugunIzinde?.Liste ?? []).map((i) => i.IDSubePersonel),
    );
    const Gelen = gelenler.length;
    const konumDisi = gelenler.filter((k) => k.KonumDisi);
    const cikisYok = gelenler.filter((k) => !k.Cikis);

    const calisanlar = [...sureler.values()].filter((x) => x.calisma > 0);
    const mesaiYapanlar = [...sureler.values()].filter((x) => x.mesai > 0);

    pdksBugun = {
      Gelen,
      /** Süresi hesaplanmış (çıkış yapmış) kişilerin ortalama çalışma saati */
      OrtalamaCalisma: calisanlar.length
        ? yuvarla(
            calisanlar.reduce((s, x) => s + x.calisma, 0) / calisanlar.length,
          )
        : null,
      SuresiHesaplanan: calisanlar.length,
      ToplamMesai: yuvarla(mesaiYapanlar.reduce((s, x) => s + x.mesai, 0)),
      MesaiYapan: mesaiYapanlar.length,
      // İzinde olanlar gelmeyen sayılmaz
      Gelmeyen:
        personelSayisi === null
          ? null
          : Math.max(0, personelSayisi - Gelen - (bugunIzinde?.Sayi ?? 0)),
      GelmeyenListe: personelListesi
        ? personelListesi
            .filter((p) => {
              const key = String(p.IDSubePersonel);
              return !kisiler.has(key) && !izindeIdler.has(key);
            })
            .map((p) => ({
              IDSubePersonel: String(p.IDSubePersonel),
              AdSoyad: adSoyad(p),
            }))
            .sort((a, b) => a.AdSoyad.localeCompare(b.AdSoyad, "tr"))
        : null,
      KonumDisi: konumDisi.length,
      KonumDisiListe: konumDisi.map(({ IDSubePersonel, AdSoyad, Giris }) => ({
        IDSubePersonel,
        AdSoyad,
        Giris,
      })),
      CikisYok: cikisYok.length,
      CikisYokListe: cikisYok.map(({ IDSubePersonel, AdSoyad, Giris }) => ({
        IDSubePersonel,
        AdSoyad,
        Giris,
      })),
    };
  }

  return {
    personelSayisi,
    personelDagilim: personelListesi ? personelDagilimi(personelListesi) : null,
    bugunIzinde,
    bekleyenTalepler,
    bordro,
    pdksBugun,
    dogumGunleri,
    isYildonumleri: personelListesi
      ? isYildonumleri(personelListesi, today)
      : null,
    personelHareket: tumPersonel
      ? personelHareketi(tumPersonel, Yil, Ay)
      : null,
    ucret: personelListesi ? ucretOzeti(personelListesi) : null,
    demografi: personelListesi ? demografi(personelListesi, today) : null,
    izin: izinListesi ? izinOzeti(izinListesi, today) : null,
    hareketTrendi: tumPersonel
      ? personelHareketTrendi(tumPersonel, today)
      : null,
    devamTrendi: pdksHafta
      ? devamTrendi(pdksHafta, izinListesi ?? [], personelSayisi, today)
      : null,
  };
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
        isPersonel
          ? user.IDSubePersonel
          : (payload.IDSubePersonel ?? user.IDSubePersonel),
      );
      if (!IDSubePersonel) {
        return fail(
          session.isMobile,
          "Hesabınıza bağlı bir personel kaydı bulunamadı.",
          400,
        );
      }
      const [personel] = await run(
        `[SubePersonel_SELECTByIDSubePersonel] '${IDSubePersonel}'`,
      );
      if (!personel) {
        return fail(session.isMobile, "Personel bilgisi bulunamadı.", 404);
      }
      return ok(session.isMobile, await personelOzet(personel, IDSubePersonel));
    }

    if (type === "YONETICI_OZET") {
      if (isPersonel) {
        return fail(
          session.isMobile,
          "Bu özeti görüntüleme yetkiniz yok.",
          403,
          "FORBIDDEN",
        );
      }
      const IDSube = id(payload.IDSube ?? user.IDSube);
      if (!IDSube) {
        return fail(session.isMobile, "Lütfen önce şube seçimi yapın.", 400);
      }
      const today = new Date();
      const Yil = id(payload.Yil ?? user.Yil) ?? format(today, "yyyy");
      const Ay = String(
        id(payload.Ay ?? user.Ay) ?? format(today, "MM"),
      ).padStart(2, "0");
      return ok(session.isMobile, await yoneticiOzet(IDSube, Yil, Ay));
    }

    return fail(session.isMobile, "Geçersiz sorgu tipi", 400);
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
