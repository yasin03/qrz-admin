"use client";

import { Controller, Control, FieldPath, FieldValues } from "react-hook-form";

import { cn } from "@/lib/utils";
import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type FormSwitchProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  /** Boş bırakılırsa (veya hiç verilmezse) hiç label alanı render edilmez — vertical fark etmeksizin tam genişlik. */
  label?: string;
  disabled?: boolean;
  /**
   * true verilirse label sola (~%25), switch sağa (~%75, sola yaslı)
   * hizalanır — FormInput/FormSelect'teki vertical prop'uyla aynı sütun
   * genişliğini kullanır. Varsayılan false: label solda, switch en sağda
   * (justify-between, tam genişlik).
   */
  vertical?: boolean;
  className?: string;
};

export function FormSwitch<T extends FieldValues>({
  control,
  name,
  label,
  disabled,
  vertical = true,
  className,
}: FormSwitchProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const hasLabel = Boolean(label);

        const switchNode = (
          <Switch
            checked={field.value}
            onCheckedChange={field.onChange}
            disabled={disabled}
          />
        );

        // Label verilmediyse (FormLabel/FormGroup içinde tek başlık altında
        // birden fazla switch kullanılıyorsa) hiç label alanı ayırma —
        // sadece switch'i sola yaslı, tam genişlikte bas.
        if (!hasLabel) {
          return (
            <Field className={cn("p-3", className)}>{switchNode}</Field>
          );
        }

        if (vertical) {
          return (
            <Field className={cn("", className)}>
              <div className="flex items-center gap-3">
                <Label className="w-1/4 shrink-0">{label}</Label>
                <div className="flex-1">{switchNode}</div>
              </div>
            </Field>
          );
        }

        return (
          <Field className={cn("flex justify-between p-3", className)}>
            <Label>{label}</Label>
            {switchNode}
          </Field>
        );
      }}
    />
  );
}