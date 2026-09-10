import { format } from "date-fns";

export function formatDate(
  value: string | Date | null | undefined,
  pattern = "dd.MM.yyyy",
) {
  if (!value) return "-";

  return format(new Date(value), pattern);
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
