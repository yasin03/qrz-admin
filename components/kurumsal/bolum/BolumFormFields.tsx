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
import { BolumForm } from "@/schemas/kurumsal/bolum.schema";

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
  temel: ["BolumAdi"],
  sorumlu: [],
  calismaSaatleri: [],
  lokasyon: [],
} as const satisfies Record<string, (keyof BolumForm)[]>;

type Props = {
  control: Control<BolumForm>;
};

/**
 * Şube formunun tüm alanları, akordiyon bölümlerinde — hem SubeEkle
 * (ekleme modalı) hem de /kurumsal/subeler/[idSube] (detay/düzenleme
 * sayfası) bunu kullanır.
 */
export function BolumFormFields({ control }: Props) {
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
              name="BolumAdi"
              label="Bölüm Adı"
              required
              placeholder="Bölüm adını giriniz"
            />
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Sorumlu Bilgileri */}
      <AccordionItem value="sorumlu">
        <AccordionTrigger>
          <SectionTitle
            title="Sorumlu Bilgileri"
            hasError={hasError("sorumlu")}
          />
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid gap-4 pt-1 sm:grid-cols-2"></div>
        </AccordionContent>
      </AccordionItem>

      {/* Çalışma Saati Bilgileri */}
      <AccordionItem value="calismaSaatleri">
        <AccordionTrigger>
          <SectionTitle
            title="Çalışma Saati Bilgileri"
            hasError={hasError("calismaSaatleri")}
          />
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid gap-4 pt-1 sm:grid-cols-2"></div>
        </AccordionContent>
      </AccordionItem>

      {/* Lokasyon Bilgileri */}
      <AccordionItem value="lokasyon">
        <AccordionTrigger>
          <SectionTitle
            title="Lokasyon Bilgileri"
            hasError={hasError("lokasyon")}
          />
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid gap-4 pt-1 sm:grid-cols-2"></div>
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
