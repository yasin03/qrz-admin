import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Button } from "../../ui/button";
import { Filter } from "lucide-react";
import { FormSelect } from "../../forms";
import { useForm } from "react-hook-form";
import { useEffect, useMemo } from "react";
import { KullaniciFilters, YetkiAlani } from "@/types/kullanici";

type FormValues = {
  KullaniciTipi: string;
  Durum: "ALL" | "true" | "false";
  Yetki: "ALL" | YetkiAlani;
};

type Props = {
  filters: KullaniciFilters;
  kullaniciTipiOptions: Array<{ value: string; label: string }>;
  onChange: (next: KullaniciFilters) => void;
  onReset: () => void;
};

const DURUM_OPTIONS = [
  { value: "ALL", label: "Tümü" },
  { value: "true", label: "Aktif" },
  { value: "false", label: "Pasif" },
];

const YETKI_OPTIONS = [
  { value: "ALL", label: "Tümü" },
  { value: "YetkiKullanici", label: "Kullanıcı Yetkisi" },
  { value: "YetkiGrup", label: "Grup Yetkisi" },
  { value: "YetkiSirket", label: "Şirket Yetkisi" },
  { value: "YetkiSube", label: "Şube Yetkisi" },
];

const Filtre = ({
  filters,
  kullaniciTipiOptions,
  onChange,
  onReset,
}: Props) => {
  const initialFormValues = useMemo<FormValues>(
    () => ({
      KullaniciTipi: filters.KullaniciTipi || "ALL",
      Durum: filters.Durum === null ? "ALL" : filters.Durum ? "true" : "false",
      Yetki: filters.Yetki || "ALL",
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
        KullaniciTipi:
          values.KullaniciTipi === "ALL" ? "" : (values.KullaniciTipi ?? ""),
        Durum:
          values.Durum === "ALL" || values.Durum === undefined
            ? null
            : values.Durum === "true",
        Yetki: values.Yetki === "ALL" ? "" : (values.Yetki ?? ""),
      });
    });

    return () => subscription.unsubscribe();
  }, [form, onChange]);

  const handleReset = () => {
    form.reset({ KullaniciTipi: "ALL", Durum: "ALL", Yetki: "ALL" });
    onReset();
  };

  const tipSelectOptions = useMemo(
    () => [{ value: "ALL", label: "Tümü" }, ...kullaniciTipiOptions],
    [kullaniciTipiOptions],
  );

  const activeCount = [
    filters.KullaniciTipi,
    filters.Durum !== null,
    filters.Yetki,
  ].filter(Boolean).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" color="secondary" appearance="outline" size="sm">
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
        <p className="text-sm font-semibold text-foreground">
          Kullanıcı Filtrele
        </p>

        <div className="space-y-3">
          <FormSelect
            control={form.control}
            name="KullaniciTipi"
            label="Kullanıcı Tipi"
            options={tipSelectOptions}
            valueKey="value"
            labelKey="label"
          />

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
            name="Yetki"
            label="Yetki"
            options={YETKI_OPTIONS}
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

export default Filtre;
