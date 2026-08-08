"use client";

import {
  Control,
  UseFormSetValue,
  useFormState,
  useWatch,
} from "react-hook-form";

import { FormInput, FormSelect, FormSwitch } from "@/components/forms";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  useIlceler,
  useIller,
  useVergiDaireleri,
} from "@/hooks/use-il-ilce-vergi-data";
import { useEffect, useRef } from "react";
import { FormLabel } from "@/components/forms/form-label";
import { PersonelForm } from "./PersonelFormType";

const SIRKET_TIP_OPTIONS = [
  { label: "Şahıs", value: "ŞAHIS" },
  { label: "Şirket", value: "ŞİRKET" },
];

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
};

/**
 * Şirket formunun tüm alanları, akordiyon bölümlerinde — hem SirketEkle
 * (ekleme modalı) hem de /kurumsal/sirketler/[idSirket] (detay/düzenleme
 * sayfası) bunu kullanır. Tek yerden değişiklik, ikisine de yansır.
 */
export function PersonelFormFields({ control, setValue }: Props) {
  const { errors } = useFormState({ control });
  const selectedIlKodu = useWatch({ control, name: "IlKodu" });

  const hasError = (section: keyof typeof SECTION_FIELDS) =>
    SECTION_FIELDS[section].some((field) => Boolean(errors[field]));

  const { data: iller = [], isLoading: illerLoading } = useIller();
  const { data: ilceler = [], isLoading: ilcelerLoading } =
    useIlceler(selectedIlKodu);
  const { data: vergiDaireleri = [], isLoading: vergiDaireleriLoading } =
    useVergiDaireleri(selectedIlKodu);

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

  return (
    <Accordion type="multiple" defaultValue={["temel"]} className="w-full">
      {/* Temel Bilgiler */}
      <AccordionItem value="temel">
        <AccordionTrigger>
          <SectionTitle title="Temel Bilgiler" hasError={hasError("temel")} />
        </AccordionTrigger>
        <AccordionContent className="flex flex-col gap-2 py-2">
          <FormLabel label="Ad Soyad">
            <FormInput control={control} name="Ad" placeholder="Adı" label="" />
            <FormInput
              control={control}
              name="Soyad"
              placeholder="Soyadı"
              label=""
            />
          </FormLabel>
          <FormSelect
            control={control}
            name="Ad"
            label="Şirket Tipi"
            options={SIRKET_TIP_OPTIONS}
          />
          <FormInput
            control={control}
            name="Soyad"
            label="Şirket Adı"
            required
            placeholder="Şirket adını giriniz"
          />
          <FormSelect
            control={control}
            name="IlKodu"
            label="İl"
            disabled={illerLoading}
            placeholder={illerLoading ? "Yükleniyor..." : "İl seçin"}
            options={iller}
            valueKey="IlKodu"
            labelKey="IlAdi"
          />
          <FormSelect
            control={control}
            name="IlceKodu"
            label="İlçe"
            disabled={!selectedIlKodu || ilcelerLoading}
            placeholder={
              !selectedIlKodu
                ? "Önce il seçin"
                : ilcelerLoading
                  ? "Yükleniyor..."
                  : "İlçe seçin"
            }
            options={ilceler}
            valueKey="IlceKodu"
            labelKey="IlceAdi"
          />

          <FormInput
            control={control}
            name="TcKimlikNo"
            label="TC Kimlik No"
            format="tcno"
          />
          <FormSwitch control={control} name="Durum" label="Durum" />
        </AccordionContent>
      </AccordionItem>

      {/* Giriş-Çıkış Bilgileri */}
      <AccordionItem value="giriscikis">
        <AccordionTrigger>
          <SectionTitle
            title="Giriş-Çıkış Bilgileri"
            hasError={hasError("giriscikis")}
          />
        </AccordionTrigger>
        <AccordionContent className="flex flex-col gap-2 py-2">
          <FormInput
            control={control}
            name="IseIlkGirisTarihi"
            label="İşe İlk Giriş Tarihi"
          />
        </AccordionContent>
      </AccordionItem>

      {/* Bordro Bilgileri */}
      <AccordionItem value="bordro">
        <AccordionTrigger>
          <SectionTitle
            title="Bordro Bilgileri"
            subtitle="opsiyonel"
            hasError={hasError("bordro")}
          />
        </AccordionTrigger>
        <AccordionContent className="flex flex-col gap-2 py-2">
          <FormInput
            control={control}
            name="Ucret"
            label="İşyeri SGK Sicil No"
          />
        </AccordionContent>
      </AccordionItem>

      {/* Adres Bilgileri */}
      <AccordionItem value="adres">
        <AccordionTrigger>
          <SectionTitle
            title="Adres Bilgileri"
            subtitle="opsiyonel"
            hasError={hasError("adres")}
          />
        </AccordionTrigger>
        <AccordionContent className="flex flex-col gap-2 py-2">
          <FormInput
            control={control}
            name="Adres"
            label="Servis Şifresi"
            type="password"
          />
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
