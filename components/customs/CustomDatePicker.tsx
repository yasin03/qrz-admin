// components/forms/custom-date-picker.tsx
"use client";

import { useState } from "react";
import { Controller, Control, FieldPath, FieldValues } from "react-hook-form";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import type { DateRange } from "react-day-picker";
import type { Matcher } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

type DatePickerMode = "single" | "range" | "multiple";

type CustomDatePickerProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  /** Boş bırakılırsa (veya hiç verilmezse) hiç label alanı render edilmez — FormSelect ile aynı davranış. */
  label?: string;
  required?: boolean;
  placeholder?: string;
  mode?: DatePickerMode;
  disabled?: boolean;
  numberOfMonths?: number;
  /** Seçim tamamlandığında (single: tarih seçilince, range: from+to tamamlanınca) popover otomatik kapansın mı. multiple'da etkisizdir. Varsayılan: true */
  closeOnComplete?: boolean;
  /** Değer varken input'un yanında temizleme (X) butonu göster. Varsayılan: true */
  clearable?: boolean;
  fromDate?: Date;
  toDate?: Date;
  dateFormat?: string;
  /**
   * true verilirse label ve buton yan yana render edilir (label ~%25,
   * buton ~%75). Varsayılan true: FormSelect ile aynı yerleşim.
   */
  vertical?: boolean;
  className?: string;
};

function formatDisplay(
  mode: DatePickerMode,
  value: unknown,
  dateFormat: string,
  placeholder?: string,
): string {
  if (mode === "range") {
    const range = value as DateRange | undefined;
    if (!range?.from) return placeholder ?? "Tarih aralığı seçiniz";
    if (!range.to) return format(range.from, dateFormat, { locale: tr });
    return `${format(range.from, dateFormat, { locale: tr })} - ${format(
      range.to,
      dateFormat,
      { locale: tr },
    )}`;
  }

  if (mode === "multiple") {
    const dates = value as Date[] | undefined;
    if (!dates?.length) return placeholder ?? "Tarih seçiniz";
    if (dates.length === 1) return format(dates[0], dateFormat, { locale: tr });
    return `${dates.length} tarih seçildi`;
  }

  // single
  const date = value as Date | undefined;
  if (!date) return placeholder ?? "Tarih seçiniz";
  return format(date, dateFormat, { locale: tr });
}

function hasValue(mode: DatePickerMode, value: unknown): boolean {
  if (mode === "range") return Boolean((value as DateRange | undefined)?.from);
  if (mode === "multiple")
    return Boolean((value as Date[] | undefined)?.length);
  return Boolean(value);
}

/**
 * FormSelect ile aynı API'ye sahip, react-hook-form'a bağlı tarih seçici.
 * Değer, seçilen mode'a göre şu tiplerde tutulur:
 *   - single    -> Date | undefined
 *   - range     -> DateRange | undefined  ({ from, to })
 *   - multiple  -> Date[] | undefined
 *
 *   <CustomDatePicker
 *     control={form.control}
 *     name="tarihAraligi"
 *     label="Tarih Aralığı"
 *     mode="range"
 *   />
 */
export function CustomDatePicker<T extends FieldValues>({
  control,
  name,
  label,
  required,
  placeholder,
  mode = "single",
  disabled,
  numberOfMonths = mode === "range" ? 2 : 1,
  closeOnComplete = true,
  clearable = true,
  fromDate,
  toDate,
  dateFormat = "d MMM yyyy",
  vertical = true,
  className,
}: CustomDatePickerProps<T>) {
  const [open, setOpen] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const hasLabel = Boolean(label);
        const disabledMatcher: Matcher | undefined =
          fromDate && toDate
            ? { before: fromDate, after: toDate }
            : fromDate
              ? { before: fromDate }
              : toDate
                ? { after: toDate }
                : undefined;
        const handleSelect = (value: any) => {
          if (mode === "range") {
            const prev = field.value as DateRange | undefined;
            const next = value as DateRange | undefined;

            const prevIsComplete = Boolean(prev?.from && prev?.to);

            // Önceki seçim yoktu ya da zaten tamamlanmıştı (from+to doluydu) ->
            // bu tıklama yeni bir aralığın başlangıcı. "to"yu bilerek undefined
            // bırakıyoruz ki kullanıcı ikinci tarihi seçene kadar popover açık kalsın.
            if (!prev?.from || prevIsComplete) {
              field.onChange({ from: next?.from, to: undefined });
              return;
            }

            // Önceki seçimde sadece "from" vardı -> bu tıklama aralığı tamamlıyor.
            field.onChange(next);
            if (closeOnComplete && next?.from && next?.to) {
              setOpen(false);
            }
            return;
          }

          field.onChange(value);

          if (!closeOnComplete || mode === "multiple") return;

          if (mode === "single" && value) {
            setOpen(false);
          }
        };

        const handleClear = (event: React.MouseEvent) => {
          event.stopPropagation();
          field.onChange(undefined);
        };

        const showClear = clearable && hasValue(mode, field.value) && !disabled;

        const trigger = (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                color="secondary"
                appearance="outline"
                disabled={disabled}
                className={cn(
                  "w-full justify-start font-normal",
                  !hasValue(mode, field.value) && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="size-4 shrink-0" />
                <span className="flex-1 truncate text-left">
                  {formatDisplay(mode, field.value, dateFormat, placeholder)}
                </span>
                {showClear && (
                  <X
                    className="size-4 shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={handleClear}
                  />
                )}
              </Button>
            </PopoverTrigger>

            <PopoverContent align="start" className="w-auto p-0">
              {mode === "range" ? (
                <Calendar
                  mode="range"
                  selected={field.value}
                  onSelect={handleSelect}
                  numberOfMonths={numberOfMonths}
                  locale={tr}
                  defaultMonth={field.value?.from}
                  disabled={disabledMatcher}
                />
              ) : mode === "multiple" ? (
                <Calendar
                  mode="multiple"
                  selected={field.value}
                  onSelect={handleSelect}
                  numberOfMonths={numberOfMonths}
                  locale={tr}
                  disabled={disabledMatcher}
                />
              ) : (
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={handleSelect}
                  numberOfMonths={numberOfMonths}
                  locale={tr}
                  defaultMonth={field.value}
                  disabled={disabledMatcher}
                />
              )}
            </PopoverContent>
          </Popover>
        );

        const errorMessage = fieldState.error && (
          <p
            className={cn(
              "text-sm text-destructive",
              hasLabel && vertical && "ml-[calc(25%+0.75rem)]",
            )}
          >
            {fieldState.error.message}
          </p>
        );

        if (!hasLabel) {
          return (
            <Field className={className}>
              {trigger}
              {errorMessage}
            </Field>
          );
        }

        const labelNode = (
          <Label className={cn(vertical && "w-1/4 shrink-0")}>
            {label}
            {required && <span className="ml-1 text-destructive">*</span>}
          </Label>
        );

        if (vertical) {
          return (
            <Field className={className}>
              <div className="flex items-center gap-3">
                {labelNode}
                <div className="flex-1">{trigger}</div>
              </div>
              {errorMessage}
            </Field>
          );
        }

        return (
          <Field className={className}>
            {labelNode}
            {trigger}
            {errorMessage}
          </Field>
        );
      }}
    />
  );
}
