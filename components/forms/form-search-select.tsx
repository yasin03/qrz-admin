"use client";

import { useEffect, useState } from "react";
import { Controller, Control, FieldPath, FieldValues } from "react-hook-form";
import { ChevronsUpDown, Loader2, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { SelectOption } from "@/types/form";
import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

// ---- Arama ile çalışan select ---------------------------------------------
// FormSelect'ten farkı: seçenekler baştan verilmiyor, kullanıcı yazdıkça
// API'den çekiliyor (meslek kodu gibi binlerce kayıtlı listeler için).
// Seçenekleri getiren hook `useOptions` prop'u ile veriliyor; component
// yazılan metni debounce edip bu hook'a geçiriyor. Örn:
//
//   <FormSearchSelect
//     control={control}
//     name="PersonelMeslekKodu"
//     label="Meslek Kodu"
//     useOptions={useMeslekKodlari}
//   />
//
// Form değeri sadece seçilen option'ın `value`'su. Düzenleme modunda
// kayıtlı değerin label'ı henüz aranmadığı için bilinmiyor — o durumda
// trigger'da değerin kendisi gösteriliyor.

type UseSearchOptions = (search: string) => {
  options: SelectOption[];
  isLoading: boolean;
};

type FormSearchSelectProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  required?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  /** Seçenekleri arama metnine göre getiren hook (debounce edilmiş metinle çağrılır). */
  useOptions: UseSearchOptions;
  /** Bu kadar karakter yazılmadan arama yapılmaz. Varsayılan: 2 */
  minSearchLength?: number;
  debounceMs?: number;
  disabled?: boolean;
  vertical?: boolean;
  className?: string;
};

function useDebouncedValue<V>(value: V, delay: number): V {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export function FormSearchSelect<T extends FieldValues>({
  control,
  name,
  label,
  required,
  placeholder = "Seçiniz",
  searchPlaceholder = "Aramak için yazın...",
  useOptions,
  minSearchLength = 2,
  debounceMs = 300,
  disabled,
  vertical = true,
  className,
}: FormSearchSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), debounceMs);

  // Seçilen değerin label'ını sakla — arama metni değişip seçilen option
  // sonuç listesinden çıksa da trigger'da doğru metin görünsün.
  const [selectedLabels, setSelectedLabels] = useState<Record<string, string>>(
    {},
  );

  const canSearch = debouncedSearch.length >= minSearchLength;
  const { options, isLoading } = useOptions(debouncedSearch);
  const visibleOptions = canSearch ? options : [];

  const isTyping = search.trim() !== debouncedSearch;

  const emptyMessage =
    search.trim().length < minSearchLength
      ? `Aramak için en az ${minSearchLength} karakter yazın.`
      : isLoading || isTyping
        ? "Aranıyor..."
        : "Sonuç bulunamadı.";

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const hasLabel = Boolean(label);
        const value =
          field.value === undefined || field.value === null
            ? ""
            : String(field.value);

        const displayLabel =
          selectedLabels[value] ??
          options.find((item) => item.value === value)?.label ??
          value;

        const handleSelect = (option: SelectOption) => {
          setSelectedLabels((prev) => ({
            ...prev,
            [option.value]: option.label,
          }));
          field.onChange(option.value);
          setOpen(false);
          setSearch("");
        };

        const handleClear = (event: React.MouseEvent) => {
          event.stopPropagation();
          field.onChange("");
        };

        const trigger = (
          // modal: Dialog içinde kullanıldığında Dialog'un scroll kilidi
          // (portal ile dışarı render edilen) listede tekerlek scroll'unu
          // engelliyordu — modal Popover kendi içeriğine scroll izni veriyor.
          <Popover
            modal
            open={open}
            onOpenChange={(next) => {
              setOpen(next);
              if (!next) setSearch("");
            }}
          >
            <PopoverTrigger asChild>
              <Button
                id={name}
                type="button"
                color="secondary"
                appearance="outline"
                disabled={disabled}
                aria-invalid={Boolean(fieldState.error)}
                className={cn(
                  "h-8 w-full justify-between gap-2 font-normal",
                  !value && "text-muted-foreground",
                )}
              >
                <span className="truncate text-left">
                  {value ? displayLabel : placeholder}
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  {value && !disabled && (
                    <X
                      className="size-4 text-muted-foreground hover:text-foreground"
                      onClick={handleClear}
                    />
                  )}
                  <ChevronsUpDown className="size-4 text-muted-foreground" />
                </span>
              </Button>
            </PopoverTrigger>

            <PopoverContent
              align="start"
              className="w-(--radix-popover-trigger-width) min-w-72 p-0"
            >
              {/* shouldFilter=false: filtrelemeyi API yapıyor, cmdk tekrar
                  filtreleyip sonuçları gizlemesin. */}
              <Command shouldFilter={false}>
                <div className="relative">
                  <CommandInput
                    value={search}
                    onValueChange={setSearch}
                    placeholder={searchPlaceholder}
                  />
                  {(isLoading || isTyping) && canSearch && (
                    <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                  )}
                </div>
                <CommandList>
                  <CommandEmpty>{emptyMessage}</CommandEmpty>
                  {visibleOptions.length > 0 && (
                    <CommandGroup>
                      {visibleOptions.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.value}
                          data-checked={option.value === value}
                          onSelect={() => handleSelect(option)}
                        >
                          {option.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
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
          <Label htmlFor={name} className={cn(vertical && "w-1/4 shrink-0")}>
            {label}
            {required && <span className="ml-1 text-destructive">*</span>}
          </Label>
        );

        if (vertical) {
          return (
            <Field className={className}>
              <div className="flex items-center gap-3">
                {labelNode}
                <div className="min-w-0 flex-1">{trigger}</div>
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
