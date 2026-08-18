"use client";

import {
  Control,
  UseFormSetValue,
  useFormState,
  useWatch,
} from "react-hook-form";

import {
  FormInput,
  FormLabel,
  FormSelect,
  FormSwitch,
} from "@/components/forms";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useIlceler, useIller } from "@/hooks/use-il-ilce-vergi-data";
import { useEffect, useMemo, useRef } from "react";
import { PersonelForm } from "./PersonelFormType";
import { useSabitTanimlar } from "@/hooks/use-sabit-tanimlar";

function currentValueOption(value: unknown) {
  if (value === null || value === undefined || value === "") return [];
  return [{ value: String(value), label: String(value) }];
}

const CINSIYET_OPTIONS = [
  { label: "Kadın", value: "KADIN" },
  { label: "Erkek", value: "ERKEK" },
];

const currentYear = new Date().getFullYear();
const MEZUNIYET_YILI_OPTIONS = Array.from({ length: 41 }, (_, i) => {
  const year = String(currentYear - i);
  return { label: year, value: year };
});

// Her akordiyon bölümünün hangi form alanlarını kapsadığı — başlıkta hata
// noktası göstermek için kullanılıyor.
const SECTION_FIELDS = {
  temel: [
    "SicilNo",
    "Ad",
    "Soyad",
    "IlkSoyad",
    "Cinsiyet",
    "DogumTarihi",
    "DogumYeri",
    "MedeniDurum",
    "Uyruk",
    "KanGurubu",
    "OgrenimDurumu",
    "MezuniyetYili",
    "MezuniyetBolumu",
    "Boy",
    "Kilo",
    "Yas",
    "Telefon",
    "KimlikKartiSeriNo",
    "KimlikKartiDuzenlemeTarihi",
    "KimlikKartiBitisTarihi",
    "OzelKod",
    "OzelKod2",
    "Aciklama",
  ],

  giriscikis: [
    "IseIlkGirisTarihi",
    "IseSonGirisTarihi",
    "CikisTarihi",
    "PersonelAyrilisKodu",
    "SgkDurumu",
    "IstihdamDurumu",
    "CalismaDurumu",
    "PersonelSgkBelgeTuru",
    "PersonelKanunNo",
    "PersonelMeslekKodu",
    "PersonelGorevKodu",
    "GorevAdi",
    "UnvanAdi",
    "IDPersonelIstisnaDurum",
    "IstisnaDurumBilgi",
    "IstisnaDurumTarih",
    "PersonelSigortaKolu",
    "IskurKayitNo",
    "IskurKayit",
    "Durum",
  ],
  bordro: [
    "Ucret",
    "Ucret2",
    "GunlukUcret",
    "GunlukUcret2",
    "SaatlikUcret",
    "SaatlikUcret2",
    "NetUcret",
    "SozlesmeUcret",
    "SozlesmeUcret2",
    "MaasParaBirimi",
    "OdemeSekli",
    "SozlesmeOdemeSekli",
    "SozlesmeOdemeSekli2",
    "UcretTipi",
    "AgiOranID",
    "AgiOrani",
    "BesOrani",
    "TesvikOrani",
    "DevredenSgkMatrahi",
    "KumulatifSgkMatrahi",
    "AuKumulatifVergiMatrahi",
    "UcretOdemeGun",
    "GecmistenKalanIzinGun",
    "IDBanka",
    "BankaSubeKodu",
    "BankaHesapNo",
    "BankaIbanNo",
    "SendikaBaslangicTarihi",
    "DayanismaBaslangicTarihi",
    "OzurlulukDerecesi",
    "AzCalismaDurumuGunSayisi",
    "AgiAlmazDurumu",
    "BesKesilmezDurumu",
    "DayanismaDurumu",
    "AsgeriUcretli",
    "HastalikRiskPrimDurumu",
    "VergidenMuaf",
    "YardimHaric",
    "AgiHaric",
    "MaliMesuliyet",
    "CocukYardimiAlamaz",
    "BordroIstisnaUygulama",
    "UcretOtomatikIsle",
    "SendikaDurumu",
    "EskiHukumluDurumu",
    "OzurluDurumu",
    "AzCalismaDurumu",
    "AzCalismaDurumuGun",
  ],
  adres: [
    "Adres",
    "IlKodu",
    "IlceKodu",
    "IDLokasyon",
    "CalismaAlani",
    "Koordinatorluk",
  ],
} as const satisfies Record<string, (keyof PersonelForm)[]>;

type Props = {
  control: Control<PersonelForm>;
  setValue: UseFormSetValue<PersonelForm>;
  personel?: PersonelForm | null;
};

/**
 * Şirket formunun tüm alanları, akordiyon bölümlerinde — hem SirketEkle
 * (ekleme modalı) hem de /kurumsal/sirketler/[idSirket] (detay/düzenleme
 * sayfası) bunu kullanır. Tek yerden değişiklik, ikisine de yansır.
 */
