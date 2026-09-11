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

// lib/format.ts içine ekleyin
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
