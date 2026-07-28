"use client";

import { Control, useFormState } from "react-hook-form";

import { FormInput, FormSelect, FormSwitch } from "@/components/forms";
import { SirketForm } from "@/schemas/kurumsal/sirket.schema";
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
const SIRKET_TIP_OPTIONS = [
  { label: "Şirket", value: "ŞİRKET" },
  { label: "Şahıs", value: "ŞAHIS" },
];
const MULKIYET_OPTIONS = [
  { label: "Kendi Mülkü", value: "Kendi Mülkü" },
  { label: "Kiralık", value: "Kiralık" },
];

// Her akordiyon bölümünün hangi form alanlarını kapsadığı — başlıkta hata
// noktası göstermek için kullanılıyor.
const SECTION_FIELDS = {
  temel: [
    "SirketAdi",
    "YetkiliKisi",
    "SirketTip",
    "MulkiyetTuru",
    "VergiDairesi",
    "VergiNo",
    "Durum",
  ],
  sahis: ["Adi", "Soyadi", "TcKimlikNo"],
  iletisim: ["Tel", "CepTel", "Fax", "EpostaAdresi", "WebAdresi"],
  adres: [
    "SirketAdresi",
    "Ulke",
    "IlKodu",
    "IlceKodu",
    "PostaKodu",
    "AdresKodu",
  ],
  resmi: [
    "IsyeriSgkSicilNumarasi",
    "IsyeriSgkIsKoluKodu",
    "TicaretSicilNumarasi",
    "MersisNumarasi",
    "TicaretSicilMudurluk",
    "IsyeriFaaliyetKodu",
    "IskurSubesi",
    "IskurNumarasi",
  ],
  tarihler: ["IsyeriAcilisTarihi", "IsyeriKapanisTarihi"],
  servis: ["ServisPassword", "ServisAktif"],
} as const satisfies Record<string, (keyof SirketForm)[]>;

type Props = {
  control: Control<SirketForm>;
};

/**
 * Şirket formunun tüm alanları, akordiyon bölümlerinde — hem SirketEkle
 * (ekleme modalı) hem de /kurumsal/sirketler/[idSirket] (detay/düzenleme
 * sayfası) bunu kullanır. Tek yerden değişiklik, ikisine de yansır.
 */
export function SirketFormFields({ control }: Props) {
  const { errors } = useFormState({ control });

  const hasError = (section: keyof typeof SECTION_FIELDS) =>
    SECTION_FIELDS[section].some((field) => Boolean(errors[field]));

  return (
    <Accordion
      type="multiple"
      defaultValue={["temel"]}
      className="w-full"
    >
      {/* Temel Bilgiler */}
      <AccordionItem value="temel">
        <AccordionTrigger>
          <SectionTitle title="Temel Bilgiler" hasError={hasError("temel")} />
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid gap-4 pt-1 sm:grid-cols-2">
            <FormInput
              control={control}
              name="SirketAdi"
              label="Şirket Adı"
              required
              placeholder="Şirket adını giriniz"
            />
            <FormInput
              control={control}
              name="YetkiliKisi"
              label="Yetkili Kişi"
              placeholder="Yetkili kişi"
            />
            <FormSelect
              control={control}
              name="SirketTip"
              label="Şirket Tipi"
              options={SIRKET_TIP_OPTIONS}
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
              required
              placeholder="Vergi dairesi"
            />
            <FormInput
              control={control}
              name="VergiNo"
              label="Vergi No"
              required
              placeholder="Vergi no"
            />
            <FormSwitch control={control} name="Durum" label="Durum" />
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Şahıs Bilgileri */}
      <AccordionItem value="sahis">
        <AccordionTrigger>
          <SectionTitle
            title="Şahıs Bilgileri"
            subtitle="opsiyonel"
            hasError={hasError("sahis")}
          />
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid gap-4 pt-1 sm:grid-cols-3">
            <FormInput control={control} name="Adi" label="Adı" />
            <FormInput control={control} name="Soyadi" label="Soyadı" />
            <FormInput
              control={control}
              name="TcKimlikNo"
              label="TC Kimlik No"
            />
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
            <FormInput
              control={control}
              name="Tel"
              label="Telefon"
              placeholder="0xxx xxx xx xx"
            />
            <FormInput
              control={control}
              name="CepTel"
              label="Cep Telefonu"
              placeholder="05xx xxx xx xx"
            />
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
              label="Şirket Adresi"
              required
              className="sm:col-span-2"
            />
            <FormInput control={control} name="Ulke" label="Ülke" required />
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
            <FormInput control={control} name="PostaKodu" label="Posta Kodu" />
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
              name="MersisNumarasi"
              label="Mersis No"
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

      {/* Servis */}
      <AccordionItem value="servis">
        <AccordionTrigger>
          <SectionTitle
            title="Servis"
            subtitle="opsiyonel"
            hasError={hasError("servis")}
          />
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid gap-4 pt-1 sm:grid-cols-2">
            <FormInput
              control={control}
              name="ServisPassword"
              label="Servis Şifresi"
              type="password"
            />
            <FormSwitch
              control={control}
              name="ServisAktif"
              label="Servis Aktif"
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