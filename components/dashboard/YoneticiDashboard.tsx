"use client";

import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { Hourglass, Plane, Receipt, UserCheck, Users } from "lucide-react";

import { AY_DATA } from "@/constants/data";
import { useCurrentContext } from "@/hooks/use-context";
import { useYoneticiDashboard } from "@/hooks/use-dashboard";
import type { YoneticiDashboard as YoneticiDashboardData } from "@/types/dashboard";
import { formatMoney } from "@/lib/format";
import { BolumBaslik, ListeKart, StatKart } from "./DashboardKart";
import { GrafikKart, PersonelDagilimGrafikleri } from "./PersonelDagilimGrafikleri";

const gunAy = (ymd: string) => format(parseISO(ymd), "d MMMM", { locale: tr });
const ayAdi = (ay: string) => AY_DATA.find((a) => a.value === ay.padStart(2, "0"))?.label ?? ay;

// Yönetici / admin: üstten seçili şube ve dönemin özeti
type DogumGunu = NonNullable<YoneticiDashboardData["dogumGunleri"]>[number];

// Bugün doğanlar öne çıkarılır, altında önümüzdeki 30 gün listelenir
function DogumGunleri({
  bugunDoganlar,
  yaklasanlar,
}: {
  bugunDoganlar: DogumGunu[];
  yaklasanlar: DogumGunu[];
}) {
  return (
    <div className="flex h-full flex-col gap-3">
      {bugunDoganlar.length > 0 ? (
        <div className="space-y-1.5 rounded-lg bg-pink-50 p-3 dark:bg-pink-950/30">
          <p className="text-xs font-medium text-pink-700 dark:text-pink-300">
            Bugün doğum günü 🎂
          </p>
          {bugunDoganlar.map((d) => (
            <p key={d.IDSubePersonel} className="truncate text-sm font-semibold">
              {d.AdSoyad}
            </p>
          ))}
        </div>
      ) : (
        <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          Bugün doğum günü olan personel yok
        </p>
      )}

      {yaklasanlar.length > 0 ? (
        <ul className="-mx-1 max-h-48 flex-1 overflow-y-auto">
          {yaklasanlar.map((d) => (
            <li
              key={d.IDSubePersonel}
              className="flex items-center gap-2 rounded-md px-1 py-1.5 text-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{d.AdSoyad}</p>
                <p className="text-xs text-muted-foreground">{gunAy(d.Tarih)}</p>
              </div>
              <span
                className={
                  d.KalanGun <= 2
                    ? "text-xs font-semibold text-pink-700 dark:text-pink-300"
                    : "text-xs font-semibold text-muted-foreground"
                }
              >
                {d.KalanGun} gün
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">Önümüzdeki 30 günde doğum günü yok</p>
      )}
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
  const dogumGunleri = data?.dogumGunleri;
  const bugunDoganlar = dogumGunleri?.filter((d) => d.KalanGun === 0) ?? [];
  const ikiGunIcinde = dogumGunleri?.filter((d) => d.KalanGun > 0 && d.KalanGun <= 2) ?? [];

  return (
    <div className="space-y-4">
      <BolumBaslik title="Bugün" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatKart
          icon={Users}
          color="#052346"
          title="Aktif Personel"
          loading={isLoading}
          value={data?.personelSayisi != null ? String(data.personelSayisi) : "—"}
          href="/personel"
        />
        <StatKart
          icon={UserCheck}
          color="#059669"
          title="Bugün Gelen"
          loading={isLoading}
          value={pdks ? String(pdks.Gelen) : "—"}
          sub={pdks?.Gelmeyen != null ? `${pdks.Gelmeyen} kişi gelmedi` : null}
          href="/pdks"
        />
        <StatKart
          icon={Plane}
          color="#2563EB"
          title="Bugün İzinde"
          loading={isLoading}
          value={izinde ? String(izinde.Sayi) : "—"}
          href="/izin"
        />
        <StatKart
          icon={Hourglass}
          color="#D97706"
          title="Onay Bekleyen"
          loading={isLoading}
          value={talepler ? String(talepler.Izin + talepler.Avans) : "—"}
          sub={talepler ? `${talepler.Izin} izin · ${talepler.Avans} avans` : null}
          href={talepler && talepler.Izin === 0 && talepler.Avans > 0 ? "/avans" : "/izin"}
        />
      </div>

      <BolumBaslik title="Personel" />
      <PersonelDagilimGrafikleri
        dagilim={data?.personelDagilim}
        loading={isLoading}
        yanKart={
          dogumGunleri ? (
            <GrafikKart
              title="Doğum Günleri"
              sub={
                ikiGunIcinde.length > 0
                  ? `2 gün içinde ${ikiGunIcinde.length} kişinin doğum günü`
                  : "2 gün içinde doğum günü yok"
              }
            >
              <DogumGunleri
                bugunDoganlar={bugunDoganlar}
                yaklasanlar={dogumGunleri.filter((d) => d.KalanGun > 0)}
              />
            </GrafikKart>
          ) : null
        }
      />

      <BolumBaslik title="Bordro" />
      <StatKart
        icon={Receipt}
        color="#0EA5E9"
        title={bordro ? `${ayAdi(bordro.Ay)} ${bordro.Yil} · Toplam ödenecek` : "Bordro"}
        loading={isLoading}
        value={bordro ? `${formatMoney(bordro.ToplamOdenecek)} ₺` : "—"}
        sub={
          bordro
            ? `${bordro.Toplam} personel · ${bordro.Hesaplanan} hesaplandı · ${bordro.Onayli} onaylı · ${bordro.OnayBekleyen} onay bekliyor`
            : null
        }
        href="/bordro"
      />

      {izinde && izinde.Liste.length > 0 && (
        <div className="grid gap-3 lg:grid-cols-2">
          <ListeKart
            title="Bugün İzinde Olanlar"
            items={izinde.Liste.slice(0, 8).map((i, idx) => ({
              key: `${i.IDSubePersonel}-${idx}`,
              title: i.AdSoyad,
              sub: i.Tip,
              right: `${gunAy(i.BitisTarihi)}'e kadar`,
            }))}
          />
        </div>
      )}
    </div>
  );
}
