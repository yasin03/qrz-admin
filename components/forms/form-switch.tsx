"use client";

import { Controller, Control, FieldPath, FieldValues } from "react-hook-form";

import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type FormSwitchProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  disabled?: boolean;
};

export function FormSwitch<T extends FieldValues>({
  control,
  name,
  label,
  disabled,
}: FormSwitchProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Field className="flex justify-between rounded-md border p-3">
          <Label>{label}</Label>

          <Switch
            checked={field.value}
            onCheckedChange={field.onChange}
            disabled={disabled}
          />
        </Field>
      )}
    />
  );
}