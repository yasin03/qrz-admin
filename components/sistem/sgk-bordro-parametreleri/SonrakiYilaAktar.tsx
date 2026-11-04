"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { FormSelect } from "@/components/forms";
import { YilAktarRequestType } from "@/types/sistem/sgk-bordro";
import { useYilOptions } from "./YilSecici";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Listede seçili yıl — kaynak yıl olarak gelir */
  mevcutYil: string;
  /** Aktarım başarılı olunca hedef yılla çağrılır (liste o yıla geçer) */
  onAktarildi: (hedefYil: string) => void;
  /** Aktarılan kayıtların adı, mesajlarda kullanılır. Örn. "Vergi oranları" */
  konu: string;
  /** İlgili AKTAR mutation'ı (Yil → Yil2) */
  aktar: (params: YilAktarRequestType) => Promise<{ test: number } | undefined>;
  isPending: boolean;
};

const aktarSchema = z
  .object({
    mevcutYil: z.string().min(1, "Mevcut yılı seçiniz"),
    hedefYil: z.string().min(1, "Hedef yılı seçiniz"),
  })
  .refine((v) => v.hedefYil !== v.mevcutYil, {
    path: ["hedefYil"],
    message: "Hedef yıl, mevcut yıldan farklı olmalı",
  });

type AktarForm = z.infer<typeof aktarSchema>;

const getDefaultValues = (mevcutYil: string): AktarForm => ({
  mevcutYil,
  hedefYil: String(Number(mevcutYil) + 1),
});

/** Seçili yılın kayıtlarını başka bir yıla kopyalayan ortak dialog. */
const SonrakiYilaAktar = ({
  open,
  onOpenChange,
  mevcutYil,
  onAktarildi,
  konu,
  aktar,
  isPending,
}: Props) => {
  const yilOptions = useYilOptions(mevcutYil, String(Number(mevcutYil) + 1));

  const form = useForm<AktarForm>({
    resolver: zodResolver(aktarSchema),
    defaultValues: getDefaultValues(mevcutYil),
  });

  useEffect(() => {
    if (open) form.reset(getDefaultValues(mevcutYil));
  }, [open, mevcutYil, form]);

  const handleSubmit = async (values: AktarForm) => {
    try {
      const result = await aktar({
        Yil: Number(values.mevcutYil),
        Yil2: Number(values.hedefYil),
      });

      if (result && Number(result.test) !== 1) {
        toast.error(`${konu} aktarılamadı.`);
        return;
      }

      toast.success(
        `${values.mevcutYil} ${konu.toLocaleLowerCase("tr-TR")} ${values.hedefYil} yılına aktarıldı.`,
      );
      onAktarildi(values.hedefYil);
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : `${konu} aktarılamadı.`,
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sonraki Yıla Aktar</DialogTitle>
          <DialogDescription>
            Mevcut yılın {konu.toLocaleLowerCase("tr-TR")} hedef yıla
            kopyalanır.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormSelect
            control={form.control}
            name="mevcutYil"
            label="Mevcut Yıl"
            options={yilOptions}
            valueKey="value"
            labelKey="label"
            disabled={isPending}
          />

          <FormSelect
            control={form.control}
            name="hedefYil"
            label="Hedef Yıl"
            options={yilOptions}
            valueKey="value"
            labelKey="label"
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
            <Button type="submit" disabled={isPending}>
              {isPending ? "Aktarılıyor..." : "Aktar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SonrakiYilaAktar;
