"use client";

import { useBordroById } from "@/hooks/use-bordro";
import { useUser } from "@/stores/auth-store";
import { useState, type ComponentType } from "react";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Spinner } from "../ui/spinner";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleMinus,
  Clock,
  Coins,
  Filter,
  HandCoins,
  Percent,
  TrendingUp,
  User,
  Wallet,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { AY_DATA, useYearOptions } from "@/constants/data";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  initialYil?: string | null;
  initialAy?: string | null;
};

type BordroValues = Record<string, unknown>;
type FieldType = "text" | "money" | "number" | "percent" | "boolean";
type Field = { key: string; label: string; type: FieldType };
type IconType = ComponentType<{ className?: string }>;

// ---- Alan tanımları -----------------------------------------------------

const PERSONAL_FIELDS: Field[] = [
  { key: "TcKimlikNo", label: "TC Kimlik No", type: "text" },
  { key: "SicilNo", label: "Sicil No", type: "text" },
  { key: "DogumTarihi2", label: "Doğum Tarihi", type: "text" },
  { key: "SubeAdi", label: "Şube", type: "text" },
  { key: "BolumAdi", label: "Bölüm", type: "text" },
  { key: "GorevAdi2", label: "Görev", type: "text" },
  { key: "UnvanAdi2", label: "Unvan", type: "text" },
  { key: "IseSonGirisTarihi2", label: "İşe Giriş Tarihi", type: "text" },
  { key: "CikisTarihi2", label: "Çıkış Tarihi", type: "text" },
  { key: "PersonelAyrilisKodu", label: "Ayrılış Kodu", type: "text" },
  { key: "SendikaDurumu", label: "Sendika Durumu", type: "boolean" },
  { key: "OzurlulukDerecesi", label: "Özürlülük Derecesi", type: "number" },
  { key: "SgkDurumu", label: "SGK Durumu", type: "text" },
  { key: "PersonelKanunNo", label: "SGK Kanun No", type: "text" },
  { key: "PersonelSgkBelgeTuru", label: "SGK Belge Türü", type: "text" },
  { key: "PersonelMeslekKodu", label: "Meslek Kodu", type: "text" },
  { key: "OdemeSekli", label: "Ödeme Şekli", type: "text" },
  { key: "UcretTipi", label: "Ücret Tipi", type: "text" },
];

