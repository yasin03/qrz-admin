"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
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
import type { HTMLInputTypeAttribute } from "react";

import { cn } from "@/lib/utils";

import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// ---- Format tipleri ve dönüştürücüleri -----------------------------------

export type InputFormat =
  | "tcno"
  | "vergino"
  | "tel"
  | "number"
  | "text"
  | "money";

/** Field'ın davranışını belirleyen "tip". Native input type'larından
 *  ayrı tutuyoruz çünkü "date" ve "textarea" tamamen farklı component'lere
 *  render ediliyor, native <input type="..."> değiller. */
export type FormInputType =
  | "text"
  | "email"
  | "password"
  | "tel"
  | "url"
  | "search"
  | "date"
  | "textarea";

/** Her format için native input'a verilecek en uygun tip/inputMode/maxLength. */
const FORMAT_META: Record<
  InputFormat,
  {
    htmlType: HTMLInputTypeAttribute;
    inputMode?: "numeric" | "text" | "decimal";
    maxLength?: number;
  }
> = {
  tcno: { htmlType: "text", inputMode: "numeric", maxLength: 11 },
  vergino: { htmlType: "text", inputMode: "numeric", maxLength: 10 },
  tel: { htmlType: "tel", inputMode: "numeric", maxLength: 13 }, // "555 444 22 33" -> 13 karakter
  number: { htmlType: "text", inputMode: "numeric" },
  text: { htmlType: "text" },
  money: { htmlType: "text", inputMode: "decimal" },
};

/** Cep telefonunu "555 444 22 33" şeklinde grupluyor, başındaki 0'ı atıyor. */
function formatTel(raw: string): string {
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
    case "tel":
      return formatTel(raw);
    default:
      return raw;
  }
}

// ---- "money" format yardımcıları ------------------------------------------
// Form değeri (field.value / API'ye giden) HER ZAMAN düz ondalık string:
// "255", "3500", "4345.88" gibi (nokta ondalık ayracı, binlik ayracı yok).
// Gösterilen (ekrandaki) değer ise Türkçe formatlı: "255,00", "3.500,00",
// "4.345,88", "1.250.000,54" — ikisi farklı olduğu için ayrı bir alt
// component (MoneyField) bu ikisi arasındaki dönüşümü yönetiyor.