export function PersonelFormFields({ control, setValue, personel }: Props) {
  const { errors } = useFormState({ control });

  const hasError = (section: keyof typeof SECTION_FIELDS) =>
    SECTION_FIELDS[section].some((field) => Boolean(errors[field]));

  const selectedIlKodu = useWatch({ control, name: "IlKodu" });
  const { data: iller = [] } = useIller();
  const { data: ilceler = [] } = useIlceler(selectedIlKodu || undefined);

  // İl değişince, önceki ile ait seçili ilçe geçersiz kalabileceği için
  // temizliyoruz. İlk render'da (henüz hiç il seçilmemişken) tetiklenmesin
  // diye ref ile "gerçekten değişti mi" kontrolü yapıyoruz.
  const previousIlKodu = useRef(selectedIlKodu);
  useEffect(() => {
    if (previousIlKodu.current !== selectedIlKodu) {
      setValue("IlceKodu", "", { shouldValidate: false });
    }
    previousIlKodu.current = selectedIlKodu;
  }, [selectedIlKodu, setValue]);
  const {
    sgkDurumlari,
    istihdamDurumlari,
    ucretTipleri,
    odemeSekilleri,
    sozlesmeOdemeSekilleri,
    sozlesmeOdemeSekilleri2,
    maasParaBirimleri,
    calismaDurumlari,
    ogrenimDurumlari,
    medeniDurumlar,
    kanGruplari,
    uyruklar,
    ozurlulukDurumlari,
    kanBagiDurumlari,
  } = useSabitTanimlar();

  const personelAyrilisKoduOptions = useMemo(
    () => currentValueOption(personel?.PersonelAyrilisKodu),
    [personel],
  );
  const istisnaDurumOptions = useMemo(
    () => currentValueOption(personel?.IDPersonelIstisnaDurum),
    [personel],
  );
  const agiOranIDOptions = useMemo(
    () => currentValueOption(personel?.AgiOranID),
    [personel],
  );
  const idBankaOptions = useMemo(
    () => currentValueOption(personel?.IDBanka),
    [personel],
  );
  const personelGorevKoduOptions = useMemo(
    () => currentValueOption(personel?.PersonelGorevKodu),
    [personel],
  );

  return (
    <Accordion type="single" defaultValue="personel" className="w-full">
      {/* ---- Personel Bilgileri ---- */}
      <AccordionItem value="personel">
        <AccordionTrigger className="bg-cyan-100 px-3">
          <span className="text-sm font-semibold text-foreground">
            Personel Bilgileri
          </span>
        </AccordionTrigger>
        <AccordionContent className="p-4">
          <div className=" space-y-2 pt-1">
            <FormInput
              control={control}
              name="TcKimlikNo"
              label="* TC Kimlik No"
              format="tcno"
            />
            <FormInput control={control} name="Ad" label="* Ad" format="text" />
            <FormInput
              control={control}
              name="Soyad"
              label="* Soyad"
              format="text"
            />
            <FormInput
              control={control}
              name="IlkSoyad"
              label="İlk Soyad"
              format="text"
            />
            <FormInput
              control={control}
              name="DogumTarihi"
              label="* Doğum Tarihi"
              type="date"
            />
            <FormSelect
              control={control}
              name="Cinsiyet"
              label="* Cinsiyet"
              options={CINSIYET_OPTIONS}
            />
            <FormSelect
              control={control}
              name="Uyruk"
              label="* Uyruk"
              options={uyruklar}
            />
            <FormInput control={control} name="UnvanAdi" label="Unvan Adı" />
            <FormSelect
              control={control}
              name="OgrenimDurumu"
              label="* Öğrenim Durumu"
              options={ogrenimDurumlari}
            />
            <FormSelect
              control={control}
              name="MezuniyetYili"
              label="Mezuniyet Yılı"
              options={MEZUNIYET_YILI_OPTIONS}
            />
            <FormInput
              control={control}
              name="MezuniyetBolumu"
              label="Mezuniyet Bölümü"
            />
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* ---- Giriş/Çıkış Bilgileri ---- */}
      <AccordionItem value="giris-cikis">
        <AccordionTrigger className="bg-cyan-100 px-3">
          <span className="text-sm font-semibold text-foreground">
            Giriş/Çıkış Bilgileri
          </span>
        </AccordionTrigger>
        <AccordionContent className="p-4">
          <div className="space-y-2 pt-1">
            <FormSelect
              control={control}
              name="SgkDurumu"
              label="* SGK Durumu"
              options={sgkDurumlari}
            />
            <FormSelect
              control={control}
              name="PersonelKanunNo"
              label="* SGK Kanun No"
              options={sgkDurumlari}
            />
            <FormSelect
              control={control}
              name="PersonelSgkBelgeTuru"
              label="* SGK Belge Türü"
              options={sgkDurumlari}
            />
            <FormSelect
              control={control}
              name="PersonelMeslekKodu"
              label="* Meslek Kodu"
              options={sgkDurumlari}
            />
            <FormSelect
              control={control}
              name="PersonelSigortaKolu"
              label="* Sigorta Kolu"
              options={sgkDurumlari}
            />
            <FormSelect
              control={control}
              name="PersonelGorevKodu"
              label="2821 SK Gereğince Belirlenen Sigortalının Görev Kodu"
              options={sgkDurumlari}
            />

            <FormInput
              control={control}
              name="IseIlkGirisTarihi"
              label="İlk Sigorta Başlangıç Tarihi"
              type="date"
            />
            <FormInput
              control={control}
              name="IseSonGirisTarihi"
              label="* İşe Giriş Tarihi"
              type="date"
            />
            <FormInput
              control={control}
              name="KumulatifSgkMatrahi"
              label="Geçmiş Gelir V. Matrahı"
              format="money"
            />
            <FormInput
              control={control}
              name="DevredenSgkMatrahi"
              label="Devreden SGK Matrahı"
              format="money"
            />
            <FormInput
              control={control}
              name="AuKumulatifVergiMatrahi"
              label="A.Ü. Kümülatif Vergi Matrahı"
              format="money"
            />
            <FormSwitch
              control={control}
              name="VardiyaliCalismaDurumu"
              label="Vardiyalı Çalışma Durumu"
            />
            <FormSwitch
              control={control}
              name="AzCalismaDurumu"
              label="Az Çalışma Durumu"
            />
            <FormInput
              control={control}
              name="AzCalismaDurumuGunSayisi"
              label="Az Çalışma Gün Sayısı"
              format="number"
              disabled={!useWatch({ control, name: "AzCalismaDurumu" })}
            />
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* ---- Bordro Bilgileri ---- */}
      <AccordionItem value="bordro">
        <AccordionTrigger className="bg-cyan-100 px-3">
          <span className="text-sm font-semibold text-foreground">
            Bordro Bilgileri
          </span>
        </AccordionTrigger>
        <AccordionContent className="p-4">
          <div className="pt-1 space-y-2">
            <FormSelect
              control={control}
              name="IstihdamDurumu"
              label="* İstihdam Durumu"
              options={istihdamDurumlari}
            />
            <FormSelect
              control={control}
              name="OdemeSekli"
              label="* Ödeme Şekli"
              options={odemeSekilleri}
            />
            <FormSelect
              control={control}
              name="UcretTipi"
              label="* Ücret Tipi"
              options={ucretTipleri}
            />
            <FormSwitch
              control={control}
              name="AsgeriUcretli"
              label="* Asgari Ücretli Mi?"
            />
            <FormSwitch
              control={control}
              name="EskiHukumluDurumu"
              label="Eski Hükümlü Mü?"
            />
            <FormSwitch
              control={control}
              name="OzurluDurumu"
              label="Sakatlık İndirimi Uygula"
            />
            <FormSelect
              control={control}
              name="OzurlulukDerecesi"
              label="Özürlülük Derecesi"
              options={ozurlulukDurumlari}
            />
            <FormSelect
              control={control}
              name="MaasParaBirimi"
              label="* Maaş Para Birimi"
              options={maasParaBirimleri}
            />
            <FormLabel label="* Ücret (Aylık/Günlük/Saatlik)">
              <FormInput control={control} name="Ucret" format="money" />
              <FormInput control={control} name="GunlukUcret" format="money" />
              <FormInput control={control} name="SaatlikUcret" format="money" />
            </FormLabel>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* ---- Adres Bilgileri ---- */}
      <AccordionItem value="adres">
        <AccordionTrigger className="bg-cyan-100 px-3">
          <span className="text-sm font-semibold text-foreground">
            Adres Bilgileri
          </span>
        </AccordionTrigger>
        <AccordionContent className="p-4">
          <div className="pt-1 space-y-2">
            <FormLabel label="İl / İlçe">
              <FormSelect
                control={control}
                name="IlKodu"
                options={iller}
                valueKey="IlKodu"
                labelKey="IlAdi"
              />
              <FormSelect
                control={control}
                name="IlceKodu"
                options={ilceler}
                valueKey="IlceKodu"
                labelKey="IlceAdi"
                disabled={!selectedIlKodu}
              />
            </FormLabel>
            <FormInput control={control} name="Adres" label="Adres" />
            <FormInput
              control={control}
              name="Telefon"
              label="Telefon"
              format="tel"
              placeholder="5xx xxx xx xx"
            />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function SectionTitle({
  title,
  subtitle,
  hasError,
}: {
  title: string;
  subtitle?: string;
  hasError?: boolean;
}) {
  return (
    <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
      {title}
      {subtitle && (
        <span className="text-xs font-normal text-muted-foreground">
          ({subtitle})
        </span>
      )}
      {hasError && (
        <span
          className={cn("size-1.5 rounded-full bg-destructive")}
          aria-label="Bu bölümde hata var"
        />
      )}
    </span>
  );
}
