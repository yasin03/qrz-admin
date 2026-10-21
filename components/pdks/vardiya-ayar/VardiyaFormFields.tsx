"use client";

import { Control, useWatch } from "react-hook-form";
import { Info } from "lucide-react";
import { z } from "zod";

import { FormInput, FormLabel, FormSwitch } from "@/components/forms";
import { FormMultiSelect } from "@/components/forms/form-multi-select";
import { HAFTA_DATA } from "@/constants/data";

/**
 * Şube ve bölüm vardiya formlarının ortak alanları, şeması ve yardımcıları —
 * SubeVardiyaEkle ve BolumVardiyaEkle ikisi de bunu kullanır.
 */

const saatRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** "08:30" → 510 (dakika); geçersizse null */
const toDakika = (saat: string) => {
  if (!saatRegex.test(saat)) return null;
  const [saatKismi, dakikaKismi] = saat.split(":").map(Number);
  return saatKismi * 60 + dakikaKismi;
};

/** Başlama → bitiş arası dakika; gece vardiyasında bitiş ertesi güne geçer */
const mesaiDakikasi = (baslama: string, bitis: string, gece: boolean) => {
  const bas = toDakika(baslama);
  const bit = toDakika(bitis);
  if (bas === null || bit === null) return null;
  const fark = bit - bas;
  return gece && fark <= 0 ? fark + 24 * 60 : fark;
};

/** 510 → "8.30 saat", 480 → "8 saat" */
const formatSure = (dakika: number) => {
  const saat = Math.floor(dakika / 60);
  const kalan = dakika % 60;
  return kalan
    ? `${saat}.${String(kalan).padStart(2, "0")} saat`
    : `${saat} saat`;
};

/** "5-7" → "Cuma, Pazar" */
export const formatHaftaTatili = (value?: string | null) =>
  String(value ?? "")
    .split("-")
    .map((gun) => HAFTA_DATA.find((item) => item.value === gun)?.label)
    .filter(Boolean)
    .join(", ");

export const vardiyaSchema = z
  .object({
    VardiyaAdi: z.string().min(2, "Vardiya adı en az 2 karakter olmalı"),
    BaslamaSaati: z.string().regex(saatRegex, "Geçerli bir saat giriniz"),
    BitisSaati: z.string().regex(saatRegex, "Geçerli bir saat giriniz"),
    Gece: z.boolean(),
    // "7" / "5-7" gibi HAFTA_DATA değerleri, "-" ile birleşik
    HaftaTatilGunu: z.string().min(1, "Hafta tatili seçiniz"),
    // Günlük toplam mola süresi, "HH:mm" (örn. 2 saat 30 dk → "02:30")
    ToplamMolaSuresi: z.string().regex(saatRegex, "Geçerli bir süre giriniz"),
  })
  .refine((data) => data.Gece || data.BaslamaSaati < data.BitisSaati, {
    message: "Bitiş saati başlangıçtan sonra olmalı",
    path: ["BitisSaati"],
  })
  .refine(
    (data) => {
      const mesai = mesaiDakikasi(
        data.BaslamaSaati,
        data.BitisSaati,
        data.Gece,
      );
      const mola = toDakika(data.ToplamMolaSuresi);
      return mesai === null || mola === null || mola < mesai;
    },
    {
      message: "Mola süresi mesai süresinden kısa olmalı",
      path: ["ToplamMolaSuresi"],
    },
  );

export type VardiyaForm = z.infer<typeof vardiyaSchema>;

export const VARDIYA_DEFAULT_VALUES: VardiyaForm = {
  VardiyaAdi: "",
  BaslamaSaati: "",
  BitisSaati: "",
  Gece: false,
  HaftaTatilGunu: "",
  ToplamMolaSuresi: "",
};

type Props = {
  control: Control<VardiyaForm>;
  disabled?: boolean;
};

export function VardiyaFormFields({ control, disabled }: Props) {
  const [baslamaSaati, bitisSaati, molaSuresi, gece] = useWatch({
    control,
    name: ["BaslamaSaati", "BitisSaati", "ToplamMolaSuresi", "Gece"],
  });
  const toplamMesai = mesaiDakikasi(baslamaSaati, bitisSaati, gece);
  const toplamMola = toDakika(molaSuresi) ?? 0;
  // Bitiş başlamadan önceyse (gece değilken) özet göstermiyoruz; şema zaten hata veriyor
  const ozetGoster = toplamMesai !== null && toplamMesai > 0;
  const toplamCalisma = ozetGoster ? toplamMesai - toplamMola : 0;

  return (
    <div className="space-y-3 py-1">
      <FormInput
        control={control}
        name="VardiyaAdi"
        label="Vardiya Adı"
        placeholder="Örn: Gündüz Vardiyası"
        disabled={disabled}
      />

      <FormLabel label="Başlama / Bitiş Saatleri" vertical>
        <FormInput
          control={control}
          name="BaslamaSaati"
          type="time"
          disabled={disabled}
        />

        <FormInput
          control={control}
          name="BitisSaati"
          type="time"
          disabled={disabled}
        />
      </FormLabel>

      <FormInput
        control={control}
        name="ToplamMolaSuresi"
        label="Günlük Toplam Mola Süresi"
        type="time"
        disabled={disabled}
      />

      <FormMultiSelect
        control={control}
        name="HaftaTatilGunu"
        label="Hafta Tatili"
        options={HAFTA_DATA}
        valueSeparator="-"
        placeholder="Gün seçiniz"
        searchPlaceholder="Gün ara..."
        maxVisibleChips={7}
        disabled={disabled}
      />

      <FormSwitch
        control={control}
        name="Gece"
        label="Gece Vardiyası"
        disabled={disabled}
      />

      {ozetGoster && (
        <div className="flex gap-2 rounded-md border border-cyan-200 bg-cyan-50 p-3 text-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-cyan-700" />
          <dl className="grid flex-1 grid-cols-[auto_1fr] gap-x-2 gap-y-1">
            <dt className="text-muted-foreground">Toplam Mesai Saati:</dt>
            <dd className="font-medium">{formatSure(toplamMesai)}</dd>
            <dt className="text-muted-foreground">Toplam Mola Süresi:</dt>
            <dd className="font-medium">{formatSure(toplamMola)}</dd>
            <dt className="text-muted-foreground">Toplam Çalışma Süresi:</dt>
            <dd
              className={
                toplamCalisma > 0
                  ? "font-semibold"
                  : "font-semibold text-destructive"
              }
            >
              {toplamCalisma > 0
                ? formatSure(toplamCalisma)
                : "Mola mesaiden uzun"}
            </dd>
          </dl>
        </div>
      )}
    </div>
  );
}
