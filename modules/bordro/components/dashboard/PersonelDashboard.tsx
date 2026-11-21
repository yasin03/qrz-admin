"use client";

import { useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Briefcase,
  CalendarCheck,
  CalendarClock,
  Clock,
  CalendarDays,
  Cake,
  Eye,
  EyeOff,
  Fingerprint,
  HandCoins,
  Hourglass,
  MinusCircle,
  Plane,
  PlusCircle,
  Receipt,
  Timer,
} from "lucide-react";

import { AY_DATA } from "@/constants/data";
import { usePersonelDashboard } from "@/modules/bordro/hooks/use-dashboard";
import { formatMoney } from "@/lib/format";
import { BolumBaslik, StatKart } from "./DashboardKart";
import { GrafikKart } from "./PersonelDagilimGrafikleri";
import { DagilimBar, IzinHalkasi } from "./YoneticiGrafikleri";

const MAAS_GIZLI_KEY = "dashboard-maas-gizli";

const gunAy = (ymd: string) => format(parseISO(ymd), "d MMMM", { locale: tr });
const tamTarih = (ymd: string) => format(parseISO(ymd), "dd.MM.yyyy");
const tl = (value: number) => `${formatMoney(value)} ₺`;
const saat = (n: number) => `${n.toLocaleString("tr-TR", { maximumFractionDigits: 1 })} sa`;
const ayAdi = (ay: string) => AY_DATA.find((a) => a.value === ay.padStart(2, "0"))?.label ?? ay;

// Maaş varsayılan olarak gizli; tercih tarayıcıda saklanır.
// Maaş kartı veri geldikten sonra (sadece istemcide) çizildiği için SSR uyuşmazlığı oluşmaz.
function useMaasGizli() {
  const [gizli, setGizli] = useState(() => {
    try {
      return typeof window === "undefined" || localStorage.getItem(MAAS_GIZLI_KEY) !== "0";
    } catch {
      return true;
    }
  });

  const toggle = () =>
    setGizli((prev) => {
      try {
        localStorage.setItem(MAAS_GIZLI_KEY, prev ? "0" : "1");
      } catch {}
      return !prev;
    });

  return [gizli, toggle] as const;
}

