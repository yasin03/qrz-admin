"use client";

import { ReactNode, useState } from "react";
import {
  Controller,
  Control,
  ControllerRenderProps,
  FieldPath,
  FieldValues,
} from "react-hook-form";
import { format, parseISO, isValid } from "date-fns";
import { tr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type FormInputProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;

  label: string;

  placeholder?: string;

  type?: React.HTMLInputTypeAttribute;

  required?: boolean;

  disabled?: boolean;

  readOnly?: boolean;

  description?: string;

  className?: string;

  inputClassName?: string;

  autoComplete?: string;

  maxLength?: number;

  startIcon?: ReactNode;

  endIcon?: ReactNode;
};

export function FormInput<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  type = "text",
  required,
  disabled,
  readOnly,
  description,
  className,
  inputClassName,
  autoComplete,
  maxLength,
  startIcon,
  endIcon,
}: FormInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field className={className}>
          <Label htmlFor={name}>
            {label}

            {required && <span className="ml-1 text-destructive">*</span>}
          </Label>

          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}

          {type === "date" ? (
            <DateField
              id={name}
              field={field}
              placeholder={placeholder}
              disabled={disabled}
              className={inputClassName}
            />
          ) : (
            <div className="relative">
              {startIcon && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  {startIcon}
                </div>
              )}

              <Input
                {...field}
                id={name}
                value={field.value ?? ""}
                type={type}
                placeholder={placeholder}
                disabled={disabled}
                readOnly={readOnly}
                autoComplete={autoComplete}
                maxLength={maxLength}
                className={cn(
                  startIcon && "pl-10",
                  endIcon && "pr-10",
                  inputClassName,
                )}
              />

              {endIcon && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {endIcon}
                </div>
              )}
            </div>
          )}

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

// ---- type="date" için Calendar + Popover tabanlı seçici ------------------
// Form değeri hâlâ "yyyy-MM-dd" string olarak tutuluyor (mevcut zod
// şemaların, API'ye gönderimin beklediği format) — sadece görsel seçim
// deneyimi değişiyor, dışarıya döndürülen veri tipi aynı kalıyor.

type DateFieldProps = {
  id: string;
  field: ControllerRenderProps<any, any>;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

function DateField({
  id,
  field,
  placeholder,
  disabled,
  className,
}: DateFieldProps) {
  const [open, setOpen] = useState(false);

  const selectedDate =
    field.value && isValid(parseISO(field.value))
      ? parseISO(field.value)
      : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          color="secondary"
          appearance="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start gap-2 font-normal",
            !selectedDate && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="size-4 shrink-0" />
          {selectedDate ? (
            format(selectedDate, "d MMMM yyyy", { locale: tr })
          ) : (
            <span>{placeholder || "Tarih seçin"}</span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            field.onChange(date ? format(date, "yyyy-MM-dd") : "");
            setOpen(false);
          }}
          locale={tr}
          className="rounded-lg border"
          captionLayout="dropdown"
        />
      </PopoverContent>
    </Popover>
  );
}
