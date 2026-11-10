"use client";

import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  Rectangle,
  XAxis,
  YAxis,
  type BarShapeProps,
} from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "../ui/chart";
import { Skeleton } from "../ui/skeleton";
import type { YoneticiDashboard } from "@/types/dashboard";

type Dagilim = NonNullable<YoneticiDashboard["personelDagilim"]>;

// Cinsiyet her iki grafikte aynı renkte (renk varlığı izler, sırayı değil).
// Erkek/kadın çifti renk körlüğü kontrolünden açık ve koyu temada geçti; pembe
// açık zeminde 3:1'in altında kaldığı için sayılar grafikte metin olarak da yazılı.
const chartConfig = {
  Erkek: { label: "Erkek", theme: { light: "#2a78d6", dark: "#3987e5" } },
  Kadin: { label: "Kadın", theme: { light: "#e87ba4", dark: "#d55181" } },
  Belirtilmemis: { label: "Belirtilmemiş", theme: { light: "#a3a29b", dark: "#6b6a64" } },
} satisfies ChartConfig;

type CinsiyetKey = keyof typeof chartConfig;

const yuzde = (deger: number, toplam: number) =>
  toplam > 0 ? `%${Math.round((deger / toplam) * 100)}` : "%0";

export function GrafikKart({
  title,
  sub,
  className,
  children,
}: {
  title: string;
  sub?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`flex flex-col rounded-xl border border-border bg-card ${className ?? ""}`}
    >
      <header className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {sub ? <p className="text-xs text-muted-foreground">{sub}</p> : null}
      </header>
      <div className="min-h-0 flex-1 p-4">{children}</div>
    </section>
  );
}

function CinsiyetGrafigi({ dagilim }: { dagilim: Dagilim }) {
  const dilimler = (Object.keys(chartConfig) as CinsiyetKey[])
    .map((key) => ({ key, value: dagilim[key] }))
    .filter((d) => d.value > 0);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row lg:flex-col">
      <ChartContainer config={chartConfig} className="aspect-square h-44 shrink-0">
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent nameKey="key" hideLabel />}
          />
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
            className="fill-foreground text-2xl font-bold tabular-nums"
          >
            {dagilim.Toplam}
          </text>
          <text
            x="50%"
            y="50%"
            dy={20}
            textAnchor="middle"
            className="fill-muted-foreground text-xs"
          >
            personel
          </text>
        </PieChart>
      </ChartContainer>

      {/* Legend + değerler: kimlik renkte değil sadece işarette; metin nötr. */}
      <ul className="w-full space-y-2">
        {dilimler.map((d) => (
          <li key={d.key} className="flex items-center gap-2 text-sm">
            <span
              className="size-2.5 shrink-0 rounded-[2px]"
              style={{ backgroundColor: `var(--color-${d.key})` }}
            />
            <span className="flex-1 text-muted-foreground">
              {chartConfig[d.key].label}
            </span>
            <span className="font-semibold tabular-nums text-foreground">{d.value}</span>
            <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
              {yuzde(d.value, dagilim.Toplam)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function GrupGrafigi({ dagilim }: { dagilim: Dagilim }) {
  // Hiç kaydı olmayan seri legend'da boş yer kaplamasın
  const seriler = (Object.keys(chartConfig) as CinsiyetKey[]).filter(
    (key) => dagilim[key] > 0,
  );
  // Her sütunun en üstteki dolu segmenti: köşesi yuvarlanır, toplam üstüne
  // yazılır (örn. kadını olmayan grupta erkek segmenti).
  const ustSeri = (row: Dagilim["Gruplar"][number]) =>
    [...seriler].reverse().find((key) => row[key] > 0);

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
      <BarChart
        data={dagilim.Gruplar}
        margin={{ left: 0, right: 0, top: 20, bottom: 0 }}
        barCategoryGap="20%"
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="Grup"
          type="category"
          tickLine={false}
          axisLine={false}
          interval={0}
          tick={{ fontSize: 12 }}
          // Uzun grup adları sütunlara sığmazsa kesilir; tam ad tooltip'te
          tickFormatter={(value: string) =>
            value.length > 16 ? `${value.slice(0, 15)}…` : value
          }
        />
        <YAxis
          type="number"
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          width={32}
          tick={{ fontSize: 12 }}
        />
        <ChartTooltip
          cursor={{ fill: "var(--muted)", opacity: 0.5 }}
          content={<ChartTooltipContent />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        {seriler.map((key) => (
          <Bar
            key={key}
            dataKey={key}
            stackId="cinsiyet"
            fill={`var(--color-${key})`}
            stroke="var(--card)"
            strokeWidth={2}
            maxBarSize={48}
            isAnimationActive={false}
            shape={(props: BarShapeProps) => (
              <Rectangle
                {...props}
                radius={
                  ustSeri(props.payload as Dagilim["Gruplar"][number]) === key
                    ? [4, 4, 0, 0]
                    : 0
                }
              />
            )}
          >
            <LabelList
              dataKey="Toplam"
              content={({ x, y, width, index, value }) => {
                const row = dagilim.Gruplar[index ?? -1];
                if (!row || ustSeri(row) !== key) return null;
                return (
                  <text
                    x={Number(x) + Number(width) / 2}
                    y={Number(y) - 6}
                    textAnchor="middle"
                    className="fill-foreground text-xs font-semibold tabular-nums"
                  >
                    {value}
                  </text>
                );
              }}
            />
          </Bar>
        ))}
      </BarChart>
    </ChartContainer>
  );
}

export function PersonelDagilimGrafikleri({
  dagilim,
  loading,
  yanKart,
}: {
  dagilim: YoneticiDashboard["personelDagilim"] | undefined;
  loading?: boolean;
  /** Grafiklerin yanındaki dördüncü sütun (örn. doğum günleri) */
  yanKart?: ReactNode;
}) {
  if (loading) {
    return (
      <div className="grid gap-3 lg:grid-cols-4">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl lg:col-span-2" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  const grafikVar = Boolean(dagilim && dagilim.Toplam > 0);
  if (!grafikVar && !yanKart) return null;

  return (
    <div className="grid gap-3 lg:grid-cols-4">
      {grafikVar && dagilim ? (
        <>
          <GrafikKart title="Cinsiyet Dağılımı" sub="Aktif personel">
            <CinsiyetGrafigi dagilim={dagilim} />
          </GrafikKart>
          <GrafikKart
            title="Personel Grupları"
            sub="Gruba göre erkek / kadın sayısı · grubu olmayanlar “Diğer”de"
            className="lg:col-span-2"
          >
            <GrupGrafigi dagilim={dagilim} />
          </GrafikKart>
        </>
      ) : null}
      {yanKart}
    </div>
  );
}
