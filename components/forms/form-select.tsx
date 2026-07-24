"use client";

import { Controller, Control, FieldPath, FieldValues } from "react-hook-form";

import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Option = {
  label: string;
  value: string;
};

type FormSelectProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  placeholder?: string;
  options: Option[];
  disabled?: boolean;
  valueType?: "string" | "boolean";
};

export function FormSelect<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  options,
  disabled,
  valueType = "string",
}: FormSelectProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field>
          <Label>{label}</Label>

          <Select
            value={valueType === "boolean" ? String(field.value) : field.value}
            onValueChange={(value) => {
              if (valueType === "boolean") {
                field.onChange(value === "true");
                return;
              }

              field.onChange(value);
            }}
            disabled={disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>

            <SelectContent>
              {options.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {fieldState.error && (
            <p className="text-sm text-destructive">
              {fieldState.error.message}
            </p>
          )}
        </Field>
      )}
    />
  );
}
