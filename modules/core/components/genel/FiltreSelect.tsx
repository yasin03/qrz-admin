"use client";

import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type FiltreSelectOption = { value: string; label: string };

/**
 * FormSelect (vertical) ile aynı görünümde, react-hook-form'a bağlı olmayan
 * kontrollü select. Değeri form yerine component state'inde tutulan
 * filtreler için.
 */
export const FiltreSelect = ({
  label,
  value,
  options,
  onChange,
  disabled,
  placeholder = "Seçiniz",
}: {
  label: string;
  value: string;
  options: FiltreSelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) => {
  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <Field>
      <div className="flex items-center gap-3">
        <Label className="w-1/4 shrink-0">{label}</Label>
        <div className="min-w-0 flex-1">
          <Select
            value={value}
            // Radix, değer henüz options'ta yokken "" ile tetikleyebiliyor
            onValueChange={(next) => next !== "" && onChange(next)}
            disabled={disabled}
          >
            <SelectTrigger
              className="h-auto! min-h-8 w-full min-w-0 py-1.5 text-left whitespace-normal"
              title={selectedLabel}
            >
              <SelectValue
                placeholder={placeholder}
                className="line-clamp-2! min-w-0 wrap:anywhere"
              />
            </SelectTrigger>
            <SelectContent
              position="popper"
              className="max-h-[min(20rem,var(--radix-select-content-available-height))] w-(--radix-select-trigger-width) max-w-[calc(100vw-2rem)]"
            >
              {options.map((o) => (
                <SelectItem
                  key={o.value}
                  value={o.value}
                  className="min-h-8 whitespace-normal wrap-anywhere"
                >
                  <span>{o.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Field>
  );
};

export default FiltreSelect;
