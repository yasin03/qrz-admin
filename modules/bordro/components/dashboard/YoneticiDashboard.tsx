"use client";

import { useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import {
  AlertTriangle,
  Award,
  Cake,
  PartyPopper,
  Building2,
  ChevronDown,
  Clock,
  Hourglass,
  Timer,
  Landmark,
  LogOut,
  MapPinOff,
  Plane,
  Receipt,
  ShieldCheck,
  TicketPercent,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";

import type { ComponentType, CSSProperties } from "react";
import { AY_DATA } from "@/constants/data";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentContext } from "@/modules/core/hooks/use-context";
import { useYoneticiDashboard } from "@/modules/bordro/hooks/use-dashboard";
import type { YoneticiDashboard as YoneticiDashboardData } from "@/modules/bordro/types/dashboard";
import { formatMoney } from "@/lib/format";
import { ListeKart, StatKart } from "./DashboardKart";
import { MadalyaIkon, PastaIkon } from "./OzelGunIkonlari";
import {
  CinsiyetGrafigi,
  GrafikKart,
  PersonelDagilimGrafikleri,
} from "./PersonelDagilimGrafikleri";
import {
  BordroDurumGrafigi,
  DagilimBar,
  MaliyetKirilimi,
  MiniDonut,
  SeriBar,
} from "./YoneticiGrafikleri";

const gunAy = (ymd: string) => format(parseISO(ymd), "d MMMM", { locale: tr });
const ayAdi = (ay: string) =>
  AY_DATA.find((a) => a.value === ay.padStart(2, "0"))?.label ?? ay;
const tl = (value: number) => `${formatMoney(value)} ₺`;
const ondalik = (n: number) =>
  n.toLocaleString("tr-TR", { maximumFractionDigits: 1 });
const saat = (n: number) => `${ondalik(n)} sa`;

// Sıfır olan uyarı kartları renksiz kalır; dikkat gerektirenler renklenir
const PASIF_RENK = "#64748B";

const LISTE_LIMIT = 8;
const fazlasi = (toplam: number, birim = "kişi") =>
  toplam > LISTE_LIMIT ? `+${toplam - LISTE_LIMIT} ${birim} daha` : null;

// İsim listesini kart alt metnine sığacak şekilde kısaltır
const isimler = (liste: { AdSoyad: string }[], max = 2) =>
  liste.length === 0
    ? null
    : liste
        .slice(0, max)
        .map((k) => k.AdSoyad)
        .join(", ") + (liste.length > max ? ` +${liste.length - max}` : "");

type IconType = ComponentType<{ className?: string; style?: CSSProperties }>;

type Gun = {
  IDSubePersonel: string;
  AdSoyad: string;
  Tarih: string;
  KalanGun: number;
};

// Bugün olanlar öne çıkarılır, altında önümüzdeki 30 gün listelenir
type Tema = {
  icon: IconType;
  /** Büyük renkli illüstrasyon */
  ilustrasyon: IconType;
  /** Bugün kutusu zemini */
  soft: string;
  /** Vurgu metni */
  text: string;
  /** Liste satırındaki yuvarlak ikon */
  avatar: string;
  /** Yaklaşan (≤2 gün) rozeti */
  pill: string;
  /** Aktif sekme */
  tab: string;
};

const TEMALAR: Record<"dogum" | "yildonumu", Tema> = {
  dogum: {
    icon: Cake,
    ilustrasyon: PastaIkon,
    soft: "bg-gradient-to-br from-emerald-50 to-green-100/70 dark:from-emerald-950/40 dark:to-green-950/30",
    text: "text-emerald-700 dark:text-emerald-300",
    avatar:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300",
    pill: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
    tab: "bg-emerald-100 text-emerald-800 shadow-sm dark:bg-emerald-900/50 dark:text-emerald-200",
  },
  yildonumu: {
    icon: Award,
    ilustrasyon: MadalyaIkon,
    soft: "bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950/40 dark:to-orange-950/30",
    text: "text-amber-700 dark:text-amber-300",
    avatar:
      "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300",
    pill: "bg-amber-500 text-white",
    tab: "bg-amber-500 text-white shadow-sm",
  },
};

// Bugün olanlar öne çıkarılır, altında yaklaşanlar listelenir
function YaklasanGunler({
  liste,
  tema,
  bugunBaslik,
  bugunBos,
  yaklasanBos,
  ek,
}: {
  liste: Gun[];
  tema: Tema;
  bugunBaslik: string;
  bugunBos: string;
  yaklasanBos: string;
  ek?: (g: Gun) => string | null;
}) {
  const Icon = tema.icon;
  const Ilustrasyon = tema.ilustrasyon;
  const bugun = liste.filter((d) => d.KalanGun === 0);
  const yaklasanlar = liste.filter((d) => d.KalanGun > 0);
  return (
    <div className="flex h-full flex-col gap-3">
      {bugun.length > 0 ? (
        <div className={cn("flex items-start gap-3 rounded-lg p-3", tema.soft)}>
          <Ilustrasyon className="size-14 shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <p
              className={cn(
                "flex items-center gap-1.5 text-xs font-semibold",
                tema.text,
              )}
            >
              <PartyPopper className="size-4" />
              {bugunBaslik}
            </p>
            {bugun.map((d) => (
              <div key={d.IDSubePersonel} className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full",
                    tema.pill,
                  )}
                >
                  <Icon className="size-3.5" />
                </span>
                <p className="min-w-0 truncate text-sm font-semibold">
                  {d.AdSoyad}
                  {ek?.(d) ? (
                    <span className="font-normal text-muted-foreground">
                      {" "}
                      · {ek(d)}
                    </span>
                  ) : null}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          <Ilustrasyon className="size-10 shrink-0 opacity-70 grayscale-[40%]" />
          {bugunBos}
        </div>
      )}

      {yaklasanlar.length > 0 ? (
        <ul className="-mx-1 max-h-56 flex-1 overflow-y-auto">
          {yaklasanlar.map((d) => (
            <li
              key={d.IDSubePersonel}
              className="flex items-center gap-2.5 rounded-md px-1 py-1.5 text-sm"
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full",
                  tema.avatar,
                )}
              >
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{d.AdSoyad}</p>
                <p className="text-xs text-muted-foreground">
                  {[gunAy(d.Tarih), ek?.(d)].filter(Boolean).join(" · ")}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                  d.KalanGun <= 2
                    ? tema.pill
                    : "bg-muted text-muted-foreground",
                )}
              >
                {d.KalanGun} gün
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">{yaklasanBos}</p>
      )}
    </div>
  );
}

// Doğum günleri ve iş yıldönümleri tek kartta, sekmeyle
// Doğum günleri sadece bu kadar gün yakınsa gösterilir (API 30 gün döndürür; mobil onu kullanır)
const DOGUM_GUNU_GUN = 10;
// İş yıldönümleri API'den gelen 30 günlük pencereyle gösterilir
const YILDONUMU_GUN = 30;

function OzelGunlerKart({
  dogumGunleri: tumDogumGunleri,
  yildonumleri,
}: {
  dogumGunleri: YoneticiDashboardData["dogumGunleri"];
  yildonumleri: YoneticiDashboardData["isYildonumleri"];
}) {
  const dogumGunleri =
    tumDogumGunleri?.filter((d) => d.KalanGun <= DOGUM_GUNU_GUN) ?? null;
  const [sekme, setSekme] = useState<"dogum" | "yildonumu">(
    dogumGunleri ? "dogum" : "yildonumu",
  );
  const tema = TEMALAR[sekme];
  const aktif = sekme === "dogum" ? dogumGunleri : yildonumleri;
  const ikiGun =
    aktif?.filter((d) => d.KalanGun > 0 && d.KalanGun <= 2).length ?? 0;
  const yilMap = new Map(
    (yildonumleri ?? []).map((y) => [y.IDSubePersonel, y.Yil]),
  );

  return (
    <GrafikKart
      title="Özel Günler"
      iconNode={<tema.ilustrasyon className="size-11" />}
      sub={
        ikiGun > 0
          ? `2 gün içinde ${ikiGun} kişinin ${sekme === "dogum" ? "doğum günü" : "iş yıldönümü"}`
          : `Önümüzdeki ${sekme === "dogum" ? DOGUM_GUNU_GUN : YILDONUMU_GUN} gün`
      }
    >
      <div className="mb-3 grid grid-cols-2 gap-0.5 rounded-lg bg-muted p-0.5 text-xs font-medium">
        {(
          [
            ["dogum", "Doğum Günü", dogumGunleri],
            ["yildonumu", "İş Yıldönümü", yildonumleri],
          ] as const
        ).map(([key, label, veri]) => {
          const TabIcon = TEMALAR[key].icon;
          return (
            <button
              key={key}
              type="button"
              disabled={!veri}
              onClick={() => setSekme(key)}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 transition-colors disabled:opacity-40",
                sekme === key
                  ? TEMALAR[key].tab
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <TabIcon className="size-3.5" />
              {label}
            </button>
          );
        })}
      </div>
      {sekme === "dogum" && dogumGunleri ? (
        <YaklasanGunler
          liste={dogumGunleri}
          tema={TEMALAR.dogum}
          bugunBaslik="Bugün doğum günü"
          bugunBos="Bugün doğum günü olan personel yok"
          yaklasanBos={`Önümüzdeki ${DOGUM_GUNU_GUN} günde doğum günü yok`}
        />
      ) : yildonumleri ? (
        <YaklasanGunler
          liste={yildonumleri}
          tema={TEMALAR.yildonumu}
          bugunBaslik="Bugün iş yıldönümü"
          bugunBos="Bugün iş yıldönümü olan personel yok"
          yaklasanBos={`Önümüzdeki ${YILDONUMU_GUN} günde iş yıldönümü yok`}
          ek={(g) =>
            yilMap.get(g.IDSubePersonel)
              ? `${yilMap.get(g.IDSubePersonel)}. yıl`
              : null
          }
        />
      ) : null}
    </GrafikKart>
  );
}

// Dashboard bölümü: başlığından açılıp kapanır, varsayılan açık. Açık/kapalı tercihi
// bölüm bazında tarayıcıda saklanır (veri geldikten sonra çizildiği için SSR uyuşmazlığı olmaz).
function AcilirBolum({
  storageKey,
  title,
  ozet,
  children,
}: {
  storageKey: string;
  title: string;
  /** Başlığın altındaki kısa özet (kapalıyken de görünür) */
  ozet?: string | null;
  children: React.ReactNode;
}) {
  const [acik, setAcik] = useState(() => {
    try {
      return (
        typeof window === "undefined" ||
        localStorage.getItem(storageKey) !== "0"
      );
    } catch {
      return true;
    }
  });

  const toggle = () =>
    setAcik((prev) => {
      try {
        localStorage.setItem(storageKey, prev ? "0" : "1");
      } catch {}
      return !prev;
    });

  return (
    <section className="rounded-xl border border-border bg-muted/40">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={acik}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-muted/70",
          acik && "rounded-b-none border-b border-border",
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">{title}</div>
          {ozet ? (
            <div className="truncate text-xs text-muted-foreground">{ozet}</div>
          ) : null}
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground shadow-xs">
          {acik ? "Gizle" : "Göster"}
          <ChevronDown
            className={cn("size-4 transition-transform", acik && "rotate-180")}
          />
        </span>
      </button>
      {acik ? <div className="space-y-3 p-3">{children}</div> : null}
    </section>
  );
}

type ListeBolumu = { key: string; ozet: string; node: React.ReactNode };

// Bugünün listeleri tek bir açılır panelde
function GunlukListeler({ kartlar }: { kartlar: (ListeBolumu | null)[] }) {
  const liste = kartlar.filter((k): k is ListeBolumu => k !== null);
  if (liste.length === 0) return null;

  return (
    <AcilirBolum
      storageKey="dashboard-listeler-acik"
      title="Günlük Listeler"
      ozet={liste.map((k) => k.ozet).join(" · ")}
    >
      <div className="grid items-start gap-3 lg:grid-cols-3">
        {liste.map((k) => (
          <div key={k.key}>{k.node}</div>
        ))}
      </div>
    </AcilirBolum>
  );
}

type Ucret = NonNullable<YoneticiDashboardData["ucret"]>;

// Brüt ve net ücretler tek kartta; altta kişi oranı çubuğu kartı dengeli doldurur
function UcretKart({ ucret }: { ucret: Ucret }) {
  const toplamKisi = ucret.BrutSayi + ucret.NetSayi;
  const satirlar = [
    {
      key: "brut",
      label: "Brüt ücretli",
      toplam: ucret.BrutToplam,
      sayi: ucret.BrutSayi,
      renk: "bg-[#2a78d6] dark:bg-[#3987e5]",
    },
    {
      key: "net",
      label: "Net ücretli",
      toplam: ucret.NetToplam,
      sayi: ucret.NetSayi,
      renk: "bg-[#6250d6] dark:bg-[#9085e9]",
    },
  ];

  return (
    <Link
      href="/personel"
      className="flex flex-col transition-shadow hover:shadow-md rounded-xl"
    >
      <GrafikKart
        title="Ücretler"
        sub="Aktif personelin tanımlı ücretleri"
        className="h-full"
      >
        {/* Brüt, net ve oran çubuğu kart yüksekliğine eşit aralıklarla yayılır */}
        <div className="flex h-full flex-col justify-between gap-4">
          {satirlar.map((r) => (
            <div
              key={r.key}
              className="flex items-start gap-3 border-b border-border/60 pb-4"
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Wallet className="size-5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                  <span className={cn("size-2 rounded-xs", r.renk)} />
                  {r.label} toplamı
                </div>
                <div className="truncate text-2xl font-bold tabular-nums">
                  {tl(r.toplam)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {r.sayi
                    ? `${r.sayi} kişi · Ort. ${tl(r.toplam / r.sayi)}`
                    : "Personel yok"}
                </div>
              </div>
            </div>
          ))}

          {toplamKisi > 0 ? (
            <div className="space-y-1.5">
              <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                {satirlar
                  .filter((r) => r.sayi > 0)
                  .map((r) => (
                    <div
                      key={r.key}
                      className={cn(
                        "h-full border-r-2 border-card last:border-r-0",
                        r.renk,
                      )}
                      style={{ width: `${(r.sayi / toplamKisi) * 100}%` }}
                    />
                  ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
                <span>
                  Brüt %{Math.round((ucret.BrutSayi / toplamKisi) * 100)}
                </span>
                <span>{toplamKisi} kişi</span>
                <span>
                  Net %{Math.round((ucret.NetSayi / toplamKisi) * 100)}
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </GrafikKart>
    </Link>
  );
}

function GrafikSkeleton({ cols }: { cols: string[] }) {
  return (
    <div className="grid gap-3 lg:grid-cols-4">
      {cols.map((c, i) => (
        <Skeleton key={i} className={cn("h-64 rounded-xl", c)} />
      ))}
    </div>
  );
}

export default function YoneticiDashboard() {
  const { data: context } = useCurrentContext();
  const now = new Date();

  const { data, isLoading, isError } = useYoneticiDashboard({
    IDSube: context?.IDSube,
    Yil: context?.Yil || String(now.getFullYear()),
    Ay: (context?.Ay || String(now.getMonth() + 1)).padStart(2, "0"),
  });

  if (!context?.IDSube) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
        Özeti görüntülemek için üstten şube seçimi yapın.
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        Özet bilgileri yüklenirken bir hata oluştu.
      </div>
    );
  }

  const pdks = data?.pdksBugun;
  const izinde = data?.bugunIzinde;
  const talepler = data?.bekleyenTalepler;
  const bordro = data?.bordro;
  const hareket = data?.personelHareket;
  const ucret = data?.ucret;
  const demo = data?.demografi;
  const donem = bordro ? `${ayAdi(bordro.Ay)} ${bordro.Yil}` : "Bu ay";
  const gelmeyenler = pdks?.GelmeyenListe;
  const izin = data?.izin;

  return (
    <div className="space-y-4">
      {/* ---- Bugün ---- */}
      <AcilirBolum
        storageKey="dashboard-bolum-bugun"
        title="Bugün"
        ozet={
          pdks || izinde || talepler
            ? [
                pdks ? `${pdks.Gelen} gelen` : null,
                pdks?.Gelmeyen != null ? `${pdks.Gelmeyen} gelmeyen` : null,
                izinde ? `${izinde.Sayi} izinde` : null,
                talepler
                  ? `${talepler.Izin + talepler.Avans} onay bekleyen`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")
            : null
        }
      >
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatKart
            layout="inline"
            icon={Users}
            color="#052346"
            title="Aktif Personel"
            loading={isLoading}
            value={
              data?.personelSayisi != null ? String(data.personelSayisi) : "—"
            }
            href="/personel"
          />
          <StatKart
            layout="inline"
            icon={UserCheck}
            color="#059669"
            title="Bugün Gelen"
            loading={isLoading}
            value={pdks ? String(pdks.Gelen) : "—"}
            sub={
              pdks?.Gelmeyen != null ? `${pdks.Gelmeyen} kişi gelmedi` : null
            }
            href="/pdks"
          />
          <StatKart
            layout="inline"
            icon={Plane}
            color="#2563EB"
            title="Bugün İzinde"
            loading={isLoading}
            value={izinde ? String(izinde.Sayi) : "—"}
            href="/izin"
          />
          <StatKart
            layout="inline"
            icon={Hourglass}
            color="#D97706"
            title="Onay Bekleyen"
            loading={isLoading}
            value={talepler ? String(talepler.Izin + talepler.Avans) : "—"}
            sub={
              talepler
                ? `${talepler.Izin} izin · ${talepler.Avans} avans`
                : null
            }
            href={
              talepler && talepler.Izin === 0 && talepler.Avans > 0
                ? "/avans"
                : "/izin"
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatKart
            layout="inline"
            icon={MapPinOff}
            color={pdks?.KonumDisi ? "#DC2626" : PASIF_RENK}
            title="Konum Dışı Giriş"
            loading={isLoading}
            value={pdks ? String(pdks.KonumDisi) : "—"}
            sub={
              pdks
                ? (isimler(pdks.KonumDisiListe) ?? "Konum dışı giriş yok")
                : null
            }
            href="/pdks"
          />
          <StatKart
            layout="inline"
            icon={LogOut}
            color={pdks?.CikisYok ? "#7C3AED" : PASIF_RENK}
            title="Çıkış Yapmayan"
            loading={isLoading}
            value={pdks ? String(pdks.CikisYok) : "—"}
            sub={
              pdks
                ? (isimler(pdks.CikisYokListe) ?? "Herkes çıkış yaptı")
                : null
            }
            href="/pdks"
          />
          <StatKart
            layout="inline"
            icon={UserPlus}
            color={hareket?.Giren ? "#059669" : PASIF_RENK}
            title={`İşe Giren · ${donem}`}
            loading={isLoading}
            value={hareket ? String(hareket.Giren) : "—"}
            sub={
              hareket ? (isimler(hareket.GirenListe) ?? "Yeni giriş yok") : null
            }
            href="/personel"
          />
          <StatKart
            layout="inline"
            icon={UserMinus}
            color={hareket?.Cikan ? "#E11D48" : PASIF_RENK}
            title={`Ayrılan · ${donem}`}
            loading={isLoading}
            value={hareket ? String(hareket.Cikan) : "—"}
            sub={
              hareket ? (isimler(hareket.CikanListe) ?? "Ayrılan yok") : null
            }
            href="/personel"
          />
        </div>

        {isLoading ? (
          <GrafikSkeleton cols={["lg:col-span-3", ""]} />
        ) : data?.devamTrendi || pdks ? (
          <div className="grid gap-3 lg:grid-cols-4">
            {data?.devamTrendi ? (
              <GrafikKart
                title="Son 7 Gün Devam"
                sub="PDKS girişi olan, gelmeyen ve izinli personel · gelmeyen bugünkü aktif sayıya göre"
                className="lg:col-span-3"
              >
                <SeriBar
                  data={data.devamTrendi}
                  stacked
                  etiketGoster
                  seriler={[
                    { key: "Gelen", label: "Gelen" },
                    { key: "Gelmeyen", label: "Gelmeyen" },
                    { key: "Izinli", label: "İzinli" },
                  ]}
                />
              </GrafikKart>
            ) : null}
            {pdks ? (
              <div
                className={cn(
                  "grid gap-3 sm:grid-cols-2",
                  data?.devamTrendi
                    ? "lg:grid-cols-1"
                    : "lg:col-span-4 lg:grid-cols-4",
                )}
              >
                <StatKart
                  layout="inline"
                  className="flex flex-col justify-center"
                  icon={Clock}
                  color="#0EA5E9"
                  title="Ort. Çalışma · Bugün"
                  value={
                    pdks.OrtalamaCalisma != null
                      ? saat(pdks.OrtalamaCalisma)
                      : "—"
                  }
                  sub={
                    pdks.SuresiHesaplanan
                      ? `${pdks.SuresiHesaplanan} kişinin süresi hesaplandı`
                      : "Henüz çıkış yapan yok"
                  }
                  href="/pdks"
                />
                <StatKart
                  layout="inline"
                  className="flex flex-col justify-center"
                  icon={Timer}
                  color={pdks.MesaiYapan ? "#D97706" : PASIF_RENK}
                  title="Mesai · Bugün"
                  value={saat(pdks.ToplamMesai)}
                  sub={
                    pdks.MesaiYapan
                      ? `${pdks.MesaiYapan} kişi mesaide`
                      : "Mesai yok"
                  }
                  href="/pdks"
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </AcilirBolum>

      {!isLoading ? (
        <GunlukListeler
          kartlar={[
            gelmeyenler
              ? {
                  key: "gelmeyen",
                  ozet: `${gelmeyenler.length} gelmeyen`,
                  node: (
                    <ListeKart
                      title="Bugün Gelmeyenler"
                      badge={String(gelmeyenler.length)}
                      bos="Gelmeyen personel yok 🎉"
                      footer={fazlasi(gelmeyenler.length)}
                      items={gelmeyenler.slice(0, LISTE_LIMIT).map((p) => ({
                        key: p.IDSubePersonel,
                        title: p.AdSoyad,
                      }))}
                    />
                  ),
                }
              : null,
            talepler
              ? {
                  key: "talep",
                  ozet: `${talepler.Izin + talepler.Avans} bekleyen talep`,
                  node: (
                    <ListeKart
                      title="Bekleyen Talepler"
                      badge={String(talepler.Izin + talepler.Avans)}
                      bos="Onay bekleyen talep yok"
                      footer={fazlasi(talepler.Izin + talepler.Avans, "talep")}
                      items={talepler.Liste.slice(0, LISTE_LIMIT).map(
                        (t, idx) => ({
                          key: `${t.Tip}-${t.IDSubePersonel}-${idx}`,
                          title: t.AdSoyad,
                          sub:
                            t.Tip === "izin"
                              ? [
                                  "İzin",
                                  t.IzinTipi,
                                  t.Gun ? `${t.Gun} gün` : null,
                                ]
                                  .filter(Boolean)
                                  .join(" · ")
                              : `Avans · ${tl(t.Tutar ?? 0)}`,
                          right: t.Tarih ? gunAy(t.Tarih) : null,
                          href:
                            t.Tip === "izin"
                              ? "/izin?tab=talep"
                              : "/avans?tab=talepler",
                        }),
                      )}
                    />
                  ),
                }
              : null,
            izinde
              ? {
                  key: "izinde",
                  ozet: `${izinde.Sayi} izinde`,
                  node: (
                    <ListeKart
                      title="Bugün İzinde Olanlar"
                      badge={String(izinde.Sayi)}
                      bos="Bugün izinde olan personel yok"
                      footer={fazlasi(izinde.Liste.length)}
                      items={izinde.Liste.slice(0, LISTE_LIMIT).map(
                        (i, idx) => ({
                          key: `${i.IDSubePersonel}-${idx}`,
                          title: i.AdSoyad,
                          sub: i.Tip,
                          right: `${gunAy(i.BitisTarihi)}'e kadar`,
                        }),
                      )}
                    />
                  ),
                }
              : null,
          ]}
        />
      ) : null}

      {/* ---- Personel ---- */}
      <AcilirBolum
        storageKey="dashboard-bolum-personel"
        title="Personel"
        ozet={
          data?.personelSayisi != null
            ? [
                `${data.personelSayisi} aktif personel`,
                hareket
                  ? `${hareket.Giren} giren · ${hareket.Cikan} ayrılan (${donem})`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")
            : null
        }
      >
        <PersonelDagilimGrafikleri
          dagilim={data?.personelDagilim}
          loading={isLoading}
          solKart={
            data?.dogumGunleri || data?.isYildonumleri ? (
              <OzelGunlerKart
                dogumGunleri={data.dogumGunleri}
                yildonumleri={data.isYildonumleri}
              />
            ) : null
          }
          yanKart={ucret ? <UcretKart ucret={ucret} /> : null}
        />

        {isLoading ? (
          <GrafikSkeleton cols={["", "", "", ""]} />
        ) : demo && data?.personelSayisi ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {data.personelDagilim && data.personelDagilim.Toplam > 0 ? (
                <GrafikKart title="Cinsiyet">
                  <CinsiyetGrafigi dagilim={data.personelDagilim} />
                </GrafikKart>
              ) : null}
              <GrafikKart title="Ücret Tipi">
                <MiniDonut data={demo.UcretTipi} />
              </GrafikKart>
              <GrafikKart title="Çalışma Durumu">
                <MiniDonut data={demo.CalismaDurumu} />
              </GrafikKart>
              <GrafikKart title="Medeni Durum">
                <MiniDonut data={demo.MedeniDurum} />
              </GrafikKart>
            </div>

            <div className="grid gap-3 lg:grid-cols-4">
              <GrafikKart title="Yaş Dağılımı" sub="Aktif personel">
                <DagilimBar data={demo.Yas} />
              </GrafikKart>
              <GrafikKart
                title="Kıdem Dağılımı"
                sub="Son işe giriş tarihine göre"
              >
                <DagilimBar data={demo.Kidem} />
              </GrafikKart>
              <GrafikKart
                title="Bölümler"
                sub="Bölüme göre aktif personel"
                className="lg:col-span-2"
              >
                <DagilimBar data={demo.Bolum} yatay />
              </GrafikKart>
            </div>
          </>
        ) : null}

        {!isLoading && data?.hareketTrendi ? (
          <GrafikKart
            title="Personel Hareketi"
            sub="Son 12 ay · işe giren ve ayrılan personel (pasifler dahil)"
          >
            <SeriBar
              data={data.hareketTrendi}
              yukseklik="h-56"
              seriler={[
                { key: "Giren", label: "İşe giren" },
                { key: "Cikan", label: "Ayrılan" },
              ]}
            />
          </GrafikKart>
        ) : null}
      </AcilirBolum>

      {/* ---- İzin ---- */}
      <AcilirBolum
        storageKey="dashboard-bolum-izin"
        title="İzin"
        ozet={
          izin
            ? [
                izinde ? `Bugün ${izinde.Sayi} kişi izinde` : null,
                `7 gün içinde ${izin.Yaklasan.length} izin başlıyor`,
              ]
                .filter(Boolean)
                .join(" · ")
            : null
        }
      >
        {isLoading ? (
          <GrafikSkeleton cols={["lg:col-span-2", "", ""]} />
        ) : izin ? (
          <div className="grid gap-3 lg:grid-cols-4">
            <GrafikKart
              title="Aylık İzin Kullanımı"
              sub="Son 12 ay · izin günü (aylara bölünmüş)"
              className="lg:col-span-2"
            >
              <DagilimBar
                data={izin.Aylik.map((a) => ({
                  Etiket: a.Etiket,
                  Sayi: a.Gun,
                }))}
                label="İzin günü"
                bicim={ondalik}
              />
            </GrafikKart>
            <GrafikKart title="İzin Türleri" sub="Son 12 ay · toplam gün">
              {izin.Turler.length > 0 ? (
                <MiniDonut
                  data={izin.Turler.map((t) => ({
                    Etiket: t.Etiket,
                    Sayi: t.Gun,
                  }))}
                  renkSayisi={5}
                  birim="gün"
                />
              ) : (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  Son 12 ayda izin kaydı yok
                </p>
              )}
            </GrafikKart>
            <ListeKart
              title="Yaklaşan İzinler · 7 gün"
              badge={String(izin.Yaklasan.length)}
              bos="Önümüzdeki 7 günde başlayan izin yok"
              footer={fazlasi(izin.Yaklasan.length)}
              items={izin.Yaklasan.slice(0, LISTE_LIMIT).map((i, idx) => ({
                key: `${i.IDSubePersonel}-${idx}`,
                title: i.AdSoyad,
                sub: [
                  i.Tip,
                  `${gunAy(i.BaslangicTarihi)} – ${gunAy(i.BitisTarihi)}`,
                ]
                  .filter(Boolean)
                  .join(" · "),
                right: i.KalanGun === 1 ? "Yarın" : `${i.KalanGun} gün sonra`,
                href: "/izin",
              }))}
            />
          </div>
        ) : null}
      </AcilirBolum>

      {/* ---- Bordro ---- */}
      <AcilirBolum
        storageKey="dashboard-bolum-bordro"
        title={`Bordro · ${donem}`}
        ozet={
          bordro
            ? `${tl(bordro.ToplamOdenecek)} ödenecek · ${bordro.Onayli}/${bordro.Toplam} onaylı · ${bordro.Hesaplanmadi} hesaplanmadı`
            : null
        }
      >
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatKart
            className="col-span-2 lg:col-span-1"
            icon={Receipt}
            color="#0EA5E9"
            title="Toplam Ödenecek"
            loading={isLoading}
            value={bordro ? tl(bordro.ToplamOdenecek) : "—"}
            sub={
              bordro
                ? `${bordro.Toplam} personel · ${bordro.Hesaplanan} hesaplandı · ${bordro.Onayli} onaylı · ${bordro.OnayBekleyen} onay bekliyor`
                : null
            }
            href="/bordro"
          />
          <StatKart
            icon={Building2}
            color="#052346"
            title="İşveren Maliyeti"
            loading={isLoading}
            value={bordro ? tl(bordro.ToplamMaliyet) : "—"}
            sub={
              bordro?.Hesaplanan
                ? `${bordro.Hesaplanan} hesaplanmış bordro`
                : "Hesaplanmış bordro yok"
            }
            href="/bordro"
          />
          <StatKart
            icon={ShieldCheck}
            color="#059669"
            title="SGK İşveren Primi"
            loading={isLoading}
            value={bordro ? tl(bordro.SgkIsverenPrimi) : "—"}
            sub={bordro ? `İşçi payı ${tl(bordro.SgkIsciPrimi)}` : null}
            href="/bordro"
          />
          <StatKart
            icon={Landmark}
            color="#D97706"
            title="Gelir + Damga Vergisi"
            loading={isLoading}
            value={bordro ? tl(bordro.GelirVergisi + bordro.DamgaVergisi) : "—"}
            sub={
              bordro
                ? `GV ${tl(bordro.GelirVergisi)} · DV ${tl(bordro.DamgaVergisi)}`
                : null
            }
            href="/bordro"
          />
          <StatKart
            icon={TicketPercent}
            color="#7C3AED"
            title="Teşvik Toplamı"
            loading={isLoading}
            value={bordro ? tl(bordro.TesvikToplam) : "—"}
            sub={
              bordro
                ? `5510 ${tl(bordro.Tesvik5510)} · 4447 ${tl(bordro.Tesvik4447)}`
                : null
            }
            href="/bordro"
          />
        </div>

        {bordro && bordro.Negatif.length > 0 ? (
          <Link
            href="/bordro"
            className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive hover:shadow-md"
          >
            <AlertTriangle className="mt-0.5 size-5 shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold">
                {bordro.Negatif.length} bordroda ödenecek tutar negatif
              </p>
              <p className="text-xs">
                {bordro.Negatif.slice(0, 5)
                  .map((b) => `${b.AdSoyad} (${tl(b.OdenecekTutar)})`)
                  .join(" · ")}
                {bordro.Negatif.length > 5
                  ? ` · +${bordro.Negatif.length - 5} kişi`
                  : ""}
              </p>
            </div>
          </Link>
        ) : null}

        {isLoading ? (
          <GrafikSkeleton cols={["", "lg:col-span-2"]} />
        ) : bordro && bordro.Toplam > 0 ? (
          <div className="grid gap-3 lg:grid-cols-3">
            <GrafikKart
              title="Bordro Durumu"
              sub="Hesaplama ve onay ilerlemesi"
            >
              <BordroDurumGrafigi bordro={bordro} />
            </GrafikKart>
            <GrafikKart
              title="Maliyet Kırılımı"
              sub="Hesaplanmış bordrolar · işveren maliyetinin kalemleri"
              className="lg:col-span-2"
            >
              {bordro.Hesaplanan > 0 ? (
                <MaliyetKirilimi bordro={bordro} />
              ) : (
                <div className="flex flex-col items-center gap-2 py-8 text-center text-xs text-muted-foreground">
                  <Receipt className="size-6" />
                  Bu dönem için henüz hesaplanmış bordro yok
                </div>
              )}
            </GrafikKart>
          </div>
        ) : null}

        {!isLoading && bordro && bordro.BolumMaliyet.length > 0 ? (
          <GrafikKart
            title="Bölüm Bazında Maliyet"
            sub="Hesaplanmış bordrolar · toplam işveren maliyeti"
          >
            <DagilimBar
              data={bordro.BolumMaliyet.map((b) => ({
                Etiket: b.Etiket,
                Sayi: b.Tutar,
              }))}
              yatay
              label="Maliyet"
              bicim={tl}
            />
          </GrafikKart>
        ) : null}
      </AcilirBolum>
    </div>
  );
}
