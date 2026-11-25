"use client";

import type { Control, FieldPath, FieldValues } from "react-hook-form";

import { FormInput } from "@/components/forms";
import { Button } from "@/components/ui/button";
import { paraSembol } from "@/constants/data";
import { cn } from "@/lib/utils";
import type { TeklifParaBirimi } from "@/modules/crm/types/teklif";

type Props<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  /** true → tutar (para birimi), false → yüzde. */
  tutar: boolean;
  paraBirimi: TeklifParaBirimi;
  onTipDegistir: () => void;
  className?: string;
};

/** İskonto alanı: değer girişi + input'un sağında % / para birimi geçiş düğmesi (satır ve genel iskonto ortak). */
export function IskontoInput<T extends FieldValues>({
  control,
  name,
  tutar,
  paraBirimi,
  onTipDegistir,
  className,
}: Props<T>) {
  return (
    <div className={cn("relative", className)}>
      <FormInput
        // Format değişince alan yeniden kurulsun (oran ↔ para maskesi).
        key={tutar ? "tutar" : "oran"}
        control={control}
        name={name}
        format={tutar ? "money" : "oran"}
        placeholder={tutar ? "0,00" : "0"}
        inputClassName="pr-11 text-right tabular-nums"
      />
      <Button
        type="button"
        size="xs"
        appearance="ghost"
        variant="secondary"
        className="absolute top-1 right-1 min-w-7 bg-muted px-1.5"
        onClick={onTipDegistir}
        title={tutar ? "Tutar iskontosu, yüzdeye geçmek için tıklayın" : "Yüzde iskonto, tutara geçmek için tıklayın"}
        aria-label={tutar ? "Yüzde iskontoya geç" : "Tutar iskontosuna geç"}
      >
        {tutar ? paraSembol(paraBirimi) : "%"}
      </Button>
    </div>
  );
}
