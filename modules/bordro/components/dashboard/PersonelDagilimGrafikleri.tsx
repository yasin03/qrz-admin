"use client";

import type { ComponentType, ReactNode } from "react";
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
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import type { YoneticiDashboard } from "@/modules/bordro/types/dashboard";

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
  icon: Icon,
  iconClassName,
  iconNode,
  className,
  children,
}: {
  title: string;
  sub?: string;
  /** Başlığın solunda renkli ikon kutusu */
  icon?: ComponentType<{ className?: string }>;
  iconClassName?: string;
  /** icon yerine hazır görsel (örn. renkli illüstrasyon) */
  iconNode?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`flex flex-col rounded-xl border border-border bg-card ${className ?? ""}`}
    >
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        {iconNode ? <span className="shrink-0">{iconNode}</span> : Icon ? (
          <span
            className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${iconClassName ?? "bg-muted text-muted-foreground"}`}
          >
            <Icon className="size-4.5" />
          </span>
        ) : null}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">{title}</h3>
          {sub ? <p className="truncate text-xs text-muted-foreground">{sub}</p> : null}
        </div>
      </header>
      <div className="min-h-0 flex-1 p-4">{children}</div>
    </section>
  );
}

// Küçük donut satırında (ücret tipi, medeni durum…) yanındakilerle aynı ölçüde
export function CinsiyetGrafigi({ dagilim }: { dagilim: Dagilim }) {
  const dilimler = (Object.keys(chartConfig) as CinsiyetKey[])
    .map((key) => ({ key, value: dagilim[key] }))
    .filter((d) => d.value > 0);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <ChartContainer config={chartConfig} className="aspect-square h-28 shrink-0">
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
            className="fill-foreground text-lg font-bold tabular-nums"
          >
            {dagilim.Toplam}
          </text>
          <text
            x="50%"
            y="50%"
            dy={18}
            textAnchor="middle"
            className="fill-muted-foreground text-xs"
          >
            personel
          </text>
        </PieChart>
      </ChartContainer>

      {/* Legend + değerler: kimlik renkte değil sadece işarette; metin nötr. */}
      <ul className="w-full min-w-0 space-y-1.5">
        {dilimler.map((d) => (
          <li key={d.key} className="flex items-center gap-2 text-sm">
            <span
              className="size-2.5 shrink-0 rounded-xs"
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

// Personel grupları grafiği (2 kolon) + yanında ek kartlar (özel günler, ücret…)
export function PersonelDagilimGrafikleri({
  dagilim,
  loading,
  solKart,
  yanKart,
}: {
  dagilim: YoneticiDashboard["personelDagilim"] | undefined;
  loading?: boolean;
  /** Grafiğin solundaki kolon */
  solKart?: ReactNode;
  /** Grafiğin sağındaki kolon(lar) (her biri lg'de 1 kolon) */
  yanKart?: ReactNode;
}) {
  if (loading) {
    return (
      <div className="grid gap-3 lg:grid-cols-4">
        <Skeleton className="h-72 rounded-xl lg:col-span-2" />
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  const grafikVar = Boolean(dagilim && dagilim.Toplam > 0);
  if (!grafikVar && !yanKart && !solKart) return null;

  return (
    <div className="grid gap-3 lg:grid-cols-4">
      {solKart}
      {grafikVar && dagilim ? (
        <GrafikKart
          title="Personel Grupları"
          sub="Gruba göre erkek / kadın sayısı · grubu olmayanlar “Diğer”de"
          className="lg:col-span-2"
        >
          <GrupGrafigi dagilim={dagilim} />
        </GrafikKart>
      ) : null}
      {yanKart}
    </div>
  );
}
