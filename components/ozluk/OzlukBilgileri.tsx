"use client";

import { useState, type ComponentType } from "react";
import { differenceInMonths, isValid, parseISO } from "date-fns";
import {
  BadgeCheck,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Contact,
  Filter,
  GraduationCap,
  Hash,
  HeartPulse,
  IdCard,
  Landmark,
  Phone,
  Settings2,
  ShieldCheck,
  Wallet,
  XCircle,
} from "lucide-react";

import { usePersonelDetay } from "@/hooks/use-personel";
import { useIlceler, useIller } from "@/hooks/use-il-ilce-vergi-data";
import {
  usePersonelSabitTanimlar,
  useSabitTanimlar,
} from "@/hooks/use-sabit-tanimlar";
import { formatDate, formatMoney } from "@/lib/format";
import { cn, formatIban, formatPhone, text } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Spinner } from "../ui/spinner";
import { Switch } from "../ui/switch";

type Props = {
  idSubePersonel: string | number;
  /** Yönetici görünümü: bordro parametreleri ve iç alanlar da gösterilir. */
  isAdminView?: boolean;
};

type Option = { value: string; label: string };
type IconType = ComponentType<{ className?: string }>;

// null → boş kabul edilir ("Boş alanları göster" kapalıyken gizlenir)
type FieldValue = string | boolean | null;
type Field = { label: string; value: FieldValue; span?: boolean };
type Group = { key: string; title: string; icon: IconType; fields: Field[] };

// ---- Yardımcılar --------------------------------------------------------

// Bazı kodlarda "0" / "00000" / boş dize backend'in "seçilmedi" karşılığı.
const EMPTY_SENTINELS = new Set(["", "0", "00000"]);

const code = (value: unknown): string | null => {
  const str = text(value);
  return str === null || EMPTY_SENTINELS.has(str) ? null : str;
};

const lookup = (options: Option[], value: unknown): string | null => {
  const str = code(value);
  if (str === null) return null;
  return options.find((o) => o.value === str)?.label ?? str;
};

// Backend boş tarihleri 1900-01-01 olarak dönüyor.
const toDate = (value: unknown): Date | null => {
  if (typeof value !== "string" || value === "") return null;
  const date = parseISO(value.replace("Z", ""));
  return isValid(date) && date.getFullYear() > 1900 ? date : null;
};

const date = (value: unknown): string | null => {
  const d = toDate(value);
  return d ? formatDate(d) : null;
};

const money = (value: unknown): string | null => {
  if (value === null || value === undefined || Number(value) === 0)
    return null;
  return `${formatMoney(value as number)} ₺`;
};

const num = (value: unknown, suffix = ""): string | null => {
  if (value === null || value === undefined || Number(value) === 0)
    return null;
  return `${value}${suffix}`;
};



const kidem = (value: unknown): string | null => {
  const start = toDate(value);
  if (!start) return null;
  const months = differenceInMonths(new Date(), start);
  if (months < 0) return null;
  const yil = Math.floor(months / 12);
  const ay = months % 12;
  if (yil === 0 && ay === 0) return "1 aydan az";
  return [yil && `${yil} yıl`, ay && `${ay} ay`].filter(Boolean).join(" ");
};

const initials = (ad: unknown, soyad: unknown) =>
  `${String(ad ?? "").trim()[0] ?? ""}${String(soyad ?? "").trim()[0] ?? ""}`.toLocaleUpperCase(
    "tr-TR",
  );

// ---- Alt bileşenler -----------------------------------------------------

const FieldValueView = ({ value }: { value: FieldValue }) => {
  if (typeof value === "boolean") {
    return value ? (
      <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-400">
        <CheckCircle2 className="size-3.5" /> Evet
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <XCircle className="size-3.5" /> Hayır
      </span>
    );
  }
  return <>{value ?? "-"}</>;
};

