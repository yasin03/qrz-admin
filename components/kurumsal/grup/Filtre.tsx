import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Button } from "../../ui/button";
import { Filter } from "lucide-react";
import { FormSelect } from "../../forms";
import { useForm } from "react-hook-form";
import { useEffect, useMemo } from "react";
import { GrupFilters } from "@/types/kurumsal/grup";

type FormValues = {
  Durum: "ALL" | "1" | "0";
  Sirket: "ALL" | "VAR" | "YOK";
};

type Props = {
  filters: GrupFilters;
  onChange: (next: GrupFilters) => void;
  onReset: () => void;
};

const DURUM_OPTIONS = [
  { value: "ALL", label: "Tümü" },
  { value: "1", label: "Aktif" },
  { value: "0", label: "Pasif" },
];

const SIRKET_OPTIONS = [
  { value: "ALL", label: "Tümü" },
  { value: "VAR", label: "Şirketi Olanlar" },
  { value: "YOK", label: "Şirketi Olmayanlar" },
];

const Filtre = ({ filters, onChange, onReset }: Props) => {
  const initialFormValues = useMemo<FormValues>(
    () => ({
      Durum: filters.Durum === null ? "ALL" : filters.Durum ? "1" : "0",
      Sirket: filters.Sirket || "ALL",
    }),
    [filters],
  );

  const form = useForm<FormValues>({
    defaultValues: initialFormValues,
  });

  useEffect(() => {
    form.reset(initialFormValues);
  }, [form, initialFormValues]);

  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
      if (!name) return;

      onChange({
        Durum:
          values.Durum === "ALL" || values.Durum === undefined
            ? null
            : values.Durum === "1"
              ? 1
              : 0,
        Sirket:
          values.Sirket === "ALL" || values.Sirket === undefined
            ? ""
            : values.Sirket,
      });
    });

    return () => subscription.unsubscribe();
  }, [form, onChange]);

  const handleReset = () => {
    form.reset({ Durum: "ALL", Sirket: "ALL" });
    onReset();
  };

  const activeCount = [filters.Durum !== null, filters.Sirket].filter(
    Boolean,
  ).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          appearance="outline"
          size="sm"
        >
          <Filter className="size-4" />
          Filtre
          {activeCount > 0 && (
            <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 space-y-4">
        <p className="text-sm font-semibold text-foreground">Grup Filtrele</p>

        <div className="space-y-3">
          <FormSelect
            control={form.control}
            name="Durum"
            label="Durum"
            options={DURUM_OPTIONS}
            valueKey="value"
            labelKey="label"
          />

          <FormSelect
            control={form.control}
            name="Sirket"
            label="Şirket"
            options={SIRKET_OPTIONS}
            valueKey="value"
            labelKey="label"
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-3">
          <Button
            type="button"
            variant="secondary"
            appearance="outline"
            size="sm"
            onClick={handleReset}
          >
            Sıfırla
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default Filtre;
