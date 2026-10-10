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
import { CalendarIcon, Eye, EyeOff } from "lucide-react";
import type { HTMLInputTypeAttribute } from "react";

import { cn } from "@/lib/utils";

import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";

// ---- Format tipleri ve dönüştürücüleri -----------------------------------

export type InputFormat =
  | "tcno"
  | "vergino"
  | "tel"
  | "number"
  | "decimal"
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
  | "time"
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
  decimal: { htmlType: "text", inputMode: "decimal" },
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

/** Form değerini ekranda gösterilecek hale getirir. "tel" formatında değer
 *  boşluksuz tutuluyor ("2122121212"), ekranda ise gruplanmış gösteriliyor
 *  ("212 212 12 12"). Diğer formatlarda değer olduğu gibi gösteriliyor. */
function toDisplayValue(
  value: string | number | undefined | null,
  format?: InputFormat,
): string {
  if (value === undefined || value === null) return "";
  return format === "tel" ? formatTel(String(value)) : String(value);
}

/** Ham input değerini, seçilen format'a göre filtreler/biçimlendirir.
 *  Dönen değer forma yazılan değerdir ("tel" için boşluksuz rakamlar). */
function applyFormat(raw: string, format?: InputFormat): string {
  switch (format) {
    case "tcno":
      return raw.replace(/\D/g, "").slice(0, 11);
    case "vergino":
      return raw.replace(/\D/g, "").slice(0, 10);
    case "number":
      return raw.replace(/\D/g, "");
    case "decimal": {
      // Enlem/Boylam gibi alanlar için: tek leading '-', tek ondalık ayıracı.
      const cleaned = raw.replace(/[^\d,.-]/g, "");
      const hasMinus = cleaned.startsWith("-");
      const unsigned = cleaned.replace(/-/g, "").replace(/,/g, ".");
      const firstDot = unsigned.indexOf(".");
      const normalized =
        firstDot === -1
          ? unsigned
          : unsigned.slice(0, firstDot + 1) +
            unsigned.slice(firstDot + 1).replace(/\./g, "");

      return `${hasMinus ? "-" : ""}${normalized}`;
    }
    case "text":
      return raw.replace(/[0-9]/g, "");
    case "tel":
      return formatTel(raw).replace(/\s/g, "");
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

// ---- Ortak (T'den bağımsız) alanlar ---------------------------------------
type FormInputBaseProps = {
  label?: string;
  placeholder?: string;
  type?: FormInputType;
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
  rows?: number;
  vertical?: boolean;
  transform?: (value: string) => string;
};

// ---- Controlled mod: react-hook-form'a bağlı -------------------------------
type ControlledFormInputProps<T extends FieldValues> = FormInputBaseProps & {
  control: Control<T>;
  name: FieldPath<T>;
  value?: never;
  defaultValue?: never;
  onChange?: never;
};

// ---- Uncontrolled mod: value/onChange ile çalışan, forma bağlı olmayan -----
type UncontrolledFormInputProps = FormInputBaseProps & {
  control?: undefined;
  name?: undefined;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
};

type FormInputProps<T extends FieldValues> =
  | ControlledFormInputProps<T>
  | UncontrolledFormInputProps;

export function FormInput<T extends FieldValues>(props: FormInputProps<T>) {
  const { control, name, ...rest } = props;

  // control/name verilmediyse uncontrolled modda çalış — Controller'a hiç girme.
  if (!control || !name) {
    return <UncontrolledFormInput {...rest} />;
  }

  return <ControlledFormInput {...props} control={control} name={name} />;
}

function ControlledFormInput<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  type = "text",
  format,
  required,
  disabled,
  readOnly,
  transform,
  description,
  className,
  inputClassName,
  autoComplete,
  maxLength,
  startIcon,
  endIcon,
  rows,
  vertical = true,
}: FormInputProps<T> & { control: Control<T>; name: FieldPath<T> }) {
  const formatMeta = format ? FORMAT_META[format] : undefined;
  const isPassword = type === "password";
  const [showPassword, setShowPassword] = useState(false);

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

        const resolvedEndIcon = isPassword ? (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((prev) => !prev)}
            className="text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
          >
            {showPassword ? (
              <Eye className="size-4" />
            ) : (
              <EyeOff className="size-4" />
            )}
          </button>
        ) : (
          endIcon
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
                <div className="absolute left-3 top-1/2 z-10 -translate-y-1/2">
                  {startIcon}
                </div>
              )}

              <Input
                id={name}
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                value={toDisplayValue(field.value, format)}
                onChange={(event) => {
                  let nextValue = format
                    ? applyFormat(event.target.value, format)
                    : event.target.value;

                  if (transform) {
                    nextValue = transform(nextValue);
                  }

                  field.onChange(nextValue);
                }}
                type={
                  isPassword
                    ? showPassword
                      ? "text"
                      : "password"
                    : (formatMeta?.htmlType ?? type)
                }
                inputMode={formatMeta?.inputMode}
                placeholder={placeholder}
                disabled={disabled}
                readOnly={readOnly}
                autoComplete={autoComplete}
                maxLength={formatMeta?.maxLength ?? maxLength}
                className={cn(
                  startIcon && "pl-10",
                  resolvedEndIcon && "pr-10",
                  inputClassName,
                )}
              />

              {resolvedEndIcon && (
                <div className="absolute right-3 top-1/2 z-10 -translate-y-1/2">
                  {resolvedEndIcon}
                </div>
              )}
            </div>
          );

        const errorNode = fieldState.error && (
          <p className="text-sm text-destructive">{fieldState.error.message}</p>
        );

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

