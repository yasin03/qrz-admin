"use client";

import {
  Control,
  UseFormSetValue,
  useFormState,
  useWatch,
} from "react-hook-form";

import { FormInput, FormSelect, FormSwitch } from "@/components/forms";
import { SubeForm } from "@/schemas/kurumsal/sube.schema";
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

const IL_OPTIONS = [
  { label: "Ankara", value: "006" },
  { label: "İstanbul", value: "034" },
];
const ILCE_OPTIONS = [
  { label: "Keçiören", value: "79" },
  { label: "Çankaya", value: "06" },
];
const MULKIYET_OPTIONS = [
  { label: "Kendi Mülkü", value: "Kendi Mülkü" },
  { label: "Kiralık", value: "Kiralık" },
];

// Her akordiyon bölümünün hangi form alanlarını kapsadığı — başlıkta hata
// noktası göstermek için kullanılıyor.
const SECTION_FIELDS = {
  temel: [
    "SubeAdi",
    "SubeKodu",
    "YetkiliKisi",
    "MulkiyetTuru",
    "VergiDairesi",
    "VergiNo",
    "Durum",
  ],

  adres: [
    "SirketAdresi",
    "IlKodu",
    "IlceKodu",
    "AdresKodu",
    "Tel",
    "CepTel",
    "Fax",
    "EpostaAdresi",
    "WebAdresi",
  ],
  resmi: [
    "IsyeriSgkSicilNumarasi",
    "IsyeriSgkIsKoluKodu",
    "TicaretSicilNumarasi",
    "TicaretSicilMudurluk",
    "IsyeriFaaliyetKodu",
    "IskurSubesi",
    "IskurNumarasi",
    "IsyeriAcilisTarihi",
    "IsyeriKapanisTarihi",
  ],
} as const satisfies Record<string, (keyof SubeForm)[]>;

type Props = {
  control: Control<SubeForm>;
  setValue: UseFormSetValue<SubeForm>;
};

/**
 * Şube formunun tüm alanları, akordiyon bölümlerinde — hem SubeEkle
 * (ekleme modalı) hem de /kurumsal/subeler/[idSube] (detay/düzenleme
 * sayfası) bunu kullanır.
 */
export function SubeFormFields({ control, setValue }: Props) {
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
          <FormInput
            control={control}
            name="SubeAdi"
            label="Şube Adı"
            required
            placeholder="Şube adını giriniz"
          />
          <FormInput control={control} name="SubeKodu" label="Şube Kodu" />
          <FormInput
            control={control}
            name="YetkiliKisi"
            label="Yetkili Kişi"
          />
          <FormSelect
            control={control}
            name="MulkiyetTuru"
            label="Mülkiyet Türü"
            options={MULKIYET_OPTIONS}
          />
          <FormInput
            control={control}
            name="Ulke"
            label="Ülke"
            required
            readOnly
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
          <FormSelect
            control={control}
            name="VergiDairesi"
            label="Vergi Dairesi"
            placeholder={
              vergiDaireleriLoading
                ? "Yükleniyor..."
                : selectedIlKodu
                  ? "Vergi dairesi seçin"
                  : "Önce il seçin (veya tüm daireler listelenir)"
            }
            disabled={vergiDaireleriLoading}
            options={vergiDaireleri}
            valueKey="IDVergiDairesi"
            labelKey="DaireAdi"
          />
          <FormInput
            control={control}
            name="VergiNo"
            label="Vergi No"
            format="vergino"
          />
          <FormSwitch control={control} name="Durum" label="Durum" />
        </AccordionContent>
      </AccordionItem>

      {/* Adres */}
      <AccordionItem value="adres">
        <AccordionTrigger>
          <SectionTitle title="Adres" hasError={hasError("adres")} />
        </AccordionTrigger>
        <AccordionContent className="flex flex-col gap-2 py-2">
          <FormInput
            control={control}
            name="SirketAdresi"
            label="Adres"
            required
            className="sm:col-span-2"
          />
          <FormInput
            control={control}
            name="Tel"
            label="Telefon"
            placeholder="2xx xxx xx xx"
            format="tel"
          />
          <FormInput
            control={control}
            name="CepTel"
            label="Cep Telefonu"
            placeholder="5xx xxx xx xx"
            format="tel"
          />
          <FormInput control={control} name="Fax" label="Faks" />
          <FormInput
            control={control}
            name="EpostaAdresi"
            label="E-posta"
            placeholder="ornek@sirket.com"
          />
          <FormInput control={control} name="WebAdresi" label="Web Adresi" />
          <FormInput
            control={control}
            name="AdresKodu"
            label="Adres Kodu"
            format="number"
          />
        </AccordionContent>
      </AccordionItem>

      {/* Resmi Kayıtlar */}
      <AccordionItem value="resmi">
        <AccordionTrigger>
          <SectionTitle
            title="Resmi Kayıtlar"
            subtitle="opsiyonel"
            hasError={hasError("resmi")}
          />
        </AccordionTrigger>
        <AccordionContent className="flex flex-col gap-2 py-2">
          <FormInput
            control={control}
            name="IsyeriSgkSicilNumarasi"
            label="İşyeri SGK Sicil No"
            vertical
          />
          <FormInput
            control={control}
            name="IsyeriSgkIsKoluKodu"
            label="İşyeri SGK İş Kolu Kodu"
          />
          <FormInput
            control={control}
            name="TicaretSicilNumarasi"
            label="Ticaret Sicil No"
          />
          <FormInput
            control={control}
            name="TicaretSicilMudurluk"
            label="Ticaret Sicil Müdürlüğü"
          />
          <FormInput
            control={control}
            name="IsyeriFaaliyetKodu"
            label="İşyeri Faaliyet Kodu"
          />
          <FormInput
            control={control}
            name="IskurSubesi"
            label="İşkur Şubesi"
          />
          <FormInput
            control={control}
            name="IskurNumarasi"
            label="İşkur Numarası"
          />
          <FormInput
            control={control}
            name="IsyeriAcilisTarihi"
            label="İşyeri Açılış Tarihi"
            type="date"
            required
          />
          <FormInput
            control={control}
            name="IsyeriKapanisTarihi"
            label="İşyeri Kapanış Tarihi"
            type="date"
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
