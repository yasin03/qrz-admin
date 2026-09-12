import { HAFTA_DATA } from "@/constants/data";

export type PuantajBadge = {
  label: string;
  className: string;
};

export function getPuantajBadge(
  value: string | null | undefined,
): PuantajBadge | null {
  const code = value?.trim();
  if (!code) return null;

  if (code === "HT") {
    return {
      label: "HT",
      className: "bg-red-50 text-red-600 border border-red-100",
    };
  }
  if (code === "GT") {
    return {
      label: "GT",
      className: "bg-violet-50 text-violet-600 border border-violet-100",
    };
  }

  const izinKodlari = ["YI", "CI", "EI", "DI", "MI", "SI", "GI", "SÜ"];
  if (izinKodlari.includes(code)) {
    return {
      label: code,
      className: "bg-blue-50 text-blue-600 border border-blue-100",
    };
  }

  if (code === "01") {
    return {
      label: code,
      className: "bg-orange-50 text-orange-600 border border-orange-100",
    };
  }
  if (code === "15") {
    return {
      label: code,
      className: "bg-rose-50 text-rose-600 border border-rose-100",
    };
  }

  const ucretsizIzinKodlari = ["19", "20", "21", "28", "29"];
  if (ucretsizIzinKodlari.includes(code)) {
    return {
      label: code,
      className: "bg-amber-50 text-amber-600 border border-amber-100",
    };
  }

  return {
    label: code,
    className: "bg-gray-50 text-gray-600 border border-gray-100",
  };
}

export function getHaftaBilgisi(yil: number, ay: number, gunNo: number) {
  const tarih = new Date(yil, ay - 1, gunNo);
  const jsGun = tarih.getDay(); // Pazar=0 ... Cumartesi=6
  const haftaNo = jsGun === 0 ? 7 : jsGun; // Pazartesi=1 ... Pazar=7
  const hafta = HAFTA_DATA.find((item) => Number(item.value) === haftaNo);
  return {
    isWeekend: hafta?.isWeekend ?? false,
    shortDay: hafta?.shortTr ?? "",
    haftaNo,
  };
}
