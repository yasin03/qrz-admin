import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { Filter } from "lucide-react";
import { FormSelect } from "../forms";
import { useForm } from "react-hook-form";
import { useEffect, useMemo } from "react";
import { LokasyonFilters } from "@/types/lokasyon";

type FormValues = {
  IDBolum: string;
  Aktif: "ALL" | "true" | "false";
};

type LokasyonFiltreProps = {
  filters: Pick<LokasyonFilters, "IDBolum" | "Aktif">;
  bolumOptions: Array<{ value: string; label: string }>;
  onChange: (next: Pick<LokasyonFilters, "IDBolum" | "Aktif">) => void;
  onReset: () => void;
};

const LokasyonFiltre = ({
  filters,
  bolumOptions,
  onChange,
  onReset,
}: LokasyonFiltreProps) => {
  const initialFormValues = useMemo<FormValues>(
    () => ({
      IDBolum: filters.IDBolum ? String(filters.IDBolum) : "ALL",
      Aktif: filters.Aktif === null ? "ALL" : filters.Aktif ? "true" : "false",
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
      if (name !== "IDBolum" && name !== "Aktif") return;

      const nextIDBolum =
        values.IDBolum === "ALL" ? "" : (values.IDBolum ?? "");
      const nextAktif =
        values.Aktif === "ALL" || values.Aktif === undefined
          ? null
          : values.Aktif === "true";

      onChange({
        IDBolum: nextIDBolum,
        Aktif: nextAktif,
      });
    });

    return () => subscription.unsubscribe();
  }, [form, onChange]);

  const handleReset = () => {
    form.reset({ IDBolum: "ALL", Aktif: "ALL" });
    onReset();
  };

  const bolumSelectOptions = useMemo(
    () => [{ value: "ALL", label: "Tümü" }, ...bolumOptions],
    [bolumOptions],
  );

  const aktifOptions = useMemo(
    () => [
      { value: "ALL", label: "Tümü" },
      { value: "true", label: "Aktif" },
      { value: "false", label: "Pasif" },
    ],
    [],
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" color="secondary" appearance="outline" size="sm">
          <Filter className="size-4" />
          Filtre
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 space-y-4">
        <p className="text-sm font-semibold text-foreground">
          Lokasyon Filtrele
        </p>

        <div className="space-y-3">
          <FormSelect
            control={form.control}
            name="IDBolum"
            label="Bölüm"
            options={bolumSelectOptions}
            valueKey="value"
            labelKey="label"
          />

          <FormSelect
            control={form.control}
            name="Aktif"
            label="Durum"
            options={aktifOptions}
            valueKey="value"
            labelKey="label"
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-3">
          <Button
            type="button"
            color="secondary"
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

export default LokasyonFiltre;