const REPORT_GROUPS: {
  key: string;
  title: string;
  icon: IconType;
  fields: Field[];
}[] = [
  {
    key: "calisma",
    title: "Çalışma Bilgileri",
    icon: Briefcase,
    fields: [
      { key: "Ucret", label: "Ücret", type: "money" },
      { key: "NetUcret", label: "Net Ücret", type: "money" },
      { key: "GunSayisi", label: "Çalışma Gün Sayısı", type: "number" },
      { key: "SgkGunSayisi", label: "SGK Gün Sayısı", type: "number" },
      { key: "SgkEksikGun", label: "SGK Eksik Gün", type: "number" },
      { key: "ToplamGun", label: "Normal Çalışma Gün", type: "number" },
      { key: "BrutToplamGun", label: "Normal Çalışma Brüt", type: "money" },
      { key: "ToplamGT", label: "GT Gün", type: "number" },
      { key: "BrutToplamGT", label: "GT Brüt", type: "money" },
      { key: "ToplamHT", label: "HT Gün", type: "number" },
      { key: "BrutToplamHT", label: "HT Brüt", type: "money" },
      { key: "ToplamYI", label: "Yİ Gün", type: "number" },
      { key: "BrutToplamYI", label: "Yİ Brüt", type: "money" },
      { key: "SaatSayisi", label: "Saat", type: "number" },
      { key: "BrutSaatSayisi", label: "Saat Brüt", type: "money" },
    ],
  },
  {
    key: "mesai",
    title: "Mesai Bilgileri",
    icon: Clock,
    fields: [
      { key: "ToplamFMs100", label: "FM Saat 100", type: "number" },
      { key: "BrutToplamFMs100", label: "Brüt FM Saat 100", type: "money" },
      { key: "ToplamFMs50", label: "FM Saat 50", type: "number" },
      { key: "BrutToplamFMs50", label: "Brüt FM Saat 50", type: "money" },
      { key: "ToplamFMg100", label: "FM Gün 100", type: "number" },
      { key: "BrutToplamFMg100", label: "Brüt FM Gün 100", type: "money" },
      { key: "ToplamFMg50", label: "FM Gün 50", type: "number" },
      { key: "BrutToplamFMg50", label: "Brüt FM Gün 50", type: "money" },
      { key: "ToplamDMs", label: "DM Saat", type: "number" },
      { key: "BrutToplamDMs", label: "Brüt DM Saat", type: "money" },
      { key: "ToplamDMg", label: "DM Gün", type: "number" },
      { key: "BrutToplamDMg", label: "Brüt DM Gün", type: "money" },
      { key: "ToplamRMs", label: "RM Saat", type: "number" },
      { key: "BrutToplamRMs", label: "Brüt RM Saat", type: "money" },
      { key: "ToplamRMg", label: "RM Gün", type: "number" },
      { key: "BrutToplamRMg", label: "Brüt RM Gün", type: "money" },
      { key: "ToplamTisFMs", label: "TİS FM Saat", type: "number" },
      { key: "BrutToplamTisFMs", label: "Brüt TİS FM Saat", type: "money" },
      { key: "ToplamTisFMg", label: "TİS FM Gün", type: "number" },
      { key: "BrutToplamTisFMg", label: "Brüt TİS FM Gün", type: "money" },
      { key: "ToplamTisDMs", label: "TİS DM Saat", type: "number" },
      { key: "BrutToplamTisDMs", label: "Brüt TİS DM Saat", type: "money" },
      { key: "ToplamTisDMg", label: "TİS DM Gün", type: "number" },
      { key: "BrutToplamTisDMg", label: "Brüt TİS DM Gün", type: "money" },
      { key: "ToplamTisRMs", label: "TİS RM Saat", type: "number" },
      { key: "BrutToplamTisRMs", label: "Brüt TİS RM Saat", type: "money" },
      { key: "ToplamTisRMg", label: "TİS RM Gün", type: "number" },
      { key: "BrutToplamTisRMg", label: "Brüt TİS RM Gün", type: "money" },
      { key: "ToplamTisGeceMg", label: "TİS Gece M Gün", type: "number" },
      {
        key: "BrutToplamTisGeceMg",
        label: "Brüt TİS Gece M Gün",
        type: "money",
      },
      { key: "ToplamTisGeceMs", label: "TİS Gece M Saat", type: "number" },
      {
        key: "BrutToplamTisGeceMs",
        label: "Brüt TİS Gece M Saat",
        type: "money",
      },
    ],
  },
  {
    key: "yardim",
    title: "Yardım Bilgileri",
    icon: HandCoins,
    fields: [
      { key: "AskerlikYardimi", label: "Askerlik Yardımı", type: "money" },
      { key: "BayramOdenegi", label: "Bayram Ödeneği", type: "money" },
      { key: "EgitimUcreti", label: "Eğitim Ücreti", type: "money" },
      { key: "EkdersSaat", label: "Ekders Saat", type: "number" },
      { key: "EkdersUcreti", label: "Ekders Ücreti", type: "money" },
      { key: "IkramiyeOdenegi", label: "İkramiye Ödeneği", type: "money" },
      { key: "EvlilikYardimi", label: "Evlilik Yardımı", type: "money" },
      { key: "MaasFarki", label: "Maaş Farkı", type: "money" },
      { key: "OgrenimYardimi", label: "Öğrenim Yardımı", type: "money" },
      { key: "OlumYardimi", label: "Ölüm Yardımı", type: "money" },
      { key: "SilahTazminati", label: "Silah Tazminatı", type: "money" },
      { key: "TeftisFazlaMesai", label: "Teftiş Fazla Mesai", type: "money" },
      { key: "YakacakYardimi", label: "Yakacak Yardımı", type: "money" },
      { key: "CocukYardimi", label: "Çocuk Yardımı", type: "money" },
      { key: "KucukCocukYardimi", label: "Küçük Çocuk Yardımı", type: "money" },
      { key: "BuyukCocukYardimi", label: "Büyük Çocuk Yardımı", type: "money" },
      { key: "AileYardimi", label: "Aile Yardımı", type: "money" },
      { key: "KasaTazminati", label: "Kasa Tazminatı", type: "money" },
      { key: "IsRiskiYardimi", label: "İş Riski Yardımı", type: "money" },
      {
        key: "CesitliOdemelerYardimi",
        label: "Çeşitli Ödemeler Yardımı",
        type: "money",
      },
      { key: "PrimOdemeYardimi", label: "Prim Ödeme Yardımı", type: "money" },
      { key: "EkMenfaatYardimi", label: "Ek Menfaat Yardımı", type: "money" },
      { key: "YillikIzinYardimi", label: "Yıllık İzin Yardımı", type: "money" },
      {
        key: "HastalikRiskYardimi",
        label: "Hastalık Risk Yardımı",
        type: "money",
      },
      { key: "YolUcreti", label: "Yol Ücreti", type: "money" },
      { key: "KresYardimi", label: "Kreş Yardımı", type: "money" },
      { key: "ArabulucuYardimi", label: "Arabulucu Yardımı", type: "money" },
      { key: "KidemTazminati", label: "Kıdem Tazminatı", type: "money" },
      { key: "IhbarTazminati", label: "İhbar Tazminatı", type: "money" },
    ],
  },
  {
    key: "kesinti",
    title: "Kesintiler",
    icon: CircleMinus,
    fields: [
      { key: "SendikaKesintisi", label: "Sendika Kesintisi", type: "money" },
      { key: "AvansKesintisi", label: "Avans Kesintisi", type: "money" },
      { key: "IcraKesintisi", label: "İcra Kesintisi", type: "money" },
      { key: "NafakaKesintisi", label: "Nafaka Kesintisi", type: "money" },
      { key: "TelefonKesintisi", label: "Telefon Kesintisi", type: "money" },
      { key: "EgitimKesintisi", label: "Eğitim Kesintisi", type: "money" },
      { key: "TrafikKesintisi", label: "Trafik Kesintisi", type: "money" },
      { key: "HasarKesintisi", label: "Hasar Kesintisi", type: "money" },
      {
        key: "FazlaOdemeKesintisi",
        label: "Fazla Ödeme Kesintisi",
        type: "money",
      },
      { key: "SayistayKesintisi", label: "Sayıştay Kesintisi", type: "money" },
      { key: "MuhtelifKesintisi", label: "Muhtelif Kesintisi", type: "money" },
      { key: "YevmiyeKesintisi", label: "Yevmiye Kesintisi", type: "money" },
      {
        key: "DayanismaKesintisi",
        label: "Dayanışma Kesintisi",
        type: "money",
      },
      { key: "LojmanKesintisi", label: "Lojman Kesintisi", type: "money" },
      {
        key: "GecmisDonemOdemeKesintisi",
        label: "Geçmiş Dönem Ödeme K.",
        type: "money",
      },
      { key: "IsAvansiKesintisi", label: "İş Avansı Kesintisi", type: "money" },
      { key: "KresKesintisi", label: "Kreş Kesintisi", type: "money" },
      {
        key: "PostaPuluKesintisi",
        label: "Posta Pulu Kesintisi",
        type: "money",
      },
      { key: "DisiplinKesintisi", label: "Disiplin Kesintisi", type: "money" },
      {
        key: "FazlaKesilenBesTutari",
        label: "Fazla Kesilen BES",
        type: "money",
      },
      {
        key: "EksikKesilenBesKesintisi",
        label: "Eksik Kesilen BES",
        type: "money",
      },
      { key: "Bes", label: "BES Tutarı", type: "money" },
      { key: "BesOrani", label: "BES Oranı", type: "percent" },
      {
        key: "YasalKesintilerToplami",
        label: "Yasal Kesintiler Toplamı",
        type: "money",
      },
    ],
  },
  {
    key: "odeme",
    title: "Ödeme ve Vergi Bilgileri",
    icon: Coins,
    fields: [
      { key: "ToplamYemek", label: "Yemek Günü", type: "number" },
      { key: "BrutToplamYemek", label: "Yemek Brüt", type: "money" },
      { key: "ToplamYol", label: "Yol Günü", type: "number" },
      { key: "BrutToplamYol", label: "Yol Brüt", type: "money" },
      { key: "BrutToplamYolYemek", label: "Brüt Yol Yemek", type: "money" },
      { key: "BrutGunOdemeler", label: "Brüt Gün Ödemeler", type: "money" },
      { key: "BrutMesaiOdemeler", label: "Brüt Mesai Ödemeler", type: "money" },
      {
        key: "BrutYardimOdemeler",
        label: "Brüt Yardım Ödemeler",
        type: "money",
      },
      {
        key: "BrutToplamOdemeler",
        label: "Brüt Toplam Ödemeler",
        type: "money",
      },
      { key: "SgkMatrahi", label: "SGK Matrahı", type: "money" },
      { key: "SgkIsciPrimi", label: "SGK İşçi Primi", type: "money" },
      {
        key: "SgkIssizIsciPrimi",
        label: "SGK İşsizlik İşçi Primi",
        type: "money",
      },
      {
        key: "KumulatifVergiMatrahi",
        label: "Kümülatif Vergi Matrahı",
        type: "money",
      },
      { key: "VergiMatrahi", label: "Vergi Matrahı", type: "money" },
      { key: "GelirVergisi", label: "Gelir Vergisi", type: "money" },
      { key: "DamgaVergisi", label: "Damga Vergisi", type: "money" },
      {
        key: "DamgaVergisiMatrahi",
        label: "Damga Vergisi Matrahı",
        type: "money",
      },
      {
        key: "IndirimSonrasiVergiMatrahi",
        label: "İndirim Sonrası V.M.",
        type: "money",
      },
      { key: "VergiIndirimi", label: "Vergi İndirimi", type: "money" },
      { key: "PersonelIndirimi", label: "Personel İndirimi", type: "money" },
      {
        key: "IstisnaGelirVergisi",
        label: "Gelir Vergisi İstisnası",
        type: "money",
      },
      {
        key: "IstisnaDamgaVergisi",
        label: "Damga Vergisi İstisnası",
        type: "money",
      },
      {
        key: "AgiDahilToplamNet",
        label: "AGİ Dahil Toplam Net",
        type: "money",
      },
      {
        key: "AgiHaricToplamNet",
        label: "AGİ Hariç Toplam Net",
        type: "money",
      },
      { key: "ToplamDiger", label: "Toplam Diğer", type: "money" },
    ],
  },
  {
    key: "tesvik",
    title: "Teşvik Bilgileri",
    icon: Percent,
    fields: [
      { key: "Tesvik5510", label: "Teşvik 5510", type: "money" },
      { key: "Tesvik4447", label: "Teşvik 4447", type: "money" },
      { key: "Tesvik", label: "Teşvik", type: "money" },
    ],
  },
];

