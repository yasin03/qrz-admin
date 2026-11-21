"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { EtiketSayi, YoneticiDashboard } from "@/modules/bordro/types/dashboard";
import { formatMoney } from "@/lib/format";

type Bordro = NonNullable<YoneticiDashboard["bordro"]>;

// Kategorik palet (sabit sıra, döngü yok). Açık/koyu tema ayrı seçilmiş adımlar;
// sıra renk körlüğü ayrımını korur, yeniden sıralanmamalı.
const KATEGORIK = [
  { light: "#2a78d6", dark: "#3987e5" }, // mavi
  { light: "#eb6834", dark: "#d95926" }, // turuncu
  { light: "#1baf7a", dark: "#199e70" }, // su yeşili
  { light: "#eda100", dark: "#c98500" }, // sarı
  { light: "#e87ba4", dark: "#d55181" }, // pembe
  { light: "#008300", dark: "#0ca30c" }, // yeşil
] as const;

const NOTR = { light: "#a3a29b", dark: "#6b6a64" };

const yuzde = (deger: number, toplam: number) =>
  toplam > 0 ? `%${Math.round((deger / toplam) * 100)}` : "%0";

const tl = (value: number) => `${formatMoney(value)} ₺`;

// Donut ortası için kısa tutar: "1,2 Mn"
const kisaTutar = new Intl.NumberFormat("tr-TR", { notation: "compact", maximumFractionDigits: 1 });

const notrMu = (etiket: string) => etiket === "Belirtilmemiş" || etiket === "Diğer";

// ---- Tek serili dağılım (yaş, kıdem, bölüm) -----------------------------

// Tooltip satırı: renk işareti + seri adı + biçimlendirilmiş değer
function TooltipSatir({ renk, label, deger }: { renk?: string; label: string; deger: string }) {
  return (
    <div className="flex w-full items-center gap-2">
      <span className="size-2.5 shrink-0 rounded-xs" style={{ backgroundColor: renk }} />
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto font-medium tabular-nums text-foreground">{deger}</span>
    </div>
  );
}

