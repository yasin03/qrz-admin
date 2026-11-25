"use client";

import { useFieldArray, useWatch, type Control, type FieldValues, type UseFormReturn } from "react-hook-form";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import { FormInput, FormSelect } from "@/components/forms";
import { Button } from "@/components/ui/button";
import { BIRIM_DATA, KDV_DATA } from "@/constants/data";
import { cn } from "@/lib/utils";
import { bosKalem, paraFormat } from "@/modules/crm/lib/teklif";
import type { TeklifKalemForm } from "@/modules/crm/schemas/teklif.schema";
import type { TeklifKalem, TeklifParaBirimi } from "@/modules/crm/types/teklif";

import { IskontoInput } from "./IskontoInput";

/** Kalem tablosunu kullanan formlar (teklif, satış): `Kalemler` dizisi aynı şekilde. */
type KalemliForm = { Kalemler: TeklifKalemForm[] };

type Props<T extends FieldValues & KalemliForm> = {
  form: UseFormReturn<T>;
  /** Canlı hesaplanmış kalemler (satır toplamı için). */
  kalemler: TeklifKalem[];
  paraBirimi: TeklifParaBirimi;
};

const HUCRE = "px-1.5 py-1.5 align-top";
const SAG = "text-right tabular-nums";

/** Listede olmayan eski bir birim (önceden serbest yazılmış) kaybolmasın. */
const birimSecenekleri = (mevcut: string | undefined) =>
  mevcut && !BIRIM_DATA.some((b) => b.value === mevcut)
    ? [...BIRIM_DATA, { value: mevcut, label: mevcut }]
    : BIRIM_DATA;

/** Teklif / satış satırları: ekle / sil / sırala; satır toplamı veri girildikçe güncellenir. */
export function TeklifKalemTablosu<T extends FieldValues & KalemliForm>({ form, kalemler, paraBirimi }: Props<T>) {
  // T, Kalemler'i aynı şekilde taşıdığı için alan yolları ortak tipten yazılır.
  const control = form.control as unknown as Control<KalemliForm>;
  const { formState } = form;
  const { fields, append, remove, move } = useFieldArray({ control, name: "Kalemler" });
  const hatalar = (formState.errors as UseFormReturn<KalemliForm>["formState"]["errors"]).Kalemler;
  const iskontoTipleri = useWatch({ control, name: "Kalemler" }).map((k) => k?.IskontoTipi);

  // Tip değişince eski değer (ör. %7 → 7 ₺) yanlış anlamla kalmasın diye temizlenir.
  const iskontoTipiDegistir = (i: number) => {
    const yeni = iskontoTipleri[i] === "2" ? "1" : "2";
    const setValue = form.setValue as unknown as UseFormReturn<KalemliForm>["setValue"];
    setValue(`Kalemler.${i}.IskontoTipi`, yeni, { shouldDirty: true });
    setValue(`Kalemler.${i}.Iskonto`, "", { shouldDirty: true, shouldValidate: formState.isSubmitted });
  };

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-225 text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="w-8 px-1.5 py-2 text-center font-medium">#</th>
              <th className="px-1.5 py-2 text-left font-medium">Kalem</th>
              <th className="w-16 px-1.5 py-2 text-right font-medium">Miktar</th>
              <th className="w-24 px-1.5 py-2 text-left font-medium">Birim</th>
              <th className="w-36 px-1.5 py-2 text-right font-medium">Birim Fiyat</th>
              <th className="w-32 px-1.5 py-2 text-right font-medium">İskonto</th>
              <th className="w-24 px-1.5 py-2 text-left font-medium">KDV</th>
              <th className="w-32 px-1.5 py-2 text-right font-medium">Toplam</th>
              <th className="w-24 px-1.5 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {fields.map((field, i) => {
              const k = kalemler[i];
              const tutarIskonto = iskontoTipleri[i] === "2";

              return (
                <tr key={field.id}>
                  <td className={cn(HUCRE, "pt-3 text-center text-xs text-muted-foreground")}>{i + 1}</td>
                  <td className={HUCRE}>
                    <div className="space-y-1">
                      <FormInput
                        control={control}
                        name={`Kalemler.${i}.Aciklama`}
                        placeholder="Ürün / hizmet adı"
                        maxLength={500}
                      />
                      <FormInput
                        control={control}
                        name={`Kalemler.${i}.Detay`}
                        type="textarea"
                        rows={1}
                        placeholder="Açıklama (opsiyonel)"
                        maxLength={1000}
                        inputClassName="min-h-8 text-xs"
                      />
                    </div>
                  </td>
                  <td className={HUCRE}>
                    <FormInput control={control} name={`Kalemler.${i}.Miktar`} format="decimal" inputClassName={SAG} />
                  </td>
                  <td className={HUCRE}>
                    <FormSelect control={control} name={`Kalemler.${i}.Birim`} options={birimSecenekleri(k?.Birim)} />
                  </td>
                  <td className={HUCRE}>
                    <FormInput
                      control={control}
                      name={`Kalemler.${i}.BirimFiyat`}
                      format="money"
                      placeholder="0,00"
                      inputClassName={SAG}
                    />
                  </td>
                  <td className={HUCRE}>
                    <IskontoInput
                      control={control}
                      name={`Kalemler.${i}.Iskonto`}
                      tutar={tutarIskonto}
                      paraBirimi={paraBirimi}
                      onTipDegistir={() => iskontoTipiDegistir(i)}
                    />
                  </td>
                  <td className={HUCRE}>
                    <FormSelect control={control} name={`Kalemler.${i}.KdvOrani`} options={KDV_DATA} />
                  </td>
                  <td className={cn(HUCRE, "pt-3", SAG)}>
                    <div className="font-medium">{paraFormat(k?.ToplamTutar ?? 0, paraBirimi)}</div>
                    {k && k.IskontoTutari > 0 && (
                      <div className="text-xs text-muted-foreground">isk. −{paraFormat(k.IskontoTutari, paraBirimi)}</div>
                    )}
                  </td>
                  <td className={HUCRE}>
                    <div className="flex justify-end gap-0.5">
                      <Button
                        type="button"
                        size="icon"
                        appearance="ghost"
                        variant="secondary"
                        disabled={i === 0}
                        onClick={() => move(i, i - 1)}
                        aria-label="Yukarı taşı"
                      >
                        <ArrowUp />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        appearance="ghost"
                        variant="secondary"
                        disabled={i === fields.length - 1}
                        onClick={() => move(i, i + 1)}
                        aria-label="Aşağı taşı"
                      >
                        <ArrowDown />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        appearance="ghost"
                        variant="danger"
                        disabled={fields.length === 1}
                        onClick={() => remove(i)}
                        aria-label="Kalemi sil"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button type="button" size="sm" appearance="outline" onClick={() => append(bosKalem())}>
          <Plus /> Kalem Ekle
        </Button>
        {hatalar?.root?.message && <p className="text-xs text-destructive">{hatalar.root.message}</p>}
        {typeof hatalar?.message === "string" && <p className="text-xs text-destructive">{hatalar.message}</p>}
      </div>
    </div>
  );
}
