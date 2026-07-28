"use client";

import { Control, useFormState } from "react-hook-form";

import { FormInput, FormSelect, FormSwitch } from "@/components/forms";
import { SubeForm } from "@/schemas/kurumsal/sube.schema";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
  iletisim: ["Tel", "CepTel", "Fax", "EpostaAdresi", "WebAdresi"],
  adres: ["SirketAdresi", "IlKodu", "IlceKodu", "AdresKodu"],
  resmi: [
    "IsyeriSgkSicilNumarasi",
    "IsyeriSgkIsKoluKodu",
    "TicaretSicilNumarasi",
    "TicaretSicilMudurluk",
    "IsyeriFaaliyetKodu",
    "IskurSubesi",
    "IskurNumarasi",
  ],
  tarihler: ["IsyeriAcilisTarihi", "IsyeriKapanisTarihi"],
} as const satisfies Record<string, (keyof SubeForm)[]>;

type Props = {
  control: Control<SubeForm>;
};

/**
 * Şube formunun tüm alanları, akordiyon bölümlerinde — hem SubeEkle
 * (ekleme modalı) hem de /kurumsal/subeler/[idSube] (detay/düzenleme
 * sayfası) bunu kullanır.
 */
export function SubeFormFields({ control }: Props) {
  const { errors } = useFormState({ control });

  const hasError = (section: keyof typeof SECTION_FIELDS) =>
    SECTION_FIELDS[section].some((field) => Boolean(errors[field]));

  return (
    <Accordion type="multiple" defaultValue={["temel"]} className="w-full">
      {/* Temel Bilgiler */}
      <AccordionItem value="temel">
        <AccordionTrigger>
          <SectionTitle title="Temel Bilgiler" hasError={hasError("temel")} />
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid gap-4 pt-1 sm:grid-cols-2">
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
              name="VergiDairesi"
              label="Vergi Dairesi"
            />
            <FormInput control={control} name="VergiNo" label="Vergi No" />
            <FormSwitch control={control} name="Durum" label="Durum" />
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* İletişim */}
      <AccordionItem value="iletisim">
        <AccordionTrigger>
          <SectionTitle title="İletişim" hasError={hasError("iletisim")} />
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid gap-4 pt-1 sm:grid-cols-2">
            <FormInput control={control} name="Tel" label="Telefon" />
            <FormInput control={control} name="CepTel" label="Cep Telefonu" />
            <FormInput control={control} name="Fax" label="Faks" />
            <FormInput
              control={control}
              name="EpostaAdresi"
              label="E-posta"
              placeholder="ornek@sirket.com"
            />
            <FormInput control={control} name="WebAdresi" label="Web Adresi" />
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Adres */}
      <AccordionItem value="adres">
        <AccordionTrigger>
          <SectionTitle title="Adres" hasError={hasError("adres")} />
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid gap-4 pt-1 sm:grid-cols-2">
            <FormInput
              control={control}
              name="SirketAdresi"
              label="Adres"
              required
              className="sm:col-span-2"
            />
            <FormSelect
              control={control}
              name="IlKodu"
              label="İl"
              options={IL_OPTIONS}
            />
            <FormSelect
              control={control}
              name="IlceKodu"
              label="İlçe"
              options={ILCE_OPTIONS}
            />
            <FormInput control={control} name="AdresKodu" label="Adres Kodu" />
          </div>
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
        <AccordionContent>
          <div className="grid gap-4 pt-1 sm:grid-cols-2">
            <FormInput
              control={control}
              name="IsyeriSgkSicilNumarasi"
              label="İşyeri SGK Sicil No"
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
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Tarihler */}
      <AccordionItem value="tarihler">
        <AccordionTrigger>
          <SectionTitle title="Tarihler" hasError={hasError("tarihler")} />
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid gap-4 pt-1 sm:grid-cols-2">
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