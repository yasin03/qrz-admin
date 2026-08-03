"use client";

import { ReactNode, useState } from "react";
import {
  Controller,
  Control,
  ControllerRenderProps,
  FieldPath,
  FieldValues,
} from "react-hook-form";
import { format as formatDate, parseISO, isValid } from "date-fns";
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

// ---- Format tipleri ve dönüştürücüleri -----------------------------------

export type InputFormat = "tcno" | "vergino" | "ceptel" | "number" | "text";

/** Her format için native input'a verilecek en uygun tip/inputMode/maxLength. */
const FORMAT_META: Record<
  InputFormat,
  { htmlType: string; inputMode?: "numeric" | "text"; maxLength?: number }
> = {
  tcno: { htmlType: "text", inputMode: "numeric", maxLength: 11 },
  vergino: { htmlType: "text", inputMode: "numeric", maxLength: 10 },
  ceptel: { htmlType: "tel", inputMode: "numeric", maxLength: 13 }, // "555 444 22 33" -> 13 karakter
  number: { htmlType: "text", inputMode: "numeric" },
  text: { htmlType: "text" },
};

/** Cep telefonunu "555 444 22 33" şeklinde grupluyor, başındaki 0'ı atıyor. */
function formatCepTel(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = digits.slice(1);
  digits = digits.slice(0, 10);

  const groups = [
    digits.slice(0, 3),
    digits.slice(3, 6),
    digits.slice(6, 8),
    digits.slice(8, 10),
  ].filter(Boolean);

  return groups.join(" ");
}

/** Ham input değerini, seçilen format'a göre filtreler/biçimlendirir. */
function applyFormat(raw: string, format?: InputFormat): string {
  switch (format) {
    case "tcno":
      return raw.replace(/\D/g, "").slice(0, 11);
    case "vergino":
      return raw.replace(/\D/g, "").slice(0, 10);
    case "number":
      return raw.replace(/\D/g, "");
    case "text":
      return raw.replace(/[0-9]/g, "");
    case "ceptel":
      return formatCepTel(raw);
    default:
      return raw;
  }
}

// ---- FormInput ------------------------------------------------------------

type FormInputProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;

  /** Boş bırakılırsa (veya hiç verilmezse) hiç label alanı render edilmez — vertical fark etmeksizin tam genişlik. */
  label?: string;

  placeholder?: string;

  type?: React.HTMLInputTypeAttribute;

  /**
   * Girdiyi otomatik filtreleyip biçimlendirir. Verilmezse normal input.
   * - "tcno": sadece rakam, 11 karakter
   * - "vergino": sadece rakam, 10 karakter
   * - "ceptel": sadece rakam, 10 haneli, "555 444 22 33" formatında, başında 0 olmaz
   * - "number": sadece rakam
   * - "text": sadece harf/metin, rakam girilemez
   */
  format?: InputFormat;

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

  /**
   * true verilirse label ve input yan yana render edilir (label ~%25,
   * input ~%75). Varsayılan false: label üstte, input altta.
   */
  vertical?: boolean;
};

export function FormInput<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  type = "text",
  format,
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
  vertical = false,
}: FormInputProps<T>) {
  const formatMeta = format ? FORMAT_META[format] : undefined;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const hasLabel = Boolean(label);

        const labelNode = hasLabel && (
          <Label htmlFor={name} className={cn(vertical && "w-1/4 shrink-0")}>
            {label}
            {required && <span className="ml-1 text-destructive">*</span>}
          </Label>
        );

        const inputNode =
          type === "date" ? (
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
                id={name}
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                value={field.value ?? ""}
                onChange={(event) => {
                  const nextValue = format
                    ? applyFormat(event.target.value, format)
                    : event.target.value;
                  field.onChange(nextValue);
                }}
                type={formatMeta?.htmlType ?? type}
                inputMode={formatMeta?.inputMode}
                placeholder={placeholder}
                disabled={disabled}
                readOnly={readOnly}
                autoComplete={autoComplete}
                maxLength={formatMeta?.maxLength ?? maxLength}
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
          );

        const errorNode = fieldState.error && (
          <p className="text-sm text-destructive">
            {fieldState.error.message}
          </p>
        );

        // Label verilmediyse (FormLabel/FormGroup içinde tek başlık altında
        // birden fazla input kullanılıyorsa) hiç label alanı ayırma.
        if (!hasLabel) {
          return (
            <Field className={className}>
              {description && (
                <p className="text-xs text-muted-foreground">
                  {description}
                </p>
              )}
              {inputNode}
              {errorNode}
            </Field>
          );
        }

        if (vertical) {
          return (
            <Field className={className}>
              <div className="flex items-center gap-3">
                {labelNode}
                <div className="flex-1 space-y-1.5">
                  {description && (
                    <p className="text-xs text-muted-foreground">
                      {description}
                    </p>
                  )}
                  {inputNode}
                  {errorNode}
                </div>
              </div>
            </Field>
          );
        }

        return (
          <Field className={className}>
            {labelNode}

            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}

            {inputNode}

            {errorNode}
          </Field>
        );
      }}
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
            formatDate(selectedDate, "d MMMM yyyy", { locale: tr })
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
            field.onChange(date ? formatDate(date, "yyyy-MM-dd") : "");
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