// "0 değerleri göster" filtresinden bağımsız, her zaman gösterilen toplamlar
const SUMMARY_FIELDS: { key: string; label: string; icon: IconType }[] = [
  { key: "NetOdenen", label: "Net Ödenen", icon: CircleCheck },
  { key: "KesintilerToplami", label: "Kesintiler", icon: CircleMinus },
  { key: "OdenecekTutar", label: "Ödenecek Tutar", icon: Wallet },
  { key: "BrutToplamOdemeler", label: "Brüt Toplam", icon: TrendingUp },
];

// ---- Yardımcılar --------------------------------------------------------

const formatFieldValue = (value: unknown, type: FieldType) => {
  switch (type) {
    case "money":
      return `${formatMoney(value as number | null)} ₺`;
    case "percent":
      return `%${value ?? 0}`;
    case "number":
      return String(value ?? 0);
    case "boolean":
      return value ? "Evet" : "Hayır";
    default:
      return value === null || value === undefined || value === ""
        ? "-"
        : String(value).trim();
  }
};

// Sayısal alanlarda 0/boş değer "gösterilmeyecek" kabul edilir.
// Metin ve boolean alanlar hiçbir zaman gizlenmez.
const isZero = (value: unknown, type: FieldType) => {
  if (type === "text" || type === "boolean") return false;
  if (value === null || value === undefined || value === "") return true;
  return Number(value) === 0;
};

