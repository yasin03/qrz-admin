"use client";

import { useEffect, useMemo, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Filter } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/forms";
import { AY_DATA } from "@/constants/data";
import { useCurrentContext } from "@/modules/core/hooks/use-context";
import { useSubeler, useBolumler } from "@/modules/core/hooks/use-kurumsal-data";
import { MesaiCizelgesiSelectRequestType } from "@/modules/bordro/types/puantaj";

export type MesaiCizelgesiFiltreValues = Pick<
  MesaiCizelgesiSelectRequestType,
  "IDSube" | "IDBolum" | "Ay"
>;

type FormValues = {
  IDSube: string;
  /** "0" → tüm bölümler */
  IDBolum: string;
  Ay: string;
};

type Props = {
  /** Başlangıç değerleri (çalışma bağlamından gelen şube/bölüm/ay). */
  initial: MesaiCizelgesiFiltreValues;
  onApply: (filters: MesaiCizelgesiFiltreValues) => void;
};

const toForm = (v: MesaiCizelgesiFiltreValues): FormValues => ({
  IDSube: v.IDSube && String(v.IDSube) !== "0" ? String(v.IDSube) : "",
  IDBolum: v.IDBolum ? String(v.IDBolum) : "0",
  Ay: String(v.Ay).padStart(2, "0"),
});

export default function MesaiCizelgesiFiltre({ initial, onApply }: Props) {
  const { data: context } = useCurrentContext();

  const form = useForm<FormValues>({ defaultValues: toForm(initial) });

  const { data: subeler = [] } = useSubeler(Number(context?.IDSirket) || 0);

  const [idSube, idBolum, ay] = useWatch({
    control: form.control,
    name: ["IDSube", "IDBolum", "Ay"],
  });

  const { data: bolumlerData = [] } = useBolumler(Number(idSube) || 0);
  const bolumler = useMemo(
    () => [
      { IDBolum: "0", BolumAdi: "Tümü" },
      ...bolumlerData.map((b) => ({
        IDBolum: String(b.IDBolum),
        BolumAdi: b.BolumAdi,
      })),
    ],
    [bolumlerData],
  );

  // Context sonradan gelirse (ilk render'da şube boşsa) başlangıç değerlerini yerleştir
  useEffect(() => {
    if (!form.getValues("IDSube") && initial.IDSube && initial.IDSube !== "0") {
      form.reset(toForm(initial));
    }
  }, [initial, form]);

  // Şube değişince bölüm "Tümü"ye döner
  const oncekiSube = useRef(idSube);
  useEffect(() => {
    if (oncekiSube.current && oncekiSube.current !== idSube) {
      form.setValue("IDBolum", "0");
    }
    oncekiSube.current = idSube;
  }, [idSube, form]);

  // Seçim değişince otomatik uygula
  useEffect(() => {
    if (!idSube) return;
    const t = setTimeout(() => {
      onApply({ IDSube: idSube, IDBolum: idBolum || "0", Ay: ay });
    }, 250);
    return () => clearTimeout(t);
  }, [idSube, idBolum, ay, onApply]);

  const handleReset = () => {
    form.reset(
      toForm({
        IDSube: context?.IDSube ?? initial.IDSube,
        IDBolum: "0",
        Ay: context?.Ay ?? initial.Ay,
      }),
    );
  };

  const aktifFiltreSayisi =
    Number(Boolean(idBolum) && idBolum !== "0") +
    Number(Boolean(idSube) && String(idSube) !== String(context?.IDSube ?? "")) +
    Number(
      Boolean(context?.Ay) && ay !== String(context?.Ay ?? "").padStart(2, "0"),
    );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary" appearance="outline">
          <Filter className="size-4" />
          Filtre
          {aktifFiltreSayisi > 0 && (
            <span className="ml-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              {aktifFiltreSayisi}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-100 space-y-4">
        <p className="text-sm font-semibold text-foreground">
          Mesai Çizelgesi Filtrele
        </p>

        <div className="space-y-3">
          <FormSelect
            control={form.control}
            name="IDSube"
            label="Şube"
            options={subeler}
            valueKey="IDSube"
            labelKey="SubeAdi"
          />
          <FormSelect
            control={form.control}
            name="IDBolum"
            label="Bölüm"
            options={bolumler}
            valueKey="IDBolum"
            labelKey="BolumAdi"
            disabled={!idSube}
            placeholder={!idSube ? "Önce şube seçin" : "Tümü"}
          />
          <FormSelect
            control={form.control}
            name="Ay"
            label="Ay"
            options={[...AY_DATA]}
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-3">
          <Button
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
}
