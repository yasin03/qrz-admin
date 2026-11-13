export type PuantajDurumu = "eksik" | "tamam";

/**
 * Seçili ayın gün sayısı (Şubat 28/29, Nisan 30 ...). Ay "3" ya da "03"
 * olabilir. Yıl/ay geçersizse null döner.
 */
export function ayGunSayisi(
  yil: string | number | null | undefined,
  ay: string | number | null | undefined,
): number | null {
  const y = Number(yil);
  const a = Number(ay);
  if (!Number.isInteger(y) || y <= 0 || !Number.isInteger(a) || a < 1 || a > 12) {
    return null;
  }
  return new Date(y, a, 0).getDate();
}

/**
 * Satırın aylık puantajı tamamlanmış mı? Sadece G1..G{gunSayisi} bakılır.
 * null / undefined / boş-whitespace string boş sayılır; 0 dolu sayılır.
 * gunSayisi yoksa (geçersiz dönem) null döner → renk yok.
 */
export function getPuantajDurumu(
  row: Record<string, unknown>,
  gunSayisi: number | null,
): PuantajDurumu | null {
  if (!gunSayisi) return null;

  for (let gun = 1; gun <= gunSayisi; gun++) {
    const value = row[`G${gun}`];
    if (value === null || value === undefined) return "eksik";
    if (typeof value === "string" && value.trim() === "") return "eksik";
  }
  return "tamam";
}