// ---- Alt bileşenler -----------------------------------------------------

const ReportSection = ({
  title,
  icon: Icon,
  fields,
  values,
  showZeros,
}: {
  title: string;
  icon: IconType;
  fields: Field[];
  values: BordroValues;
  showZeros: boolean;
}) => {
  const visibleFields = showZeros
    ? fields
    : fields.filter((f) => !isZero(values[f.key], f.type));

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
            key={f.key}
            className="flex items-baseline justify-between gap-3 border-b border-border/60 py-2 text-sm last:border-b-0"
          >
            <dt className="text-muted-foreground">{f.label}</dt>
            <dd className="text-right font-medium whitespace-nowrap tabular-nums text-foreground">
              {formatFieldValue(values[f.key], f.type)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
};

const SummaryTotals = ({ values }: { values: BordroValues }) => (
  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
    {SUMMARY_FIELDS.map(({ key, label, icon: Icon }) => (
      <div
        key={key}
        className="flex flex-col gap-1 rounded-xl border border-primary/20 bg-primary/5 p-3 sm:p-4"
      >
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase">
          <Icon className="size-3.5 shrink-0 text-primary" />
          <span className="truncate">{label}</span>
        </div>
        <span className="text-base font-bold tabular-nums text-foreground sm:text-lg">
          {formatMoney(values[key] as number | null)} ₺
        </span>
      </div>
    ))}
  </div>
);

// ---- Ana bileşen --------------------------------------------------------

const PersonelBordroListesi = ({ initialYil, initialAy }: Props) => {
  const user = useUser();
  const yilSecenekleri = useYearOptions(5, 1);
  const [yil, setYil] = useState(
    initialYil || new Date().getFullYear().toString(),
  );
  const [ay, setAy] = useState(
    initialAy || (new Date().getMonth() + 1).toString().padStart(2, "0"),
  );
  const [showPersonal, setShowPersonal] = useState(false);
  const [showZeros, setShowZeros] = useState(false);

  const idSubePersonel = user?.IDSubePersonel;

  const { data, isLoading, isError } = useBordroById(
    {
      IDSubePersonel: idSubePersonel ?? "0",
      Yil: yil,
      Ay: ay,
    },
    !!idSubePersonel,
  );

  // API dizi ya da tek obje dönebilir
  const bordro = ((Array.isArray(data) ? data[0] : data) ??
    null) as BordroValues | null;

  const ayAdi = AY_DATA.find((a) => a.value === ay)?.label ?? "";
  const donem = `${ayAdi} ${yil}`;

  const handlePrevMonth = () => {
    const a = Number(ay);
    if (a === 1) {
      setAy("12");
      setYil((y) => (Number(y) - 1).toString());
    } else {
      setAy((a - 1).toString().padStart(2, "0"));
    }
  };

  const handleNextMonth = () => {
    const a = Number(ay);
    if (a === 12) {
      setAy("01");
      setYil((y) => (Number(y) + 1).toString());
    } else {
      setAy((a + 1).toString().padStart(2, "0"));
    }
  };

  return (
    <div className="space-y-4">
      {/* Başlık + filtre */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="truncate text-lg font-semibold text-foreground">
            {String(bordro?.AdSoyad ?? user?.Ad ?? "—").trim()}
          </div>
          <div className="text-sm text-muted-foreground">
            {donem}
            {bordro?.SicilNo ? ` · Sicil No: ${bordro.SicilNo}` : ""}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="icon"
            appearance="outline"
            variant="secondary"
            onClick={handlePrevMonth}
            aria-label="Önceki ay"
          >
            <ChevronLeft className="size-4" />
          </Button>

          <Select value={ay} onValueChange={setAy}>
            <SelectTrigger className="min-w-0 flex-1 sm:w-32 sm:flex-none">
              <SelectValue placeholder="Ay" />
            </SelectTrigger>
            <SelectContent>
              {AY_DATA.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={yil} onValueChange={setYil}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Yıl" />
            </SelectTrigger>
            <SelectContent>
              {yilSecenekleri.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            size="icon"
            appearance="outline"
            variant="secondary"
            onClick={handleNextMonth}
            aria-label="Sonraki ay"
          >
            <ChevronRight className="size-4" />
          </Button>

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
                <Label htmlFor="bordro-kisisel">Kişisel bilgileri göster</Label>
                <Switch
                  id="bordro-kisisel"
                  checked={showPersonal}
                  onCheckedChange={setShowPersonal}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="bordro-sifir">0 değerleri göster</Label>
                <Switch
                  id="bordro-sifir"
                  checked={showZeros}
                  onCheckedChange={setShowZeros}
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* İçerik */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="size-6 text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Bordro bilgileri yüklenirken bir hata oluştu.
        </div>
      ) : !bordro ? (
        <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          {donem} dönemi için bordro bulunamadı.
        </div>
      ) : (
        <>
          <SummaryTotals values={bordro} />

          {showPersonal && (
            <ReportSection
              title="Kişisel Bilgiler"
              icon={User}
              fields={PERSONAL_FIELDS}
              values={bordro}
              showZeros
            />
          )}

          {REPORT_GROUPS.map((group) => (
            <ReportSection
              key={group.key}
              title={group.title}
              icon={group.icon}
              fields={group.fields}
              values={bordro}
              showZeros={showZeros}
            />
          ))}

          {bordro.HesaplamaTarihi2 ? (
            <p
              className={cn(
                "text-right text-xs text-muted-foreground",
                !bordro.OnayTarihi && "italic",
              )}
            >
              Hesaplama: {String(bordro.HesaplamaTarihi2)}
              {!bordro.OnayTarihi && " · Onay bekliyor"}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
};

export default PersonelBordroListesi;