/** API formatındaki bir değeri (örn. "4345.88") ekran formatına çevirir. */
function formatMoneyDisplay(
  apiValue: string | number | undefined | null,
): string {
  if (apiValue === "" || apiValue === null || apiValue === undefined) return "";
  const [wholeRaw, decRaw = ""] = String(apiValue).split(".");
  const whole = wholeRaw.replace(/\D/g, "") || "0";
  const decimals = decRaw.replace(/\D/g, "").padEnd(2, "0").slice(0, 2);
  const groupedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${groupedWhole},${decimals}`;
}

/**
 * Kullanıcının o an yazdığı ham metni işler. Ondalığı YAZARKEN zorla
 * 2 haneye tamamlamıyoruz (yoksa "88" yazmaya çalışırken her tuşta
 * "80"a zıplardı) — o tamamlama sadece onBlur'da yapılıyor.
 */
function applyMoneyFormat(raw: string): { display: string; api: string } {
  let cleaned = raw.replace(/[^\d,]/g, "");
  if (!cleaned) return { display: "", api: "" };

  // Sadece ilk virgül geçerli, geri kalanları at.
  const firstComma = cleaned.indexOf(",");
  if (firstComma !== -1) {
    cleaned =
      cleaned.slice(0, firstComma + 1) +
      cleaned.slice(firstComma + 1).replace(/,/g, "");
  }

  const hasComma = cleaned.includes(",");
  let [wholePart, decPart = ""] = cleaned.split(",");
  wholePart = wholePart.replace(/^0+(?=\d)/, "");
  decPart = decPart.slice(0, 2);

  const groupedWhole = (wholePart || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  const display = hasComma ? `${groupedWhole},${decPart}` : groupedWhole;
  const api = hasComma ? `${wholePart || "0"}.${decPart}` : wholePart || "";

  return { display, api };
}

/** onBlur'da ondalığı tam 2 haneye tamamlar: "4345.8" -> "4345.80". */
function padMoneyApiValue(api: string): string {
  if (!api) return "";
  const [whole, dec = ""] = api.split(".");
  return `${whole || "0"}.${dec.padEnd(2, "0").slice(0, 2)}`;
}

// ---- FormInput ------------------------------------------------------------

type FormInputProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;

  /** Boş bırakılırsa (veya hiç verilmezse) hiç label alanı render edilmez — vertical fark etmeksizin tam genişlik. */
  label?: string;

  placeholder?: string;

  /**
   * "date" -> Calendar + Popover seçici
   * "textarea" -> çok satırlı metin alanı
   * diğerleri -> native <input type="...">
   */
  type?: FormInputType;

  /**
   * Girdiyi otomatik filtreleyip biçimlendirir. Verilmezse normal input.
   * (type="textarea" veya type="date" iken dikkate alınmaz.)
   * - "tcno": sadece rakam, 11 karakter
   * - "vergino": sadece rakam, 10 karakter
   * - "tel": sadece rakam, 10 haneli, "555 444 22 33" formatında, başında 0 olmaz
   * - "number": sadece rakam
   * - "text": sadece harf/metin, rakam girilemez
   * - "money": Türkçe para gösterimi ("1.250.000,54"), form değeri düz
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

  /** Sadece type="textarea" için satır sayısı. Varsayılan 4. */
  rows?: number;

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
  rows,
  vertical = true,
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
          ) : type === "textarea" ? (
            <Textarea
              id={name}
              name={field.name}
              ref={field.ref}
              value={field.value ?? ""}
              onChange={(event) => field.onChange(event.target.value)}
              onBlur={field.onBlur}
              placeholder={placeholder}
              disabled={disabled}
              readOnly={readOnly}
              maxLength={maxLength}
              rows={rows ?? 4}
              className={cn("resize-y", inputClassName)}
            />
          ) : format === "money" ? (
            <MoneyField
              id={name}
              field={field}
              placeholder={placeholder}
              disabled={disabled}
              readOnly={readOnly}
              className={cn(
                startIcon && "pl-10",
                endIcon && "pr-10",
                inputClassName,
              )}
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
          <p className="text-sm text-destructive">{fieldState.error.message}</p>
        );

        // Label verilmediyse (FormLabel/FormGroup içinde tek başlık altında
        // birden fazla input kullanılıyorsa) hiç label alanı ayırma.
        if (!hasLabel) {
          return (
            <Field className={className}>
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
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

// ---- format="money" için para giriş alanı --------------------------------
// field.value her zaman API formatında ("4345.88") tutuluyor. Ekrandaki
// metin ise ayrı bir local state'te — çünkü yazarken canlı Türkçe formata
// çeviriyoruz (binlik nokta, ondalık virgül) ama ondalığı 2 haneye
// TAMAMLAMA işini sadece blur'da yapıyoruz (yoksa yazarken zıplardı).

type MoneyFieldProps = {
  id: string;
  field: ControllerRenderProps<any, any>;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
};

function MoneyField({
  id,
  field,
  placeholder,
  disabled,
  readOnly,
  className,
}: MoneyFieldProps) {
  const [text, setText] = useState(() => formatMoneyDisplay(field.value));
  // field.value'nun EN SON kendi onChange'imizle mi değiştiğini, yoksa
  // dışarıdan mı (form.reset gibi) değiştiğini ayırt etmek için.
  const lastEmitted = useRef(field.value);

  useEffect(() => {
    if (field.value !== lastEmitted.current) {
      setText(formatMoneyDisplay(field.value));
      lastEmitted.current = field.value;
    }
  }, [field.value]);

  return (
    <Input
      id={id}
      name={field.name}
      ref={field.ref}
      value={text}
      onChange={(event) => {
        const { display, api } = applyMoneyFormat(event.target.value);
        setText(display);
        lastEmitted.current = api;
        field.onChange(api);
      }}
      onBlur={() => {
        const padded = padMoneyApiValue(lastEmitted.current ?? "");
        lastEmitted.current = padded;
        field.onChange(padded);
        setText(formatMoneyDisplay(padded));
        field.onBlur();
      }}
      type="text"
      inputMode="decimal"
      placeholder={placeholder ?? "0,00"}
      disabled={disabled}
      readOnly={readOnly}
      className={className}
    />
  );
}