// ---- Uncontrolled mod (control/name verilmediğinde) ------------------------
// Form state'ine hiç dokunmuyor — sadece value/defaultValue/onChange ile
// çalışan basit bir gösterim/giriş alanı. "date" ve "money" gibi field.*
// nesnesine bağımlı özel alt bileşenler bu modda desteklenmiyor (aşağıda
// düz input/textarea'ya düşülüyor); ihtiyaç olursa ayrıca eklenebilir.

function UncontrolledFormInput(props: UncontrolledFormInputProps) {
  const {
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
    value,
    defaultValue,
    onChange,
  } = props;

  const formatMeta = format ? FORMAT_META[format] : undefined;
  const isPassword = type === "password";
  const [showPassword, setShowPassword] = useState(false);
  const inputId = `uncontrolled-${label ?? "input"}`;

  const hasLabel = Boolean(label);

  const labelNode = hasLabel && (
    <Label htmlFor={inputId} className={cn(vertical && "w-1/4 shrink-0")}>
      {label}
      {required && <span className="ml-1 text-destructive">*</span>}
    </Label>
  );

  const resolvedEndIcon = isPassword ? (
    <button
      type="button"
      tabIndex={-1}
      onClick={() => setShowPassword((prev) => !prev)}
      className="text-muted-foreground hover:text-foreground"
      aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
    >
      {showPassword ? (
        <Eye className="size-4" />
      ) : (
        <EyeOff className="size-4" />
      )}
    </button>
  ) : (
    endIcon
  );

  const inputNode =
    type === "textarea" ? (
      <Textarea
        id={inputId}
        value={value}
        defaultValue={defaultValue}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        maxLength={maxLength}
        rows={rows ?? 4}
        className={cn("resize-y", inputClassName)}
      />
    ) : (
      <div className="relative">
        {startIcon && (
          <div className="absolute left-3 top-1/2 z-10 -translate-y-1/2">
            {startIcon}
          </div>
        )}

        <Input
          id={inputId}
          value={value === undefined ? undefined : toDisplayValue(value, format)}
          defaultValue={
            defaultValue === undefined
              ? undefined
              : toDisplayValue(defaultValue, format)
          }
          onChange={(event) => {
            const nextValue = format
              ? applyFormat(event.target.value, format)
              : event.target.value;
            onChange?.(nextValue);
          }}
          type={
            isPassword
              ? showPassword
                ? "text"
                : "password"
              : (formatMeta?.htmlType ?? type)
          }
          inputMode={formatMeta?.inputMode}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          autoComplete={autoComplete}
          maxLength={formatMeta?.maxLength ?? maxLength}
          className={cn(
            startIcon && "pl-10",
            resolvedEndIcon && "pr-10",
            inputClassName,
          )}
        />

        {resolvedEndIcon && (
          <div className="absolute right-3 top-1/2 z-10 -translate-y-1/2">
            {resolvedEndIcon}
          </div>
        )}
      </div>
    );

  if (!hasLabel) {
    return (
      <Field className={className}>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {inputNode}
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
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {inputNode}
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
    </Field>
  );
}

// ---- type="date" için elle yazılabilir tarih alanı + takvim ---------------
// Form değeri hâlâ "yyyy-MM-dd" string olarak tutuluyor (mevcut zod
// şemaların, API'ye gönderimin beklediği format). Ekranda "gg.aa.yyyy"
// gösteriliyor; kullanıcı ister yazıyor (24.03.2026, 24-03-2026,
// 24/03/2026, 24032026), ister sağdaki ikondan takvimle seçiyor.

const DISPLAY_DATE_FORMAT = "dd.MM.yyyy";
const VALUE_DATE_FORMAT = "yyyy-MM-dd";

/** "yyyy-MM-dd" form değerini ekran formatına çevirir; geçersizse "". */
function toDisplayDate(value: unknown): string {
  if (!value || typeof value !== "string") return "";
  const date = parseISO(value);
  return isValid(date) ? formatDate(date, DISPLAY_DATE_FORMAT) : "";
}

/**
 * Kullanıcının yazdığı metni tarihe çevirir. Kabul edilenler:
 * 24.03.2026 / 24-03-2026 / 24/03/2026 (gün ve ay tek hane de olabilir)
 * ve ayraçsız 24032026. 31.02.2026 gibi takvimde olmayan tarihler geçersiz.
 */
function parseDisplayDate(text: string): Date | null {
  const trimmed = text.trim();
  const match =
    trimmed.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/) ??
    trimmed.match(/^(\d{2})(\d{2})(\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (year < 1900 || year > 2100) return null;

  const date = new Date(year, month - 1, day);
  const isSameDate =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;

  return isSameDate ? date : null;
}

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
  const [text, setText] = useState(() => toDisplayDate(field.value));
  const wrapperRef = useRef<HTMLDivElement>(null);
  // Takvimde gösterilen ay (seçili tarihten bağımsız gezinilebiliyor).
  const [month, setMonth] = useState<Date | undefined>(() =>
    field.value && isValid(parseISO(field.value))
      ? parseISO(field.value)
      : undefined,
  );
  // field.value'nun EN SON kendi onChange'imizle mi değiştiğini, yoksa
  // dışarıdan mı (form.reset gibi) değiştiğini ayırt etmek için
  // (MoneyField ile aynı yaklaşım).
  const lastEmitted = useRef(field.value);

  useEffect(() => {
    if (field.value !== lastEmitted.current) {
      setText(toDisplayDate(field.value));
      lastEmitted.current = field.value;
      if (field.value && isValid(parseISO(field.value))) {
        setMonth(parseISO(field.value));
      }
    }
  }, [field.value]);

  const emit = (value: string) => {
    lastEmitted.current = value;
    field.onChange(value);
  };

  const selectedDate =
    field.value && isValid(parseISO(field.value))
      ? parseISO(field.value)
      : undefined;

  // Yazarken: metin geçerli bir tarih olur olmaz form değerini güncelle;
  // tamamen silinirse değeri temizle. Yarım metinde form değerine dokunma.
  const handleChange = (nextText: string) => {
    const cleaned = nextText.replace(/[^\d./-]/g, "").slice(0, 10);
    setText(cleaned);

    if (!cleaned) {
      emit("");
      return;
    }

    const parsed = parseDisplayDate(cleaned);
    if (parsed) {
      emit(formatDate(parsed, VALUE_DATE_FORMAT));
      setMonth(parsed);
    }
  };

  // Alan bırakılınca: geçerliyse "gg.aa.yyyy" şeklinde düzelt (24-3-2026 ->
  // 24.03.2026), geçersizse son geçerli tarihe geri dön.
  const commit = () => {
    const parsed = parseDisplayDate(text);
    if (parsed) {
      setText(formatDate(parsed, DISPLAY_DATE_FORMAT));
    } else if (text.trim()) {
      setText(toDisplayDate(field.value));
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* Input Popover'ın tetikleyicisi değil çıpası: tıklayınca takvim
          açılıyor ama odak input'ta kalıyor, kullanıcı yazmaya devam
          edebiliyor. */}
      <PopoverAnchor asChild>
        <div ref={wrapperRef} className="relative">
          <Input
            id={id}
            name={field.name}
            ref={field.ref}
            value={text}
            onChange={(event) => {
              handleChange(event.target.value);
              setOpen(true);
            }}
            onClick={() => setOpen(true)}
            onBlur={() => {
              commit();
              field.onBlur();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commit();
                setOpen(false);
              } else if (event.key === "Escape" || event.key === "Tab") {
                setOpen(false);
              } else if (event.key === "ArrowDown") {
                setOpen(true);
              }
            }}
            inputMode="numeric"
            autoComplete="off"
            placeholder={placeholder || "gg.aa.yyyy"}
            disabled={disabled}
            className={cn("pr-9", className)}
          />

          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            aria-label="Takvimden tarih seç"
            onClick={() => setOpen((prev) => !prev)}
            className="absolute top-1/2 right-1 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            <CalendarIcon className="size-4" />
          </button>
        </div>
      </PopoverAnchor>

      <PopoverContent
        className="w-auto p-0"
        align="start"
        // Açılınca odağı takvime taşıma — kullanıcı input'ta yazmaya devam etsin.
        onOpenAutoFocus={(event) => event.preventDefault()}
        // Input'a / ikona tıklamak "dışarı tıklama" sayılıp takvimi
        // kapatmasın (onları kendi handler'ları yönetiyor).
        onInteractOutside={(event) => {
          if (wrapperRef.current?.contains(event.target as Node)) {
            event.preventDefault();
          }
        }}
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          // Kontrollü ay: yazılan tarih geçerli olunca takvim o aya geçiyor.
          month={month}
          onMonthChange={setMonth}
          onSelect={(date) => {
            const value = date ? formatDate(date, VALUE_DATE_FORMAT) : "";
            emit(value);
            setText(toDisplayDate(value));
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
