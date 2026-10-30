"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Calendar, CalendarRange, Check } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/forms";
import { useAktarPuantaj } from "@/hooks/use-puantaj";
import { cn } from "@/lib/utils";
import { PuantajAktarimTipi } from "@/types/puantaj";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** PDKS listesinde seçili tarih ("yyyy-MM-dd") — modal bununla açılır */
  tarih: string;
};

type FormValues = {
  Tarih: string;
  AktarimTipi: PuantajAktarimTipi;
};

const AKTARIM_TIPLERI: {
  value: PuantajAktarimTipi;
  label: string;
  description: string;
  icon: typeof Calendar;
}[] = [
  {
    value: "GÜNLÜK",
    label: "Günlük",
    description: "Sadece seçilen günün kayıtları aktarılır.",
    icon: Calendar,
  },
  {
    value: "AYLIK",
    label: "Aylık",
    description: "Seçilen tarihin ayındaki tüm kayıtlar aktarılır.",
    icon: CalendarRange,
  },
];

const PuantajaAktar = ({ open, onOpenChange, tarih }: Props) => {
  const { mutateAsync: aktar, isPending } = useAktarPuantaj();

  const form = useForm<FormValues>({
    defaultValues: { Tarih: tarih, AktarimTipi: "GÜNLÜK" },
  });
  const aktarimTipi = form.watch("AktarimTipi");

  useEffect(() => {
    if (open) form.reset({ Tarih: tarih, AktarimTipi: "GÜNLÜK" });
  }, [open, tarih, form]);

  const handleSubmit = async (values: FormValues) => {
    if (!values.Tarih) {
      toast.error("Tarih seçiniz.");
      return;
    }

    try {
      const result = await aktar(values);

      if (Number(result?.test) !== 1) {
        toast.error("Puantaja aktarılamadı.", {
          description: result?.sonuc,
        });
        return;
      }

      toast.success(result?.sonuc || "Aktarım tamamlandı.");
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Puantaja aktarılamadı.",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Puantaja Aktar</DialogTitle>
          <DialogDescription>
            PDKS kayıtlarının puantaja nasıl aktarılacağını seçiniz.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            {AKTARIM_TIPLERI.map(({ value, label, description, icon: Icon }) => {
              const selected = aktarimTipi === value;
              return (
                <button
                  key={value}
                  type="button"
                  disabled={isPending}
                  aria-pressed={selected}
                  onClick={() => form.setValue("AktarimTipi", value)}
                  className={cn(
                    "relative flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors",
                    "hover:bg-muted/50 disabled:pointer-events-none disabled:opacity-60",
                    selected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border",
                  )}
                >
                  {selected && (
                    <Check className="absolute top-2 right-2 size-4 text-primary" />
                  )}
                  <Icon
                    className={cn(
                      "size-5",
                      selected ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <span className="text-sm font-semibold">{label}</span>
                  <span className="text-xs text-muted-foreground">
                    {description}
                  </span>
                </button>
              );
            })}
          </div>

          <FormInput
            control={form.control}
            name="Tarih"
            label="Tarih"
            type="date"
            disabled={isPending}
          />

          <DialogFooter>
            <Button
              type="button"
              appearance="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              İptal
            </Button>
            <Button type="submit" variant="success" disabled={isPending}>
              {isPending ? "Aktarılıyor..." : "Aktar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PuantajaAktar;
