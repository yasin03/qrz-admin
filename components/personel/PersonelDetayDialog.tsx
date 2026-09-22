"use client";

import type { ComponentType, ReactNode } from "react";
import {
  Briefcase,
  CheckCircle2,
  Contact,
  GraduationCap,
  IdCard,
  Loader2,
  Ruler,
  UserRound,
  Wallet,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePersonelDetay } from "@/hooks/use-personel";
import { useIlceler, useIller } from "@/hooks/use-il-ilce-vergi-data";
import {
  usePersonelSabitTanimlar,
  useSabitTanimlar,
} from "@/hooks/use-sabit-tanimlar";
import { formatDate, formatMoney } from "@/lib/format";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  id?: string | number | null;
};

type Option = { value: string; label: string };

// Bazı kodlarda "0" / "00000" / boş dize, backend'in "seçilmedi" karşılığı —
// bu alanlarda ham kodu göstermek yerine "-" gösteriyoruz.
const EMPTY_SENTINELS = new Set(["", "0", "00000"]);

function dash(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  const str = String(value).trim();
  return str === "" ? "-" : str;
}

function dashZero(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  const str = String(value).trim();
  return EMPTY_SENTINELS.has(str) ? "-" : str;
}

function findLabel(options: Option[], value: unknown): string {
  if (value === null || value === undefined) return "-";
  const str = String(value).trim();
  if (str === "") return "-";
  const match = options.find((option) => option.value === str);
  return match ? match.label : str;
}

function money(value: number | string | null | undefined, currency?: string) {
  const amount = formatMoney(value);
  return currency ? `${amount} ${currency}` : amount;
}

function InfoItem({
  label,
  value,
  span,
}: {
  label: string;
  value: ReactNode;
  span?: boolean;
}) {
  return (
    <div className={span ? "space-y-0.5 sm:col-span-2 lg:col-span-3" : "space-y-0.5"}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground wrap-break-word">{value || "-"}</p>
    </div>
  );
}

function BoolValue({ value }: { value: boolean | null | undefined }) {
  if (value === null || value === undefined) {
    return <span className="text-sm text-muted-foreground">-</span>;
  }
  return value ? (
    <span className="inline-flex items-center gap-1 text-sm text-green-700 dark:text-green-400">
      <CheckCircle2 className="size-3.5" /> Evet
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
      <XCircle className="size-3.5" /> Hayır
    </span>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border">
      <div className="flex items-center gap-2 border-b bg-cyan-100 px-3 py-2.5">
        <Icon className="size-4 shrink-0 text-foreground" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="grid grid-cols-1 gap-x-4 gap-y-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </section>
  );
}

