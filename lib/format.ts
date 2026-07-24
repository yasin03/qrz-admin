import { format } from "date-fns";

export function formatDate(
  value: string | Date | null | undefined,
  pattern = "dd.MM.yyyy"
) {
  if (!value) return "-";

  return format(new Date(value), pattern);
}