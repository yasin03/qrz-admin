import { format, isValid, parse } from "date-fns";
import type { ColumnDef, Row } from "@tanstack/react-table";

import { formatMoney } from "@/lib/format";
import { normalize } from "@/lib/utils";

/** "OSMAN  YILMAZ " → "OSMAN YILMAZ" */
export const temizAdSoyad = (value?: string | null) =>
  (value ?? "").replace(/\s+/g, " ").trim();

const karsilastir = (a: number, b: number) => (a > b ? 1 : a < b ? -1 : 0);

/** "dd.MM.yyyy" metnini Date'e çevirir; boş/geçersizse null */
export function tarihMetniParse(value?: string | null) {
  if (!value) return null;
  const date = parse(value, "dd.MM.yyyy", new Date());
  return isValid(date) ? date : null;
}

/**
 * ISO tarihin ("2026-01-08T00:00:00.000Z") UTC gün/ay/yılından yerel Date
 * üretir — veritabanı yerel tarihi "Z" ile gönderdiği için saat dilimi
 * kayması olmasın. Boş/geçersizse null.
 */
export function isoTarihParse(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function isoTarihGosterim(value?: string | null) {
  const date = isoTarihParse(value);
  return date ? format(date, "dd.MM.yyyy") : "-";
}

export const tarihGosterim = (yyyyMMdd: string) =>
  format(parse(yyyyMMdd, "yyyy-MM-dd", new Date()), "dd.MM.yyyy");

export const tarihAraligiMetni = (baslangic: string, bitis: string) =>
  `${tarihGosterim(baslangic)} - ${tarihGosterim(bitis)}`;

/** Yılın ilk ve son günü ("yyyy-MM-dd") */
export const yilAraligi = (yil: string | number) => ({
  BaslangicTarihi: `${yil}-01-01`,
  BitisTarihi: `${yil}-12-31`,
});

// ---- Sıralama fonksiyonları ----------------------------------------------

/** Türkçe alfabeye göre metin sıralaması */
export function trMetinSort<T>(a: Row<T>, b: Row<T>, columnId: string) {
  return String(a.getValue(columnId) ?? "").localeCompare(
    String(b.getValue(columnId) ?? ""),
    "tr",
  );
}

/** "dd.MM.yyyy" metin tarih sıralaması; boş değerler en başta */
export function tarihMetniSort<T>(a: Row<T>, b: Row<T>, columnId: string) {
  const zaman = (row: Row<T>) =>
    tarihMetniParse(row.getValue<string | null>(columnId))?.getTime() ??
    -Infinity;
  return karsilastir(zaman(a), zaman(b));
}

// ---- Arama ---------------------------------------------------------------

/** Türkçe karakter duyarsız arama; süzülmüş veri hem tabloya hem export'a gider */
export function raporAra<T>(
  data: T[],
  aranan: string,
  alanlar: (row: T) => (string | null | undefined)[],
) {
  const search = normalize(aranan.trim());
  if (!search) return data;
  return data.filter((row) =>
    alanlar(row).some((value) => value && normalize(value).includes(search)),
  );
}

// ---- Ortak kolonlar ------------------------------------------------------


export function subeKoduKolonu<
  T extends { SubeKodu: string | null },
>(): ColumnDef<T> {
  return {
    accessorKey: "SubeKodu",
    header: "Şube Kodu",
    size: 110,
    cell: ({ row }) => row.original.SubeKodu || "-",
  };
}

/** Ad soyad üstte, TC altta gri; sıralama ad soyada göre */
export function personelKolonu<
  T extends { AdSoyad: string | null; TcKimlikNo: string | null },
>(): ColumnDef<T> {
  return {
    id: "AdSoyad",
    header: "Ad Soyad / TC",
    meta: { label: "Ad Soyad / TC" },
    accessorFn: (row) => temizAdSoyad(row.AdSoyad),
    sortingFn: trMetinSort,
    cell: ({ row }) => (
      <div className="min-w-0">
        <div className="font-medium">{temizAdSoyad(row.original.AdSoyad)}</div>
        <div className="text-muted-foreground text-xs">
          {row.original.TcKimlikNo || "-"}
        </div>
      </div>
    ),
  };
}

/** Sağa hizalı sayı/para kolonu; sıralama Number(...) üzerinden */
export function sayiKolonu<T>(
  key: keyof T & string,
  header: string,
  options: { money?: boolean; size?: number } = {},
): ColumnDef<T> {
  return {
    id: key,
    header,
    size: options.size,
    meta: { align: "right" },
    accessorFn: (row) => Number(row[key] ?? 0),
    cell: ({ getValue }) => {
      const value = getValue<number>();
      return options.money ? formatMoney(value) : value.toLocaleString("tr-TR");
    },
  };
}

/** ISO tarih kolonu: gösterim dd.MM.yyyy, sıralama ISO string üzerinden */
export function isoTarihKolonu<T>(
  key: keyof T & string,
  header: string,
): ColumnDef<T> {
  return {
    id: key,
    header,
    accessorFn: (row) => String(row[key] ?? ""),
    cell: ({ getValue }) => isoTarihGosterim(getValue<string>()),
  };
}

/** Uzun metinler (açıklama, izin türü) alt satıra kaysın */
export const SARILAN_HUCRE = {
  cellClassName: "whitespace-normal break-words",
};