export default function PersonelDashboard() {
  const { data, isLoading, isError } = usePersonelDashboard();
  const [maasGizli, toggleMaas] = useMaasGizli();

  if (isError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        Özet bilgileri yüklenirken bir hata oluştu.
      </div>
    );
  }

  const p = data?.personel;
  const izin = data?.yillikIzin;
  const sonraki = data?.sonrakiIzin;
  const maas = data?.maas;
  const avans = data?.avans;
  const puantaj = data?.puantaj;
  const ek = data?.eklentiKesinti;
  const pdks = data?.pdksBugun;
  const pdksAy = data?.pdksAy;
  const talepler = data?.bekleyenTalepler;
  const bekleyenToplam = (talepler?.Izin ?? 0) + (talepler?.Avans ?? 0);
  const dogumGunuYakin = p?.DogumGunuKalanGun != null && p.DogumGunuKalanGun <= 7;

  return (
    <div className="space-y-4">
      {/* Karşılama */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="text-lg font-semibold">
          Merhaba{p?.AdSoyad ? `, ${p.AdSoyad}` : ""}
        </div>
        <div className="text-sm text-muted-foreground">
          {[p?.Unvan, p?.BolumAdi, p?.SicilNo ? `Sicil: ${p.SicilNo}` : null]
            .filter(Boolean)
            .join(" · ")}
        </div>
      </div>

      {(dogumGunuYakin || bekleyenToplam > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {dogumGunuYakin && (
            <div className="flex items-center gap-3 rounded-xl bg-pink-50 p-4 text-pink-700 dark:bg-pink-950/30 dark:text-pink-300">
              <Cake className="size-6 shrink-0" />
              <div>
                <div className="text-sm font-semibold">
                  {p!.DogumGunuKalanGun === 0
                    ? "Doğum günün kutlu olsun! 🎉"
                    : `Doğum gününe ${p!.DogumGunuKalanGun} gün kaldı`}
                </div>
                <div className="text-xs">{gunAy(p!.DogumTarihi!)}</div>
              </div>
            </div>
          )}
          {bekleyenToplam > 0 && (
            <Link
              href={talepler!.Izin > 0 ? "/izin" : "/avans"}
              className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 hover:shadow-md dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300"
            >
              <Hourglass className="size-5 shrink-0" />
              Onay bekleyen{" "}
              {[
                talepler!.Izin ? `${talepler!.Izin} izin` : null,
                talepler!.Avans ? `${talepler!.Avans} avans` : null,
              ]
                .filter(Boolean)
                .join(" ve ")}{" "}
              talebin var
            </Link>
          )}
        </div>
      )}

      <BolumBaslik title="İzin & Çalışma" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {izin && !isLoading ? (
          <Link
            href="/izin"
            className="flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md sm:flex-row sm:items-center"
          >
            <IzinHalkasi kullanilan={izin.Kullanilan} kalan={izin.Kalan} />
            <div className="min-w-0 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-medium text-muted-foreground">
                <Plane className="size-3.5" style={{ color: "#2563EB" }} />
                Yıllık İzin
              </div>
              <div className="text-muted-foreground">
                Toplam hak <span className="font-semibold text-foreground tabular-nums">{izin.ToplamHak}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span className="size-2 rounded-xs" style={{ backgroundColor: "#2a78d6" }} />
                Kullanılan <span className="font-semibold text-foreground tabular-nums">{izin.Kullanilan}</span>
              </div>
            </div>
          </Link>
        ) : (
          <StatKart
            icon={Plane}
            color="#2563EB"
            title="Kalan Yıllık İzin"
            loading={isLoading}
            value="—"
            sub="Bilgi yok"
            href="/izin"
          />
        )}
        <StatKart
          icon={CalendarClock}
          color="#7C3AED"
          title="Sonraki İzin"
          loading={isLoading}
          value={
            sonraki
              ? sonraki.KalanGun === 0
                ? "Bugün"
                : `${sonraki.KalanGun} gün kaldı`
              : "Planlı izin yok"
          }
          sub={sonraki ? `${sonraki.Tip} · ${gunAy(sonraki.BaslangicTarihi)}` : null}
          href="/izin"
        />
        <StatKart
          icon={Briefcase}
          color="#059669"
          title="Çalışma Süresi"
          loading={isLoading}
          value={p?.CalistigiGun != null ? `${p.CalistigiGun.toLocaleString("tr-TR")} gün` : "—"}
          sub={p?.IseGirisTarihi ? `${p.Kidem ?? ""} · Giriş ${tamTarih(p.IseGirisTarihi)}` : null}
          href="/ozluk"
        />
        <StatKart
          icon={Cake}
          color="#DB2777"
          title="Doğum Günü"
          loading={isLoading}
          value={
            p?.DogumGunuKalanGun != null
              ? p.DogumGunuKalanGun === 0
                ? "Bugün 🎂"
                : `${p.DogumGunuKalanGun} gün kaldı`
              : "—"
          }
          sub={p?.DogumTarihi ? gunAy(p.DogumTarihi) : null}
          href="/ozluk"
        />
      </div>

      {pdksAy && pdksAy.Gunler.length > 0 ? (
        <>
          <BolumBaslik title={`Bu Ay Çalışma · ${ayAdi(String(new Date().getMonth() + 1))}`} />
          <div className="grid gap-3 lg:grid-cols-4">
            <GrafikKart
              title="Günlük Çalışma Saatleri"
              sub="PDKS kayıtlarına göre · çıkış yapılmayan günler boş"
              className="lg:col-span-3"
            >
              <DagilimBar
                data={pdksAy.Gunler.map((g) => ({ Etiket: String(g.Gun), Sayi: g.Calisma }))}
                label="Çalışma"
                bicim={saat}
              />
            </GrafikKart>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
              <StatKart
                icon={CalendarCheck}
                color="#059669"
                title="Giriş Yapılan Gün"
                value={`${pdksAy.GirisYapilanGun} gün`}
                sub={`Toplam ${saat(pdksAy.ToplamCalisma)}`}
                href="/pdks"
              />
              <StatKart
                icon={Clock}
                color="#0EA5E9"
                title="Günlük Ortalama"
                value={pdksAy.OrtalamaCalisma != null ? saat(pdksAy.OrtalamaCalisma) : "—"}
                href="/pdks"
              />
              <StatKart
                className="col-span-2 lg:col-span-1"
                icon={Timer}
                color={pdksAy.ToplamMesai ? "#D97706" : "#64748B"}
                title="Bu Ay Mesai"
                value={saat(pdksAy.ToplamMesai)}
                href="/pdks"
              />
            </div>
          </div>
        </>
      ) : null}

      <BolumBaslik title="Maaş & Ödemeler" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatKart
          className="col-span-2"
          icon={Receipt}
          color="#0EA5E9"
          title={maas ? `Son Bordro · ${ayAdi(maas.Ay)} ${maas.Yil}` : "Son Bordro"}
          loading={isLoading}
          value={maas ? (maasGizli ? "•••••• ₺" : tl(maas.NetOdenen)) : "Hesaplanmış bordro yok"}
          sub={
            maas
              ? `Net ödenen${maasGizli ? "" : ` · Ödenecek ${tl(maas.OdenecekTutar)}`} · ${
                  maas.Onayli ? "Onaylı" : "Onay bekliyor"
                }`
              : null
          }
          href="/bordro"
          right={
            maas ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  toggleMaas();
                }}
                aria-label={maasGizli ? "Maaşı göster" : "Maaşı gizle"}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
              >
                {maasGizli ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
              </button>
            ) : null
          }
        />
        <StatKart
          icon={HandCoins}
          color="#F59E0B"
          title="Avans (bu yıl)"
          loading={isLoading}
          value={avans ? tl(avans.ToplamTutar) : "—"}
          sub={
            avans
              ? avans.AylikKesinti > 0
                ? `${avans.Adet} avans · Aylık kesinti ${tl(avans.AylikKesinti)}`
                : `${avans.Adet} avans`
              : null
          }
          href="/avans"
        />
        <StatKart
          icon={CalendarDays}
          color="#8B5CF6"
          title={puantaj ? `Puantaj · ${ayAdi(puantaj.Ay)}` : "Puantaj"}
          loading={isLoading}
          value={puantaj ? `${puantaj.CalisilanGun} gün` : "Kayıt yok"}
          sub={
            puantaj
              ? `${puantaj.CalisilanSaat} saat${puantaj.FazlaMesai ? ` · FM ${puantaj.FazlaMesai}` : ""}`
              : null
          }
          href="/puantaj"
        />
        <StatKart
          icon={PlusCircle}
          color="#10B981"
          title="Eklentiler (bu yıl)"
          loading={isLoading}
          value={ek ? tl(ek.EklentiToplam) : "—"}
          href="/bordro/parametre"
        />
        <StatKart
          icon={MinusCircle}
          color="#EF4444"
          title="Kesintiler (bu yıl)"
          loading={isLoading}
          value={ek ? tl(ek.KesintiToplam) : "—"}
          href="/bordro/parametre"
        />
        <StatKart
          className="col-span-2"
          icon={Fingerprint}
          color="#052346"
          title="Bugün (PDKS)"
          loading={isLoading}
          value={pdks?.Giris ? `Giriş ${pdks.Giris}` : "Henüz giriş yok"}
          sub={pdks?.Cikis ? `Çıkış ${pdks.Cikis}` : pdks?.Giris ? "Henüz çıkış yok" : null}
          href="/pdks"
        />
      </div>
    </div>
  );
}
