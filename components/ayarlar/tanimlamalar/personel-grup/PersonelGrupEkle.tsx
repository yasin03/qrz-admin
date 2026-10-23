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
import { FormInput } from "@/components/forms";
import {
  useInsertPersonelGrup,
  useUpdatePersonelGrup,
} from "@/hooks/use-personel-grup";
import { PersonelGrupType } from "@/types/ayarlar/personel-grup";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Verilirse dialog düzenleme modunda açılır */
  grup?: PersonelGrupType | null;
  /** Ekleme başarılı olunca çağrılır (örn. personel formundaki hızlı ekleme) */
  onCreated?: () => void;
};

const personelGrupSchema = z.object({
  Kod: z.string().trim().min(1, "Kod giriniz"),
  Adi: z.string().trim().min(1, "Grup adı giriniz"),
});

type PersonelGrupForm = z.infer<typeof personelGrupSchema>;

const DEFAULT_VALUES: PersonelGrupForm = {
  Kod: "",
  Adi: "",
};

const PersonelGrupEkle = ({ open, onOpenChange, grup, onCreated }: Props) => {
  const isEdit = Boolean(grup);
  const { mutateAsync: insertGrup, isPending: isInserting } =
    useInsertPersonelGrup();
  const { mutateAsync: updateGrup, isPending: isUpdating } =
    useUpdatePersonelGrup();
  const isSaving = isInserting || isUpdating;

  const form = useForm<PersonelGrupForm>({
    resolver: zodResolver(personelGrupSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) {
      form.reset(DEFAULT_VALUES);
    } else if (grup) {
      form.reset({ Kod: grup.Kod ?? "", Adi: grup.Adi ?? "" });
    }
  }, [open, grup, form]);

  const handleSubmit = async (values: PersonelGrupForm) => {
    try {
      if (grup) {
        const result = await updateGrup({
          IDSirketPersonelGrup: grup.IDSirketPersonelGrup,
          ...values,
        });

        if (Number(result?.test) !== 1) {
          toast.error("Personel grubu güncellenemedi.");
          return;
        }

        toast.success("Personel grubu güncellendi.");
      } else {
        const result = await insertGrup(values);

        // test >= 1 başarılı, 0 → aynı kodla grup zaten var
        if (!(Number(result?.test) >= 1)) {
          toast.error("Bu kodla bir personel grubu zaten var.");
          return;
        }

        toast.success("Personel grubu eklendi.");
        onCreated?.();
      }

      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : isEdit
            ? "Personel grubu güncellenemedi."
            : "Personel grubu eklenemedi.",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Personel Grubu Düzenle" : "Yeni Personel Grubu"}
          </DialogTitle>
          <DialogDescription>
            Personelleri kategorilendirmek için grup bilgilerini giriniz (örn.
            Şoförler, Temizlik).
          </DialogDescription>
        </DialogHeader>

        {/* Personel formunun içinden açılabildiği için submit dış forma
            taşmasın diye event'i burada durduruyoruz. */}
        <form
          onSubmit={(event) => {
            event.stopPropagation();
            form.handleSubmit(handleSubmit)(event);
          }}
          className="space-y-4"
        >
          <div className="space-y-3 py-1">
            <FormInput
              control={form.control}
              name="Kod"
              label="Kod"
              disabled={isSaving}
            />
            <FormInput
              control={form.control}
              name="Adi"
              label="Grup Adı"
              disabled={isSaving}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              appearance="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Kaydediliyor..." : isEdit ? "Güncelle" : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PersonelGrupEkle;
