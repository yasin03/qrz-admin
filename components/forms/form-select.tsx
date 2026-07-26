"use client";

import { Controller, Control, FieldPath, FieldValues } from "react-hook-form";

import { cn } from "@/lib/utils";
import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FormSelectProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  placeholder?: string;
  options: any[];
  disabled?: boolean;
  valueType?: "string" | "boolean" | "number";
  /** options'taki her öğeden "değer" olarak okunacak alan adı. Örn: "IlKodu", "IDSirket". Varsayılan: "value" */
  valueKey?: string;
  /** options'taki her öğeden "görünen metin" olarak okunacak alan adı. Örn: "SirketAdi". Varsayılan: "label" */
  labelKey?: string;
  /**
   * true verilirse label ve select yan yana render edilir (label ~%25,
   * select ~%75). Varsayılan false: label üstte, select altta.
   */
  vertical?: boolean;
};

export function FormSelect<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  options,
  disabled,
  valueType = "string",
  valueKey = "value",
  labelKey = "label",
  vertical = false,
}: FormSelectProps<T>) {

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const selectValue =
          field.value === undefined || field.value === null
            ? undefined
            : String(field.value);

        const handleValueChange = (value: string) => {
          if (valueType === "boolean") {
            field.onChange(value === "true");
            return;
          }
          if (valueType === "number") {
            field.onChange(Number(value));
            return;
          }
          field.onChange(value);
        };

        const select = (
          <Select
            value={selectValue}
            onValueChange={handleValueChange}
            disabled={disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>

            <SelectContent>
              {options.map((item) => {
                const itemValue = String(item[valueKey]);
                const itemLabel = item[labelKey];
                return (
                  <SelectItem key={itemValue} value={itemValue}>
                    {itemLabel}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        );

        const errorMessage = fieldState.error && (
          <p
            className={cn(
              "text-sm text-destructive",
              vertical && "ml-[calc(25%+0.75rem)]",
            )}
          >
            {fieldState.error.message}
          </p>
        );

        if (vertical) {
          return (
            <Field>
              <div className="flex items-center gap-3">
                <Label className="w-1/4 shrink-0">{label}</Label>
                <div className="flex-1">{select}</div>
              </div>
              {errorMessage}
            </Field>
          );
        }

        return (
          <Field>
            <Label>{label}</Label>
            {select}
            {errorMessage}
          </Field>
        );
      }}
    />
  );
}