export function DagilimBar({
  data,
  yatay,
  label = "Personel",
  bicim,
}: {
  data: EtiketSayi[];
  yatay?: boolean;
  /** Tooltip'teki seri adı */
  label?: string;
  /** Değer biçimi (örn. para); verilmezse sayı olduğu gibi */
  bicim?: (n: number) => string;
}) {
  const tekSeriConfig = { Sayi: { label, theme: KATEGORIK[0] } } satisfies ChartConfig;
  const tooltip = (
    <ChartTooltipContent
      formatter={
        bicim
          ? (value, _name, item) => (
              <TooltipSatir renk={item.color} label={label} deger={bicim(Number(value))} />
            )
          : undefined
      }
    />
  );

  if (yatay) {
    return (
      <ChartContainer
        config={tekSeriConfig}
        className="aspect-auto w-full"
        style={{ height: Math.max(160, data.length * 32 + 16) }}
      >
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 0, right: bicim ? 120 : 32, top: 0, bottom: 0 }}
        >
          <CartesianGrid horizontal={false} strokeDasharray="3 3" />
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="Etiket"
            tickLine={false}
            axisLine={false}
            width={120}
            tick={{ fontSize: 12 }}
            tickFormatter={(v: string) => (v.length > 18 ? `${v.slice(0, 17)}…` : v)}
          />
          <ChartTooltip cursor={{ fill: "var(--muted)", opacity: 0.5 }} content={tooltip} />
          <Bar
            dataKey="Sayi"
            fill="var(--color-Sayi)"
            radius={[0, 4, 4, 0]}
            maxBarSize={20}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="Sayi"
              position="right"
              formatter={bicim ? (v: unknown) => bicim(Number(v)) : undefined}
              className="fill-foreground text-xs font-semibold tabular-nums"
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer config={tekSeriConfig} className="aspect-auto h-56 w-full">
      <BarChart data={data} margin={{ left: 0, right: 0, top: 20, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="Etiket"
          tickLine={false}
          axisLine={false}
          interval={0}
          tick={{ fontSize: 11 }}
        />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} tick={{ fontSize: 12 }} />
        <ChartTooltip cursor={{ fill: "var(--muted)", opacity: 0.5 }} content={tooltip} />
        <Bar
          dataKey="Sayi"
          fill="var(--color-Sayi)"
          radius={[4, 4, 0, 0]}
          maxBarSize={40}
          isAnimationActive={false}
        >
          <LabelList
            dataKey="Sayi"
            position="top"
            formatter={bicim ? (v: unknown) => bicim(Number(v)) : undefined}
            className="fill-foreground text-xs font-semibold tabular-nums"
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

// ---- Donut + legend listesi ----------------------------------------------

type Dilim = { key: string; label: string; value: number; deger?: string };

function Donut({
  dilimler,
  config,
  merkez,
  merkezAlt,
  boyut = "h-36",
}: {
  dilimler: Dilim[];
  config: ChartConfig;
  merkez: string;
  merkezAlt: string;
  boyut?: string;
}) {
  const toplam = dilimler.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <ChartContainer config={config} className={`aspect-square shrink-0 ${boyut}`}>
        <PieChart>
          <ChartTooltip cursor={false} content={<ChartTooltipContent nameKey="key" hideLabel />} />
          <Pie
            data={dilimler}
            dataKey="value"
            nameKey="key"
            innerRadius="62%"
            outerRadius="100%"
            stroke="var(--card)"
            strokeWidth={2}
            isAnimationActive={false}
          >
            {dilimler.map((d) => (
              <Cell key={d.key} fill={`var(--color-${d.key})`} />
            ))}
          </Pie>
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-foreground text-lg font-bold tabular-nums"
          >
            {merkez}
          </text>
          <text x="50%" y="50%" dy={18} textAnchor="middle" className="fill-muted-foreground text-xs">
            {merkezAlt}
          </text>
        </PieChart>
      </ChartContainer>

      {/* Kimlik işarette; metin nötr renkte */}
      <ul className="w-full min-w-0 space-y-1.5">
        {dilimler.map((d) => (
          <li key={d.key} className="flex items-center gap-2 text-sm">
            <span
              className="size-2.5 shrink-0 rounded-xs"
              style={{ backgroundColor: `var(--color-${d.key})` }}
            />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">{d.label}</span>
            <span className="font-semibold tabular-nums text-foreground">
              {d.deger ?? d.value}
            </span>
            <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
              {yuzde(d.value, toplam)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Küçük kategorik dağılım (ücret tipi, çalışma durumu, medeni durum).
// En fazla 3 renkli dilim; fazlası ve "Belirtilmemiş" nötr griyle birleşir.
export function MiniDonut({
  data,
  renkSayisi = 3,
  birim = "personel",
  boyut = "h-28",
}: {
  data: EtiketSayi[];
  /** En fazla bu kadar renkli dilim (palet sırasıyla), kalanı nötr gri */
  renkSayisi?: number;
  /** Ortadaki toplamın altındaki birim */
  birim?: string;
  boyut?: string;
}) {
  const renkli = data.filter((d) => !notrMu(d.Etiket)).slice(0, Math.min(renkSayisi, KATEGORIK.length));
  const kalan = data
    .filter((d) => !renkli.includes(d))
    .reduce((s, d) => s + d.Sayi, 0);

  const config: ChartConfig = {};
  const dilimler: Dilim[] = renkli.map((d, i) => {
    const key = `k${i}`;
    config[key] = { label: d.Etiket, theme: KATEGORIK[i] };
    return { key, label: d.Etiket, value: d.Sayi };
  });
  if (kalan > 0) {
    config.diger = { label: "Diğer / Belirtilmemiş", theme: NOTR };
    dilimler.push({ key: "diger", label: "Diğer / Belirtilmemiş", value: kalan });
  }

  const toplam = dilimler.reduce((s, d) => s + d.value, 0);
  return (
    <Donut
      dilimler={dilimler}
      config={config}
      merkez={String(Math.round(toplam))}
      merkezAlt={birim}
      boyut={boyut}
    />
  );
}

// ---- Bordro --------------------------------------------------------------

// Durum renkleri ayrılmış (status) paletten; etiketle birlikte gösterilir
const durumConfig = {
  hesaplanmadi: { label: "Hesaplanmadı", theme: NOTR },
  bekliyor: { label: "Onay bekliyor", theme: { light: "#fab219", dark: "#fab219" } },
  onayli: { label: "Onaylı", theme: { light: "#0ca30c", dark: "#0ca30c" } },
} satisfies ChartConfig;

export function BordroDurumGrafigi({ bordro }: { bordro: Bordro }) {
  const dilimler: Dilim[] = [
    { key: "hesaplanmadi", label: durumConfig.hesaplanmadi.label, value: bordro.Hesaplanmadi },
    { key: "bekliyor", label: durumConfig.bekliyor.label, value: bordro.OnayBekleyen },
    { key: "onayli", label: durumConfig.onayli.label, value: bordro.Onayli },
  ].filter((d) => d.value > 0);

  return (
    <Donut
      dilimler={dilimler}
      config={durumConfig}
      merkez={String(bordro.Toplam)}
      merkezAlt="bordro"
    />
  );
}

const maliyetConfig = {
  net: { label: "Net ödenen", theme: KATEGORIK[0] },
  sgkIsveren: { label: "SGK işveren", theme: KATEGORIK[1] },
  sgkIsci: { label: "SGK işçi", theme: KATEGORIK[2] },
  gv: { label: "Gelir vergisi", theme: KATEGORIK[3] },
  dv: { label: "Damga vergisi", theme: KATEGORIK[4] },
  diger: { label: "Diğer kesintiler", theme: KATEGORIK[5] },
} satisfies ChartConfig;

/** Hesaplanmış bordroların maliyet kalemleri */
export function MaliyetKirilimi({ bordro }: { bordro: Bordro }) {
  const kalemler: [keyof typeof maliyetConfig, number][] = [
    ["net", bordro.NetOdenen],
    ["sgkIsveren", bordro.SgkIsverenPrimi],
    ["sgkIsci", bordro.SgkIsciPrimi],
    ["gv", bordro.GelirVergisi],
    ["dv", bordro.DamgaVergisi],
    ["diger", bordro.DigerKesinti],
  ];
  const dilimler: Dilim[] = kalemler
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({ key, label: maliyetConfig[key].label, value, deger: tl(value) }));

  if (dilimler.length === 0) {
    return <p className="py-8 text-center text-xs text-muted-foreground">Tutar bilgisi yok</p>;
  }
  const toplam = dilimler.reduce((s, d) => s + d.value, 0);

  return (
    <Donut
      dilimler={dilimler}
      config={maliyetConfig}
      merkez={kisaTutar.format(toplam)}
      merkezAlt="₺ toplam"
      boyut="h-40"
    />
  );
}

// ---- Personel: yıllık izin halkası ---------------------------------------

const izinConfig = {
  kullanilan: { label: "Kullanılan", theme: KATEGORIK[0] },
  kalan: { label: "Kalan", theme: NOTR },
} satisfies ChartConfig;

/** Yıllık izin hakkının kullanılan / kalan oranı; ortada kalan gün */
export function IzinHalkasi({ kullanilan, kalan }: { kullanilan: number; kalan: number }) {
  const dilimler = [
    { key: "kullanilan", value: Math.max(0, kullanilan) },
    { key: "kalan", value: Math.max(0, kalan) },
  ].filter((d) => d.value > 0);

  return (
    <ChartContainer config={izinConfig} className="aspect-square h-24 shrink-0">
      <PieChart>
        <ChartTooltip cursor={false} content={<ChartTooltipContent nameKey="key" hideLabel />} />
        <Pie
          data={dilimler.length ? dilimler : [{ key: "kalan", value: 1 }]}
          dataKey="value"
          nameKey="key"
          innerRadius="70%"
          outerRadius="100%"
          startAngle={90}
          endAngle={-270}
          stroke="var(--card)"
          strokeWidth={2}
          isAnimationActive={false}
        >
          {(dilimler.length ? dilimler : [{ key: "kalan" }]).map((d) => (
            <Cell key={d.key} fill={`var(--color-${d.key})`} />
          ))}
        </Pie>
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-foreground text-base font-bold tabular-nums"
        >
          {kalan}
        </text>
        <text x="50%" y="50%" dy={14} textAnchor="middle" className="fill-muted-foreground text-[10px]">
          gün kaldı
        </text>
      </PieChart>
    </ChartContainer>
  );
}

// ---- Çok serili sütun grafiği (trendler) ----------------------------------

export type Seri = { key: string; label: string; theme?: { light: string; dark: string } };

/**
 * Zaman serisi / kategori için çok serili sütun grafiği.
 * Seri renkleri verilmezse kategorik palet sırasıyla atanır.
 */
export function SeriBar<T extends { Etiket: string }>({
  data,
  seriler,
  stacked,
  yukseklik = "h-60",
  etiketGoster,
}: {
  data: T[];
  seriler: Seri[];
  stacked?: boolean;
  yukseklik?: string;
  /** Yığılmış sütunda toplamı en üste yaz */
  etiketGoster?: boolean;
}) {
  const config: ChartConfig = Object.fromEntries(
    seriler.map((s, i) => [s.key, { label: s.label, theme: s.theme ?? KATEGORIK[i] }]),
  );
  const toplam = (row: T) =>
    seriler.reduce((t, s) => t + Number((row as Record<string, unknown>)[s.key] ?? 0), 0);

  return (
    <ChartContainer config={config} className={`aspect-auto w-full ${yukseklik}`}>
      <BarChart data={data} margin={{ left: 0, right: 0, top: etiketGoster ? 20 : 8, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="Etiket" tickLine={false} axisLine={false} interval={0} tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} tick={{ fontSize: 12 }} />
        <ChartTooltip cursor={{ fill: "var(--muted)", opacity: 0.5 }} content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        {seriler.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            stackId={stacked ? "yigin" : undefined}
            fill={`var(--color-${s.key})`}
            stroke="var(--card)"
            strokeWidth={stacked ? 2 : 0}
            radius={!stacked || i === seriler.length - 1 ? [4, 4, 0, 0] : 0}
            maxBarSize={stacked ? 40 : 18}
            isAnimationActive={false}
          >
            {etiketGoster && stacked && i === seriler.length - 1 ? (
              <LabelList
                content={({ x, y, width, index }) => {
                  const row = data[index ?? -1];
                  if (!row) return null;
                  return (
                    <text
                      x={Number(x) + Number(width) / 2}
                      y={Number(y) - 6}
                      textAnchor="middle"
                      className="fill-foreground text-xs font-semibold tabular-nums"
                    >
                      {toplam(row)}
                    </text>
                  );
                }}
              />
            ) : null}
          </Bar>
        ))}
      </BarChart>
    </ChartContainer>
  );
}