const InfoSection = ({
  title,
  icon: Icon,
  fields,
  showEmpty,
}: {
  title: string;
  icon: IconType;
  fields: Field[];
  showEmpty: boolean;
}) => {
  // Boolean alanlar "Hayır" ise de boş sayılır; sadece "Evet" olanlar öne çıksın.
  const visibleFields = showEmpty
    ? fields
    : fields.filter((f) => f.value !== null && f.value !== false);

  if (visibleFields.length === 0) return null;

  return (
    <section className="rounded-xl border border-border bg-card">
      <header className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Icon className="size-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </header>
      <dl className="grid grid-cols-1 gap-x-6 px-4 py-2 sm:grid-cols-2 lg:grid-cols-3">
        {visibleFields.map((f) => (
          <div
            key={f.label}
            className={cn(
              "flex items-baseline justify-between gap-3 border-b border-border/60 py-2 text-sm last:border-b-0",
              f.span && "sm:col-span-2 lg:col-span-3",
            )}
          >
            <dt className="shrink-0 text-muted-foreground">{f.label}</dt>
            <dd className="min-w-0 text-right font-medium wrap-break-word tabular-nums text-foreground">
              <FieldValueView value={f.value} />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
};

// ---- Ana bileşen --------------------------------------------------------

const OzlukBilgileri = ({ idSubePersonel, isAdminView = false }: Props) => {
  const [showEmpty, setShowEmpty] = useState(false);

  const { data: p, isLoading, isError } = usePersonelDetay(idSubePersonel);
console.log("p:", p);
  const {
    sgkDurumlari,
    istihdamDurumlari,
    ucretTipleri,
    odemeSekilleri,
    maasParaBirimleri,
    calismaDurumlari,
    ogrenimDurumlari,
    medeniDurumlar,
    kanGruplari,
    uyruklar,
    ozurlulukDurumlari,
  } = useSabitTanimlar();
  const { sgkBelgeTurleri, sigortaKollari, sgkKanunNolar, gorevKodlari } =
    usePersonelSabitTanimlar();

  const ilKodu = code(p?.IlKodu) ?? undefined;
  const { data: iller = [] } = useIller();
  const { data: ilceler = [] } = useIlceler(ilKodu);
console.log("ilceler:", ilceler);
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        Özlük bilgileri yüklenirken bir hata oluştu.
      </div>
    );
  }

  if (!p) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        Personel bilgisi bulunamadı.
      </div>
    );
  }

  const adSoyad = [p.Ad, p.Soyad].filter(Boolean).join(" ").trim() || "-";
  const unvan = code(p.UnvanAdi) ?? code(p.GorevAdi);
  // API kodları bazen sayı (453), bazen başında 0 olan metin ("034") dönüyor;
  // sayıya çevirip karşılaştırıyoruz.
  const ilceKodu = code(p.IlceKodu);
  const ilAdi = ilKodu
    ? (iller.find((il) => Number(il.IlKodu) === Number(ilKodu))?.IlAdi ??
      ilKodu)
    : null;
  const ilceAdi = ilceKodu
    ? (ilceler.find((ilce) => Number(ilce.IlceKodu) === Number(ilceKodu))
        ?.IlceAdi ?? ilceKodu)
    : null;
  const cinsiyet =
    p.Cinsiyet === "KADIN" ? "Kadın" : p.Cinsiyet === "ERKEK" ? "Erkek" : text(p.Cinsiyet);
  const ucretTipi = lookup(ucretTipleri, p.UcretTipi);
  const cikisTarihi = date(p.CikisTarihi);

  // ---- Özet kutuları ----
  const summary: { label: string; value: string; icon: IconType }[] = [
    { label: "Sicil No", value: text(p.SicilNo) ?? "-", icon: Hash },
    {
      label: "İşe Giriş",
      value: date(p.IseSonGirisTarihi) ?? "-",
      icon: CalendarDays,
    },
    { label: "Kıdem", value: kidem(p.IseSonGirisTarihi) ?? "-", icon: BadgeCheck },
    {
      label: ucretTipi ? `Ücret (${ucretTipi})` : "Ücret",
      value: money(p.Ucret) ?? "-",
      icon: Wallet,
    },
  ];

  // ---- Gruplar ----
  const groups: Group[] = [
    {
      key: "kimlik",
      title: "Kimlik Bilgileri",
      icon: IdCard,
      fields: [
        { label: "TC Kimlik No", value: text(p.TcKimlikNo) },
        { label: "Ad", value: text(p.Ad) },
        { label: "Soyad", value: text(p.Soyad) },
        { label: "İlk Soyad", value: text(p.IlkSoyad) },
        { label: "Cinsiyet", value: cinsiyet },
        { label: "Doğum Tarihi", value: date(p.DogumTarihi) },
        { label: "Doğum Yeri", value: text(p.DogumYeri) },
        { label: "Yaş", value: num(p.Yas) },
        { label: "Medeni Durum", value: lookup(medeniDurumlar, p.MedeniDurum) },
        { label: "Uyruk", value: lookup(uyruklar, p.Uyruk) },
        { label: "Kimlik Kartı Seri No", value: text(p.KimlikKartiSeriNo) },
        {
          label: "Kimlik Düzenleme Tarihi",
          value: date(p.KimlikKartiDuzenlemeTarihi),
        },
        { label: "Kimlik Bitiş Tarihi", value: date(p.KimlikKartiBitisTarihi) },
      ],
    },
    {
      key: "iletisim",
      title: "İletişim Bilgileri",
      icon: Contact,
      fields: [
        { label: "Telefon", value: formatPhone(p.Telefon) },
        { label: "İl", value: ilAdi },
        { label: "İlçe", value: ilceAdi },
        { label: "Adres", value: text(p.Adres), span: true },
      ],
    },
    {
      key: "is",
      title: "İş Bilgileri",
      icon: Briefcase,
      fields: [
        { label: "Görev", value: code(p.GorevAdi) },
        { label: "Unvan", value: code(p.UnvanAdi) },
        { label: "Çalışma Alanı", value: text(p.CalismaAlani) },
        { label: "Koordinatörlük", value: text(p.Koordinatorluk) },
        {
          label: "Çalışma Durumu",
          value: lookup(calismaDurumlari, p.CalismaDurumu),
        },
        {
          label: "İstihdam Durumu",
          value: lookup(istihdamDurumlari, p.IstihdamDurumu),
        },
        { label: "İlk Sigorta Başlangıç", value: date(p.IseIlkGirisTarihi) },
        { label: "İşe Giriş Tarihi", value: date(p.IseSonGirisTarihi) },
        { label: "Çıkış Tarihi", value: cikisTarihi },
        { label: "Ayrılış Kodu", value: code(p.PersonelAyrilisKodu) },
        {
          label: "Geçmişten Kalan İzin",
          value: num(p.GecmistenKalanIzinGun, " gün"),
        },
      ],
    },
    {
      key: "sgk",
      title: "SGK Bilgileri",
      icon: ShieldCheck,
      fields: [
        { label: "SGK Durumu", value: lookup(sgkDurumlari, p.SgkDurumu) },
        {
          label: "SGK Belge Türü",
          value: lookup(sgkBelgeTurleri, p.PersonelSgkBelgeTuru),
        },
        { label: "SGK Kanun No", value: lookup(sgkKanunNolar, p.PersonelKanunNo) },
        { label: "Görev Kodu", value: lookup(gorevKodlari, p.PersonelGorevKodu) },
        { label: "Meslek Kodu", value: code(p.PersonelMeslekKodu) },
        {
          label: "Sigorta Kolu",
          value: lookup(sigortaKollari, p.PersonelSigortaKolu),
        },
        { label: "İşkur Kaydı", value: Boolean(p.IskurKayit) },
        { label: "İşkur Kayıt No", value: text(p.IskurKayitNo) },
        { label: "Sendika Üyesi", value: Boolean(p.SendikaDurumu) },
        { label: "Sendika Başlangıç", value: date(p.SendikaBaslangicTarihi) },
        { label: "Dayanışma", value: Boolean(p.DayanismaDurumu) },
        { label: "Dayanışma Başlangıç", value: date(p.DayanismaBaslangicTarihi) },
      ],
    },
    {
      key: "ucret",
      title: "Ücret Bilgileri",
      icon: Wallet,
      fields: [
        { label: "Ücret Tipi", value: ucretTipi },
        { label: "Ödeme Şekli", value: lookup(odemeSekilleri, p.OdemeSekli) },
        {
          label: "Para Birimi",
          value: lookup(maasParaBirimleri, p.MaasParaBirimi),
        },
        { label: "Ücret", value: money(p.Ucret) },
        { label: "Net Ücret", value: money(p.NetUcret) },
        { label: "Günlük Ücret", value: money(p.GunlukUcret) },
        { label: "Saatlik Ücret", value: money(p.SaatlikUcret) },
        { label: "Sözleşme Ücreti", value: money(p.SozlesmeUcret) },
        { label: "Sözleşme Ücreti 2", value: money(p.SozlesmeUcret2) },
        { label: "Ücret Ödeme Günü", value: num(p.UcretOdemeGun) },
        { label: "Asgari Ücretli", value: Boolean(p.AsgeriUcretli) },
      ],
    },
    {
      key: "egitim",
      title: "Eğitim Bilgileri",
      icon: GraduationCap,
      fields: [
        {
          label: "Öğrenim Durumu",
          value: lookup(ogrenimDurumlari, p.OgrenimDurumu),
        },
        { label: "Mezuniyet Yılı", value: code(p.MezuniyetYili) },
        { label: "Mezuniyet Bölümü", value: text(p.MezuniyetBolumu) },
      ],
    },
    {
      key: "banka",
      title: "Banka Bilgileri",
      icon: Landmark,
      fields: [
        { label: "Banka", value: code(p.IDBanka) },
        { label: "Şube Kodu", value: code(p.BankaSubeKodu) },
        { label: "Hesap No", value: text(p.BankaHesapNo) },
        { label: "IBAN", value: formatIban(p.BankaIbanNo), span: true },
      ],
    },
    {
      key: "saglik",
      title: "Sağlık ve Diğer Bilgiler",
      icon: HeartPulse,
      fields: [
        { label: "Kan Grubu", value: lookup(kanGruplari, p.KanGurubu) },
        { label: "Boy", value: num(p.Boy, " cm") },
        { label: "Kilo", value: num(p.Kilo, " kg") },
        { label: "Engellilik Durumu", value: Boolean(p.OzurluDurumu) },
        {
          label: "Engellilik Derecesi",
          value: lookup(ozurlulukDurumlari, p.OzurlulukDerecesi),
        },
        { label: "Eski Hükümlü", value: Boolean(p.EskiHukumluDurumu) },
      ],
    },
  ];

  if (isAdminView) {
    groups.push({
      key: "parametre",
      title: "Bordro Parametreleri",
      icon: Settings2,
      fields: [
        { label: "Ücret 2", value: money(p.Ucret2) },
        { label: "Günlük Ücret 2", value: money(p.GunlukUcret2) },
        { label: "Saatlik Ücret 2", value: money(p.SaatlikUcret2) },
        {
          label: "Sözleşme Ödeme Şekli",
          value: lookup(odemeSekilleri, p.SozlesmeOdemeSekli),
        },
        {
          label: "Sözleşme Ödeme Şekli 2",
          value: lookup(odemeSekilleri, p.SozlesmeOdemeSekli2),
        },
        { label: "AGİ Oranı", value: num(p.AgiOrani, "%") },
        { label: "BES Oranı", value: num(p.BesOrani, "%") },
        { label: "Teşvik Oranı", value: num(p.TesvikOrani, "%") },
        { label: "Kümülatif SGK Matrahı", value: money(p.KumulatifSgkMatrahi) },
        { label: "Devreden SGK Matrahı", value: money(p.DevredenSgkMatrahi) },
        {
          label: "A.Ü. Küm. Vergi Matrahı",
          value: money(p.AuKumulatifVergiMatrahi),
        },
        { label: "Az Çalışma", value: Boolean(p.AzCalismaDurumu) },
        {
          label: "Az Çalışma Gün Sayısı",
          value: num(p.AzCalismaDurumuGunSayisi),
        },
        { label: "İstisna Durum Bilgisi", value: text(p.IstisnaDurumBilgi) },
        { label: "İstisna Durum Tarihi", value: date(p.IstisnaDurumTarih) },
        { label: "AGİ Almaz", value: Boolean(p.AgiAlmazDurumu) },
        { label: "BES Kesilmez", value: Boolean(p.BesKesilmezDurumu) },
        { label: "Vergiden Muaf", value: Boolean(p.VergidenMuaf) },
        { label: "Yardım Hariç", value: Boolean(p.YardimHaric) },
        { label: "AGİ Hariç", value: Boolean(p.AgiHaric) },
        { label: "Mali Mesuliyet", value: Boolean(p.MaliMesuliyet) },
        { label: "Çocuk Yardımı Alamaz", value: Boolean(p.CocukYardimiAlamaz) },
        {
          label: "Bordro İstisna Uygulama",
          value: Boolean(p.BordroIstisnaUygulama),
        },
        { label: "Ücret Otomatik İşle", value: Boolean(p.UcretOtomatikIsle) },
        {
          label: "Hastalık Risk Primi",
          value: Boolean(p.HastalikRiskPrimDurumu),
        },
        { label: "Kullanıcı Aktif", value: Boolean(p.KullaniciAktif) },
        { label: "Özel Kod", value: text(p.OzelKod) },
        { label: "Özel Kod 2", value: text(p.OzelKod2) },
        { label: "Açıklama", value: text(p.Aciklama), span: true },
      ],
    });
  }

  return (
    <div className="space-y-4">
      {/* Profil kartı */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary sm:size-16 sm:text-xl">
            {initials(p.Ad, p.Soyad) || "?"}
          </div>
          <div className="min-w-0 space-y-1">
            <div className="truncate text-lg font-semibold text-foreground">
              {adSoyad}
            </div>
            {unvan && (
              <div className="truncate text-sm text-muted-foreground">
                {unvan}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant={p.Durum && !cikisTarihi ? "success" : "gray"}>
                {p.Durum && !cikisTarihi ? "Aktif" : "Pasif"}
              </Badge>
              {cinsiyet && <Badge variant="default">{cinsiyet}</Badge>}
              {num(p.Yas) && <Badge variant="default">{p.Yas} yaş</Badge>}
              {cikisTarihi && (
                <Badge variant="danger">Çıkış: {cikisTarihi}</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          {formatPhone(p.Telefon) && (
            <a
              href={`tel:${String(p.Telefon).replace(/\D/g, "")}`}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <Phone className="size-4" />
              {formatPhone(p.Telefon)}
            </a>
          )}

          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                appearance="outline"
                variant="secondary"
                aria-label="Görünüm filtresi"
              >
                <Filter className="size-4" />
                <span className="hidden sm:inline">Filtre</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 gap-3 p-3">
              <div className="text-sm font-semibold">Görünüm</div>
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="ozluk-bos">Boş alanları göster</Label>
                <Switch
                  id="ozluk-bos"
                  checked={showEmpty}
                  onCheckedChange={setShowEmpty}
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Özet */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summary.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="flex flex-col gap-1 rounded-xl border border-primary/20 bg-primary/5 p-3 sm:p-4"
          >
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase">
              <Icon className="size-3.5 shrink-0 text-primary" />
              <span className="truncate">{label}</span>
            </div>
            <span className="truncate text-base font-bold tabular-nums text-foreground sm:text-lg">
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Gruplar */}
      {groups.map((group) => (
        <InfoSection
          key={group.key}
          title={group.title}
          icon={group.icon}
          fields={group.fields}
          showEmpty={showEmpty}
        />
      ))}
    </div>
  );
};

export default OzlukBilgileri;
