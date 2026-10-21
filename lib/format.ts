import { format, parse } from "date-fns";

export function formatDate(
  value: string | Date | null | undefined,
  pattern = "dd.MM.yyyy",
) {
  if (!value) return "-";

  if (typeof value === "string") {
    const localDateString = value.replace("Z", "");
    const date = parse(
      localDateString,
      "yyyy-MM-dd'T'HH:mm:ss.SSS",
      new Date(),
    );

    return format(date, pattern);
  }

  return format(value, pattern);
}

/**
 * Saat/süre değerini "HH:mm"e çevirir; hiçbir formatta hata fırlatmaz.
 * "08:30", "08:30:00", "1970-01-01T08:30:00.000Z", "1970-01-01T08:30:00Z" →
 * "08:30". ISO değerlerde saat, formatDate'teki gibi olduğu gibi (Z'siz,
 * timezone çevrimi yapılmadan) alınır. Tanınmayan değerde "" döner.
 */
export function formatSaat(value: string | null | undefined) {
  if (!value) return "";
  const match = String(value).match(/(?:T|^)(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : "";
}

export const formatMoney = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === "") {
    return "0,00";
  }

  return Number(value).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export function clampNumberString(
  value: string,
  min: number,
  max: number,
): string {
  if (!value) return value;
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return value;
  if (numeric > max) return String(max);
  if (numeric < min && value.length >= String(min).length) return String(min);
  return value;
}
