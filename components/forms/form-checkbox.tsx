"use client";

import { useId } from "react";
import { Controller, Control, FieldPath, FieldValues } from "react-hook-form";

import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type FormCheckboxProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  disabled?: boolean;
  className?: string;
};

/** Boolean alan için checkbox + tıklanabilir label (yan yana). */
export function FormCheckbox<T extends FieldValues>({
  control,
  name,
  label,
  disabled,
  className,
}: FormCheckboxProps<T>) {
  const id = useId();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className={cn("flex items-center gap-2", className)}>
          <Checkbox
            id={id}
            checked={!!field.value}
            onCheckedChange={(checked) => field.onChange(checked === true)}
            onBlur={field.onBlur}
            disabled={disabled}
          />
          <Label htmlFor={id} className="cursor-pointer font-normal">
            {label}
          </Label>
        </div>
      )}
    />
  );
}
