/** 15 → "%15", 15.5 → "%15,5" */
export function formatYuzde(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "";
  return `%${Number(value).toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`;
}
