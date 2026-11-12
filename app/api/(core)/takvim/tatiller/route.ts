import { NextResponse, type NextRequest } from "next/server";

import { getSabitResmiTatiller } from "@/modules/core/lib/takvim-gunleri";
import type { TakvimGunu } from "@/modules/core/types/takvim";

// Ücretsiz, anahtarsız tatil servisi: https://date.nager.at
const NAGER_URL = "https://date.nager.at/api/v3/PublicHolidays";
const ONE_DAY = 60 * 60 * 24;

type NagerHoliday = { date: string; localName: string };

const TAHMINI = /\s*\(Tentative Date\)\s*/i;

function oncekiGun(date: string) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function mapNager(year: number, list: NagerHoliday[]): TakvimGunu[] {
  const result: TakvimGunu[] = [];

  for (const h of list) {
    const tahmini = TAHMINI.test(h.localName);
    const name = h.localName.replace(TAHMINI, "").trim();
    result.push({ date: h.date, name, type: "resmi", tahmini });

    // Ramazan ve Kurban bayramı arifeleri yarım gün idari izin.
    const bayram = name.match(/^(Ramazan|Kurban) Bayramı 1\. Gün$/);
    if (bayram) {
      result.push({
        date: oncekiGun(h.date),
        name: `${bayram[1]} Bayramı Arifesi (yarım gün)`,
        type: "arife",
        tahmini,
      });
    }
  }

  // Cumhuriyet Bayramı arifesi Nager'da yok.
  result.push(...getSabitResmiTatiller(year).filter((t) => t.type === "arife"));

  return result.sort((a, b) => a.date.localeCompare(b.date));
}

export async function GET(request: NextRequest) {
  const yearParam = Number(request.nextUrl.searchParams.get("year"));
  const year = Number.isInteger(yearParam) && yearParam >= 1975 && yearParam <= 2100
    ? yearParam
    : new Date().getFullYear();

  try {
    const res = await fetch(`${NAGER_URL}/${year}/TR`, {
      next: { revalidate: ONE_DAY },
    });
    if (!res.ok) throw new Error(`Nager.Date ${res.status}`);
    const data = (await res.json()) as NagerHoliday[];

    return NextResponse.json(
      { year, source: "nager", gunler: mapNager(year, data) },
      { headers: { "Cache-Control": `public, max-age=${ONE_DAY}` } },
    );
  } catch (error) {
    console.error("Tatil servisi alınamadı:", error);
    // Servis yoksa en azından sabit tarihli tatilleri dön (dinî bayramlar eksik kalır).
    return NextResponse.json({
      year,
      source: "fallback",
      gunler: getSabitResmiTatiller(year),
    });
  }
}