export default function PersonelDetayDialog({ open, onOpenChange, id }: Props) {
  const isEditMode = Boolean(id);

  const {
    data: personel,
    isLoading,
    isError,
  } = usePersonelDetay(open && isEditMode ? (id ?? undefined) : undefined);

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

  const ilKodu = personel?.IlKodu ? String(personel.IlKodu) : "";
  const { data: iller = [] } = useIller();
  const { data: ilceler = [] } = useIlceler(
    ilKodu && ilKodu !== "0" ? ilKodu : undefined,
  );

  const ilAdi =
    ilKodu && ilKodu !== "0"
      ? (iller.find((il) => il.IlKodu === ilKodu)?.IlAdi ?? dash(ilKodu))
      : "-";
  const ilceAdi = personel?.IlceKodu
    ? (ilceler.find((ilce) => ilce.IlceKodu === String(personel.IlceKodu))
        ?.IlAdi ?? dash(personel.IlceKodu))
    : "-";

  const adSoyad = personel
    ? [personel.Ad, personel.Soyad].filter(Boolean).join(" ")
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Personel Detayı</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : isError || !personel ? (
          <p className="py-8 text-center text-sm text-destructive">
            Personel bilgileri getirilemedi.
          </p>
        ) : (
          <div className="space-y-4">
            {/* ---- Özet ---- */}
            <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 p-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserRound className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-foreground">
                  {adSoyad || "-"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Sicil No: {dash(personel.SicilNo)}
                </p>
              </div>
              <Badge variant={personel.Durum ? "success" : "gray"}>
                {personel.Durum ? "Aktif" : "Pasif"}
              </Badge>
            </div>

            {/* ---- Kimlik Bilgileri ---- */}
            <Section icon={IdCard} title="Kimlik Bilgileri">
              <InfoItem label="Ad" value={dash(personel.Ad)} />
              <InfoItem label="Soyad" value={dash(personel.Soyad)} />
              <InfoItem label="İlk Soyad" value={dash(personel.IlkSoyad)} />
              <InfoItem label="TC Kimlik No" value={dash(personel.TcKimlikNo)} />
              <InfoItem
                label="Cinsiyet"
                value={
                  personel.Cinsiyet === "KADIN"
                    ? "Kadın"
                    : personel.Cinsiyet === "ERKEK"
                      ? "Erkek"
                      : dash(personel.Cinsiyet)
                }
              />
              <InfoItem label="Doğum Tarihi" value={formatDate(personel.DogumTarihi)} />
              <InfoItem label="Doğum Yeri" value={dash(personel.DogumYeri)} />
              <InfoItem label="Yaş" value={dash(personel.Yas)} />
              <InfoItem
                label="Medeni Durum"
                value={findLabel(medeniDurumlar, personel.MedeniDurum)}
              />
              <InfoItem label="Uyruk" value={findLabel(uyruklar, personel.Uyruk)} />
              <InfoItem label="Kan Grubu" value={findLabel(kanGruplari, personel.KanGurubu)} />
              <InfoItem label="Unvan Adı" value={dashZero(personel.UnvanAdi)} />
              <InfoItem
                label="Kimlik Kartı Seri No"
                value={dash(personel.KimlikKartiSeriNo)}
              />
              <InfoItem
                label="Kimlik Kartı Düzenleme Tarihi"
                value={formatDate(personel.KimlikKartiDuzenlemeTarihi)}
              />
              <InfoItem
                label="Kimlik Kartı Bitiş Tarihi"
                value={formatDate(personel.KimlikKartiBitisTarihi)}
              />
            </Section>

            {/* ---- İletişim Bilgileri ---- */}
            <Section icon={Contact} title="İletişim Bilgileri">
              <InfoItem label="Telefon" value={dash(personel.Telefon)} />
              <InfoItem label="İl" value={ilAdi} />
              <InfoItem label="İlçe" value={ilceAdi} />
              <InfoItem label="Çalışma Alanı" value={dash(personel.CalismaAlani)} />
              <InfoItem label="Koordinatörlük" value={dash(personel.Koordinatorluk)} />
              <InfoItem label="Adres" value={dash(personel.Adres)} span />
            </Section>

            {/* ---- İş ve SGK Bilgileri ---- */}
            <Section icon={Briefcase} title="İş ve SGK Bilgileri">
              <InfoItem label="SGK Durumu" value={findLabel(sgkDurumlari, personel.SgkDurumu)} />
              <InfoItem
                label="İstihdam Durumu"
                value={findLabel(istihdamDurumlari, personel.IstihdamDurumu)}
              />
              <InfoItem
                label="Çalışma Durumu"
                value={findLabel(calismaDurumlari, personel.CalismaDurumu)}
              />
              <InfoItem label="Meslek Kodu" value={dash(personel.PersonelMeslekKodu)} />
              <InfoItem
                label="SGK Belge Türü"
                value={findLabel(sgkBelgeTurleri, personel.PersonelSgkBelgeTuru)}
              />
              <InfoItem
                label="SGK Kanun No"
                value={findLabel(sgkKanunNolar, personel.PersonelKanunNo)}
              />
              <InfoItem
                label="Görev Kodu"
                value={findLabel(gorevKodlari, personel.PersonelGorevKodu)}
              />
              <InfoItem
                label="Sigorta Kolu"
                value={findLabel(sigortaKollari, personel.PersonelSigortaKolu)}
              />
              <InfoItem
                label="İlk Sigorta Başlangıç Tarihi"
                value={formatDate(personel.IseIlkGirisTarihi)}
              />
              <InfoItem label="İşe Giriş Tarihi" value={formatDate(personel.IseSonGirisTarihi)} />
              <InfoItem label="Çıkış Tarihi" value={formatDate(personel.CikisTarihi)} />
              <InfoItem label="Ayrılış Kodu" value={dashZero(personel.PersonelAyrilisKodu)} />
              <InfoItem label="Az Çalışma Durumu" value={<BoolValue value={personel.AzCalismaDurumu} />} />
              <InfoItem
                label="Az Çalışma Gün Sayısı"
                value={dash(personel.AzCalismaDurumuGunSayisi)}
              />
              <InfoItem label="İşkur Kayıt" value={<BoolValue value={personel.IskurKayit} />} />
              <InfoItem label="İşkur Kayıt No" value={dash(personel.IskurKayitNo)} />
              <InfoItem label="Sendika Durumu" value={<BoolValue value={personel.SendikaDurumu} />} />
              <InfoItem
                label="Sendika Başlangıç Tarihi"
                value={formatDate(personel.SendikaBaslangicTarihi)}
              />
              <InfoItem
                label="Dayanışma Durumu"
                value={<BoolValue value={personel.DayanismaDurumu} />}
              />
              <InfoItem
                label="Dayanışma Başlangıç Tarihi"
                value={formatDate(personel.DayanismaBaslangicTarihi)}
              />
              <InfoItem label="İstisna Durum Bilgisi" value={dash(personel.IstisnaDurumBilgi)} />
              <InfoItem
                label="İstisna Durum Tarihi"
                value={formatDate(personel.IstisnaDurumTarih)}
              />
              <InfoItem
                label="Kümülatif SGK Matrahı"
                value={money(personel.KumulatifSgkMatrahi)}
              />
              <InfoItem label="Devreden SGK Matrahı" value={money(personel.DevredenSgkMatrahi)} />
              <InfoItem
                label="A.Ü. Kümülatif Vergi Matrahı"
                value={money(personel.AuKumulatifVergiMatrahi)}
              />
            </Section>

            {/* ---- Ücret Bilgileri ---- */}
            <Section icon={Wallet} title="Ücret Bilgileri">
              <InfoItem label="Ücret Tipi" value={findLabel(ucretTipleri, personel.UcretTipi)} />
              <InfoItem label="Ödeme Şekli" value={findLabel(odemeSekilleri, personel.OdemeSekli)} />
              <InfoItem
                label="Maaş Para Birimi"
                value={findLabel(maasParaBirimleri, personel.MaasParaBirimi)}
              />
              <InfoItem label="Ücret" value={money(personel.Ucret)} />
              <InfoItem label="Günlük Ücret" value={money(personel.GunlukUcret)} />
              <InfoItem label="Saatlik Ücret" value={money(personel.SaatlikUcret)} />
              <InfoItem label="Ücret 2" value={money(personel.Ucret2)} />
              <InfoItem label="Günlük Ücret 2" value={money(personel.GunlukUcret2)} />
              <InfoItem label="Saatlik Ücret 2" value={money(personel.SaatlikUcret2)} />
              <InfoItem label="Sözleşme Ücreti" value={money(personel.SozlesmeUcret)} />
              <InfoItem
                label="Sözleşme Ödeme Şekli"
                value={findLabel(odemeSekilleri, personel.SozlesmeOdemeSekli)}
              />
              <InfoItem label="Sözleşme Ücreti 2" value={money(personel.SozlesmeUcret2)} />
              <InfoItem
                label="Sözleşme Ödeme Şekli 2"
                value={findLabel(odemeSekilleri, personel.SozlesmeOdemeSekli2)}
              />
              <InfoItem label="Net Ücret" value={money(personel.NetUcret)} />
              <InfoItem label="Asgari Ücretli" value={<BoolValue value={personel.AsgeriUcretli} />} />
              <InfoItem label="AGİ Oranı" value={dash(personel.AgiOrani)} />
              <InfoItem label="AGİ Almaz Durumu" value={<BoolValue value={personel.AgiAlmazDurumu} />} />
              <InfoItem label="BES Oranı" value={dash(personel.BesOrani)} />
              <InfoItem label="BES Kesilmez Durumu" value={<BoolValue value={personel.BesKesilmezDurumu} />} />
              <InfoItem label="Teşvik Oranı" value={dash(personel.TesvikOrani)} />
              <InfoItem label="Vergiden Muaf" value={<BoolValue value={personel.VergidenMuaf} />} />
              <InfoItem label="Yardım Hariç" value={<BoolValue value={personel.YardimHaric} />} />
              <InfoItem label="AGİ Hariç" value={<BoolValue value={personel.AgiHaric} />} />
              <InfoItem label="Mali Mesuliyet" value={<BoolValue value={personel.MaliMesuliyet} />} />
              <InfoItem
                label="Çocuk Yardımı Alamaz"
                value={<BoolValue value={personel.CocukYardimiAlamaz} />}
              />
              <InfoItem
                label="Bordro İstisna Uygulama"
                value={<BoolValue value={personel.BordroIstisnaUygulama} />}
              />
              <InfoItem
                label="Ücret Otomatik İşle"
                value={<BoolValue value={personel.UcretOtomatikIsle} />}
              />
              <InfoItem label="Ücret Ödeme Günü" value={dash(personel.UcretOdemeGun)} />
              <InfoItem
                label="Hastalık Risk Prim Durumu"
                value={<BoolValue value={personel.HastalikRiskPrimDurumu} />}
              />
            </Section>

            {/* ---- Eğitim ve Banka ---- */}
            <Section icon={GraduationCap} title="Eğitim ve Banka">
              <InfoItem
                label="Öğrenim Durumu"
                value={findLabel(ogrenimDurumlari, personel.OgrenimDurumu)}
              />
              <InfoItem label="Mezuniyet Yılı" value={dash(personel.MezuniyetYili)} />
              <InfoItem label="Mezuniyet Bölümü" value={dash(personel.MezuniyetBolumu)} />
              <InfoItem label="Banka" value={dashZero(personel.IDBanka)} />
              <InfoItem label="Banka Şube Kodu" value={dashZero(personel.BankaSubeKodu)} />
              <InfoItem label="Banka Hesap No" value={dash(personel.BankaHesapNo)} />
              <InfoItem label="Banka IBAN No" value={dash(personel.BankaIbanNo)} span />
            </Section>

            {/* ---- Fiziksel ve Diğer Bilgiler ---- */}
            <Section icon={Ruler} title="Fiziksel ve Diğer Bilgiler">
              <InfoItem label="Boy (cm)" value={dash(personel.Boy)} />
              <InfoItem label="Kilo (kg)" value={dash(personel.Kilo)} />
              <InfoItem label="Özürlü Durumu" value={<BoolValue value={personel.OzurluDurumu} />} />
              <InfoItem
                label="Özürlülük Derecesi"
                value={findLabel(ozurlulukDurumlari, personel.OzurlulukDerecesi)}
              />
              <InfoItem
                label="Eski Hükümlü Durumu"
                value={<BoolValue value={personel.EskiHukumluDurumu} />}
              />
              <InfoItem
                label="Geçmişten Kalan İzin Günü"
                value={dash(personel.GecmistenKalanIzinGun)}
              />
              <InfoItem label="Özel Kod" value={dash(personel.OzelKod)} />
              <InfoItem label="Özel Kod 2" value={dash(personel.OzelKod2)} />
              <InfoItem
                label="Kullanıcı Aktif"
                value={<BoolValue value={personel.KullaniciAktif} />}
              />
              <InfoItem label="Açıklama" value={dash(personel.Aciklama)} span />
            </Section>
          </div>
        )}

        <DialogFooter>
          <Button type="button" appearance="outline" onClick={() => onOpenChange(false)}>
            Kapat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
