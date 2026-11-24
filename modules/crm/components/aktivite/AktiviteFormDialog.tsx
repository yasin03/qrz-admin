"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addHours, format, startOfHour } from "date-fns";
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
import {
  FormInput,
  FormLabel,
  FormSelect,
  FormSubmitButton,
  FormSwitch,
} from "@/components/forms";
import { HATIRLATMA_SECENEKLERI } from "@/modules/core/components/takvim/takvim-utils";
import { useInsertCrmAktivite, useUpdateCrmAktivite } from "@/modules/crm/hooks/use-kisiler";
import {
  GORUSME_ARACI_SECENEKLERI,
  aktiviteFormVarsayilan,
  aktiviteFormdanParams,
  kisiAdi,
} from "@/modules/crm/lib/kisiler";
import {
  SECILMEDI,
  aktiviteSchema,
  type AktiviteForm,
} from "@/modules/crm/schemas/kisiler.schema";
import type { CrmAktiviteRow, CrmKisiRow } from "@/modules/crm/types/kisiler";

/**
 * - yeni: kişiye görüşme (durum 1) veya randevu (durum 0) ekle
 * - duzenle: mevcut aktiviteyi düzenle (durum değişmez)
 */
export type AktiviteFormModu =
  | { tip: "yeni"; kisi: Pick<CrmKisiRow, "IDCrmKisi" | "Kurum" | "YetkiliKisi">; durum: 0 | 1 }
  | { tip: "duzenle"; aktivite: CrmAktiviteRow };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mod: AktiviteFormModu | null;
};

const HATIRLATMA_OPTIONS = [
  { value: SECILMEDI, label: "Hatırlatma yok" },
  ...HATIRLATMA_SECENEKLERI,
];

/** Alanların altındaki açıklama metni — label sütununu atlayıp input hizasında. */
const ALT_NOT = "text-xs text-muted-foreground sm:pl-[calc(25%+0.75rem)]";

function bosForm(durum: 0 | 1): AktiviteForm {
  const form = aktiviteFormVarsayilan(null, durum);
  if (durum === 1) return form; // görüşme: şimdi

  // Randevu: bir sonraki tam saat, 30 dk, 15 dk önce hatırlat.
  const bas = addHours(startOfHour(new Date()), 1);
  return {
    ...form,
    Tarih: format(bas, "yyyy-MM-dd"),
    Saat: format(bas, "HH:mm"),
    Sure: "30",
    HatirlatmaDakika: "15",
  };
}

export function AktiviteFormDialog({ open, onOpenChange, mod }: Props) {
  const insert = useInsertCrmAktivite();
  const update = useUpdateCrmAktivite();
  const isPending = insert.isPending || update.isPending;

  const form = useForm<AktiviteForm>({
    resolver: zodResolver(aktiviteSchema),
    defaultValues: bosForm(1),
  });
  const { control } = form;

  useEffect(() => {
    if (!open || !mod) return;
    form.reset(mod.tip === "yeni" ? bosForm(mod.durum) : aktiviteFormVarsayilan(mod.aktivite));
  }, [open, mod, form]);

  const [durum, hatirlatma] = useWatch({ control, name: ["Durum", "HatirlatmaDakika"] });
  const randevu = durum === "0";

  const onSubmit = async (v: AktiviteForm) => {
    if (!mod) return;
    const params = aktiviteFormdanParams(v);

    try {
      if (mod.tip === "yeni") {
        await insert.mutateAsync({
          ...params,
          IDCrmKisi: mod.kisi.IDCrmKisi,
          Durum: mod.durum,
        });
        toast.success(randevu ? "Randevu planlandı, takviminize eklendi." : "Görüşme eklendi.");
      } else {
        await update.mutateAsync({ ...params, IDCrmAktivite: mod.aktivite.IDCrmAktivite });
        toast.success(randevu ? "Randevu güncellendi." : "Görüşme güncellendi.");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error((error as Error)?.message || "Kaydedilemedi.");
    }
  };

  const yeni = mod?.tip === "yeni";
  const baslik = randevu
    ? yeni
      ? "Randevu Planla"
      : "Randevuyu Düzenle"
    : yeni
      ? "Görüşme Ekle"
      : "Görüşmeyi Düzenle";
  const kisi = mod ? (mod.tip === "yeni" ? mod.kisi : mod.aktivite) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{baslik}</DialogTitle>
          <DialogDescription>{kisi ? kisiAdi(kisi) : ""}</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex flex-col divide-y">
            <div className="flex flex-col gap-4 pb-4">
              <FormLabel label="Tarih" required>
                <FormInput control={control} name="Tarih" type="date" />
                <FormInput control={control} name="Saat" type="time" />
              </FormLabel>
              <FormLabel label={randevu ? "Tahmini Süre" : "Süre"}>
                <FormInput
                  control={control}
                  name="Sure"
                  format="number"
                  maxLength={4}
                  endIcon={<span className="text-xs text-muted-foreground">dk</span>}
                />
                <FormSelect control={control} name="GorusmeAraci" options={GORUSME_ARACI_SECENEKLERI} />
              </FormLabel>
              <FormInput
                control={control}
                name="Konu"
                label="Konu"
                placeholder={randevu ? "Örn. Teklif sunumu" : "Örn. İlk tanışma"}
                maxLength={250}
              />
              <FormInput
                control={control}
                name="Aciklama"
                label={randevu ? "Gündem" : "Görüşme Notu"}
                type="textarea"
                rows={4}
                placeholder={randevu ? "Görüşülecek konular" : "Ne konuşuldu?"}
              />
            </div>

            {randevu && (
              <div className="flex flex-col gap-4 pt-4">
                <FormLabel label="Hatırlatma ve E-posta">
                  <FormSwitch
                    control={control}
                    name="HatirlatmaEposta"
                    disabled={hatirlatma === SECILMEDI}
                    className="w-auto flex-none! self-center p-0"
                  />
                  <FormSelect control={control} name="HatirlatmaDakika" options={HATIRLATMA_OPTIONS} />
                </FormLabel>
                <p className={ALT_NOT}>
                  Randevu takviminize de eklenir; saatini takvimden değiştirirseniz burada da güncellenir.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" appearance="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <FormSubmitButton loading={isPending} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
