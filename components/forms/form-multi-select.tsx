"use client";

import { useMemo, useState } from "react";
import { Controller, Control, FieldPath, FieldValues } from "react-hook-form";
import { Check, ChevronsUpDown, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

type FormMultiSelectProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  required?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  options: any[];
  disabled?: boolean;
  valueKey?: string;
  labelKey?: string;
  /** Arama yaparken labelKey dışında ek alanlarda da ara (örn. SicilNo, TcKimlikNo) */
  extraSearchKeys?: string[];
  /** Seçilenleri trigger üzerinde chip olarak gösterme sayısı sınırı, aşarsa "+N" */
  maxVisibleChips?: number;
  vertical?: boolean;
  className?: string;
};

export function FormMultiSelect<T extends FieldValues>({
  control,
  name,
  label,
  required,
  placeholder = "Seçiniz",
  searchPlaceholder = "Ara...",
  emptyMessage = "Sonuç bulunamadı.",
  options,
  disabled,
  valueKey = "value",
  labelKey = "label",
  extraSearchKeys = [],
  maxVisibleChips = 3,
  vertical = true,
  className,
}: FormMultiSelectProps<T>) {
  const [open, setOpen] = useState(false);

  const optionMap = useMemo(() => {
    const map = new Map<string, any>();
    options.forEach((item) => map.set(String(item[valueKey]), item));
    return map;
  }, [options, valueKey]);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const hasLabel = Boolean(label);
        const selectedValues: string[] = Array.isArray(field.value)
          ? field.value
          : [];

        const toggleValue = (value: string) => {
          const exists = selectedValues.includes(value);
          const next = exists
            ? selectedValues.filter((v) => v !== value)
            : [...selectedValues, value];
          field.onChange(next);
        };

        const removeValue = (value: string, event: React.MouseEvent) => {
          event.stopPropagation();
          field.onChange(selectedValues.filter((v) => v !== value));
        };

        const clearAll = (event: React.MouseEvent) => {
          event.stopPropagation();
          field.onChange([]);
        };

        const visibleChips = selectedValues.slice(0, maxVisibleChips);
        const hiddenCount = selectedValues.length - visibleChips.length;

        const trigger = (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                color="secondary"
                appearance="outline"
                disabled={disabled}
                className={cn(
                  "h-auto min-h-9 w-full justify-between font-normal",
                  selectedValues.length === 0 && "text-muted-foreground",
                )}
              >
                <div className="flex flex-1 flex-wrap items-center gap-1 py-0.5">
                  {selectedValues.length === 0 ? (
                    <span>{placeholder}</span>
                  ) : (
                    <>
                      {visibleChips.map((value) => {
                        const item = optionMap.get(value);
                        return (
                          <Badge
                            key={value}
                            variant="secondary"
                            className="gap-1 pr-1"
                          >
                            {item ? item[labelKey] : value}
                            <span
                              role="button"
                              onClick={(e) => removeValue(value, e)}
                              className="rounded-full hover:bg-muted"
                            >
                              <X className="size-3" />
                            </span>
                          </Badge>
                        );
                      })}
                      {hiddenCount > 0 && (
                        <Badge variant="secondary">+{hiddenCount}</Badge>
                      )}
                    </>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {selectedValues.length > 0 && !disabled && (
                    <X
                      className="size-4 text-muted-foreground hover:text-foreground"
                      onClick={clearAll}
                    />
                  )}
                  <ChevronsUpDown className="size-4 text-muted-foreground" />
                </div>
              </Button>
            </PopoverTrigger>

            <PopoverContent
              align="start"
              className="w-[--radix-popover-trigger-width] p-0"
            >
              <Command
                filter={(itemValue, search) => {
                  const item = optionMap.get(itemValue);
                  if (!item) return 0;
                  const haystack = [
                    item[labelKey],
                    ...extraSearchKeys.map((k) => item[k]),
                  ]
                    .filter(Boolean)
                    .join(" ")
                    .toLocaleLowerCase("tr-TR");
                  return haystack.includes(search.toLocaleLowerCase("tr-TR"))
                    ? 1
                    : 0;
                }}
              >
                <CommandInput placeholder={searchPlaceholder} />
                <CommandList>
                  <CommandEmpty>{emptyMessage}</CommandEmpty>
                  <CommandGroup>
                    {options.map((item) => {
                      const itemValue = String(item[valueKey]);
                      const isSelected = selectedValues.includes(itemValue);
                      return (
                        <CommandItem
                          key={itemValue}
                          value={itemValue}
                          onSelect={() => toggleValue(itemValue)}
                        >
                          <div
                            className={cn(
                              "flex size-4 items-center justify-center rounded-sm border border-primary",
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "opacity-50",
                            )}
                          >
                            {isSelected && <Check className="size-3" />}
                          </div>
                          {item[labelKey]}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
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
