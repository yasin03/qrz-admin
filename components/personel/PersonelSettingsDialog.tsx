"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FormInput } from "@/components/forms";
import { useUpdatePersonelSettings } from "@/hooks/use-personel";

export type PersonelSettingsPersonel = {
  IDSubePersonel: string;
  AdSoyad: string;
  Telefon: string;
  KullaniciAktif: boolean;
};

type FormValues = {
  AdSoyad: string;
  Telefon: string;
  Sifre: string;
  KullaniciAktif: boolean;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personel: PersonelSettingsPersonel | null;
};

export default function PersonelSettingsDialog({
  open,
  onOpenChange,
  personel,
}: Props) {
  const { mutateAsync, isPending } = useUpdatePersonelSettings();

  const form = useForm<FormValues>({
    defaultValues: {
      Telefon: "",
      Sifre: "",
      KullaniciAktif: false,
    },
  });

  const telefonReadOnly = Boolean(personel?.Telefon);

  useEffect(() => {
    if (!open || !personel) return;

    form.reset({
      AdSoyad: personel.AdSoyad ?? "",
      Telefon: personel.Telefon ?? "",
      Sifre: "",
      KullaniciAktif: personel.KullaniciAktif ?? false,
    });
  }, [open, personel, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!personel) return;

    if (!telefonReadOnly && !values.Telefon) {
      toast.error("Telefon numarası zorunludur.");
      return;
    }

    if (!values.Sifre) {
      toast.error("Şifre zorunludur.");
      return;
    }

    try {
      const response = await mutateAsync({
        IDSubePersonel: personel.IDSubePersonel,
        Telefon: values.Telefon,
        Sifre: values.Sifre,
        KullaniciAktif: values.KullaniciAktif,
      });
      const result = response?.[0];
      if (!result || result.test === 0) {
        toast.error(result?.sonuc ?? "İşlem başarısız oldu.");
        return;
      }
      toast.success(result.sonuc || "Kullanıcı ayarları güncellendi.");
      onOpenChange(false);
    } catch {
      toast.error("İşlem başarısız oldu.");
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kullanıcı Ayarları</DialogTitle>
          <DialogDescription>
            {personel ? `${personel.AdSoyad}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <FormInput
            control={form.control}
            name="AdSoyad"
            label="Ad Soyad"
            readOnly={true}
          />
          <FormInput
            control={form.control}
            name="Telefon"
            label="Telefon"
            format="tel"
            readOnly={telefonReadOnly}
            placeholder="555 444 22 33"
          />

          <FormInput
            control={form.control}
            name="Sifre"
            label="Şifre"
            type="password"
            placeholder="Şifre girin"
          />

          <Controller
            control={form.control}
            name="KullaniciAktif"
            render={({ field }) => (
              <div className="flex items-center gap-3">
                <Label htmlFor="KullaniciAktif" className="w-1/4 shrink-0">
                  Kullanıcı Aktif
                </Label>
                <Switch
                  id="KullaniciAktif"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </div>
            )}
          />
        </div>

        <DialogFooter>
          <Button type="button" disabled={isPending} onClick={handleSubmit}>
            Kaydet
          </Button>
          <Button
            type="button"
            color="secondary"
            appearance="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            İptal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
