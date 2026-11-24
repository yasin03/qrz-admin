"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormInput, FormSubmitButton } from "@/components/forms";
import { useTamamlaCrmAktivite } from "@/modules/crm/hooks/use-kisiler";
import { tamamlaFormdanParams } from "@/modules/crm/lib/kisiler";
import { tamamlaSchema, type TamamlaForm } from "@/modules/crm/schemas/kisiler.schema";
import type { CrmAktiviteRow } from "@/modules/crm/types/kisiler";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aktivite: CrmAktiviteRow | null;
};

/** Randevu yapıldı → görüşmeye dönüşür (not ve gerçekleşen süre eklenir). */
export function AktiviteTamamlaDialog({ open, onOpenChange, aktivite }: Props) {
  const tamamla = useTamamlaCrmAktivite();

  const form = useForm<TamamlaForm>({
    resolver: zodResolver(tamamlaSchema),
    defaultValues: { Aciklama: "", Sure: "" },
  });

  useEffect(() => {
    if (!open || !aktivite) return;
    form.reset({
      Aciklama: aktivite.Aciklama ?? "",
      Sure: aktivite.Sure != null ? String(aktivite.Sure) : "",
    });
  }, [open, aktivite, form]);

  const onSubmit = async (v: TamamlaForm) => {
    if (!aktivite) return;
    try {
      await tamamla.mutateAsync({ IDCrmAktivite: aktivite.IDCrmAktivite, ...tamamlaFormdanParams(v) });
      toast.success("Randevu görüşme olarak kaydedildi.");
      onOpenChange(false);
    } catch (error) {
      toast.error((error as Error)?.message || "Kaydedilemedi.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Görüşme Yapıldı</DialogTitle>
          <DialogDescription>
            {aktivite?.Konu ? `"${aktivite.Konu}" ` : "Randevu "}
            görüşme olarak kaydedilecek. Takvimde kalır, hatırlatması kapanır.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex flex-col gap-4">
            <FormInput
              control={form.control}
              name="Aciklama"
              label="Görüşme Notu"
              type="textarea"
              rows={5}
              placeholder="Ne konuşuldu, sonraki adım ne?"
            />
            <FormInput
              control={form.control}
              name="Sure"
              label="Süre"
              format="number"
              maxLength={4}
              endIcon={<span className="text-xs text-muted-foreground">dk</span>}
            />
          </div>

          <DialogFooter>
            <Button type="button" appearance="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <FormSubmitButton loading={tamamla.isPending}>Kaydet</FormSubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
